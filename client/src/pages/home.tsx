import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { TaskList } from '@/components/task-list';
import { MobileTaskList } from '@/components/mobile-task-list';
import { TaskReminders } from '@/components/task-reminders';
import { reminderService } from '@/lib/reminder-service';
import { Plus, Bell } from 'lucide-react';
import { TaskWithStringDates } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

import { MobileLayout } from '@/components/layouts/mobile-layout';

export default function HomePage() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const isMobile = useIsMobile();
  
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

  return (
    <MobileLayout>
      {/* Notification Permission Button (if not enabled yet) */}
      {!notificationsEnabled && (
        <div className="mb-4">
          <Button
            variant="outline"
            className="w-full border-amber-300 bg-amber-50 text-amber-700 py-2 h-auto text-sm flex items-center justify-center"
            onClick={enableNotifications}
          >
            <Bell className="h-4 w-4 mr-2" />
            Enable Task Reminders
          </Button>
        </div>
      )}

      {/* Task Reminders for urgent deadlines */}
      <div>
        <TaskReminders />
      </div>

      {/* Add Task Button */}
      <div className="mb-6">
        <Button
          className="w-full bg-primary text-white py-3 h-12 rounded-xl text-base font-medium shadow-sm"
          onClick={() => navigate('/new-task')}
        >
          Add Task
        </Button>
      </div>

      {/* Today's Tasks */}
      {isMobile ? (
        <MobileTaskList filter="today" title="Today's Tasks" />
      ) : (
        <TaskList filter="today" title="Today's Tasks" />
      )}

      {/* Upcoming Tasks */}
      {isMobile ? (
        <MobileTaskList filter="upcoming" title="Upcoming" />
      ) : (
        <TaskList filter="upcoming" title="Upcoming" />
      )}
    </MobileLayout>
  );
}
