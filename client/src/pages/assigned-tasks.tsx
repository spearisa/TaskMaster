import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { MobileLayout } from "@/components/layouts/mobile-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, Calendar, AlertTriangle, ArrowRight } from "lucide-react";
import { format, isPast, isToday, isTomorrow, addDays } from "date-fns";
import { TaskWithStringDates } from "@shared/schema";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { CategoryBadge } from "@/components/ui/category-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function AssignedTasksPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentFilter, setCurrentFilter] = useState<'all' | 'today' | 'upcoming'>('all');

  // Fetch assigned tasks
  const { 
    data: assignedTasks = [], 
    isLoading,
    isError,
    refetch: refetchAssignedTasks
  } = useQuery<TaskWithStringDates[]>({
    queryKey: ['/api/assigned-tasks'],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/assigned-tasks");
      return await response.json();
    },
    enabled: !!user,
  });

  // Mutation for completing tasks
  const completeMutation = useMutation({
    mutationFn: async (taskId: number) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/complete`, null);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to complete task");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Task completed",
        description: "The task has been marked as complete.",
      });
      refetchAssignedTasks();
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete task.",
        variant: "destructive",
      });
    },
  });

  const handleCompleteTask = (taskId: number) => {
    completeMutation.mutate(taskId);
  };

  const handleViewTask = (taskId: number) => {
    navigate(`/task/${taskId}`);
  };

  // Filter tasks based on selected tab
  const filteredTasks = assignedTasks.filter(task => {
    if (currentFilter === 'all') return true;
    if (!task.dueDate) return false;
    
    const dueDate = new Date(task.dueDate);
    
    if (currentFilter === 'today') {
      return isToday(dueDate);
    } else if (currentFilter === 'upcoming') {
      const nextWeek = addDays(new Date(), 7);
      return !isToday(dueDate) && dueDate <= nextWeek;
    }
    
    return true;
  });

  // Format the due date for display
  const formatDueDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No due date";
    
    const dueDate = new Date(dateString);
    
    if (isToday(dueDate)) {
      return "Today";
    } else if (isTomorrow(dueDate)) {
      return "Tomorrow";
    } else {
      return format(dueDate, "MMM d, yyyy");
    }
  };

  // Check if a task is overdue
  const isOverdue = (dateString: string | null | undefined) => {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    return isPast(dueDate) && !isToday(dueDate);
  };

  return (
    <MobileLayout pageTitle="Assigned Tasks" showBackButton backButtonPath="/">
      <div className="p-4">
        <Tabs value={currentFilter} onValueChange={(value) => setCurrentFilter(value as any)}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-0">
            <h2 className="text-lg font-semibold mb-4">All Assigned Tasks</h2>
            {renderTaskList()}
          </TabsContent>
          
          <TabsContent value="today" className="mt-0">
            <h2 className="text-lg font-semibold mb-4">Tasks Due Today</h2>
            {renderTaskList()}
          </TabsContent>
          
          <TabsContent value="upcoming" className="mt-0">
            <h2 className="text-lg font-semibold mb-4">Upcoming Tasks</h2>
            {renderTaskList()}
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );

  function renderTaskList() {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent className="pb-2">
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="p-6 text-center">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">Error Loading Tasks</h3>
          <p className="text-gray-500 mb-4">There was a problem loading your assigned tasks.</p>
          <Button onClick={() => refetchAssignedTasks()}>Try Again</Button>
        </div>
      );
    }

    if (filteredTasks.length === 0) {
      return (
        <div className="text-center p-6 bg-gray-50 rounded-lg">
          <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">No Tasks Assigned</h3>
          <p className="text-gray-500">
            {currentFilter === 'all' 
              ? "You don't have any tasks assigned to you yet." 
              : `You don't have any ${currentFilter === 'today' ? 'tasks due today' : 'upcoming tasks'}.`}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filteredTasks.map(task => (
          <Card key={task.id} className={task.completed ? "opacity-60" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{task.title}</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={task.priority} />
                <CategoryBadge category={task.category} />
                {task.completed ? (
                  <div className="px-2 py-0.5 rounded-full text-xs text-green-500 bg-green-50">
                    Completed
                  </div>
                ) : isOverdue(task.dueDate) ? (
                  <div className="px-2 py-0.5 rounded-full text-xs text-red-500 bg-red-50">
                    Overdue
                  </div>
                ) : null}
              </div>
            </CardHeader>
            
            <CardContent className="pb-2">
              {task.description && (
                <CardDescription className="line-clamp-2 mb-2">
                  {task.description}
                </CardDescription>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatDueDate(task.dueDate)}</span>
                </div>
                
                {task.estimatedTime && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{task.estimatedTime} mins</span>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="pt-2">
              <div className="w-full grid grid-cols-2 gap-2">
                {!task.completed && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={completeMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                )}
                <Button 
                  size="sm"
                  onClick={() => handleViewTask(task.id)}
                  className={task.completed ? "col-span-2" : ""}
                >
                  View Details
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
}