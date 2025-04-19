import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TaskWithStringDates, UserProfile, updateProfileSchema } from "@shared/schema";
import { MobileLayout } from "@/components/layouts/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, LogOut, CalendarClock, CheckCircle, Clock, Bell, Moon, Sun,
  Settings, ChevronRight, Shield, PieChart, BellRing, Sparkles,
  Globe, Link, Instagram, Twitter, Facebook, Check, Edit, Github,
  AlertCircle, Linkedin as LinkedIn
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

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

// Interface for profile form data
interface ProfileFormData {
  displayName: string;
  bio: string;
  interests: string[];
  skills: string[];
  location: string;
  website: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
    facebook?: string;
  };
  isPublic: boolean;
}

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  
  // Initialize profile form data from user
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
    interests: user?.interests || [],
    skills: user?.skills || [],
    location: user?.location || '',
    website: user?.website || '',
    socialLinks: user?.socialLinks || {},
    isPublic: user?.isPublic || false
  });
  
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
  
  // Update profile form when user data changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        displayName: user.displayName || '',
        bio: user.bio || '',
        interests: user.interests || [],
        skills: user.skills || [],
        location: user.location || '',
        website: user.website || '',
        socialLinks: user.socialLinks || {},
        isPublic: user.isPublic || false
      });
    }
  }, [user]);
  
  // Fetch profile data from API
  // Fetch profile data from API
  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
    enabled: !!user, // Only run if user is logged in
    retry: 1, // Only retry once if there's an error
  });
  
  // Validate profile form data before submission
  const validateProfileForm = (data: ProfileFormData) => {
    try {
      // Basic validation before even attempting schema validation
      if (!data.displayName.trim()) {
        return { success: false, error: "Display name cannot be empty" };
      }
      
      if (data.bio && data.bio.length > 500) {
        return { success: false, error: "Bio cannot exceed 500 characters" };
      }
      
      if (data.website && !/^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(\/\S*)?$/i.test(data.website)) {
        return { success: false, error: "Website URL is not valid" };
      }
      
      // For social media links, check if they're valid when provided
      const socialLinks = data.socialLinks;
      for (const [platform, username] of Object.entries(socialLinks)) {
        if (username && typeof username === 'string' && username.includes('/')) {
          return { success: false, error: `${platform} should only be a username, not a full URL` };
        }
      }
      
      return { success: true, data };
    } catch (error) {
      console.error("Profile validation error:", error);
      return { success: false, error: "Invalid profile data" };
    }
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      // Validate form data before submission
      const validation = validateProfileForm(data);
      
      if (!validation.success) {
        throw new Error(validation.error);
      }
      
      const response = await apiRequest('PATCH', '/api/profile', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Failed to update profile: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Toggle profile visibility mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async (isPublic: boolean) => {
      const response = await apiRequest('POST', '/api/profile/visibility', { isPublic });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Visibility Updated",
        description: `Your profile is now ${data.isPublic ? 'public' : 'private'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: `Failed to update profile visibility: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Fetch task statistics directly from the server
  const { data: taskStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['/api/profile/statistics'],
    enabled: !!user, // Only run if user is logged in
    retry: 1, // Only retry once if there's an error
    onError: (error) => {
      console.error("Error fetching profile statistics:", error);
      // Don't show a toast for stats errors, as it's not critical to the user experience
      // and we'll show fallback/default values
    }
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
  
  // Use server-side task statistics
  const completedTasks = taskStats?.completedCount || 0;
  const pendingTasks = taskStats?.pendingCount || 0;
  const totalTasks = taskStats?.totalCount || 0;
  const completionRate = taskStats?.completionRate || 0;
  
  // Fetch tasks for upcoming deadlines
  const { data: userTasks } = useQuery<TaskWithStringDates[]>({
    queryKey: ['/api/tasks'],
    enabled: !!user,
  });
  
  // Calculate upcoming deadlines
  const upcomingDeadlines = userTasks
    ?.filter(task => !task.completed && task.dueDate)
    .sort((a, b) => {
      if (!a.dueDate || !b.dueDate) return 0;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 3);

  return (
    <MobileLayout pageTitle="My Profile">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
          
          {/* Profile Tab Content */}
          <TabsContent value="profile" className="space-y-4">
            
            {/* Profile Card */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {user?.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{profileForm.displayName || user?.username}</CardTitle>
                  <CardDescription>
                    @{user?.username}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <Badge variant={profileForm.isPublic ? "default" : "outline"} className="cursor-pointer" onClick={() => !updateProfileMutation.isPending && toggleVisibilityMutation.mutate(!profileForm.isPublic)}>
                    {profileForm.isPublic ? "Public Profile" : "Private Profile"}
                  </Badge>
                  <Badge variant="secondary">Joined {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : '...'}</Badge>
                </div>
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
            
            {/* Profile Details and Edit */}
            {!isEditing ? (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Profile Information</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Bio */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Bio</h3>
                    <p className="text-sm">{profileForm.bio || "No bio provided"}</p>
                  </div>
                  
                  {/* Interests & Skills */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Interests</h3>
                      <div className="flex flex-wrap gap-1">
                        {profileForm.interests && profileForm.interests.length > 0 ? 
                          profileForm.interests.map((interest, i) => (
                            <Badge key={i} variant="secondary">{interest}</Badge>
                          )) : 
                          <span className="text-sm text-gray-400">None specified</span>
                        }
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Skills</h3>
                      <div className="flex flex-wrap gap-1">
                        {profileForm.skills && profileForm.skills.length > 0 ? 
                          profileForm.skills.map((skill, i) => (
                            <Badge key={i} variant="secondary">{skill}</Badge>
                          )) : 
                          <span className="text-sm text-gray-400">None specified</span>
                        }
                      </div>
                    </div>
                  </div>
                  
                  {/* Location & Website */}
                  <div className="grid grid-cols-1 gap-2">
                    {profileForm.location && (
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-sm">{profileForm.location}</span>
                      </div>
                    )}
                    
                    {profileForm.website && (
                      <div className="flex items-center">
                        <Link className="h-4 w-4 mr-2 text-gray-500" />
                        <a 
                          href={profileForm.website.startsWith('http') ? profileForm.website : `https://${profileForm.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {profileForm.website}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  {/* Social Links */}
                  {profileForm.socialLinks && Object.keys(profileForm.socialLinks).length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Social Media</h3>
                      <div className="flex space-x-2">
                        {profileForm.socialLinks.twitter && (
                          <a 
                            href={`https://twitter.com/${profileForm.socialLinks.twitter}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-500"
                          >
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                        {profileForm.socialLinks.linkedin && (
                          <a 
                            href={`https://linkedin.com/in/${profileForm.socialLinks.linkedin}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:text-blue-800"
                          >
                            <LinkedIn className="h-5 w-5" />
                          </a>
                        )}
                        {profileForm.socialLinks.github && (
                          <a 
                            href={`https://github.com/${profileForm.socialLinks.github}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-800 hover:text-black"
                          >
                            <Github className="h-5 w-5" />
                          </a>
                        )}
                        {profileForm.socialLinks.instagram && (
                          <a 
                            href={`https://instagram.com/${profileForm.socialLinks.instagram}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-pink-500 hover:text-pink-600"
                          >
                            <Instagram className="h-5 w-5" />
                          </a>
                        )}
                        {profileForm.socialLinks.facebook && (
                          <a 
                            href={`https://facebook.com/${profileForm.socialLinks.facebook}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Facebook className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              // Edit Profile Form
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Edit Profile</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {updateProfileMutation.isError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>
                        {updateProfileMutation.error?.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input 
                      id="displayName" 
                      value={profileForm.displayName} 
                      onChange={(e) => setProfileForm({...profileForm, displayName: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea 
                      id="bio" 
                      value={profileForm.bio} 
                      onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                      placeholder="Tell us about yourself"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="interests">
                        Interests <span className="text-gray-400 text-xs">(comma separated)</span>
                      </Label>
                      <Input 
                        id="interests" 
                        value={profileForm.interests.join(', ')} 
                        onChange={(e) => setProfileForm({...profileForm, interests: e.target.value.split(',').map(i => i.trim()).filter(Boolean)})}
                        placeholder="productivity, cooking, travel"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="skills">
                        Skills <span className="text-gray-400 text-xs">(comma separated)</span>
                      </Label>
                      <Input 
                        id="skills" 
                        value={profileForm.skills.join(', ')} 
                        onChange={(e) => setProfileForm({...profileForm, skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                        placeholder="organization, writing, design"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location" 
                        value={profileForm.location} 
                        onChange={(e) => setProfileForm({...profileForm, location: e.target.value})}
                        placeholder="City, Country"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input 
                        id="website" 
                        value={profileForm.website} 
                        onChange={(e) => setProfileForm({...profileForm, website: e.target.value})}
                        placeholder="yourwebsite.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Social Media Links</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Twitter className="h-4 w-4 text-blue-400" />
                          <Label htmlFor="twitter">Twitter</Label>
                        </div>
                        <Input 
                          id="twitter" 
                          value={profileForm.socialLinks.twitter || ''} 
                          onChange={(e) => setProfileForm({
                            ...profileForm, 
                            socialLinks: {...profileForm.socialLinks, twitter: e.target.value}
                          })}
                          placeholder="username"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <LinkedIn className="h-4 w-4 text-blue-700" />
                          <Label htmlFor="linkedin">LinkedIn</Label>
                        </div>
                        <Input 
                          id="linkedin" 
                          value={profileForm.socialLinks.linkedin || ''} 
                          onChange={(e) => setProfileForm({
                            ...profileForm, 
                            socialLinks: {...profileForm.socialLinks, linkedin: e.target.value}
                          })}
                          placeholder="username"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Github className="h-4 w-4 text-gray-800" />
                          <Label htmlFor="github">GitHub</Label>
                        </div>
                        <Input 
                          id="github" 
                          value={profileForm.socialLinks.github || ''} 
                          onChange={(e) => setProfileForm({
                            ...profileForm, 
                            socialLinks: {...profileForm.socialLinks, github: e.target.value}
                          })}
                          placeholder="username"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Instagram className="h-4 w-4 text-pink-500" />
                          <Label htmlFor="instagram">Instagram</Label>
                        </div>
                        <Input 
                          id="instagram" 
                          value={profileForm.socialLinks.instagram || ''} 
                          onChange={(e) => setProfileForm({
                            ...profileForm, 
                            socialLinks: {...profileForm.socialLinks, instagram: e.target.value}
                          })}
                          placeholder="username"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Label htmlFor="public-profile" className="flex-1">Make my profile public</Label>
                    <Switch
                      id="public-profile"
                      checked={profileForm.isPublic}
                      onCheckedChange={(checked) => setProfileForm({...profileForm, isPublic: checked})}
                    />
                  </div>
                  
                  <div className="pt-2 flex justify-end">
                    <Button 
                      onClick={() => updateProfileMutation.mutate(profileForm)}
                      disabled={updateProfileMutation.isPending}
                      className="w-full sm:w-auto"
                    >
                      {updateProfileMutation.isPending ? (
                        <>
                          <span className="animate-spin mr-2">⟳</span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
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
                  <p className="text-2xl font-bold">
                    {completedTasks}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-amber-500" />
                    Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {totalTasks}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="col-span-2">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    {statsLoading ? (
                      <div className="w-full flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div className="bg-gray-300 animate-pulse h-2.5 rounded-full" style={{ width: '0%' }}></div>
                        </div>
                        <span className="text-sm font-bold text-gray-400">Loading...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                          <div 
                            className="bg-primary h-2.5 rounded-full" 
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold">{completionRate}%</span>
                      </>
                    )}
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
      </MobileLayout>
  );
}