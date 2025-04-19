import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { 
  ChevronLeft, Loader2, MessageCircle, Send, Smile, Search, AlertCircle, 
  MoreVertical, Check, Edit, Trash2, Copy, CheckCheck 
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useWebSocket } from '@/lib/websocket-service';
import type { DirectMessage, UserProfile } from '@shared/schema';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';

interface DirectMessengerProps {
  recipientId: number;
}

export function DirectMessenger({ recipientId }: DirectMessengerProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Use the WebSocket service
  const wsService = useWebSocket(user?.id);
  
  // Get recipient profile
  const { data: recipient, isLoading: isLoadingProfile } = useQuery<UserProfile>({
    queryKey: [`/api/profile/${recipientId}`],
    enabled: !!user,
  });

  // Get messages
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<DirectMessage[]>({
    queryKey: [`/api/messages/${recipientId}`],
    enabled: !!user,
    onSuccess: (data) => {
      // Scroll to bottom when messages arrive
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // Send a message
  const sendMessageMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest('POST', '/api/messages', { 
        receiverId: recipientId,
        content: text 
      });
      return await res.json();
    },
    onSuccess: () => {
      // Mark queries as stale but don't trigger automatic refetch
      queryClient.invalidateQueries({ 
        queryKey: [`/api/messages/${recipientId}`],
        refetchType: 'none' 
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'],
        refetchType: 'none'
      });
      
      // Manual refetch with delay to prevent duplicates and race conditions
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [`/api/messages/${recipientId}`] });
        queryClient.refetchQueries({ queryKey: ['/api/conversations'] });
      }, 500);
      
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

  // Mark messages as read (manual trigger)
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', `/api/messages/${recipientId}/read`);
    },
    onSuccess: () => {
      // Mark as stale but don't trigger automatic refetch
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'],
        refetchType: 'none' 
      });
      
      // Manual refetch with delay to prevent duplicates
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/conversations'] });
      }, 300);
    }
  });
  
  // Add emoji reaction to a message
  const addReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: number, emoji: string }) => {
      const res = await apiRequest('POST', `/api/messages/${messageId}/reactions`, { emoji });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/messages/${recipientId}`],
        refetchType: 'none' 
      });
      
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [`/api/messages/${recipientId}`] });
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error adding reaction',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Remove emoji reaction from a message
  const removeReactionMutation = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: number, emoji: string }) => {
      const res = await apiRequest('DELETE', `/api/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/messages/${recipientId}`],
        refetchType: 'none' 
      });
      
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [`/api/messages/${recipientId}`] });
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error removing reaction',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Edit a message
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: number, content: string }) => {
      const res = await apiRequest('PUT', `/api/messages/${messageId}`, { content });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/messages/${recipientId}`],
        refetchType: 'none' 
      });
      
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [`/api/messages/${recipientId}`] });
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error editing message',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Delete a message (soft delete)
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest('DELETE', `/api/messages/${messageId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/messages/${recipientId}`],
        refetchType: 'none' 
      });
      
      queryClient.invalidateQueries({ 
        queryKey: ['/api/conversations'],
        refetchType: 'none'
      });
      
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [`/api/messages/${recipientId}`] });
        queryClient.refetchQueries({ queryKey: ['/api/conversations'] });
      }, 300);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error deleting message',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  
  // Mark a message as delivered
  const markMessageDeliveredMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const res = await apiRequest('POST', `/api/messages/${messageId}/delivered`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/messages/${recipientId}`],
        refetchType: 'none' 
      });
    },
    onError: (error: Error) => {
      console.error('Error marking message as delivered:', error);
    }
  });

  // Set up WebSocket listener and connection status
  useEffect(() => {
    if (!user) return;
    
    // Update connection status from WebSocket service
    const removeStatusHandler = wsService.addStatusHandler(setConnectionStatus);
    
    // Configure query to prevent automatic refetching
    queryClient.setQueryDefaults([`/api/messages/${recipientId}`], {
      refetchOnWindowFocus: false,
      staleTime: 10000, // Consider data fresh for 10 seconds
      refetchInterval: false
    });
    
    // Set up message handler
    const removeMessageHandler = wsService.addMessageHandler((data) => {
      // Handle message reception
      if (data.type === 'new_message') {
        const message = data.message;
        
        // Check if this message is for the current conversation
        if (
          (message.senderId === recipientId && message.receiverId === user.id) ||
          (message.senderId === user.id && message.receiverId === recipientId)
        ) {
          // Mark as stale but don't refetch automatically
          queryClient.invalidateQueries({ 
            queryKey: [`/api/messages/${recipientId}`],
            refetchType: 'none' // Don't trigger a refetch
          });
          
          // Instead, use a manual refetch with a short delay to prevent duplicates
          setTimeout(() => {
            queryClient.refetchQueries({ queryKey: [`/api/messages/${recipientId}`] });
          }, 500);
        }
        
        // Update conversations list
        queryClient.invalidateQueries({ 
          queryKey: ['/api/conversations'],
          refetchType: 'none'
        });
      }
    });
    
    // Clean up on component unmount
    return () => {
      removeStatusHandler();
      removeMessageHandler();
      
      // Reset query defaults when component unmounts
      queryClient.setQueryDefaults([`/api/messages/${recipientId}`], {});
    };
  }, [user, recipientId, queryClient, wsService]);

  // Send the message via both WebSocket (for real-time) and API (for persistence)
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // First try to send via WebSocket for immediate delivery
    if (connectionStatus === 'connected') {
      // Send message directly through WebSocket for better real-time experience
      wsService.send({
        type: 'direct_message',
        receiverId: recipientId, 
        content: message
      });
    }
    
    // Always use the mutation for persistence (this creates the record in database)
    sendMessageMutation.mutate(message);
  };

  // Format message date with relative time
  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return `Today at ${format(messageDate, 'h:mm a')}`;
    } else if (isYesterday(messageDate)) {
      return `Yesterday at ${format(messageDate, 'h:mm a')}`;
    } else if (Date.now() - messageDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
      // Less than a week ago
      return `${formatDistanceToNow(messageDate, { addSuffix: true })} at ${format(messageDate, 'h:mm a')}`;
    } else {
      // More than a week ago
      return format(messageDate, 'MMM d, yyyy \'at\' h:mm a');
    }
  };

  // Search through messages if there's a query
  const filteredMessages = searchQuery ? 
    messages.filter(msg => {
      const content = msg.message || msg.content || '';
      return content.toLowerCase().includes(searchQuery.toLowerCase());
    }) : 
    messages;
  
  // Group messages by date
  type MessageGroups = Record<string, DirectMessage[]>;
  
  const groupedMessages: MessageGroups = filteredMessages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as MessageGroups);

  // Check if we have profile of the recipient
  const recipientName = isLoadingProfile ? 'Loading...' : (recipient ? (recipient.displayName || recipient.username) : 'Unknown user');

  // Check for unread messages
  const hasUnreadMessages = messages.some(msg => 
    msg.senderId === recipientId && 
    msg.receiverId === user?.id && 
    !msg.read
  );

  // State for message editing - moved outside of the map function
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  
  // Start editing a message
  const startEditingMessage = (messageId: number, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditContent('');
  };
  
  // Save edited message
  const saveEditedMessage = (messageId: number) => {
    if (editContent.trim() !== '') {
      editMessageMutation.mutate({
        messageId,
        content: editContent
      });
      setEditingMessageId(null);
    }
  };
  
  // Highlight search terms in message text
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim() || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, index) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={index} className="bg-yellow-200 text-black px-0.5 rounded">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };
  
  // On component mount, check if there are unread messages and add a mark as read button
  useEffect(() => {
    // We're not calling markAsReadMutation here to avoid the infinite loop
    // Let the user click the button manually
  }, []);

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
        
        <div className="flex items-center flex-1">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={recipient?.avatarUrl || undefined} />
            <AvatarFallback>
              {isLoadingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                recipient?.username?.substring(0, 2).toUpperCase() || '??'
              )}
            </AvatarFallback>
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
          
          {/* Chat controls */}
          <div className="ml-auto flex items-center gap-2">
            {/* Search button */}
            <Button
              variant="ghost"
              size="icon"
              className={isSearching ? "bg-gray-100" : ""}
              onClick={() => setIsSearching(!isSearching)}
            >
              <Search className="h-4 w-4" />
            </Button>
            
            {/* Mark as read button */}
            {hasUnreadMessages && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => markAsReadMutation.mutate()}
                disabled={markAsReadMutation.isPending}
              >
                Mark as read
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Search bar, shown conditionally */}
      {isSearching && (
        <div className="mb-4 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search in conversation..."
              className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => setSearchQuery('')}
              >
                &times;
              </Button>
            )}
          </div>
          
          {/* Search status with result count */}
          {searchQuery && (
            <div className="text-xs mt-1">
              {filteredMessages.length > 0 ? (
                <span className="text-green-600">
                  Found {filteredMessages.length} {filteredMessages.length === 1 ? 'message' : 'messages'} containing "{searchQuery}"
                </span>
              ) : (
                <span className="text-gray-500">
                  No messages found containing "{searchQuery}"
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-2 pr-1">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="space-y-2">
            <div className="flex justify-center my-3">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            
            {dateMessages.map((msg) => {
              // Parse reactions if they exist
              const reactions = msg.reactions ? 
                (typeof msg.reactions === 'string' ? 
                  JSON.parse(msg.reactions as string) : 
                  msg.reactions) || {} : 
                {};
              
              // Get all reaction emojis
              const reactionEmojis = Object.keys(reactions);
              
              // Check if message is from current user
              const isFromMe = msg.senderId === user?.id;
              
              // Check if this message is being edited
              const isEditing = editingMessageId === msg.id;
              
              // Format message content based on status
              const messageContent = msg.deleted ? 
                <em className="text-gray-400">This message was deleted</em> : 
                searchQuery ? 
                  highlightText(msg.message || msg.content || '', searchQuery) : 
                  msg.message || msg.content;
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isFromMe ? 'justify-end' : 'justify-start'} group`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg relative ${
                      isFromMe 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {/* Message content or edit field */}
                    {isEditing ? (
                      <div className="mb-2">
                        <Textarea 
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[60px] w-full bg-white text-gray-900 border border-gray-300 rounded p-2 mb-1"
                        />
                        <div className="flex justify-end gap-1 mt-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={cancelEditing}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => saveEditedMessage(msg.id)}
                            disabled={editMessageMutation.isPending}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words">
                        {messageContent}
                        {msg.edited && (
                          <span className={`text-xs ml-1 ${isFromMe ? 'text-primary-foreground/70' : 'text-gray-500'}`}>
                            (edited)
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Message info */}
                    <div 
                      className={`text-xs mt-1 flex items-center ${
                        isFromMe ? 'text-primary-foreground/70 justify-end' : 'text-gray-500'
                      }`}
                    >
                      <span>{formatMessageDate(msg.createdAt.toString())}</span>
                      
                      {/* Delivery status for sent messages */}
                      {isFromMe && !msg.deleted && (
                        <div className="ml-2 flex items-center">
                          {msg.delivered ? (
                            <CheckCheck className="h-3 w-3 ml-1" />
                          ) : (
                            <Check className="h-3 w-3 ml-1" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Message actions - only show if not editing and not deleted */}
                    {!isEditing && !msg.deleted && (
                      <div 
                        className={`absolute ${isFromMe ? 'left-0' : 'right-0'} top-0 transform ${
                          isFromMe ? '-translate-x-full' : 'translate-x-full'
                        } hidden group-hover:flex flex-col gap-1 p-1 bg-white shadow-md rounded-md`}
                      >
                        {/* Reaction button */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7">
                              <Smile className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2">
                            <EmojiPicker 
                              onEmojiClick={(emojiData: EmojiClickData) => {
                                addReactionMutation.mutate({
                                  messageId: msg.id,
                                  emoji: emojiData.emoji
                                });
                              }}
                              width={300}
                              height={350}
                            />
                          </PopoverContent>
                        </Popover>
                        
                        {/* Copy message */}
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-7 w-7"
                          onClick={() => {
                            navigator.clipboard.writeText(msg.message || msg.content || '');
                            toast({
                              title: "Copied to clipboard",
                              duration: 2000
                            });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        
                        {/* Edit own message */}
                        {isFromMe && (
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7"
                            onClick={() => startEditingMessage(msg.id, msg.message || msg.content || '')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Delete own message */}
                        {isFromMe && (
                          <Button 
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this message?')) {
                                deleteMessageMutation.mutate(msg.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* Display reactions */}
                    {reactionEmojis.length > 0 && !msg.deleted && (
                      <div className={`flex flex-wrap gap-1 mt-1 ${
                        isFromMe ? 'justify-end' : 'justify-start'
                      }`}>
                        {reactionEmojis.map(emoji => (
                          <button
                            key={emoji}
                            className={`text-xs rounded-full px-1.5 py-0.5 flex items-center ${
                              isFromMe ? 'bg-primary-foreground/10' : 'bg-gray-200'
                            }`}
                            onClick={() => {
                              // Toggle reaction
                              if (reactions[emoji].includes(user?.id)) {
                                removeReactionMutation.mutate({
                                  messageId: msg.id,
                                  emoji
                                });
                              } else {
                                addReactionMutation.mutate({
                                  messageId: msg.id,
                                  emoji
                                });
                              }
                            }}
                          >
                            <span>{emoji}</span>
                            <span className="ml-1">{reactions[emoji].length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        
        {isLoadingMessages && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Loader2 className="h-12 w-12 mb-2 opacity-50 animate-spin" />
            <p>Loading messages...</p>
          </div>
        )}
        
        {messages.length === 0 && !isLoadingMessages && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="h-12 w-12 mb-2 opacity-20" />
            <p>No messages yet</p>
            <p className="text-sm">Start a conversation with {recipientName}</p>
          </div>
        )}
        
        {/* Show a message when search has no results but there are messages in the conversation */}
        {searchQuery && filteredMessages.length === 0 && messages.length > 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Search className="h-12 w-12 mb-2 opacity-20" />
            <p>No matching messages found</p>
            <p className="text-sm">Try a different search term</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4"
              onClick={() => setSearchQuery('')}
            >
              Clear search
            </Button>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="mt-auto">
        <div className="flex flex-col gap-2">
          {/* Error message, shown conditionally when message sending fails */}
          {sendMessageMutation.isError && (
            <Alert variant="destructive" className="mb-2 py-2">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertTitle>Failed to send message</AlertTitle>
              <AlertDescription>
                {sendMessageMutation.error?.message || 'Please try again later.'}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex items-end">
            {/* Emoji picker */}
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className={`self-end mr-2 ${showEmojiPicker ? 'bg-gray-100' : ''}`}
                >
                  <Smile className="h-5 w-5 text-gray-500 hover:text-gray-800" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="p-0 border-0 w-72 sm:w-96">
                <EmojiPicker
                  onEmojiClick={(emojiData: EmojiClickData) => {
                    setMessage(prev => prev + emojiData.emoji);
                    setShowEmojiPicker(false);
                  }}
                  width="100%"
                  height={350}
                  previewConfig={{ showPreview: false }}
                />
              </PopoverContent>
            </Popover>
            
            {/* Message textarea */}
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
            
            {/* Send button */}
            <Button 
              type="submit" 
              size="icon" 
              className="ml-2 self-end"
              disabled={!message.trim() || sendMessageMutation.isPending}
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Connection status indicator */}
          {connectionStatus !== 'connected' && (
            <div className="text-xs text-gray-500 mt-1">
              {connectionStatus === 'connecting' ? (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mr-1 animate-pulse"></span>
                  Connecting to real-time messaging...
                </span>
              ) : (
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                  Not connected to real-time messaging. Messages will still be sent but may be delayed.
                </span>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}