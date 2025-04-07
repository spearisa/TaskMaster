import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserSearch } from "@/components/user-search";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TaskWithStringDates } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TaskAssignmentProps {
  task: TaskWithStringDates;
  onDone?: () => void;
}

export function TaskAssignment({ task, onDone }: TaskAssignmentProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const assignTaskMutation = useMutation({
    mutationFn: async ({ taskId, assignedToUserId }: { taskId: number; assignedToUserId: number }) => {
      const response = await apiRequest("POST", `/api/tasks/${taskId}/assign`, { assignedToUserId });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign task");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      // Show success toast
      toast({
        title: "Task assigned successfully",
        description: `Task "${task.title}" has been assigned to ${selectedUserName}`,
        variant: "default",
      });
      
      // Invalidate task queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${task.id}`] });
      
      // Call onDone callback if provided
      if (onDone) {
        onDone();
      }
    },
    onError: (error: Error) => {
      // Show error toast
      toast({
        title: "Failed to assign task",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAssignTask = () => {
    if (!selectedUserId) {
      toast({
        title: "No user selected",
        description: "Please select a user to assign this task to",
        variant: "destructive",
      });
      return;
    }

    assignTaskMutation.mutate({
      taskId: task.id,
      assignedToUserId: selectedUserId,
    });
  };

  const handleUserSelect = (userId: number, userName?: string) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName || `User ${userId}`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Assign Task</h2>
      
      {task.assignedToUserId && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Task Already Assigned</AlertTitle>
          <AlertDescription>
            This task is already assigned to another user (ID: {task.assignedToUserId}).
            Reassigning will transfer responsibility to the new user.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">Search Users:</label>
          <UserSearch onSelectUser={handleUserSelect} />
        </div>
        
        {selectedUserId && (
          <div className="bg-primary-foreground p-3 rounded-md border">
            <p className="text-sm">Selected user: <span className="font-semibold">{selectedUserName}</span></p>
          </div>
        )}
        
        <div className="flex justify-end space-x-2">
          {onDone && (
            <Button variant="outline" onClick={onDone}>
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleAssignTask} 
            disabled={!selectedUserId || assignTaskMutation.isPending}
          >
            {assignTaskMutation.isPending ? "Assigning..." : "Assign Task"}
          </Button>
        </div>
      </div>
      
      {assignTaskMutation.isSuccess && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Task Assigned</AlertTitle>
          <AlertDescription>
            This task has been successfully assigned to {selectedUserName}.
          </AlertDescription>
        </Alert>
      )}
      
      {assignTaskMutation.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {assignTaskMutation.error.message || "An error occurred while assigning the task."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}