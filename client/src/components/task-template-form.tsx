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
import { Loader2, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {defaultValues?.id ? 'Update Template' : 'Create Template'}
        </Button>
      </form>
    </Form>
  );
}