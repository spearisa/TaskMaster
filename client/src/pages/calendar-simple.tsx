import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import { useLocation } from 'wouter';
import { TaskWithStringDates } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';

export default function CalendarSimplePage() {
  const [_, navigate] = useLocation();
  const [date, setDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const { data: tasks, isLoading } = useQuery<TaskWithStringDates[]>({
    queryKey: ['/api/tasks'],
  });

  // Tasks for selected date
  const tasksForSelectedDate = tasks?.filter(task => {
    if (!task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    return isSameDay(taskDate, date);
  });
  
  // Create a map of dates with tasks
  const datesWithTasks = tasks?.reduce((acc, task) => {
    if (!task.dueDate) return acc;
    const dateStr = task.dueDate.split('T')[0];
    acc[dateStr] = true;
    return acc;
  }, {} as Record<string, boolean>) || {};

  return (
    <div className="px-4 py-4">
      <header className="mb-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-2">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">Calendar</h1>
      </header>

      {/* Calendar Component */}
      <div className="mb-6">
        <div className="mb-2 text-center">
          <h2 className="text-lg font-semibold">{format(date, 'MMMM yyyy')}</h2>
        </div>
        
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => newDate && setDate(newDate)}
          month={month}
          onMonthChange={setMonth}
          className="rounded-lg border mx-auto w-full bg-white"
          modifiers={{
            hasTasks: (d) => {
              const dateStr = format(d, 'yyyy-MM-dd');
              return !!datesWithTasks[dateStr];
            }
          }}
          modifiersClassNames={{
            hasTasks: "bg-blue-100 font-bold text-blue-800"
          }}
        />
      </div>

      {/* Tasks for Selected Date */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">
          Tasks for {format(date, 'MMMM d, yyyy')}
        </h2>
        
        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, idx) => (
              <Skeleton key={idx} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : tasksForSelectedDate && tasksForSelectedDate.length > 0 ? (
          <div className="space-y-3">
            {tasksForSelectedDate.map(task => (
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
            <CalendarIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
            <p className="text-gray-500">No tasks scheduled for this day</p>
            <Button 
              className="mt-4"
              onClick={() => navigate('/new-task')}
            >
              Add Task
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}