import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Users,
  CheckSquare,
  List,
  Globe,
  DollarSign,
  FileClock,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";

// Define the stats interface for type safety
interface AdminStats {
  users: number;
  tasks: number;
  templates: number;
  completedTasks: number;
  publicTasks: number;
  bids: number;
  messages: number;
  blogPosts: number;
  tasksByWeek: { week: string; count: number }[];
  usersByWeek: { week: string; count: number }[];
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const { data: stats, isLoading, error } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1, // Only retry once to avoid endless loading on serious errors
    refetchOnWindowFocus: false // Avoid refetching when window gets focus
  });

  // Log errors for debugging
  useEffect(() => {
    if (error) {
      console.error("Error fetching admin stats:", error);
      
      // Show toast error to notify the user
      toast({
        title: "Error loading dashboard data",
        description: error.message || "Failed to fetch admin statistics",
        variant: "destructive"
      });
    }
  }, [error, toast]);
  
  // Debug log for stats data
  useEffect(() => {
    console.log("Admin dashboard stats loaded:", stats);
  }, [stats]);

  // Default admin stats when data is not loaded yet
  const defaultStats: AdminStats = {
    users: 0,
    tasks: 0,
    templates: 0,
    completedTasks: 0,
    publicTasks: 0,
    bids: 0,
    messages: 0,
    blogPosts: 0,
    tasksByWeek: [],
    usersByWeek: []
  };
  
  // Prepare safe default values with proper type
  const safeStats: AdminStats = stats || defaultStats;

  // Format data for charts with fallback empty arrays
  const taskChartData = safeStats.tasksByWeek.length > 0
    ? safeStats.tasksByWeek.map((entry: any) => ({
        name: format(new Date(entry.week), "MMM d"),
        Tasks: Number(entry.count)
      }))
    : [
        { name: 'Week 1', Tasks: 0 },
        { name: 'Week 2', Tasks: 0 },
        { name: 'Week 3', Tasks: 0 },
        { name: 'Week 4', Tasks: 0 }
      ];

  const userChartData = safeStats.usersByWeek.length > 0
    ? safeStats.usersByWeek.map((entry: any) => ({
        name: format(new Date(entry.week), "MMM d"),
        Users: Number(entry.count)
      }))
    : [
        { name: 'Week 1', Users: 0 },
        { name: 'Week 2', Users: 0 },
        { name: 'Week 3', Users: 0 },
        { name: 'Week 4', Users: 0 }
      ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col space-y-4 md:space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage Appmo platform data and users
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Task Creation Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={taskChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="Tasks" fill="#6366F1" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>New User Registrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={userChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="Users"
                        stroke="#6366F1"
                        strokeWidth={2}
                        dot={{ stroke: '#6366F1', strokeWidth: 2, r: 4 }}
                        activeDot={{ stroke: '#6366F1', strokeWidth: 3, r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Stats cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <StatCard 
                title="Total Users" 
                value={safeStats.users} 
                icon={<Users className="h-5 w-5 text-blue-500" />} 
              />
              <StatCard 
                title="Total Tasks" 
                value={safeStats.tasks} 
                icon={<List className="h-5 w-5 text-indigo-500" />} 
              />
              <StatCard 
                title="Completed Tasks" 
                value={safeStats.completedTasks} 
                icon={<CheckSquare className="h-5 w-5 text-green-500" />} 
              />
              <StatCard 
                title="Public Tasks" 
                value={safeStats.publicTasks} 
                icon={<Globe className="h-5 w-5 text-orange-500" />} 
              />
              <StatCard 
                title="Active Bids" 
                value={safeStats.bids} 
                icon={<DollarSign className="h-5 w-5 text-yellow-500" />} 
              />
              <StatCard 
                title="Task Templates" 
                value={safeStats.templates} 
                icon={<FileClock className="h-5 w-5 text-purple-500" />} 
              />
              <StatCard 
                title="Messages" 
                value={safeStats.messages} 
                icon={<MessageSquare className="h-5 w-5 text-pink-500" />} 
              />
              <StatCard 
                title="Blog Posts" 
                value={safeStats.blogPosts} 
                icon={<BookOpen className="h-5 w-5 text-teal-500" />} 
              />
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  View detailed user information and manage user accounts on the Users page.
                </p>
                <a 
                  href="/admin/users" 
                  className="inline-block px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                >
                  Go to User Management
                </a>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <p className="font-medium">New user registrations</p>
                      <p className="text-sm text-muted-foreground">
                        {`${safeStats.users} total users on the platform`}
                      </p>
                    </div>
                    <div className="border-b pb-2">
                      <p className="font-medium">Tasks created</p>
                      <p className="text-sm text-muted-foreground">
                        {`${safeStats.tasks} total tasks created`}
                      </p>
                    </div>
                    <div className="border-b pb-2">
                      <p className="font-medium">Tasks completed</p>
                      <p className="text-sm text-muted-foreground">
                        {`${safeStats.completedTasks} tasks completed`}
                      </p>
                    </div>
                    <div className="border-b pb-2">
                      <p className="font-medium">Bids placed</p>
                      <p className="text-sm text-muted-foreground">
                        {`${safeStats.bids} bids placed on tasks`}
                      </p>
                    </div>
                    <div className="border-b pb-2">
                      <p className="font-medium">Messages sent</p>
                      <p className="text-sm text-muted-foreground">
                        {`${safeStats.messages} messages exchanged between users`}
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage blog posts, categories, and comments on the Blog Management page.
                </p>
                <a 
                  href="/admin/blog" 
                  className="inline-block px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                >
                  Go to Blog Management
                </a>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          {icon}
        </div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}