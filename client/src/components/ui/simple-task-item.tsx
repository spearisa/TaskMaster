import { useState } from 'react';
import { TaskWithStringDates } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SimpleTaskItemProps {
  task: TaskWithStringDates;
  onTaskComplete?: (task: TaskWithStringDates) => void;
}

export function SimpleTaskItem({ task, onTaskComplete }: SimpleTaskItemProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();

  const handleComplete = async () => {
    if (task.completed) return;
    
    try {
      setIsCompleting(true);
      const res = await apiRequest('POST', `/api/tasks/${task.id}/complete`, null);
      const updatedTask = await res.json();
      
      if (onTaskComplete) {
        onTaskComplete(updatedTask);
      }
      
      toast({
        title: "Task completed",
        description: `"${task.title}" has been marked as complete.`,
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const viewTask = () => {
    window.location.href = `/task/${task.id}`;
  };

  // HTML table-based layout (more stable text handling)
  return (
    <table 
      className="w-full border-collapse mb-2 bg-white border rounded" 
      style={{tableLayout: 'fixed'}}
    >
      <tbody>
        <tr onClick={viewTask} style={{cursor: 'pointer'}}>
          <td className="p-2 w-8 align-top" onClick={(e) => e.stopPropagation()}>
            <input 
              type="checkbox"
              checked={task.completed}
              onChange={handleComplete}
              disabled={isCompleting}
              className="h-4 w-4 rounded border-gray-300"
            />
          </td>
          <td className="p-2 align-top">
            <div 
              className={task.completed ? 'line-through text-gray-500' : ''} 
              style={{overflow: 'hidden', textOverflow: 'ellipsis'}}
            >
              {task.title}
            </div>
            {!task.completed && (
              <div className="text-xs text-gray-500 mt-1">
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
              </div>
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}