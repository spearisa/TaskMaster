import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowLeft, Clock, Calendar, User, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { TaskWithStringDates } from '@shared/schema';

type SharedTaskResponse = {
  task: TaskWithStringDates;
  user: {
    username: string;
    displayName: string;
  } | null;
};

export default function SharedTaskPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [task, setTask] = useState<TaskWithStringDates | null>(null);
  const [userInfo, setUserInfo] = useState<{username: string, displayName: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract the task ID from the URL
  const taskId = location.split('/').pop();

  useEffect(() => {
    const fetchSharedTask = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!taskId || isNaN(parseInt(taskId))) {
          setError('Invalid task ID');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/shared-task/${taskId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load shared task');
        }

        const data: SharedTaskResponse = await response.json();
        setTask(data.task);
        setUserInfo(data.user);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching shared task:', err);
        setError(err.message || 'Failed to load shared task');
        setLoading(false);

        toast({
          title: 'Error',
          description: err.message || 'Failed to load shared task',
          variant: 'destructive',
        });
      }
    };

    fetchSharedTask();
  }, [taskId, toast]);

  function renderPriorityBadge(priority: string) {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors]}`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  }

  function renderCategoryBadge(category: string) {
    const colors = {
      work: 'bg-purple-100 text-purple-800',
      personal: 'bg-indigo-100 text-indigo-800',
      study: 'bg-yellow-100 text-yellow-800',
      health: 'bg-emerald-100 text-emerald-800',
      finance: 'bg-cyan-100 text-cyan-800',
      shopping: 'bg-rose-100 text-rose-800',
      other: 'bg-gray-100 text-gray-800',
    };

    const key = (category || 'other').toLowerCase() as keyof typeof colors;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[key] || colors.other}`}>
        {category || 'Other'}
      </span>
    );
  }

  return (
    <div className="container max-w-3xl px-4 py-8 mx-auto">
      <Button
        variant="ghost"
        className="mb-6 flex items-center gap-1"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">
            {loading ? <Skeleton className="h-7 w-3/4" /> : task?.title}
          </CardTitle>
          
          {loading ? (
            <div className="flex flex-wrap gap-2 mt-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 mt-2">
              {task?.priority && renderPriorityBadge(task.priority)}
              {task?.category && renderCategoryBadge(task.category)}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-gray-500">Description</h3>
            {loading ? (
              <>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-11/12" />
                <Skeleton className="h-4 w-4/5" />
              </>
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{task?.description || 'No description provided.'}</p>
            )}
          </div>

          <Separator />

          {/* Details */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm text-gray-500">Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Due Date */}
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Due Date</div>
                  {loading ? (
                    <Skeleton className="h-4 w-24 mt-1" />
                  ) : (
                    <div className="text-sm text-gray-600">
                      {task?.dueDate ? format(new Date(task.dueDate), 'MMMM d, yyyy') : 'No due date'}
                    </div>
                  )}
                </div>
              </div>

              {/* Estimated Time */}
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Estimated Time</div>
                  {loading ? (
                    <Skeleton className="h-4 w-24 mt-1" />
                  ) : (
                    <div className="text-sm text-gray-600">
                      {task?.estimatedTime ? `${task.estimatedTime} hour${task.estimatedTime !== 1 ? 's' : ''}` : 'Not specified'}
                    </div>
                  )}
                </div>
              </div>

              {/* Created By */}
              <div className="flex items-start gap-2">
                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Created By</div>
                  {loading ? (
                    <Skeleton className="h-4 w-24 mt-1" />
                  ) : (
                    <div className="text-sm text-gray-600">
                      {userInfo?.displayName || userInfo?.username || 'Unknown user'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-md text-red-700">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}