import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import { TaskWithStringDates } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function CalendarSimplePage() {
  const [_, navigate] = useLocation();
  const { data: tasks, isLoading } = useQuery<TaskWithStringDates[]>({
    queryKey: ['/api/tasks'],
  });

  return (
    <div className="px-4 py-4">
      <header className="mb-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-2">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">Calendar</h1>
      </header>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Your Tasks</h2>
        
        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, idx) => (
              <Skeleton key={idx} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map(task => (
              <div 
                key={task.id} 
                className="p-4 border rounded-lg bg-white shadow-sm cursor-pointer"
                onClick={() => navigate(`/task/${task.id}`)}
              >
                <div className="flex justify-between">
                  <h3 className="font-medium">{task.title}</h3>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {task.priority}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {task.dueDate && (
                    <span>Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <p className="text-gray-500">No tasks found</p>
            <Button 
              className="mt-4"
              onClick={() => navigate('/new-task')}
            >
              Create Task
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}