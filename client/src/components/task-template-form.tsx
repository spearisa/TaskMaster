import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  Plus, 
  X, 
  Sparkles, 
  Lightbulb,
  ListTodo,
  CheckCircle2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

// Define the form schema with Zod
const formSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters' }).max(100),
  description: z.string().nullable().optional(),
  category: z.string().min(1, { message: 'Category is required' }),
  priority: z.enum(['low', 'medium', 'high']),
  steps: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  estimatedTime: z.number().min(0).nullable().optional(),
  isPublic: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface TaskTemplateFormProps {
  onSuccess?: () => void;
  defaultValues?: Partial<FormValues>;
}

export function TaskTemplateForm({ onSuccess, defaultValues }: TaskTemplateFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newStep, setNewStep] = useState('');
  const [newTag, setNewTag] = useState('');
  const [aiContext, setAiContext] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Initialize form with defaultValues or empty values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'general',
      priority: 'medium',
      steps: [],
      tags: [],
      estimatedTime: null,
      isPublic: false,
      ...defaultValues,
    },
  });

  // Create task template mutation
  const createTaskTemplateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest('POST', '/api/task-templates', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Task template created successfully',
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public-task-templates'] });
      
      // Reset form or call onSuccess callback
      form.reset();
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update task template mutation
  const updateTaskTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormValues }) => {
      const res = await apiRequest('PATCH', `/api/task-templates/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Task template updated successfully',
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public-task-templates'] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // AI Delegation mutation
  const aiDelegateMutation = useMutation({
    mutationFn: async (context: string) => {
      try {
        const templateDetails = {
          title: form.getValues('title'),
          description: form.getValues('description'),
          category: form.getValues('category'),
          context: context
        };
        
        console.log("Sending AI delegate template request:", templateDetails);
        
        const res = await apiRequest('POST', '/api/ai/delegate-template', templateDetails);
        
        if (!res.ok) {
          const errorData = await res.json();
          console.error("AI delegation API error:", errorData);
          throw new Error(errorData.message || "Failed to delegate to AI");
        }
        
        const data = await res.json();
        console.log("AI delegation response:", data);
        
        // Validate and sanitize the response
        const sanitizedResponse = {
          description: typeof data.description === 'string' ? data.description : '',
          steps: Array.isArray(data.steps) ? data.steps : [],
          estimatedTime: typeof data.estimatedTime === 'number' ? data.estimatedTime : 30,
          tags: Array.isArray(data.tags) ? data.tags : [],
          priority: data.priority && ['low', 'medium', 'high'].includes(data.priority) 
            ? data.priority 
            : 'medium'
        };
        
        return sanitizedResponse;
      } catch (err) {
        console.error("Error in AI delegation:", err);
        throw err;
      }
    },
    onSuccess: (data) => {
      console.log("AI delegation successful - setting result:", data);
      setAiResult(data);
      
      // Update form with AI generated content
      if (data.description) {
        form.setValue('description', data.description);
      }
      
      if (data.steps && Array.isArray(data.steps)) {
        form.setValue('steps', data.steps);
      }
      
      if (data.estimatedTime !== undefined && data.estimatedTime !== null) {
        const estimatedTime = typeof data.estimatedTime === 'string' 
          ? parseInt(data.estimatedTime) 
          : data.estimatedTime;
        
        form.setValue('estimatedTime', isNaN(estimatedTime) ? 30 : estimatedTime);
      }
      
      if (data.tags && Array.isArray(data.tags)) {
        form.setValue('tags', data.tags);
      }
      
      // Ensure priority is valid
      const validPriority = data.priority && ['low', 'medium', 'high'].includes(data.priority)
        ? data.priority as 'low' | 'medium' | 'high'
        : 'medium';
        
      form.setValue('priority', validPriority);
      
      toast({
        title: 'AI Delegation Complete',
        description: 'Template details have been generated and applied to the form',
      });
    },
    onError: (error: any) => {
      console.error("AI delegation mutation error:", error);
      let errorMessage = "An unexpected error occurred";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast({
        title: 'AI Delegation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  });

  // Form submission handler
  const onSubmit = (data: FormValues) => {
    console.log('Form submission data:', data);
    
    if (defaultValues?.id) {
      // Update existing template
      updateTaskTemplateMutation.mutate({
        id: defaultValues.id as number,
        data
      });
    } else {
      // Create new template
      createTaskTemplateMutation.mutate(data);
    }
  };

  // Handle adding a new step
  const handleAddStep = () => {
    if (!newStep.trim()) return;
    
    const currentSteps = form.getValues('steps') || [];
    form.setValue('steps', [...currentSteps, newStep.trim()]);
    setNewStep('');
  };

  // Handle removing a step
  const handleRemoveStep = (index: number) => {
    const currentSteps = form.getValues('steps') || [];
    form.setValue('steps', currentSteps.filter((_, i) => i !== index));
  };

  // Handle adding a new tag
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', [...currentTags, newTag.trim()]);
    setNewTag('');
  };

  // Handle removing a tag
  const handleRemoveTag = (index: number) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter((_, i) => i !== index));
  };

  // Determine if form is submitting
  const isSubmitting = createTaskTemplateMutation.isPending || updateTaskTemplateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter template title" {...field} />
              </FormControl>
              <FormDescription>
                A clear and concise title for your task template
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter template description" 
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Provide a detailed description of what this template is for
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Estimated Time */}
        <FormField
          control={form.control}
          name="estimatedTime"
          render={({ field: { onChange, ...field }}) => (
            <FormItem>
              <FormLabel>Estimated Time (minutes)</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={0}
                  onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                Approximate time needed to complete this task
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Steps */}
        <div className="space-y-2">
          <FormLabel>Steps</FormLabel>
          <div className="flex">
            <Input 
              placeholder="Add a step" 
              value={newStep}
              onChange={(e) => setNewStep(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddStep();
                }
              }}
            />
            <Button 
              type="button" 
              onClick={handleAddStep}
              className="ml-2"
              variant="secondary"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          <FormDescription>
            Break down the task into sequential steps
          </FormDescription>
          <div className="mt-2">
            {form.watch('steps')?.length ? (
              <div className="border rounded-md p-4 space-y-2">
                {form.watch('steps')?.map((step, index) => (
                  <div key={index} className="flex items-start gap-2 group">
                    <div className="rounded-full bg-muted flex h-6 w-6 items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1 text-sm">{step}</div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveStep(index)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove step</span>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-2">No steps added yet</div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <FormLabel>Tags</FormLabel>
          <div className="flex">
            <Input 
              placeholder="Add a tag" 
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button 
              type="button" 
              onClick={handleAddTag}
              className="ml-2"
              variant="secondary"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          <FormDescription>
            Add tags to help categorize and find this template later
          </FormDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            {form.watch('tags')?.length ? (
              form.watch('tags')?.map((tag, index) => (
                <Badge key={index} variant="outline" className="group">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1"
                    onClick={() => handleRemoveTag(index)}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove tag</span>
                  </Button>
                </Badge>
              ))
            ) : (
              <div className="text-sm text-muted-foreground py-2">No tags added yet</div>
            )}
          </div>
        </div>

        {/* Public/Private */}
        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <input
                  type="checkbox"
                  className="h-4 w-4 mt-1"
                  checked={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Make this template public</FormLabel>
                <FormDescription>
                  Public templates can be viewed and used by other users
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        {/* AI Delegation */}
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full mb-4 bg-primary/5 hover:bg-primary/10 border-primary/20"
            >
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              Delegate to AI Assistant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-primary" />
                AI Template Assistant
              </DialogTitle>
              <DialogDescription>
                Let our AI assistant help you create a detailed template. Provide some context about the template's purpose.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Title</p>
                <p className="text-sm border p-2 rounded-md bg-muted/50">
                  {form.getValues('title') || 'No title provided'}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Category</p>
                <p className="text-sm border p-2 rounded-md bg-muted/50">
                  {form.getValues('category') || 'No category selected'}
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="ai-context" className="text-sm font-medium">
                  Additional Context (optional)
                </label>
                <Textarea
                  id="ai-context"
                  placeholder="Provide more details about what this template should include..."
                  value={aiContext}
                  onChange={(e) => setAiContext(e.target.value)}
                  rows={4}
                />
              </div>
              
              {aiResult && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium">AI template details generated</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The AI has suggested details for your template. Click "Apply Changes" to use them.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setAiContext('');
                  setAiResult(null);
                }}
              >
                Cancel
              </Button>
              
              {!aiResult ? (
                <Button 
                  type="button" 
                  onClick={() => {
                    if (!form.getValues('title')) {
                      toast({
                        title: "Title Required",
                        description: "Please add a title before delegating to AI",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    setIsLoadingAi(true);
                    aiDelegateMutation.mutate(aiContext, {
                      onSettled: () => {
                        setIsLoadingAi(false);
                      }
                    });
                  }}
                  disabled={isLoadingAi || aiDelegateMutation.isPending}
                >
                  {(isLoadingAi || aiDelegateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Template Details
                </Button>
              ) : (
                <DialogClose asChild>
                  <Button type="button">
                    Apply Changes
                  </Button>
                </DialogClose>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues?.id ? 'Update Template' : 'Create Template'}
        </Button>
      </form>
    </Form>
  );
}