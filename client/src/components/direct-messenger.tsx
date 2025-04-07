import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ChevronLeft, Send, MessageCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface DirectMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  read: boolean;
  createdAt: string;
}

interface UserProfile {
  id: number;
  username: string;
  displayName: string | null;
  bio: string | null;
  interests: string[];
  skills: string[];
  avatarUrl: string | null;
  createdAt: string | null;
}

interface DirectMessengerProps {
  recipientId: number;
}

export function DirectMessenger({ recipientId }: DirectMessengerProps) {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  // Get recipient profile
  const { data: recipient } = useQuery<UserProfile>({
    queryKey: [`/api/profile/${recipientId}`],
    enabled: !!user,
  });

  // Get messages
  const { data: messages = [], isLoading } = useQuery<DirectMessage[]>({
    queryKey: [`/api/messages/${recipientId}`],
    enabled: !!user,
    refetchInterval: connectionStatus === 'connected' ? false : 5000, // Only poll if WebSocket isn't connected
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', '/api/messages', {
        receiverId: recipientId,
        content
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${recipientId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setMessage('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error sending message',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mark messages as read
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/messages/${recipientId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    }
  });

  // Set up WebSocket connection
  useEffect(() => {
    if (!user) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
      
      // Register with the WebSocket server
      socket.send(JSON.stringify({
        type: 'register',
        userId: user.id
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        // Handle message reception
        if (data.type === 'new_message') {
          const message = data.message;
          
          // Check if this message is for the current conversation
          if (
            (message.senderId === recipientId && message.receiverId === user.id) ||
            (message.senderId === user.id && message.receiverId === recipientId)
          ) {
            queryClient.invalidateQueries({ queryKey: [`/api/messages/${recipientId}`] });
            
            // Mark messages as read if we're currently viewing this conversation
            markAsReadMutation.mutate();
          }
          
          // Update conversations list
          queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    socket.onclose = (event) => {
      console.log(`WebSocket disconnected with code: ${event.code}, reason: ${event.reason || 'No reason provided'}`);
      setConnectionStatus('disconnected');
      
      // Try to reconnect if not closed cleanly (code 1000 is normal closure, 1001 is going away)
      if (event.code !== 1000 && event.code !== 1001) {
        handleReconnect();
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
      handleReconnect();
    };
    
    // Function to handle reconnection with exponential backoff
    function handleReconnect() {
      const attempts = reconnectAttemptsRef.current + 1;
      reconnectAttemptsRef.current = attempts;
      
      // Only try up to 5 reconnect attempts
      if (attempts <= 5) {
        // Exponential backoff: 1s, 2s, 4s, 8s, 16s
        const delay = Math.min(1000 * Math.pow(2, attempts - 1), 16000);
        
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${attempts})`);
        
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          // Create a new WebSocket connection
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = `${protocol}//${window.location.host}/ws`;
          
          // Set status to connecting before creating a new socket
          setConnectionStatus('connecting');
          
          const newSocket = new WebSocket(wsUrl);
          wsRef.current = newSocket;
          
          // Set up event handlers for the new socket
          newSocket.onopen = socket.onopen;
          newSocket.onmessage = socket.onmessage;
          newSocket.onclose = socket.onclose;
          newSocket.onerror = socket.onerror;
        }, delay);
      } else {
        console.log('Max reconnection attempts reached');
        toast({
          title: 'Connection issue',
          description: 'Could not connect to messaging service after multiple attempts',
          variant: 'destructive'
        });
      }
    }

    // Clean up on component unmount
    return () => {
      // Clear any pending reconnection attempts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close the WebSocket connection if it's open
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, "Component unmounted");
      }
    };
  }, [user, recipientId, queryClient, markAsReadMutation, toast]);

  // Automatically mark messages as read when component mounts
  useEffect(() => {
    if (user) {
      markAsReadMutation.mutate();
    }
  }, [user, markAsReadMutation]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // If recipient is currently typing
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    sendMessageMutation.mutate(message);
  };

  // Extract only the date part
  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date);
    const today = new Date();
    
    if (
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear()
    ) {
      return format(messageDate, 'h:mm a'); // Today, show only time
    }
    
    return format(messageDate, 'MMM d, h:mm a'); // Not today, show date and time
  };

  // Group messages by date
  type MessageGroups = Record<string, DirectMessage[]>;
  
  const groupedMessages: MessageGroups = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as MessageGroups);

  // Check if we have profile of the recipient
  const recipientName = recipient ? (recipient.displayName || recipient.username) : 'Loading...';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/messenger')} 
          className="mr-2"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={recipient?.avatarUrl || undefined} />
            <AvatarFallback>{recipient?.username?.substring(0, 2).toUpperCase() || '??'}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-lg font-semibold">{recipientName}</h2>
            {connectionStatus === 'connected' ? (
              <p className="text-xs text-green-600 flex items-center">
                <span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span>
                Connected
              </p>
            ) : connectionStatus === 'connecting' ? (
              <p className="text-xs text-amber-600 flex items-center">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-1 animate-pulse"></span>
                Connecting...
              </p>
            ) : (
              <p className="text-xs text-gray-500 flex items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                Disconnected
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-1">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="space-y-2">
            <div className="flex justify-center my-3">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            
            {dateMessages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.senderId === user?.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                  <div 
                    className={`text-xs mt-1 ${
                      msg.senderId === user?.id ? 'text-primary-foreground/70' : 'text-gray-500'
                    }`}
                  >
                    {formatMessageDate(msg.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
        
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="h-12 w-12 mb-2 opacity-20" />
            <p>No messages yet</p>
            <p className="text-sm">Start a conversation with {recipientName}</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="mt-auto">
        <div className="flex">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message ${recipientName}...`}
            className="flex-1 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (message.trim()) {
                  handleSendMessage(e);
                }
              }
            }}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="ml-2 self-end"
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}