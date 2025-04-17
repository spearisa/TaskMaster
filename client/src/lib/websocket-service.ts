import { useEffect, useRef } from 'react';

type WebSocketMessageHandler = (data: any) => void;
type WebSocketStatusHandler = (status: 'connected' | 'connecting' | 'disconnected') => void;

interface WebSocketConfig {
  reconnectMaxAttempts?: number;
  reconnectBaseDelay?: number;
  reconnectMaxDelay?: number;
  debug?: boolean;
}

/**
 * WebSocket Service for managing connections across the application
 */
class WebSocketService {
  private static instance: WebSocketService;
  private socket: WebSocket | null = null;
  private userId: number | null = null;
  private messageHandlers: Set<WebSocketMessageHandler> = new Set();
  private statusHandlers: Set<WebSocketStatusHandler> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private config: Required<WebSocketConfig> = {
    reconnectMaxAttempts: 5,
    reconnectBaseDelay: 1000,
    reconnectMaxDelay: 16000,
    debug: false
  };
  private status: 'connected' | 'connecting' | 'disconnected' = 'disconnected';

  private constructor() {}

  /**
   * Get the singleton instance of WebSocketService
   */
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Configure the WebSocket service
   */
  public configure(config: WebSocketConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Initialize WebSocket connection with user ID
   */
  public initialize(userId: number): void {
    this.userId = userId;
    this.connect();
  }

  /**
   * Connect to the WebSocket server
   */
  private connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      this.log('Socket already connected or connecting');
      return;
    }

    // Update and notify status
    this.updateStatus('connecting');

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    this.log(`Connecting to WebSocket at ${wsUrl}`);
    this.socket = new WebSocket(wsUrl);

    // Set up event handlers
    this.socket.onopen = this.handleOpen.bind(this);
    this.socket.onmessage = this.handleMessage.bind(this);
    this.socket.onclose = this.handleClose.bind(this);
    this.socket.onerror = this.handleError.bind(this);
  }

  /**
   * Handle socket open event
   */
  private handleOpen(): void {
    this.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.updateStatus('connected');

    // Authenticate with user ID
    if (this.socket && this.userId) {
      this.socket.send(JSON.stringify({
        type: 'auth',
        userId: this.userId
      }));
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      this.log('WebSocket message received:', data);
      
      // Notify all message handlers
      this.messageHandlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }

  /**
   * Handle socket close event
   */
  private handleClose(event: CloseEvent): void {
    this.log(`WebSocket disconnected with code: ${event.code}, reason: ${event.reason || 'No reason provided'}`);
    this.updateStatus('disconnected');
    
    // Try to reconnect if not closed cleanly
    if (event.code !== 1000 && event.code !== 1001) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle socket error
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.updateStatus('disconnected');
    this.scheduleReconnect();
  }

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.reconnectAttempts++;
    
    if (this.reconnectAttempts <= this.config.reconnectMaxAttempts) {
      // Calculate delay with exponential backoff: baseDelay * 2^(attempts-1)
      const delay = Math.min(
        this.config.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts - 1),
        this.config.reconnectMaxDelay
      );
      
      this.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.reconnectMaxAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      this.log('Max reconnection attempts reached');
    }
  }

  /**
   * Update connection status and notify handlers
   */
  private updateStatus(status: 'connected' | 'connecting' | 'disconnected'): void {
    if (this.status === status) return;
    
    this.status = status;
    this.statusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Error in status handler:', error);
      }
    });
  }

  /**
   * Get current connection status
   */
  public getStatus(): 'connected' | 'connecting' | 'disconnected' {
    return this.status;
  }

  /**
   * Send a message to the server
   */
  public send(data: any): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(typeof data === 'string' ? data : JSON.stringify(data));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    }
    return false;
  }
  
  /**
   * Send a chat message via WebSocket
   */
  public sendChatMessage(receiverId: number, content: string): boolean {
    return this.send({
      type: 'message',
      receiverId,
      content
    });
  }
  
  /**
   * Add a reaction to a message
   */
  public addMessageReaction(messageId: number, emoji: string): boolean {
    return this.send({
      type: 'message_reaction',
      messageId,
      emoji
    });
  }
  
  /**
   * Remove a reaction from a message
   */
  public removeMessageReaction(messageId: number, emoji: string): boolean {
    return this.send({
      type: 'message_reaction_remove',
      messageId,
      emoji
    });
  }
  
  /**
   * Edit a message
   */
  public editMessage(messageId: number, content: string): boolean {
    return this.send({
      type: 'message_edit',
      messageId,
      content
    });
  }
  
  /**
   * Mark a message as delivered
   */
  public markMessageDelivered(messageId: number): boolean {
    return this.send({
      type: 'message_delivered',
      messageId
    });
  }
  
  /**
   * Delete a message
   */
  public deleteMessage(messageId: number): boolean {
    return this.send({
      type: 'message_delete',
      messageId
    });
  }

  /**
   * Register a message handler
   */
  public addMessageHandler(handler: WebSocketMessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /**
   * Register a status change handler
   */
  public addStatusHandler(handler: WebSocketStatusHandler): () => void {
    this.statusHandlers.add(handler);
    // Immediately notify with current status
    handler(this.status);
    return () => this.statusHandlers.delete(handler);
  }

  /**
   * Gracefully disconnect
   */
  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close(1000, "Intentional disconnect");
      }
      this.socket = null;
    }

    this.updateStatus('disconnected');
  }

  /**
   * Conditionally log based on debug setting
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.debug) {
      console.log(`[WebSocketService] ${message}`, ...args);
    }
  }
}

/**
 * React hook for using the WebSocket service
 */
export function useWebSocket(userId: number | null | undefined) {
  const wsService = WebSocketService.getInstance();
  const initialized = useRef(false);
  
  // Initialize WebSocket with user ID
  useEffect(() => {
    if (userId && !initialized.current) {
      wsService.configure({ debug: true });
      wsService.initialize(userId);
      initialized.current = true;
    }
    
    return () => {
      // We don't disconnect on unmount since the service is meant to be persistent
      // across component unmounts
    };
  }, [userId]);
  
  return wsService;
}

export const websocketService = WebSocketService.getInstance();