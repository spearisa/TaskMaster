import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { TaskWithStringDates } from "@shared/schema";
import { AccordionTrigger, AccordionContent, AccordionItem, Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface TaskDelegationProps {
  task: TaskWithStringDates;
  onDone?: () => void;
}

interface DelegationResult {
  taskTitle: string;
  analysisAndContext: string;
  completionSteps: Array<{
    stepNumber: number;
    description: string;
    estimatedMinutes: number;
  }>;
  draftContent: string;
  resourceSuggestions: string[];
  totalEstimatedTime: number;
  nextActions: string;
}

export function TaskDelegation({ task, onDone }: TaskDelegationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState("");
  const [result, setResult] = useState<DelegationResult | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  const delegateTask = async () => {
    try {
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to use this feature",
          variant: "destructive",
        });
        return;
      }

      const userResponse = await fetch('/api/user', {
        credentials: 'include'
      });

      if (!userResponse.ok) {
        throw new Error('Session expired');
      }

      setIsLoading(true);
      
      const response = await fetch(`/api/tasks/${task.id}/delegate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ context: context.trim() || undefined }),
        credentials: "include" // Important: include credentials for session cookie
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        toast({
          title: "Task delegated",
          description: "AI assistant is helping you with this task",
        });
      } else if (response.status === 401) {
        // Handle expired session during request
        toast({
          title: "Session expired",
          description: "Please log in again to continue",
          variant: "destructive",
        });
      } else {
        // Check if it's an auth error
        if (response.status === 401) {
          toast({
            title: "Session expired",
            description: "Your session has expired. Please log in again.",
            variant: "destructive",
          });
          navigate("/auth");
        } else {
          let errorMessage = "Failed to delegate task to AI";
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error("Could not parse error response", e);
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error delegating task:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!result ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-primary" />
              Delegate to AI Assistant
            </CardTitle>
            <CardDescription>
              Let the AI assistant help you complete this task by providing detailed steps,
              draft content, and resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Additional context (optional)</p>
                <Textarea
                  placeholder="Add any specific requirements, constraints, or details about this task..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={delegateTask} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Delegate Task to AI
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-primary/20">
          <CardHeader className="bg-primary/5 border-b border-primary/10">
            <CardTitle className="flex items-center text-lg">
              <Sparkles className="w-5 h-5 mr-2 text-primary" />
              AI Assistance for: {result.taskTitle}
            </CardTitle>
            <CardDescription className="text-sm">
              Estimated completion time: {result.totalEstimatedTime} minutes
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6 px-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-sm mb-2">Analysis & Context</h3>
                <p className="text-sm text-gray-600">{result.analysisAndContext}</p>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium text-sm mb-3">Completion Steps</h3>
                <div className="space-y-3">
                  {result.completionSteps.map((step) => (
                    <div key={step.stepNumber} className="flex items-start gap-3 bg-gray-50 p-3 rounded-md">
                      <div className="flex-shrink-0 bg-primary/10 text-primary font-medium rounded-full w-6 h-6 flex items-center justify-center text-sm">
                        {step.stepNumber}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{step.description}</p>
                        <p className="text-xs text-gray-500 mt-1">Est. time: {step.estimatedMinutes} minutes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {result.draftContent && (
                <>
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium text-sm mb-3">Draft Content</h3>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="draft">
                        <AccordionTrigger className="text-sm font-medium py-2">
                          View Draft Content
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md text-sm">
                            {result.draftContent}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </>
              )}
              
              {result.resourceSuggestions.length > 0 && (
                <>
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium text-sm mb-3">Recommended Resources</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.resourceSuggestions.map((resource, index) => (
                        <Badge key={index} variant="outline" className="bg-gray-50">
                          {resource}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
              <Separator />
              
              <div>
                <h3 className="font-medium text-sm mb-2">Next Actions</h3>
                <p className="text-sm p-3 bg-primary/5 border border-primary/10 rounded-md">
                  {result.nextActions}
                </p>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between bg-gray-50 border-t">
            <Button variant="outline" onClick={() => setResult(null)}>
              Back
            </Button>
            <Button onClick={onDone}>
              Mark as Completed
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}