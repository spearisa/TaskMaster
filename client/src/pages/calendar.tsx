import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, isSameDay, isToday as isDateToday } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, AlertTriangle, Clock, Calendar as CalendarIconSolid } from 'lucide-react';
import { useLocation } from 'wouter';
import { TaskWithStringDates } from '@shared/schema';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskItem } from '@/components/ui/task-item';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { reminderService } from '@/lib/reminder-service';
import { getDaysUntilDeadline, formatRelativeDate } from '@/lib/utils/date-utils';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CalendarPage() {
  const [_, navigate] = useLocation();
  const [date, setDate] = useState<Date>(new Date());
  const [month, setMonth] = useState<Date>(new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const { toast } = useToast();
  
  const { data: tasks, isLoading } = useQuery<TaskWithStringDates[]>({
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
    reminderService.registerCallback('calendarClick', (task) => {
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate);
        setDate(dueDate);
      }
    });

    return () => {
      reminderService.unregisterCallback('calendarClick');
    };
  }, []);

  // Filter tasks for the selected date
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

  // Get upcoming deadlines within the next 7 days
  const upcomingDeadlines = tasks?.filter(task => {
    if (!task.dueDate || task.completed) return false;
    const daysUntil = getDaysUntilDeadline(task.dueDate);
    return daysUntil !== null && daysUntil >= 0 && daysUntil <= 7;
  }).sort((a, b) => {
    const daysA = a.dueDate ? getDaysUntilDeadline(a.dueDate) || 999 : 999;
    const daysB = b.dueDate ? getDaysUntilDeadline(b.dueDate) || 999 : 999;
    return daysA - daysB;
  });

  // Get tasks due today
  const todaysTasks = tasks?.filter(task => {
    if (!task.dueDate || task.completed) return false;
    return isDateToday(new Date(task.dueDate));
  });

  // Request notification permission
  const requestNotificationPermission = async () => {
    const granted = await reminderService.requestPermission();
    setNotificationsEnabled(granted);
    
    if (granted) {
      toast({
        title: "Reminders enabled",
        description: "You'll now receive reminders for your task deadlines.",
      });
      
      // Process tasks after enabling notifications
      if (tasks) {
        reminderService.processTasks(tasks);
      }
    } else {
      toast({
        title: "Reminders blocked",
        description: "Please enable notifications in your browser settings to receive reminders.",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <header className="px-5 py-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-2">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">Calendar</h1>
      </header>

      <div className="px-3 sm:px-5 py-2">
        <Tabs defaultValue="calendar" className="mb-6">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="calendar" className="text-sm sm:text-base py-2">Calendar</TabsTrigger>
            <TabsTrigger value="deadlines" className="text-sm sm:text-base py-2">Deadlines</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar">
            <div className="mb-4">
              <div className="mb-2 text-center">
                <h2 className="text-xl font-bold">{format(date, 'MMMM yyyy')}</h2>
              </div>
              <Calendar
                mode="single"
                selected={date}
                onSelect={(date) => date && setDate(date)}
                month={month}
                onMonthChange={setMonth}
                className="rounded-xl border p-3 mx-auto"
                classNames={{
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] flex-1 text-center",
                  row: "flex w-full mt-2",
                  cell: "text-center text-sm p-0 relative first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 flex-1 h-9",
                  day: "h-9 w-9 mx-auto p-0 font-normal aria-selected:opacity-100 flex items-center justify-center rounded-md",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
                modifiers={{
                  hasTasks: (date) => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    return !!datesWithTasks[dateStr];
                  }
                }}
                modifiersClassNames={{
                  hasTasks: "bg-primary/20 font-bold text-primary"
                }}
              />
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                Tasks for {format(date, 'MMMM d, yyyy')}
              </h3>

              {isLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, idx) => (
                    <Skeleton key={idx} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : tasksForSelectedDate && tasksForSelectedDate.length > 0 ? (
                <div>
                  {tasksForSelectedDate.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <CalendarIcon className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                  <p className="text-gray-500">No tasks scheduled for this day</p>
                  <Button 
                    className="mt-4 bg-primary text-white rounded-xl"
                    onClick={() => navigate('/new-task')}
                  >
                    Add Task
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="deadlines">
            {/* Enable Notifications Banner */}
            {!notificationsEnabled && (
              <Card className="mb-4 p-4 bg-amber-50 border-amber-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                    <p className="text-sm text-amber-800">Enable notifications to get reminders for your deadlines</p>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-700 text-xs"
                    onClick={requestNotificationPermission}
                  >
                    Enable
                  </Button>
                </div>
              </Card>
            )}
            
            {/* Today's Deadlines */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-red-500" />
                Due Today
              </h3>
              
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </div>
              ) : todaysTasks && todaysTasks.length > 0 ? (
                <div className="space-y-2">
                  {todaysTasks.map(task => (
                    <Card 
                      key={task.id} 
                      className="p-3 border-red-100 bg-red-50 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/task/${task.id}`)}
                    >
                      <div className="flex justify-between items-center">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium truncate">{task.title}</h4>
                          <div className="text-sm text-red-600 flex items-center">
                            <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">Due today</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-red-100 text-red-600 border-red-200 ml-2 whitespace-nowrap flex-shrink-0">
                          {task.priority}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-4 text-center border-gray-200 bg-gray-50">
                  <p className="text-gray-500">No tasks due today</p>
                </Card>
              )}
            </div>
            
            {/* Upcoming Deadlines */}
            <div>
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <CalendarIconSolid className="h-5 w-5 mr-2 text-primary" />
                Upcoming Deadlines
              </h3>
              
              {isLoading ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, idx) => (
                    <Skeleton key={idx} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : upcomingDeadlines && upcomingDeadlines.length > 0 ? (
                <div className="space-y-2">
                  {upcomingDeadlines.map(task => {
                    if (!task.dueDate) return null;
                    
                    const daysLeft = getDaysUntilDeadline(task.dueDate);
                    let urgencyColor = "text-amber-600";
                    let bgColor = "bg-amber-50";
                    let borderColor = "border-amber-100";
                    
                    if (daysLeft === 0) {
                      urgencyColor = "text-red-600";
                      bgColor = "bg-red-50";
                      borderColor = "border-red-100";
                    } else if (daysLeft === 1) {
                      urgencyColor = "text-orange-600";
                      bgColor = "bg-orange-50";
                      borderColor = "border-orange-100";
                    } else if (daysLeft && daysLeft > 3) {
                      urgencyColor = "text-green-600";
                      bgColor = "bg-green-50";
                      borderColor = "border-green-100";
                    }
                    
                    return (
                      <Card 
                        key={task.id} 
                        className={`p-3 ${borderColor} ${bgColor} cursor-pointer hover:shadow-md transition-shadow`}
                        onClick={() => {
                          // Allow clicking to navigate to task detail
                          const showTaskDetail = (e: React.MouseEvent) => {
                            if (e.shiftKey || e.metaKey || e.ctrlKey) {
                              // If modifier key pressed, just navigate to calendar view of this date
                              if (task.dueDate) {
                                const dueDate = new Date(task.dueDate);
                                setDate(dueDate);
                                setMonth(dueDate);
                                document.querySelector('[value="calendar"]')?.dispatchEvent(new MouseEvent('click'));
                              }
                            } else {
                              // Otherwise go to task detail page
                              navigate(`/task/${task.id}`);
                            }
                          };
                          showTaskDetail(window.event as any);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium truncate">{task.title}</h4>
                            <div className={`text-sm ${urgencyColor} flex items-center`}>
                              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{formatRelativeDate(task.dueDate)}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className={`${bgColor} ${urgencyColor} ml-2 whitespace-nowrap flex-shrink-0`}>
                            {task.priority}
                          </Badge>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-4 text-center border-gray-200 bg-gray-50">
                  <p className="text-gray-500">No upcoming deadlines</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
