import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TaskWithStringDates } from '@shared/schema';
import { TaskItem } from './ui/task-item';
import { Skeleton } from './ui/skeleton';

interface TaskListProps {
  filter?: 'today' | 'upcoming' | 'completed' | 'all';
  title?: string;
}

export function TaskList({ filter = 'all', title }: TaskListProps) {
  const queryClient = useQueryClient();
  
  const { data: tasks, isLoading, error } = useQuery<TaskWithStringDates[]>({
    queryKey: ['/api/tasks'],
  });

  const handleTaskComplete = (completedTask: TaskWithStringDates) => {
    queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
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
      <div className="px-5 mb-4">
        {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
        {[1, 2, 3].map(i => (
          <div key={i} className="mb-3">
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-5 mb-4">
        {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
        <div className="text-red-500">Error loading tasks: {error.toString()}</div>
      </div>
    );
  }

  if (!filteredTasks.length) {
    return (
      <div className="px-5 mb-4">
        {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
        <div className="bg-gray-50 rounded-xl p-4 text-center text-gray-500">
          No tasks found
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 mb-4">
      {title && <h2 className="text-lg font-semibold mb-3">{title}</h2>}
      {filteredTasks.map(task => (
        <TaskItem 
          key={task.id} 
          task={task} 
          onTaskComplete={handleTaskComplete}
        />
      ))}
    </div>
  );
}
