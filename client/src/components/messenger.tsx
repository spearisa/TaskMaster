
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface Message {
  room: string;
  author: string;
  message: string; // Used in UI for compatibility
  content?: string; // Field from direct message API
  timestamp?: string;
}

export function Messenger() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const { user } = useAuth();
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptRef = useRef<number>(0);
  const room = 'global'; // Using a global room for simplicity

  useEffect(() => {
    // Set initial status
    setConnectionStatus('connecting');
    
    // Create socket instance with proper configuration
    const socket = io('/', {
      withCredentials: true,
      autoConnect: false, // Don't auto connect, we'll handle this manually
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 5000 // Shorter timeout for faster connection feedback
    });

    socketRef.current = socket;

    // Connect to the socket
    socket.connect();
    
    // Join room when connected
    socket.on('connect', () => {
      socket.emit('join_room', room);
    });

    // Listen for incoming messages
    socket.on('receive_message', (data: Message) => {
      // Ensure both message and content fields exist for compatibility
      const normalizedData = {
        ...data,
        // If we receive a message with content field (from direct message API), use it for message field
        message: data.content || data.message,
        // Always keep both fields in sync for compatibility
        content: data.message || data.content
      };
      
      // Check if this message is from the current user and already in the list
      // This prevents duplicate messages
      const isDuplicate = (prev: Message[]) => prev.some(
        msg => 
          msg.author === normalizedData.author && 
          msg.message === normalizedData.message && 
          // Use approximate time matching (within 2 seconds)
          msg.timestamp && normalizedData.timestamp && 
          Math.abs(new Date(msg.timestamp).getTime() - new Date(normalizedData.timestamp).getTime()) < 2000
      );
      
      setMessages((prev) => isDuplicate(prev) ? prev : [...prev, normalizedData]);
    });

    // Handle connection events
    socket.on('connect', () => {
      console.log('Connected to socket server');
      setConnectionStatus('connected');
      reconnectAttemptRef.current = 0;
      
      // Only show toast on reconnection
      if (reconnectAttemptRef.current > 0) {
        toast({
          title: "Connected to messenger",
          description: "You are now connected to the messenger service",
          variant: "default",
        });
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setConnectionStatus('disconnected');
      reconnectAttemptRef.current += 1;
      
      // Only show toast on first error
      if (reconnectAttemptRef.current === 1) {
        toast({
          title: "Connection issue",
          description: "Attempting to reconnect to the messenger service",
          variant: "default",
        });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
      setConnectionStatus('disconnected');
    });
    
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      setConnectionStatus('connecting');
      reconnectAttemptRef.current = attemptNumber;
    });
    
    socket.on('reconnect_failed', () => {
      console.log('Failed to reconnect after multiple attempts');
      setConnectionStatus('disconnected');
      toast({
        title: "Connection failed",
        description: "Could not connect to messenger after multiple attempts. Please try again later.",
        variant: "destructive",
      });
    });

    // Cleanup on component unmount
    return () => {
      socket.off('receive_message');
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('reconnect_attempt');
      socket.off('reconnect_failed');
      socket.disconnect();
    };
  }, [toast]);

  const sendMessage = () => {
    if (message.trim() && socketRef.current && user) {
      const messageText = message.trim();
      const messageData: Message = {
        room,
        author: user.username,
        message: messageText,
        content: messageText, // Include content field for direct message API compatibility
      };
      
      socketRef.current.emit('send_message', messageData);
      
      // Add your own message to the list immediately for better UX
      setMessages(prev => [...prev, {
        ...messageData,
        timestamp: new Date().toISOString()
      }]);
      
      setMessage('');
    } else if (!user) {
      toast({
        title: "Not signed in",
        description: "You need to be signed in to send messages",
        variant: "destructive",
      });
    } else if (!socketRef.current) {
      toast({
        title: "Not connected",
        description: "You're not connected to the messenger service",
        variant: "destructive",
      });
    }
  };

  // Connection status indicator
  const getConnectionStatusIcon = () => {
    switch(connectionStatus) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />;
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };
  
  const getConnectionStatusText = () => {
    switch(connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
    }
  };

  return (
    <Card className="p-4 h-[400px] flex flex-col">
      {/* Connection status indicator */}
      <div className="flex items-center justify-end gap-1 text-xs mb-2">
        {getConnectionStatusIcon()}
        <span className={`
          ${connectionStatus === 'connected' ? 'text-green-500' : ''}
          ${connectionStatus === 'connecting' ? 'text-amber-500' : ''}
          ${connectionStatus === 'disconnected' ? 'text-red-500' : ''}
        `}>
          {getConnectionStatusText()}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start a conversation!
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg ${
              msg.author === user?.username
                ? 'bg-primary text-white ml-auto'
                : 'bg-gray-100'
            } max-w-[80%]`}
          >
            <div className="text-xs opacity-70">{msg.author}</div>
            <div>{msg.message}</div>
            {msg.timestamp && (
              <div className="text-xs opacity-50 text-right mt-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          disabled={connectionStatus !== 'connected'}
        />
        <Button 
          onClick={sendMessage}
          disabled={connectionStatus !== 'connected'}
        >
          Send
        </Button>
      </div>
    </Card>
  );
}
