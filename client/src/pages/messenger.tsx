
import { Messenger } from '@/components/messenger';
import { DirectMessenger } from '@/components/direct-messenger';
import { UserSearch } from '@/components/user-search';
import { useLocation } from 'wouter';
import { ChevronLeft, MessageSquare, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';

interface Conversation {
  id: number;
  user1Id: number;
  user2Id: number;
  lastMessageAt: string;
  unreadCount: number;
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

interface ConversationWithUser {
  conversation: Conversation;
  user: UserProfile;
}

// A single unified messenger page that handles all cases
export default function MessengerPage() {
  const [_, navigate] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'direct' | 'group' | 'search'>('direct');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Check URL for conversation ID
  useEffect(() => {
    const pathname = window.location.pathname;
    const match = pathname.match(/\/messenger\/(\d+)/);
    if (match && match[1]) {
      const userId = parseInt(match[1], 10);
      if (!isNaN(userId)) {
        setSelectedUserId(userId);
      }
    }
  }, []);

  // Get conversations
  const { data: conversations } = useQuery<ConversationWithUser[]>({
    queryKey: ['/api/conversations'],
    enabled: !!user,
  });

  // Handle active conversations list
  const openConversation = (userId: number) => {
    console.log(`[Messenger] Opening conversation with user ID: ${userId}`);
    setSelectedUserId(userId);
    
    // Update URL without reloading the page
    window.history.pushState({}, '', `/messenger/${userId}`);
  };

  // If we have a selected user ID, show the direct messenger
  if (selectedUserId) {
    return (
      <div className="p-4">
        <header className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              setSelectedUserId(null);
              window.history.pushState({}, '', '/messenger');
            }} 
            className="mr-2"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-semibold">Direct Message</h1>
        </header>
        
        <DirectMessenger recipientId={selectedUserId} />
      </div>
    );
  }

  // Otherwise show the messenger list
  return (
    <div className="p-4">
      <header className="flex items-center mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-2">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">Messages</h1>
      </header>
      
      <Tabs 
        defaultValue="direct" 
        className="w-full"
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as any)}
      >
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="direct" className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Direct Messages
          </TabsTrigger>
          <TabsTrigger value="group" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Group Chat
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center">
            <Search className="h-4 w-4 mr-2" />
            Find Users
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="direct" className="space-y-4">
          {conversations?.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No conversations yet</p>
              <p className="text-sm mt-1">Start a new conversation by searching for users</p>
              <Button 
                variant="outline" 
                onClick={() => setActiveTab('search')}
                className="mt-3"
              >
                Find Users
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations?.map(({ conversation, user: otherUser }) => (
                <Card 
                  key={conversation.id}
                  className="p-3 flex items-center hover:bg-gray-50 cursor-pointer"
                  onClick={() => openConversation(otherUser.id)}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={otherUser.avatarUrl || undefined} />
                    <AvatarFallback>{otherUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">
                      {otherUser.displayName || otherUser.username}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(conversation.lastMessageAt).toLocaleDateString()}
                    </div>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="rounded-full bg-primary text-white h-5 min-w-5 flex items-center justify-center px-1.5 text-xs">
                      {conversation.unreadCount}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="group">
          <Messenger />
        </TabsContent>
        
        <TabsContent value="search">
          <UserSearch onSelectUser={openConversation} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
