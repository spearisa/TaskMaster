import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { reminderService } from '@/lib/reminder-service';
import { Plus, Bell, AlertTriangle, Calendar } from 'lucide-react';
import { TaskWithStringDates } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { format, isPast, isToday, isTomorrow, formatDistanceToNow } from 'date-fns';

export default function HomePage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Check notification permission on component mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  const { data: tasks } = useQuery<TaskWithStringDates[]>({
    queryKey: ['/api/tasks'],
  });

  // Enable notifications when the button is clicked
  const enableNotifications = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      
      if (permission === "granted") {
        setNotificationsEnabled(true);
        
        // Initialize reminders with the current tasks
        if (tasks && tasks.length > 0) {
          reminderService.processTasks(tasks);
        }
        
        toast({
          title: "Notifications enabled",
          description: "You'll now receive reminders for your tasks",
        });
      } else {
        toast({
          title: "Notifications blocked",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Notifications not supported",
        description: "Your browser does not support notifications",
        variant: "destructive",
      });
    }
  };

  // Filter tasks that are upcoming (not completed and due date is in the future or today)
  const upcomingTasks = tasks?.filter(task => {
    if (!task.completed && task.dueDate) {
      const dueDate = new Date(task.dueDate);
      return isToday(dueDate) || dueDate > new Date();
    }
    return false;
  }).sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    return 0;
  });

  // Get only 4 upcoming tasks max
  const limitedUpcomingTasks = upcomingTasks?.slice(0, 4) || [];

  // Function to format due date text
  const formatDueDate = (dateString?: string | null) => {
    if (!dateString) return 'No due date';
    
    const date = new Date(dateString);
    if (isToday(date)) {
      return 'Due today';
    } else if (isTomorrow(date)) {
      return 'Due tomorrow';
    } else if (isPast(date)) {
      return `Due ${formatDistanceToNow(date, { addSuffix: true })}`;
    } else {
      return `Due in ${formatDistanceToNow(date, { addSuffix: false })}`;
    }
  };

  // Task priority to tailwind color mapping
  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800'
  };

  return (
    <div className="px-4 pt-2 pb-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">To-Do List</h1>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full"
            onClick={() => navigate('/profile')}
          >
            <span className="sr-only">Profile</span>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              U
            </div>
          </Button>
        </div>
      </div>

      {/* Enable Notifications Toggle */}
      <div className="flex items-center justify-between px-4 py-3 bg-amber-50 rounded-lg border border-amber-100 mb-6">
        <div className="flex items-center gap-2">
          <Bell className="text-amber-600" size={18} />
          <span className="text-amber-700">Enable Task Reminders</span>
        </div>
        <Switch 
          checked={notificationsEnabled} 
          onCheckedChange={enableNotifications} 
          className="data-[state=checked]:bg-amber-600"
        />
      </div>

      {/* Upcoming Deadlines */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={20} />
            <h2 className="text-lg font-semibold text-amber-800">
              Upcoming Deadlines ({limitedUpcomingTasks.length})
            </h2>
          </div>
          <Button 
            variant="ghost" 
            className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 px-2 h-8 text-sm"
            onClick={() => navigate('/calendar')}
          >
            View Calendar
          </Button>
        </div>

        <div className="space-y-3">
          {limitedUpcomingTasks.map(task => (
            <div 
              key={task.id} 
              className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm"
              onClick={() => navigate(`/task/${task.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Calendar className="text-amber-600" size={20} />
                </div>
                <div className="flex-grow">
                  <h3 className="font-medium mb-1">{task.title}</h3>
                  <div className="text-sm text-gray-500">
                    {formatDueDate(task.dueDate)}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-md text-xs font-medium ${priorityColors[task.priority || 'medium']}`}>
                  {task.priority || 'medium'}
                </div>
              </div>
            </div>
          ))}
          
          {limitedUpcomingTasks.length === 0 && (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No upcoming deadlines</p>
            </div>
          )}
        </div>
      </div>
      
      {/* All Tasks */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">
              My Tasks ({tasks?.length || 0})
            </h2>
          </div>
        </div>

        <div className="space-y-3">
          {tasks?.map(task => (
            <div 
              key={task.id} 
              className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm"
              onClick={() => navigate(`/task/${task.id}`)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Calendar className="text-gray-600" size={20} />
                </div>
                <div className="flex-grow">
                  <h3 className="font-medium mb-1">{task.title}</h3>
                  <div className="text-sm text-gray-500">
                    {task.dueDate ? formatDueDate(task.dueDate) : 'No due date'}
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-md text-xs font-medium ${priorityColors[task.priority || 'medium']}`}>
                  {task.priority || 'medium'}
                </div>
              </div>
            </div>
          ))}
          
          {(!tasks || tasks.length === 0) && (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No tasks found</p>
            </div>
          )}
        </div>
      </div>

      {/* Add a regular button directly in the content area */}
      <div className="mt-6">
        <Button
          onClick={() => navigate('/new-task')}
          className="w-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 p-6 rounded-xl shadow-lg text-lg"
        >
          <Plus size={24} className="animate-pulse" />
          <span className="font-medium">Add New Task</span>
        </Button>
      </div>
    </div>
  );
}
