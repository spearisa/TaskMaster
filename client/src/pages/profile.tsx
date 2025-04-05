import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { TaskWithStringDates } from "@shared/schema";
import { MobileLayout } from "@/components/layouts/mobile-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, LogOut, CalendarClock, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const [_, navigate] = useLocation();
  
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
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>
        
        {/* Profile Card */}
        <Card className="mb-6">
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
        <h2 className="text-lg font-semibold mb-3">Task Statistics</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
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
        <h2 className="text-lg font-semibold mb-3">Upcoming Deadlines</h2>
        {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
          <div className="space-y-3">
            {upcomingDeadlines.map(task => (
              <Card key={task.id} className="cursor-pointer" onClick={() => navigate(`/task/${task.id}`)}>
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
      </div>
    </MobileLayout>
  );
}