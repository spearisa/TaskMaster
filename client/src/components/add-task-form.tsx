import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

// Create client-side form schema 
const formSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional().nullable(),
  dueDate: z.date().optional(),
  completed: z.boolean().default(false),
  priority: z.enum(["high", "medium", "low"], {
    required_error: "Please select a priority level",
  }),
  category: z.string({
    required_error: "Please select a category",
  }),
  estimatedTime: z.number().optional(),
  userId: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddTaskForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
      category: "Work",
      completed: false,
      dueDate: undefined,
      estimatedTime: undefined,
      userId: 1, // Using the demo user ID
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      console.log("Form data before submission:", data);
      
      // Create a new object with the same data
      // NOTE: We keep dueDate as a Date object since the server expects it
      const taskData = {
        ...data,
        // Don't convert dueDate to ISO string - server expects a Date object
        dueDate: data.dueDate, // Keep as Date object
        estimatedTime: typeof data.estimatedTime === 'number' ? data.estimatedTime : undefined,
        description: data.description || '', // Ensure description is never undefined
        // Ensure all required fields are present
        priority: data.priority || 'medium',
        category: data.category || 'Work',
        completed: false,
        isPublic: false
      };
      
      console.log("Task data being sent to API:", taskData);
      
      try {
        const response = await apiRequest("POST", "/api/tasks", taskData);
        
        console.log("API response status:", response.status);
        
        if (response.ok) {
          const responseData = await response.json();
          console.log("Success response data:", responseData);
          
          queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
          
          toast({
            title: "Task created",
            description: "Your task has been created successfully.",
          });
          
          navigate("/");
        } else {
          let errorMessage = "Failed to create task";
          
          try {
            const errorData = await response.json();
            console.error("Server error response:", errorData);
            
            if (errorData.details) {
              errorMessage = `${errorData.message}: ${errorData.details}`;
            } else if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (jsonError) {
            console.error("Error parsing error response:", jsonError);
            errorMessage = `Server error (${response.status}): ${response.statusText}`;
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      } catch (networkError) {
        console.error("Network error:", networkError);
        toast({
          title: "Connection Error",
          description: "Could not connect to the server. Please check your internet connection and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-4">
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-500">Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Task title"
                      className="p-3 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-500">Description</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Task description"
                      className="w-full p-3 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary min-h-[80px]"
                      onChange={(e) => field.onChange(e.target.value)}
                      value={field.value ?? ''}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-500">Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full p-3 h-auto border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span className="text-neutral-400">Select date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-500">Priority</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full p-3 h-auto border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-500">Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full p-3 h-auto border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Work">Work</SelectItem>
                      <SelectItem value="Personal">Personal</SelectItem>
                      <SelectItem value="Shopping">Shopping</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="estimatedTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-neutral-500">Estimated Time (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 30"
                      className="p-3 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary"
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-1/3 py-3 h-auto border border-primary text-primary font-medium rounded-xl"
                onClick={() => navigate("/")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-2/3 bg-primary text-white py-3 h-auto font-medium rounded-xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Task"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
