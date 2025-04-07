import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

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

export function UserSearch() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Handle search input changes with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Clear any existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set a new timeout
    const timeout = setTimeout(() => {
      if (value.length >= 2) {
        setDebouncedQuery(value);
      } else if (value.length === 0) {
        setDebouncedQuery('');
      }
    }, 500);
    
    setSearchTimeout(timeout);
  };

  // Get search results
  const { data: searchResults = [], isLoading, error } = useQuery<UserProfile[]>({
    queryKey: ['/api/users/search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      
      console.log(`[UserSearch] Searching for query: "${debouncedQuery}"`);
      
      try {
        const response = await apiRequest(
          'GET',
          `/api/users/search?q=${encodeURIComponent(debouncedQuery)}`
        );
        
        const data = await response.json();
        console.log(`[UserSearch] Search results:`, data);
        return data;
      } catch (err) {
        console.error(`[UserSearch] Error searching users:`, err);
        throw err;
      }
    },
    enabled: !!user && debouncedQuery.length >= 2,
  });
  
  // Log any errors
  if (error) {
    console.error(`[UserSearch] Query error:`, error);
  }

  // When a user card is clicked, navigate to the direct message page
  const handleUserClick = (userId: number) => {
    navigate(`/messenger/${userId}`);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Input
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search for users by name or interests..."
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>

      {debouncedQuery && (
        <div className="text-sm text-gray-500 mb-2">
          {isLoading
            ? 'Searching...'
            : searchResults.length === 0
            ? 'No users found. Try a different search term.'
            : `Found ${searchResults.length} user${searchResults.length === 1 ? '' : 's'}`}
        </div>
      )}

      <div className="space-y-3">
        {searchResults.map((profile) => (
          <Card 
            key={profile.id} 
            className="p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => handleUserClick(profile.id)}
          >
            <div className="flex">
              <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback>{profile.username.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="font-medium">
                  {profile.displayName || profile.username}
                </div>
                
                {profile.bio && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {profile.bio}
                  </p>
                )}
                
                {profile.interests && profile.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {profile.interests.slice(0, 3).map((interest, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                    {profile.interests.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{profile.interests.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                
                {profile.skills && profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile.skills.slice(0, 2).map((skill, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {profile.skills.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{profile.skills.length - 2} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <Button variant="ghost" size="sm" className="ml-2 self-start">
                Message
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      {!debouncedQuery && (
        <div className="text-center py-8 text-gray-500">
          <Search className="h-10 w-10 mx-auto mb-2 opacity-20" />
          <p>Search for users to start a conversation</p>
          <p className="text-sm mt-1">Find people by name, interests, or skills</p>
        </div>
      )}
    </div>
  );
}