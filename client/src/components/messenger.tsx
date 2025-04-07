
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { useToast } from '@/hooks/use-toast';

interface Message {
  room: string;
  author: string;
  message: string;
  timestamp?: string;
}

export function Messenger() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  const room = 'global'; // Using a global room for simplicity

  useEffect(() => {
    // Create socket instance with proper configuration
    const socket = io('/', {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socketRef.current = socket;

    // Connect to the socket
    socket.connect();

    // Join room
    socket.emit('join_room', room);

    // Listen for incoming messages
    socket.on('receive_message', (data: Message) => {
      // Check if this message is from the current user and already in the list
      // This prevents duplicate messages
      const isDuplicate = prev => prev.some(
        msg => 
          msg.author === data.author && 
          msg.message === data.message && 
          // Use approximate time matching (within 2 seconds)
          msg.timestamp && data.timestamp && 
          Math.abs(new Date(msg.timestamp).getTime() - new Date(data.timestamp).getTime()) < 2000
      );
      
      setMessages((prev) => isDuplicate(prev) ? prev : [...prev, data]);
    });

    // Handle connection events
    socket.on('connect', () => {
      console.log('Connected to socket server');
      toast({
        title: "Connected to messenger",
        description: "You are now connected to the messenger service",
        variant: "default",
      });
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      toast({
        title: "Connection error",
        description: "Failed to connect to the messenger service",
        variant: "destructive",
      });
    });

    // Cleanup on component unmount
    return () => {
      socket.off('receive_message');
      socket.off('connect');
      socket.off('connect_error');
      socket.disconnect();
    };
  }, [toast]);

  const sendMessage = () => {
    if (message.trim() && socketRef.current && user) {
      const messageData: Message = {
        room,
        author: user.username,
        message: message.trim(),
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

  return (
    <Card className="p-4 h-[400px] flex flex-col">
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
        />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </Card>
  );
}
