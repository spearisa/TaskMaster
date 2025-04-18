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

  return (
    <div className="space-y-3">
      {tasks?.map(task => (
        <TaskItem 
          key={task.id} 
          task={task} 
          onTaskComplete={handleTaskComplete}
        />
      ))}
    </div>
  );
}