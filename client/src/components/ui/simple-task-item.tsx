import { useState } from 'react';
import { TaskWithStringDates } from '@shared/schema';
import { TaskCheckbox } from './task-checkbox';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Button } from './button';
import { Sparkles } from 'lucide-react';

interface SimpleTaskItemProps {
  task: TaskWithStringDates;
  onTaskComplete?: (task: TaskWithStringDates) => void;
}

export function SimpleTaskItem({ task, onTaskComplete }: SimpleTaskItemProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const { toast } = useToast();

  const handleCheckboxChange = async (e: any) => {
    // Stop propagation to prevent the Link from triggering
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
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

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Super simple layout with limited information
  return (
    <Link href={`/task/${task.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 shadow-sm">
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '12px' }}>
          {/* Checkbox column */}
          <div onClick={stopPropagation}>
            <TaskCheckbox 
              checked={task.completed} 
              onChange={handleCheckboxChange}
              disabled={isCompleting}
            />
          </div>

          {/* Content column - with strict overflow control */}
          <div style={{ minWidth: 0 }}>
            {/* Title */}
            <div style={{ 
              fontWeight: 500, 
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }} className={task.completed ? 'line-through text-gray-500' : ''}>
              {task.title}
            </div>

            {/* Priority badge - only show for incomplete tasks */}
            {!task.completed && (
              <div style={{ display: 'inline-block', marginBottom: '8px' }}>
                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`} style={{ whiteSpace: 'nowrap' }}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                </span>
              </div>
            )}

            {/* AI Delegate button - simplified */}
            {!task.completed && (
              <div onClick={stopPropagation} style={{ marginTop: '8px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/task/${task.id}`;
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  <span style={{ whiteSpace: 'nowrap' }}>Delegate to AI</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}