
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

// Initialize socket with auth headers
const socket = io('/', {
  autoConnect: true,
  withCredentials: true,
  extraHeaders: {
    'Cookie': document.cookie
  }
});

export function Messenger() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const { user } = useAuth();
  const room = 'global'; // Using a global room for simplicity

  useEffect(() => {
    socket.emit('join_room', room);

    socket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      const messageData = {
        room,
        author: user?.username,
        message,
      };
      socket.emit('send_message', messageData);
      setMessage('');
    }
  };

  return (
    <Card className="p-4 h-[400px] flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
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
