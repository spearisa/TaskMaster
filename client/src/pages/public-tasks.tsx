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
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Browse and explore tasks shared by the community
        </p>

        {/* Category filters */}
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-gray-500">Categories</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? "secondary" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "secondary" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Login prompt for non-authenticated users */}
        {!user && !isLoading && (
          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-md text-indigo-700">
            <p className="font-medium">Browsing as a guest</p>
            <p className="text-sm mb-3">Sign in to create your own tasks, use templates, and access AI assistance.</p>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Sign In
            </Button>
          </div>
        )}

        {/* Tasks grid */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="w-full cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </CardHeader>
                <CardContent className="pb-2">
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-3 w-1/3 ml-2" />
                </CardFooter>
              </Card>
            ))
          ) : filteredTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No public tasks found</p>
              {selectedCategory && (
                <Button 
                  variant="ghost" 
                  className="mt-2"
                  onClick={() => setSelectedCategory(null)}
                >
                  Clear filter
                </Button>
              )}
            </div>
          ) : (
            filteredTasks.map(task => (
              <Card 
                key={task.id}
                className="w-full cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleTaskClick(task.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center">
                    <Tag size={14} className="mr-1" />
                    {task.category}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pb-2">
                  {task.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {task.dueDate && (
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        {formatDate(task.dueDate)}
                      </div>
                    )}
                    {task.estimatedTime && (
                      <div className="flex items-center ml-2">
                        <Clock size={14} className="mr-1" />
                        {task.estimatedTime} min
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="pt-2 pb-3 flex items-center justify-between border-t">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {task.user?.username ? getInitials(task.user.username) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs ml-2 text-gray-600">
                      Shared by {task.user?.username || 'Anonymous'}
                    </span>
                  </div>
                  
                  {task.assignedToUserId && (
                    <Badge variant="outline" className="flex items-center">
                      <Users size={12} className="mr-1" />
                      Assigned
                    </Badge>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
}