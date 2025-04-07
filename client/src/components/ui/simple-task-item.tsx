import { useState } from 'react';
import { TaskWithStringDates } from '@shared/schema';
import { TaskCheckbox } from './task-checkbox';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface SimpleTaskItemProps {
  task: TaskWithStringDates;
  onTaskComplete?: (task: TaskWithStringDates) => void;
}

export function SimpleTaskItem({ task, onTaskComplete }: SimpleTaskItemProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();

  const handleCheckboxChange = async (e: any) => {
    e.preventDefault();
    e.stopPropagation();
    
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

  // Ultra-minimal styling
  return (
    <div className="bg-white border rounded-md p-2 mb-2 shadow-sm">
      <div className="flex items-start">
        {/* Checkbox */}
        <div className="mr-3 mt-1" onClick={(e) => e.stopPropagation()}>
          <TaskCheckbox 
            checked={task.completed} 
            onChange={handleCheckboxChange}
            disabled={isCompleting}
          />
        </div>

        {/* Content column */}
        <Link href={`/task/${task.id}`} className="flex-1 min-w-0">
          {/* Title only with text truncation */}
          <div className={`text-sm font-medium truncate ${task.completed ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </div>
          
          {/* Only show priority as simple text */}
          {!task.completed && (
            <div className="text-xs text-gray-500 mt-1">
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}