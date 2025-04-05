import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { TaskWithStringDates } from '@shared/schema';
import { reminderService } from '@/lib/reminder-service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { getDaysUntilDeadline } from '@/lib/utils/date-utils';

export function TaskReminders() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [urgentTasks, setUrgentTasks] = useState<TaskWithStringDates[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: tasks, isLoading, error } = useQuery<TaskWithStringDates[]>({
    queryKey: ['/api/tasks'],
  });

  // Check notification permission on component mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationsEnabled(Notification.permission === "granted");
    }
  }, []);

  // Register callback to handle notification clicks
  useEffect(() => {
    reminderService.registerCallback('taskClick', (task) => {
      navigate(`/calendar`);
    });

    reminderService.registerCallback('urgentTaskClick', (task) => {
      navigate(`/calendar`);
    });

    return () => {
      reminderService.unregisterCallback('taskClick');
      reminderService.unregisterCallback('urgentTaskClick');
    };
  }, [navigate]);

  // Process tasks for reminders when tasks data changes
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      // Process all tasks for scheduling reminders
      reminderService.processTasks(tasks);

      // Check for urgent tasks (due soon)
      const urgent = reminderService.checkDeadlines(tasks);
      setUrgentTasks(urgent);

      // Show immediate notification for very urgent tasks
      const veryUrgent = urgent.filter(task => {
        if (!task.dueDate) return false;
        const daysLeft = getDaysUntilDeadline(task.dueDate);
        return daysLeft !== null && daysLeft <= 1; // Due today or tomorrow
      });
      
      if (veryUrgent.length > 0 && notificationsEnabled) {
        veryUrgent.forEach(task => {
          reminderService.showUrgentDeadlineNotification(task);
        });
      }
    }
  }, [tasks, notificationsEnabled]);

  const requestNotificationPermission = async () => {
    const granted = await reminderService.requestPermission();
    setNotificationsEnabled(granted);
    
    if (granted) {
      toast({
        title: "Notifications enabled",
        description: "You'll now receive reminders for your tasks.",
      });
      
      // Process tasks again after enabling notifications
      if (tasks) {
        reminderService.processTasks(tasks);
      }
    } else {
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings to receive reminders.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || error || !tasks || urgentTasks.length === 0) {
    return null; // Don't show anything if there are no urgent tasks
  }

  return (
    <div className="mb-4">
      <Card className={`bg-amber-50 border-amber-200 shadow-sm transition-all ${isCollapsed ? 'h-14 overflow-hidden' : ''}`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              <h3 className="text-amber-800 font-semibold text-sm">
                Upcoming Deadlines ({urgentTasks.length})
              </h3>
            </div>
            <div className="flex space-x-2">
              {!notificationsEnabled && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 bg-white border-amber-200"
                  onClick={requestNotificationPermission}
                >
                  <Bell className="h-4 w-4 mr-1 text-amber-500" />
                  <span className="text-xs">Enable Reminders</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-amber-500 hover:text-amber-700"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                {isCollapsed ? 'Show' : 'Hide'}
              </Button>
            </div>
          </div>

          {!isCollapsed && (
            <div className="mt-2 space-y-2">
              {urgentTasks.map(task => {
                if (!task.dueDate) return null;
                
                const daysLeft = getDaysUntilDeadline(task.dueDate);
                let urgencyColor = "text-amber-600";
                
                if (daysLeft === 0) {
                  urgencyColor = "text-red-600";
                } else if (daysLeft === 1) {
                  urgencyColor = "text-orange-600";
                }
                
                return (
                  <div 
                    key={task.id} 
                    className="bg-white rounded-lg p-3 shadow-sm flex justify-between items-center"
                    onClick={() => navigate('/calendar')}
                  >
                    <div className="flex items-center">
                      <div className="mr-3">
                        <div className={`w-10 h-10 rounded-full ${daysLeft === 0 ? 'bg-red-100' : 'bg-amber-100'} flex items-center justify-center`}>
                          <Calendar className={`h-5 w-5 ${urgencyColor}`} />
                        </div>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{task.title}</div>
                        <div className={`text-xs flex items-center ${urgencyColor}`}>
                          <Clock className="h-3 w-3 mr-1" />
                          {daysLeft === 0 
                            ? "Due today" 
                            : daysLeft === 1 
                              ? "Due tomorrow" 
                              : daysLeft !== null
                                ? `Due in ${daysLeft} days` 
                                : "Deadline approaching"}
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      daysLeft === 0 
                        ? 'bg-red-50 text-red-600' 
                        : daysLeft === 1 
                          ? 'bg-orange-50 text-orange-600' 
                          : 'bg-amber-50 text-amber-600'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                );
              })}
              
              <Button 
                variant="outline" 
                className="w-full mt-2 bg-amber-100 border-amber-200 text-amber-800"
                onClick={() => navigate('/calendar')}
              >
                View All in Calendar
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}