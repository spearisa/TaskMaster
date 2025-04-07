import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Globe, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TaskWithStringDates } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface PublicTaskToggleProps {
  task: TaskWithStringDates;
  onDone?: () => void;
}

export function PublicTaskToggle({ task, onDone }: PublicTaskToggleProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isPublic, setIsPublic] = useState(task.isPublic || false);

  const { mutate: togglePublicStatus, isPending } = useMutation({
    mutationFn: async (newIsPublic: boolean) => {
      const response = await apiRequest(
        "POST", 
        `/api/tasks/${task.id}/public`,
        { isPublic: newIsPublic }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update task visibility");
      }
      
      return await response.json();
    },
    onSuccess: (updatedTask) => {
      setIsPublic(updatedTask.isPublic);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', task.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/public-tasks'] });
      
      if (task.userId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/users', task.userId, 'public-tasks'] 
        });
      }
      
      toast({
        title: updatedTask.isPublic ? "Task made public" : "Task made private",
        description: updatedTask.isPublic 
          ? "This task is now visible to all users" 
          : "This task is now only visible to you",
      });
      
      if (onDone) onDone();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update visibility",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggleChange = (checked: boolean) => {
    if (!isPending) {
      togglePublicStatus(checked);
    }
  };

  return (
    <div className="flex items-center space-x-4 p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="mr-2">
        {isPublic ? (
          <Globe className="h-5 w-5 text-blue-500" />
        ) : (
          <Shield className="h-5 w-5 text-gray-500" />
        )}
      </div>
      
      <div className="flex-1">
        <h4 className="text-sm font-medium mb-1">Task Visibility</h4>
        <p className="text-sm text-muted-foreground">
          {isPublic 
            ? "This task is public and visible to everyone" 
            : "This task is private and only visible to you"}
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="public-toggle"
          checked={isPublic}
          onCheckedChange={handleToggleChange}
          disabled={isPending}
          aria-label="Toggle task public visibility"
        />
        <Label htmlFor="public-toggle" className="sr-only">Public</Label>
      </div>
    </div>
  );
}