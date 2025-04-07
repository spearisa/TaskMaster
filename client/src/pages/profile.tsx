import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { TaskWithStringDates } from "@shared/schema";
import { MobileLayout } from "@/components/layouts/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, LogOut, CalendarClock, CheckCircle, Clock, Bell, Moon, Sun,
  Settings, ChevronRight, Shield, PieChart, BellRing, Sparkles
} from "lucide-react";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { reminderService } from "@/lib/reminder-service";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// User settings interface
interface UserSettings {
  darkMode: boolean;
  notificationsEnabled: boolean;
  reminderTime: number; // minutes before deadline
  aiSuggestionsEnabled: boolean;
  defaultTaskView: 'all' | 'today' | 'upcoming';
  defaultPriority: 'low' | 'medium' | 'high';
}

// Default settings
const defaultSettings: UserSettings = {
  darkMode: false,
  notificationsEnabled: true,
  reminderTime: 60,
  aiSuggestionsEnabled: true,
  defaultTaskView: 'today',
  defaultPriority: 'medium'
};

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Initialize settings from localStorage or defaults
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const savedSettings = localStorage.getItem('taskManager_settings');
      return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    } catch (e) {
      return defaultSettings;
    }
  });
  
  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('taskManager_settings', JSON.stringify(settings));
  }, [settings]);
  
  // Fetch tasks for statistics
  const { data: tasks } = useQuery<TaskWithStringDates[]>({
    queryKey: ['/api/tasks'],
  });
  
  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/auth");
      }
    });
  };
  
  // Handle settings changes
  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: value };
      
      // Handle special cases
      if (key === 'notificationsEnabled' && value === true) {
        // Request notification permissions when enabling
        reminderService.requestPermission().then((granted) => {
          if (!granted) {
            toast({
              title: "Permission Denied",
              description: "Notification permission was denied. You won't receive reminders.",
              variant: "destructive"
            });
            // Revert the setting if permission denied
            setSettings(prev => ({ ...prev, notificationsEnabled: false }));
          }
        });
      }
      
      // Show confirmation toast
      toast({
        title: "Settings Updated",
        description: `Your preference has been saved.`,
      });
      
      return newSettings;
    });
  };
  
  // Reset settings to defaults
  const resetSettings = () => {
    setSettings(defaultSettings);
    toast({
      title: "Settings Reset",
      description: "All settings have been restored to defaults.",
    });
  };
  
  // Calculate task statistics
  const completedTasks = tasks?.filter(task => task.completed).length || 0;
  const pendingTasks = tasks?.filter(task => !task.completed).length || 0;
  const totalTasks = tasks?.length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Calculate upcoming deadlines
  const upcomingDeadlines = tasks
    ?.filter(task => !task.completed && task.dueDate)
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 3);

  return (
    <MobileLayout>
      <div className="p-4 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          {/* Profile Tab Content */}
          <TabsContent value="profile" className="space-y-4">
            <h1 className="text-2xl font-bold">My Profile</h1>
            
            {/* Profile Card */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {user?.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{user?.username}</CardTitle>
                  <CardDescription>
                    Account ID: {user?.id}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full mt-2" 
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </Button>
              </CardContent>
            </Card>
            
            {/* Task Statistics */}
            <h2 className="text-lg font-semibold">Task Statistics</h2>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{completedTasks}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-amber-500" />
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{pendingTasks}</p>
                </CardContent>
              </Card>
              
              <Card className="col-span-2">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold">{completionRate}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Upcoming Deadlines */}
            <h2 className="text-lg font-semibold">Upcoming Deadlines</h2>
            {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.map(task => (
                  <Card key={task.id} className="cursor-pointer" onClick={() => { window.location.href = `/task/${task.id}`; }}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{task.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === 'high' 
                            ? 'bg-red-100 text-red-800' 
                            : task.priority === 'medium'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.dueDate && (
                        <div className="mt-2 text-sm text-gray-500 flex items-center">
                          <CalendarClock className="h-3 w-3 mr-1" />
                          Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  No upcoming deadlines
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Settings Tab Content */}
          <TabsContent value="settings">
            <h1 className="text-2xl font-bold mb-6">Settings</h1>
            
            {/* Appearance Settings */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Sun className="h-5 w-5 mr-2" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Configure how the app looks and feels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Moon className="h-4 w-4" />
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Notification Settings */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Manage your task reminders and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BellRing className="h-4 w-4" />
                    <Label htmlFor="notifications">Enable Notifications</Label>
                  </div>
                  <Switch
                    id="notifications"
                    checked={settings.notificationsEnabled}
                    onCheckedChange={(checked) => updateSetting('notificationsEnabled', checked)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="reminder-time">Default Reminder Time</Label>
                  <Select
                    value={settings.reminderTime.toString()}
                    onValueChange={(value) => updateSetting('reminderTime', parseInt(value))}
                    disabled={!settings.notificationsEnabled}
                  >
                    <SelectTrigger id="reminder-time">
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes before</SelectItem>
                      <SelectItem value="30">30 minutes before</SelectItem>
                      <SelectItem value="60">1 hour before</SelectItem>
                      <SelectItem value="120">2 hours before</SelectItem>
                      <SelectItem value="1440">1 day before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            {/* Task Preferences */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Task Preferences
                </CardTitle>
                <CardDescription>
                  Default settings for new tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-view">Default Task View</Label>
                  <Select
                    value={settings.defaultTaskView}
                    onValueChange={(value) => updateSetting('defaultTaskView', value as 'all' | 'today' | 'upcoming')}
                  >
                    <SelectTrigger id="default-view">
                      <SelectValue placeholder="Select view" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tasks</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default-priority">Default Priority</Label>
                  <Select
                    value={settings.defaultPriority}
                    onValueChange={(value) => updateSetting('defaultPriority', value as 'low' | 'medium' | 'high')}
                  >
                    <SelectTrigger id="default-priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            
            {/* AI Assistant Settings */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" />
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  Configure your AI task assistant
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="h-4 w-4" />
                    <Label htmlFor="ai-suggestions">AI Suggestions</Label>
                  </div>
                  <Switch
                    id="ai-suggestions"
                    checked={settings.aiSuggestionsEnabled}
                    onCheckedChange={(checked) => updateSetting('aiSuggestionsEnabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Reset Settings */}
            <Card>
              <CardContent className="pt-6">
                <Button 
                  variant="outline" 
                  onClick={resetSettings}
                  className="w-full"
                >
                  Reset All Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}