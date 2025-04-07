import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TaskWithStringDates } from '@shared/schema';
import { Skeleton } from './ui/skeleton';
import { Check } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MobileTaskListProps {
  filter?: 'today' | 'upcoming' | 'completed' | 'all';
  title?: string;
}

export function MobileTaskList({ filter = 'all', title }: MobileTaskListProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: tasks, isLoading, error } = useQuery<TaskWithStringDates[]>({
    queryKey: ['/api/tasks'],
  });

  const handleTaskComplete = async (taskId: number) => {
    try {
      const res = await apiRequest('POST', `/api/tasks/${taskId}/complete`, null);
      await res.json();
      
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      toast({
        title: "Task completed",
        description: "Task has been marked as complete.",
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTaskClick = (taskId: number) => {
    window.location.href = `/task/${taskId}`;
  };

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    switch (filter) {
      case 'today':
        return tasks.filter(task => {
          if (!task.dueDate) return false;
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate.getTime() === today.getTime() && !task.completed;
        });
      case 'upcoming':
        return tasks.filter(task => {
          if (!task.dueDate || task.completed) return false;
          const taskDate = new Date(task.dueDate);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate > today && taskDate <= nextWeek;
        });
      case 'completed':
        return tasks.filter(task => task.completed);
      default:
        return tasks;
    }
  }, [tasks, filter]);

  if (isLoading) {
    return (
      <div className="px-4 mb-4">
        {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
        {[1, 2, 3].map(i => (
          <div key={i} className="mb-3">
            <Skeleton className="h-14 w-full rounded-md" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 mb-4">
        {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
        <div className="text-red-500">Error loading tasks</div>
      </div>
    );
  }

  if (!filteredTasks.length) {
    return (
      <div className="px-4 mb-4">
        {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
        <div className="bg-gray-50 rounded-md p-4 text-center text-gray-500">
          No tasks found
        </div>
      </div>
    );
  }

  // Ultra-simplified mobile task list
  return (
    <div className="px-4 mb-4">
      {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
      <ul className="space-y-2">
        {filteredTasks.map(task => (
          <li 
            key={task.id}
            className="border rounded-md bg-white"
          >
            <button 
              onClick={() => handleTaskClick(task.id)}
              className="text-left w-full px-3 py-3 flex items-center"
            >
              <div className="grow">
                <p className={`font-medium ${task.completed ? 'line-through text-gray-400' : ''}`}>
                  {task.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {task.priority} priority
                </p>
              </div>
              
              {!task.completed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTaskComplete(task.id);
                  }}
                  className="ml-2 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0"
                  aria-label="Complete task"
                >
                  <Check className="h-4 w-4 text-gray-600" />
                </button>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}