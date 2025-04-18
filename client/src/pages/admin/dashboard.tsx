import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, Users, CheckSquare, ListTodo, Newspaper, 
  MessageSquare, Package, Award, FileText, BookOpen 
} from "lucide-react";
import { Link } from "wouter";

// Bar Chart Component
function StatsChart({ data, title, description }: { 
  data: { week: string, count: number }[], 
  title: string, 
  description: string 
}) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((item, index) => {
            const percentage = (item.count / maxCount) * 100;
            const date = new Date(item.week);
            const formattedDate = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            
            return (
              <div key={index} className="flex items-center gap-2">
                <div className="w-12 text-xs text-muted-foreground">{formattedDate}</div>
                <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
                  <div 
                    className="h-full bg-primary transition-all" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-9 text-xs font-medium">{item.count}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, title, value, description, href }: {
  icon: React.ElementType;
  title: string;
  value: number | string;
  description: string;
  href: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <Button variant="ghost" size="sm" className="mt-2" asChild>
          <Link href={href}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['/api/admin/stats'],
    retry: false
  });

  if (isLoading) {
    return <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-20 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>;
  }

  if (error || !stats) {
    return <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="p-4 mb-4 rounded-md bg-red-100 text-red-600">
        <p>Error loading dashboard data. Please try again later.</p>
      </div>
      <Button variant="secondary" onClick={() => window.location.reload()}>
        Retry
      </Button>
    </div>;
  }

  const tasksByWeekData = stats.tasksByWeek?.map((item: any) => ({
    week: item.week,
    count: parseInt(item.count)
  })) || [];

  const usersByWeekData = stats.usersByWeek?.map((item: any) => ({
    week: item.week,
    count: parseInt(item.count)
  })) || [];

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="space-x-2">
          <Button variant="outline" asChild>
            <Link href="/admin/users">Manage Users</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/blog">Manage Blog</Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              icon={Users}
              title="Total Users"
              value={stats.users || 0}
              description="Active platform users"
              href="/admin/users"
            />
            <StatCard 
              icon={ListTodo}
              title="Total Tasks"
              value={stats.tasks || 0}
              description="Tasks created on the platform"
              href="/admin/tasks"
            />
            <StatCard 
              icon={CheckSquare}
              title="Completed Tasks"
              value={stats.completedTasks || 0}
              description="Successfully completed tasks"
              href="/admin/tasks?filter=completed"
            />
            <StatCard 
              icon={FileText}
              title="Public Tasks"
              value={stats.publicTasks || 0}
              description="Publicly available tasks"
              href="/admin/tasks?filter=public"
            />
            <StatCard 
              icon={Award}
              title="Task Bids"
              value={stats.bids || 0}
              description="Bids placed on tasks"
              href="/admin/bids"
            />
            <StatCard 
              icon={Package}
              title="Task Templates"
              value={stats.templates || 0}
              description="Available task templates"
              href="/admin/templates"
            />
            <StatCard 
              icon={MessageSquare}
              title="Messages"
              value={stats.messages || 0}
              description="Messages exchanged"
              href="/admin/messages"
            />
            <StatCard 
              icon={Newspaper}
              title="Blog Posts"
              value={stats.blogPosts || 0}
              description="Published blog articles"
              href="/admin/blog"
            />
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid gap-4 md:grid-cols-2">
            <StatsChart 
              data={tasksByWeekData} 
              title="Tasks by Week" 
              description="Number of tasks created per week"
            />
            <StatsChart 
              data={usersByWeekData} 
              title="Users by Week" 
              description="Number of users registered per week"
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex justify-end">
        <Button variant="outline" size="sm" className="mr-2" asChild>
          <Link href="/admin/settings">Admin Settings</Link>
        </Button>
        <Button variant="default" size="sm" asChild>
          <Link href="/">Return to App</Link>
        </Button>
      </div>
    </div>
  );
}