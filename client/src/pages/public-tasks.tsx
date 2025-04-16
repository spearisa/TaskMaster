import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MobileLayout } from '@/components/layouts/mobile-layout';
import { TaskWithStringDates, UserProfile } from '@shared/schema';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, Clock, Tag, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { getInitials } from '@/lib/utils';

export default function PublicTasksPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Define the type for public tasks that include user info
  interface PublicTaskWithUser extends TaskWithStringDates {
    user?: UserProfile;
  }
  
  // Fetch public tasks
  const { data: publicTasks, isLoading, error } = useQuery<PublicTaskWithUser[]>({
    queryKey: ['/api/public-tasks'],
  });

  // Get all unique categories from tasks
  const categories: string[] = [];
  if (publicTasks) {
    // Create a map to track unique categories
    const categoryMap: Record<string, boolean> = {};
    publicTasks.forEach(task => {
      if (task.category && !categoryMap[task.category]) {
        categoryMap[task.category] = true;
        categories.push(task.category);
      }
    });
  }

  // Filter tasks by selected category
  const filteredTasks = publicTasks
    ? (selectedCategory 
        ? publicTasks.filter(task => task.category === selectedCategory)
        : publicTasks)
    : [];

  const handleTaskClick = (taskId: number) => {
    // If user is logged in, navigate to task detail page
    // Otherwise, navigate to shared task page that doesn't require login
    if (user) {
      navigate(`/task/${taskId}`);
    } else {
      navigate(`/shared-task/${taskId}`);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-600';
      case 'medium': return 'bg-yellow-100 text-yellow-600';
      case 'low': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (error) {
    return (
      <MobileLayout pageTitle="Public Task Board">
        <div className="flex flex-col items-center justify-center h-64">
          <h2 className="text-lg font-semibold text-red-600">Error loading public tasks</h2>
          <p className="text-gray-500">Please try again later</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout pageTitle="Public Task Board">
      <div className="flex flex-col h-full">
        <p className="text-xs text-muted-foreground mb-2">
          Browse and explore tasks shared by the community
        </p>

        {/* Category filters */}
        <div className="mb-2">
          <h2 className="text-xs font-medium text-gray-500 mb-1">Categories</h2>
          <div className="flex flex-wrap gap-1">
            <Button
              variant={selectedCategory === null ? "secondary" : "outline"}
              size="sm"
              className="h-6 text-xs py-0 px-2"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "secondary" : "outline"}
                size="sm"
                className="h-6 text-xs py-0 px-2"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Login prompt for non-authenticated users */}
        {!user && !isLoading && (
          <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-md text-indigo-700 mb-2">
            <p className="font-medium text-sm">Browsing as a guest</p>
            <p className="text-xs mb-1">Sign in to create tasks, use templates, and access AI.</p>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-indigo-600 hover:bg-indigo-700 h-7 text-xs py-0"
            >
              Sign In
            </Button>
          </div>
        )}

        {/* Tasks grid - make it fill remaining space */}
        <div className="space-y-1 flex-1 overflow-y-auto">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="w-full cursor-pointer hover:shadow-md transition-shadow mb-1">
                <CardHeader className="pb-0.5 pt-1 px-2">
                  <Skeleton className="h-3.5 w-2/3 mb-0.5" />
                  <Skeleton className="h-2.5 w-1/2" />
                </CardHeader>
                <CardContent className="py-0.5 px-2">
                  <Skeleton className="h-2.5 w-full mb-0.5" />
                  <Skeleton className="h-2.5 w-3/4" />
                </CardContent>
                <CardFooter className="py-0.5 px-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-2.5 w-1/3 ml-1" />
                </CardFooter>
              </Card>
            ))
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm">No public tasks found</p>
              {selectedCategory && (
                <Button 
                  variant="ghost" 
                  className="mt-0.5 h-6 text-xs"
                  onClick={() => setSelectedCategory(null)}
                >
                  Clear filter
                </Button>
              )}
            </div>
          ) : (
            <>
              {filteredTasks.map(task => (
                <Card 
                  key={task.id}
                  className="w-full cursor-pointer hover:shadow-md transition-shadow mb-1 overflow-hidden"
                  onClick={() => handleTaskClick(task.id)}
                >
                  <CardHeader className="pb-0.5 pt-1.5 px-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium leading-tight">{task.title}</CardTitle>
                      <Badge className={`${getPriorityColor(task.priority)} text-[10px] py-0 px-1.5 h-4`}>
                        {task.priority}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center text-[10px]">
                      <Tag size={10} className="mr-0.5" />
                      {task.category}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="py-0.5 px-2">
                    {task.description && (
                      <p className="text-[10px] text-gray-600 line-clamp-1 mb-0.5">
                        {task.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 text-[9px] text-gray-500">
                      {task.dueDate && (
                        <div className="flex items-center">
                          <Calendar size={10} className="mr-0.5" />
                          {formatDate(task.dueDate)}
                        </div>
                      )}
                      {task.estimatedTime && (
                        <div className="flex items-center ml-1">
                          <Clock size={10} className="mr-0.5" />
                          {task.estimatedTime} min
                        </div>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="py-0.5 px-2 flex items-center justify-between border-t">
                    <div className="flex items-center">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="bg-primary text-primary-foreground text-[8px]">
                          {task.user?.username ? getInitials(task.user.username) : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-[9px] ml-0.5 text-gray-600">
                        {task.user?.username || 'Anonymous'}
                      </span>
                    </div>
                    
                    {task.assignedToUserId && (
                      <Badge variant="outline" className="flex items-center text-[9px] py-0 h-3.5">
                        <Users size={8} className="mr-0.5" />
                        Assigned
                      </Badge>
                    )}
                  </CardFooter>
                </Card>
              ))}
              
              {/* Add empty placeholders if there are fewer than 5 tasks to ensure the page fills up */}
              {filteredTasks.length > 0 && filteredTasks.length < 5 && (
                Array.from({ length: 5 - filteredTasks.length }).map((_, i) => (
                  <div key={`placeholder-${i}`} className="h-20 border border-dashed border-gray-200 rounded-lg mb-1 flex items-center justify-center">
                    <p className="text-xs text-gray-400">Browse more tasks</p>
                  </div>
                ))
              )}
              
              {/* Spacer div at the bottom */}
              <div className="h-16"></div>
            </>
          )}
          
        </div>
      </div>
    </MobileLayout>
  );
}