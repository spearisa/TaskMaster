import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, RefreshCw, Loader } from 'lucide-react';

interface Task {
  title: string;
  estimatedTime: number;
}

interface SuggestionGroup {
  title: string;
  steps: Task[];
  recommendation: string;
}

interface AiAssistantProps {
  delegationMode?: boolean;
}

export function AiAssistant({ delegationMode = false }: AiAssistantProps) {
  const [suggestions, setSuggestions] = useState<SuggestionGroup[]>([]);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});
  const [selectedTaskForDelegation, setSelectedTaskForDelegation] = useState<number | null>(null);
  const [delegationContext, setDelegationContext] = useState('');
  const [isDelegating, setIsDelegating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch user's tasks for delegation
  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/tasks'],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Task suggestions query
  const suggestionsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/ai/suggestions', {});
      return res.json();
    },
    onSuccess: (data) => {
      if (Array.isArray(data)) {
        setSuggestions(data);
      } else if (data.taskBreakdowns) {
        // If we're receiving the new OpenAI format, transform it
        const transformedSuggestions = data.taskBreakdowns.map((breakdown: any) => ({
          title: breakdown.taskTitle,
          steps: breakdown.steps.map((step: any) => ({
            title: step.title,
            estimatedTime: step.estimatedTime
          })),
          recommendation: data.timeManagementTips?.[0] || "Prioritize these tasks based on deadlines."
        }));
        setSuggestions(transformedSuggestions);
      }
    },
    onError: (error) => {
      console.error('Error fetching AI suggestions:', error);
      toast({
        title: "Failed to get AI suggestions",
        description: "We couldn't generate suggestions at this time. Please try again later.",
        variant: "destructive",
      });
    }
  });
  
  // Fetch suggestions when component mounts
  useEffect(() => {
    loadSuggestions();
  }, []);
  
  const loadSuggestions = async () => {
    try {
      setIsFetchingSuggestions(true);
      await suggestionsMutation.mutateAsync();
    } catch (error) {
      console.error('Error in loadSuggestions:', error);
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  const toggleTaskSelection = (taskTitle: string) => {
    setSelectedTasks(prev => ({
      ...prev,
      [taskTitle]: !prev[taskTitle]
    }));
  };

  const addTasksToPlanner = async () => {
    try {
      setIsLoading(true);
      
      const tasksToAdd = suggestions.flatMap(group => 
        group.steps.filter(step => selectedTasks[step.title])
      );
      
      if (tasksToAdd.length === 0) {
        // If no tasks selected, add all tasks
        for (const group of suggestions) {
          for (const step of group.steps) {
            await addTask({
              title: step.title,
              priority: "medium",
              category: "Work",
              dueDate: new Date(),
              estimatedTime: step.estimatedTime
            });
          }
        }
      } else {
        // Add only selected tasks
        for (const task of tasksToAdd) {
          await addTask({
            title: task.title,
            priority: "medium",
            category: "Work",
            dueDate: new Date(),
            estimatedTime: task.estimatedTime
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      toast({
        title: "Tasks added to planner",
        description: "Your tasks have been added to your planner.",
      });
    } catch (error) {
      console.error('Error adding tasks:', error);
      toast({
        title: "Error",
        description: "Failed to add tasks to planner. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Schedule optimization mutation
  const scheduleMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/ai/schedule', {});
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Schedule Optimization",
        description: data.message || "AI has optimized your daily schedule.",
      });
      // If we get schedule data, refresh tasks
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      }
    },
    onError: (error) => {
      console.error('Error optimizing schedule:', error);
      toast({
        title: "Schedule Optimization Failed",
        description: "We couldn't optimize your schedule at this time. Please try again later.",
        variant: "destructive",
      });
    }
  });
  
  const askAiForHelp = async () => {
    try {
      await scheduleMutation.mutateAsync();
    } catch (error) {
      console.error('Error in askAiForHelp:', error);
    }
  };

  const addTask = async (task: any) => {
    await apiRequest('POST', '/api/tasks', task);
  };

  return (
    <div className="space-y-4 px-5 py-2">
      <div className="mb-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex items-center justify-center">
          <h2 className="text-lg font-semibold mr-2">
            Here's a plan to help you with your tasks:
          </h2>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={loadSuggestions} 
            disabled={isFetchingSuggestions}
            className="p-1"
          >
            {isFetchingSuggestions ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      {isFetchingSuggestions && suggestions.length === 0 && (
        <div className="flex items-center justify-center py-10">
          <Loader className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-gray-500">Generating AI suggestions...</span>
        </div>
      )}

      {suggestions.map((group, groupIndex) => (
        <Card key={groupIndex} className="bg-gray-50 border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{group.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="ml-5 space-y-2 mb-4">
              {group.steps.map((step, stepIndex) => (
                <div 
                  key={stepIndex} 
                  className="flex items-start"
                  onClick={() => toggleTaskSelection(step.title)}
                >
                  <div className={`w-4 h-4 rounded-full ${selectedTasks[step.title] ? 'bg-green-500' : 'bg-primary'} mt-1 mr-2 cursor-pointer`}>
                    {selectedTasks[step.title] && (
                      <CheckCircle className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="cursor-pointer">
                    {step.title} <span className="text-neutral-500 text-sm">({step.estimatedTime} mins)</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-sm text-neutral-500 mb-3">{group.recommendation}</div>
            <div className="flex space-x-3">
              <Button 
                className="w-1/2 bg-primary text-white py-2 h-10 rounded-xl text-sm font-medium"
                onClick={addTasksToPlanner}
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add All to Planner"}
              </Button>
              <Button 
                variant="outline"
                className="w-1/2 border border-primary text-primary py-2 h-10 rounded-xl text-sm font-medium"
                onClick={askAiForHelp}
                disabled={isLoading}
              >
                Ask AI for Help
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* AI Task Delegation Section */}
      <Card className="bg-gray-50 border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Delegate Task to AI</CardTitle>
        </CardHeader>
        <CardContent>
          {Array.isArray(tasks) && tasks.length > 0 ? (
            <>
              <div className="mb-3">
                <select 
                  className="w-full p-2 border border-gray-200 rounded-md text-sm"
                  value={selectedTaskForDelegation || ''}
                  onChange={(e) => setSelectedTaskForDelegation(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">Select a task to delegate...</option>
                  {Array.isArray(tasks) && tasks.map((task: any) => (
                    <option key={task.id} value={task.id}>
                      {task.title} {task.estimatedTime ? `(${task.estimatedTime} mins)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3 text-sm bg-primary/10 p-3 rounded-lg">
                <div className="font-medium text-primary mb-1">AI tip:</div>
                <p>When delegating this task to AI, be specific about your brand voice and target audience.</p>
              </div>
              <div className="mb-3">
                <textarea 
                  className="w-full p-2 border border-gray-200 rounded-md text-sm" 
                  placeholder="Add context for the AI (optional)"
                  rows={2}
                  value={delegationContext}
                  onChange={(e) => setDelegationContext(e.target.value)}
                ></textarea>
              </div>
              <Button 
                className="w-full bg-primary text-white py-2 h-10 rounded-xl text-sm font-medium"
                onClick={() => {
                  if (!selectedTaskForDelegation) {
                    toast({
                      title: "Please select a task",
                      description: "You need to select a task to delegate to the AI.",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // In a real implementation, we would call the task delegation API
                  setIsDelegating(true);
                  
                  // Example of what the delegation API call would look like
                  toast({
                    title: "AI Task Delegation",
                    description: `Task ID ${selectedTaskForDelegation} will be delegated to AI.`,
                  });
                  
                  // After some time, stop showing loading state
                  setTimeout(() => {
                    setIsDelegating(false);
                  }, 1500);
                }}
                disabled={isDelegating || !selectedTaskForDelegation}
              >
                {isDelegating ? 
                  <><Loader className="h-4 w-4 animate-spin mr-2" /> Delegating...</> : 
                  "Delegate Task"
                }
              </Button>
              <div className="mt-2 text-xs text-gray-500 text-center">
                The AI will break this task down into steps and provide suggestions.
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-gray-500 mb-3">You don't have any tasks to delegate.</div>
              <Button
                variant="outline"
                size="sm"
                className="border-primary text-primary"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/tasks'] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Tasks
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learning Assistant Section */}
      <Card className="bg-gray-50 border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Learn Spanish</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm mb-3">Today's Focus: Travel Vocabulary</div>
          <div className="text-lg font-medium mb-1">Viajar</div>
          <div className="text-neutral-500 mb-3">To travel</div>
          <div className="text-sm mb-2">How do you say "airport"?</div>
          <div className="flex flex-col space-y-2 mb-3">
            <Button variant="outline" className="justify-start text-left h-auto p-3 rounded-xl hover:bg-gray-100">
              La estación
            </Button>
            <Button variant="outline" className="justify-start text-left h-auto p-3 rounded-xl border-2 border-primary bg-primary/5">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                El aeropuerto
              </div>
            </Button>
            <Button variant="outline" className="justify-start text-left h-auto p-3 rounded-xl hover:bg-gray-100">
              El equipaje
            </Button>
          </div>
          <div className="text-neutral-500 mb-4 text-sm bg-gray-100 p-3 rounded-lg border border-neutral-200 border-opacity-20">
            <div className="font-medium text-gray-800 mb-1">You're at the airport.</div>
            Ask for your gate.
          </div>
          <Button 
            className="w-full bg-primary text-white py-2 h-10 rounded-xl text-sm font-medium"
            onClick={() => {
              toast({
                title: "Learning",
                description: "Moving to next lesson. Feature coming soon.",
              });
            }}
          >
            Next Lesson
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
