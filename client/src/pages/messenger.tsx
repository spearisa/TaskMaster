import { Messenger } from '@/components/messenger';
import { DirectMessenger } from '@/components/direct-messenger-new';
import { UserSearch } from '@/components/user-search';
import { useLocation } from 'wouter';
import { MessageSquare, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { MobileLayout } from '@/components/layouts/mobile-layout';

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
    
    // Navigate to the conversation using Wouter
    navigate(`/messenger/${userId}`);
  };

  // If we have a selected user ID, show the direct messenger
  if (selectedUserId) {
    return (
      <MobileLayout 
        showBackButton 
        backButtonPath="/messenger" 
        pageTitle="Direct Message"
      >
        <DirectMessenger recipientId={selectedUserId} />
      </MobileLayout>
    );
  }

  // Otherwise show the messenger list
  return (
    <MobileLayout 
      showBackButton 
      backButtonPath="/" 
      pageTitle="Messages"
    >
      
      <div className="flex flex-col h-full">
        <p className="text-xs text-muted-foreground mb-2">
          Connect with others and discuss tasks
        </p>
        
        {/* Message type tabs */}
        <div className="flex mb-2 bg-gray-100 rounded-lg overflow-hidden">
          <div className="flex-1">
            <Button 
              variant="ghost" 
              className={`w-full rounded-none py-2 ${activeTab === 'direct' ? 'bg-white text-primary' : 'text-gray-500'}`}
              onClick={() => setActiveTab('direct')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Direct Messages
            </Button>
          </div>
          <div className="flex-1">
            <Button 
              variant="ghost" 
              className={`w-full rounded-none py-2 ${activeTab === 'group' ? 'bg-white text-primary' : 'text-gray-500'}`}
              onClick={() => setActiveTab('group')}
            >
              <Users className="h-4 w-4 mr-2" />
              Group Chat
            </Button>
          </div>
          <div className="flex-1">
            <Button 
              variant="ghost" 
              className={`w-full rounded-none py-2 ${activeTab === 'search' ? 'bg-white text-primary' : 'text-gray-500'}`}
              onClick={() => setActiveTab('search')}
            >
              <Search className="h-4 w-4 mr-2" />
              Find Users
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
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
            <div className="space-y-1">
              {conversations?.map(({ conversation, user: otherUser }) => (
                <div 
                  key={conversation.id}
                  className="flex items-center hover:bg-gray-50 cursor-pointer p-2 rounded-lg border border-gray-100 mb-1"
                  onClick={() => openConversation(otherUser.id)}
                >
                  <div className="flex h-8 w-8 mr-2 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-gray-600 font-medium text-xs">
                      {(otherUser.displayName || otherUser.username).substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {otherUser.displayName || otherUser.username}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(conversation.lastMessageAt).toLocaleDateString("en-US", {month: "short", day: "numeric"})}
                    </div>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <div className="rounded-full bg-primary text-white h-5 w-5 flex items-center justify-center text-xs">
                      {conversation.unreadCount}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add spacer at the bottom for bottom navigation */}
              <div className="h-16"></div>
            </div>
          )}
        </div>
        
        {/* Group tab content */}
        {activeTab === 'group' && (
          <div className="mt-4">
            <Messenger />
          </div>
        )}
        
        {/* Search tab content */}
        {activeTab === 'search' && (
          <div className="mt-4">
            <UserSearch onSelectUser={openConversation} />
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
