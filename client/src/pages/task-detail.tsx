import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { MobileLayout } from "@/components/layouts/mobile-layout";
import { ChevronLeft, AlertCircle, Sparkles, Calendar, Clock, UserPlus, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { TaskDelegation } from "@/components/task-delegation";
import { TaskAssignment } from "@/components/task-assignment";
import { PriorityBadge } from "@/components/ui/priority-badge";
import { CategoryBadge } from "@/components/ui/category-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { TaskWithStringDates } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export default function TaskDetailPage() {
  const [, params] = useRoute("/task/:id");
  const [, navigate] = useLocation();
  const taskId = params?.id ? parseInt(params.id) : null;
  const { user, refreshUser } = useAuth();
  
  console.log("TaskDetailPage - User authenticated:", !!user);
  console.log("TaskDetailPage - Task ID:", taskId);
  console.log("TaskDetailPage - User:", user);
  
  const [isCompleting, setIsCompleting] = useState(false);
  const [authCheckAttempted, setAuthCheckAttempted] = useState(false);
  const { toast } = useToast();

  // Use TanStack Query to fetch the task
  const { 
    data: task,
    isLoading,
    error,
    refetch: refetchTask
  } = useQuery<TaskWithStringDates>({ 
    queryKey: ['/api/tasks', taskId],
    queryFn: async () => {
      if (!taskId) throw new Error("Task ID is required");
      console.log("Fetching task data, user state:", !!user);
      
      const response = await apiRequest("GET", `/api/tasks/${taskId}`, undefined, {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache"
        }
      });
      
      const data = await response.json();
      console.log("Task data fetched successfully:", data);
      return data;
    },
    enabled: !!taskId && !!user,
    retry: 2,
    staleTime: 30000,
    onError: async (error) => {
      console.error("Error fetching task:", error);
      
      // If we get an error and haven't tried refreshing authentication yet, try once
      if (!authCheckAttempted) {
        console.log("Attempting to refresh authentication state...");
        setAuthCheckAttempted(true);
        try {
          await refreshUser();
          // If refreshUser succeeds, try refetching the task
          if (user) {
            setTimeout(() => refetchTask(), 500);
          }
        } catch (refreshError) {
          console.error("Failed to refresh authentication:", refreshError);
        }
      }
    }
  });
  
  // Use TanStack Query Mutation for completing a task
  const completeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/tasks/${id}/complete`, null);
      return await response.json();
    },
    onSuccess: (updatedTask) => {
      // Update the cache with the new task data
      queryClient.setQueryData(['/api/tasks', taskId], updatedTask);
      // Invalidate the tasks list to refetch
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      toast({
        title: "Task completed",
        description: `"${updatedTask.title}" has been marked as complete.`,
      });
    },
    onError: (error) => {
      console.error("Error completing task:", error);
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (!taskId) {
    navigate("/");
    return null;
  }

  const handleCompleteTask = async () => {
    if (!task || task.completed) return;
    setIsCompleting(true);
    
    try {
      await completeMutation.mutateAsync(task.id);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  const formatDueDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No due date";
    
    const date = new Date(dateString);
    return format(date, "EEEE, MMMM d, yyyy");
  };

  if (isLoading) {
    return (
      <MobileLayout showBackButton backButtonPath="/" pageTitle="Loading...">
        <div className="space-y-6">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </MobileLayout>
    );
  }

  if (!task) {
    return (
      <MobileLayout showBackButton backButtonPath="/" pageTitle="Not Found">
        <div className="flex flex-col items-center justify-center h-[60vh] px-5">
          <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-xl font-medium mb-2">Task Not Found</h2>
          <p className="text-gray-500 text-center mb-6">
            The task you're looking for doesn't exist or was deleted.
          </p>
          <Button onClick={handleGoBack}>Go Back Home</Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout showBackButton backButtonPath="/" pageTitle={task.title}>
      <div>

        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <PriorityBadge priority={task.priority} />
            <CategoryBadge category={task.category} />
            {task.completed ? (
              <div className="px-2 py-1 rounded-full text-xs text-green-500 bg-green-50">
                Completed
              </div>
            ) : task.dueDate && new Date(task.dueDate) < new Date() ? (
              <div className="px-2 py-1 rounded-full text-xs text-red-500 bg-red-50">
                Overdue
              </div>
            ) : null}
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center text-gray-500 text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Due: {formatDueDate(task.dueDate)}</span>
            </div>
            
            {task.estimatedTime && (
              <div className="flex items-center text-gray-500 text-sm">
                <Clock className="h-4 w-4 mr-2" />
                <span>Estimated time: {task.estimatedTime} minutes</span>
              </div>
            )}
            
            {task.description && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Description</h3>
                <p className="text-gray-600 text-sm whitespace-pre-wrap p-3 bg-gray-50 rounded-lg">
                  {task.description}
                </p>
              </div>
            )}
          </div>

          <Separator className="my-6" />

          <Tabs defaultValue="delegate" className="space-y-6">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="delegate" className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                <span>AI Delegate</span>
              </TabsTrigger>
              <TabsTrigger value="assign" className="flex items-center gap-1">
                <UserPlus className="h-4 w-4" />
                <span>Assign</span>
              </TabsTrigger>
              <TabsTrigger value="reminders" className="flex items-center gap-1">
                <Bell className="h-4 w-4" />
                <span>Reminders</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="delegate" className="mt-4">
              <TaskDelegation 
                task={task} 
                onDone={handleCompleteTask}
              />
            </TabsContent>
            
            <TabsContent value="assign" className="mt-4">
              <TaskAssignment 
                task={task} 
                onDone={() => refetchTask()}
              />
            </TabsContent>
            
            <TabsContent value="reminders">
              <div className="p-4 border rounded-lg text-center text-gray-500">
                Reminders functionality coming soon
              </div>
            </TabsContent>
          </Tabs>

          {!task.completed && (
            <div className="mt-8">
              <Button 
                onClick={handleCompleteTask} 
                disabled={isCompleting}
                className="w-full"
              >
                {isCompleting ? "Marking as Complete..." : "Mark as Complete"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}