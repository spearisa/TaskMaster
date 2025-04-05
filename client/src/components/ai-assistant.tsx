import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface Task {
  title: string;
  estimatedTime: number;
}

interface SuggestionGroup {
  title: string;
  steps: Task[];
  recommendation: string;
}

export function AiAssistant() {
  const [suggestions, setSuggestions] = useState<SuggestionGroup[]>([
    {
      title: "Launch your business website",
      steps: [
        { title: "Choose domain name", estimatedTime: 30 },
        { title: "Set up hosting", estimatedTime: 30 },
        { title: "Write homepage copy", estimatedTime: 60 },
        { title: "Design layout", estimatedTime: 120 }
      ],
      recommendation: "To stay on track, try finishing 2 of these today."
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const askAiForHelp = () => {
    toast({
      title: "AI Assistant",
      description: "AI Assistant will help optimize your schedule. Feature coming soon.",
    });
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
        <h2 className="text-lg font-semibold">Here's a plan to help you with your tasks:</h2>
      </div>

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
          <div className="flex items-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <div className="font-medium">Write About Page Copy</div>
              <div className="text-sm text-neutral-500">Est. Time: 45 min</div>
            </div>
          </div>
          <div className="mb-3 text-sm bg-primary/10 p-3 rounded-lg">
            <div className="font-medium text-primary mb-1">AI tip:</div>
            Use brand story to build emotional resonance
          </div>
          <Button 
            className="w-full bg-primary text-white py-2 h-10 rounded-xl text-sm font-medium"
            onClick={() => {
              toast({
                title: "AI Delegation",
                description: "Task delegated to AI. Feature coming soon.",
              });
            }}
          >
            Delegate Task
          </Button>
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
