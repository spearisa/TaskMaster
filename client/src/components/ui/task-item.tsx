import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar, Clock, Sparkles, DollarSign } from 'lucide-react';
import { TaskWithStringDates } from '@shared/schema';
import { TaskCheckbox } from './task-checkbox';
import { PriorityBadge } from './priority-badge';
import { CategoryBadge } from './category-badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { Button } from './button';
import { getDaysUntilDeadline } from '@/lib/utils/date-utils';
import { PublicTaskShare } from '@/components/public-task-share';

interface TaskItemProps {
  task: TaskWithStringDates;
  onTaskComplete?: (task: TaskWithStringDates) => void;
  onTaskUpdate?: (task: TaskWithStringDates) => void;
}

export function TaskItem({ task, onTaskComplete, onTaskUpdate }: TaskItemProps) {
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

  // Format the due date or completed time
  const getTimeText = () => {
    if (task.completed && task.completedAt) {
      return '1hr ago'; // In a real app, would calculate relative time
    } else if (task.dueDate) {
      const date = new Date(task.dueDate);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
      } else {
        return format(date, 'EEEE'); // Day of week
      }
    }
    return '';
  };

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Link href={`/task/${task.id}`}>
      <div className="bg-lightGray rounded-xl p-4 mb-3 shadow-sm transition-all hover:translate-y-[-2px] cursor-pointer">
        <div className="flex items-start gap-3">
          <div onClick={stopPropagation} className="flex-shrink-0 mt-1">
            <TaskCheckbox 
              checked={task.completed} 
              onChange={handleCheckboxChange}
              disabled={isCompleting}
            />
          </div>
          <div className="flex-grow overflow-hidden">
            <div className="flex justify-between items-start">
              <h3 className={`font-medium text-base mr-2 ${task.completed ? 'line-through text-neutral-500' : ''}`}>
                {task.title}
              </h3>
              {task.completed ? (
                <div className="px-2 py-1 rounded-full text-xs text-green-500 bg-green-50 flex-shrink-0">
                  Completed
                </div>
              ) : (
                <div className="flex-shrink-0">
                  <PriorityBadge priority={task.priority} />
                </div>
              )}
            </div>
            <div className="flex items-center mt-2 text-sm text-neutral-500">
              {task.completed ? (
                <>
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{getTimeText()}</span>
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{getTimeText()}</span>
                </>
              )}
              <span className="mx-2">•</span>
              <CategoryBadge category={task.category} />
              
              {/* Deadline warning for upcoming tasks with close deadlines */}
              {!task.completed && task.dueDate && 
               (getDaysUntilDeadline(task.dueDate) !== null) && 
               (getDaysUntilDeadline(task.dueDate) as number) <= 2 && 
               (getDaysUntilDeadline(task.dueDate) as number) >= 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-lg text-xs">
                    {getDaysUntilDeadline(task.dueDate)} days left
                  </span>
                </>
              )}
              
              {/* Accepting bids indicator */}
              {task.acceptingBids && (
                <>
                  <span className="mx-2">•</span>
                  <span className="px-2 py-0.5 bg-yellow-50 text-yellow-600 rounded-lg text-xs flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    Accepting Bids
                    {task.budget && ` up to $${task.budget}`}
                  </span>
                </>
              )}
            </div>
            
            {/* Action buttons row */}
            {!task.completed && (
              <div className="mt-3 flex space-x-2" onClick={stopPropagation}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 px-2 py-1 h-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/task/${task.id}`;
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Delegate to AI
                </Button>
                
                {/* Share button for public tasks */}
                {task.isPublic && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <PublicTaskShare task={task} />
                  </div>
                )}
                
                {/* Bid button for tasks accepting bids */}
                {task.acceptingBids && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-yellow-600 border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 px-2 py-1 h-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/task/${task.id}?tab=bidding`;
                    }}
                  >
                    <DollarSign className="h-3 w-3 mr-1" />
                    Bid Now
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}


