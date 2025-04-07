import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { TaskTemplateWithStringDates } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useLocation, Link } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import {
  Calendar,
  Clock,
  Copy,
  FileText,
  Filter,
  FolderOpen,
  Globe2,
  MoreVertical,
  Plus,
  Search,
  Tag,
} from 'lucide-react';

interface TaskTemplateListProps {
  filter?: 'my' | 'public' | 'all';
  title?: string;
}

export function TaskTemplateList({ filter = 'all', title = 'Task Templates' }: TaskTemplateListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Fetch task templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/task-templates'],
    staleTime: 1000 * 60,
  });

  // Fetch public task templates
  const { data: publicTemplates = [], isLoading: publicTemplatesLoading } = useQuery({
    queryKey: ['/api/public-task-templates'],
    staleTime: 1000 * 60,
  });

  // Create task from template mutation
  const createTaskMutation = useMutation({
    mutationFn: async (templateId: number) => {
      const res = await apiRequest('POST', `/api/task-templates/${templateId}/create-task`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Task created',
        description: 'New task created from template',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      // Navigate to the task detail page
      setLocation(`/task/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error creating task',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Toggle public mutation
  const togglePublicMutation = useMutation({
    mutationFn: async ({ templateId, isPublic }: { templateId: number; isPublic: boolean }) => {
      const res = await apiRequest('PATCH', `/api/task-templates/${templateId}/public`, {
        isPublic,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Template updated',
        description: 'Template visibility updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/task-templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/public-task-templates'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle creating a task from template
  const handleCreateTask = (template: TaskTemplateWithStringDates) => {
    createTaskMutation.mutate(template.id);
  };

  // Handle toggling public status
  const handleTogglePublic = (template: TaskTemplateWithStringDates) => {
    togglePublicMutation.mutate({
      templateId: template.id,
      isPublic: !template.isPublic,
    });
  };

  // Get all categories from templates
  const allCategories = [...new Set([...templates, ...publicTemplates].map(t => t.category))];

  // Filter templates based on filter prop and search query
  const filteredTemplates = filter === 'my'
    ? templates.filter((template: TaskTemplateWithStringDates) => {
        const matchesSearch = !searchQuery || 
          template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCategory = !categoryFilter || template.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
      })
    : filter === 'public'
    ? publicTemplates.filter((template: TaskTemplateWithStringDates) => {
        const matchesSearch = !searchQuery || 
          template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCategory = !categoryFilter || template.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
      })
    : [...templates, ...publicTemplates].filter((template: TaskTemplateWithStringDates) => {
        const matchesSearch = !searchQuery || 
          template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCategory = !categoryFilter || template.category === categoryFilter;
        
        return matchesSearch && matchesCategory;
      });

  // Check if there are templates to display
  const hasTemplates = filteredTemplates.length > 0;

  if (isLoading || publicTemplatesLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter className="flex justify-between p-4 pt-0">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-10 rounded-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground/70" />
          <Input
            placeholder="Search templates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="mr-2 h-4 w-4" />
              Category {categoryFilter ? `(${categoryFilter})` : ''}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setCategoryFilter(null)}>
              All Categories
            </DropdownMenuItem>
            {allCategories.map((category) => (
              <DropdownMenuItem key={category} onClick={() => setCategoryFilter(category)}>
                {category}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {hasTemplates ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template: TaskTemplateWithStringDates) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-2">{template.title}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getPriorityVariant(template.priority)}>
                        {template.priority}
                      </Badge>
                      <Badge variant="outline">{template.category}</Badge>
                      {template.isPublic && (
                        <Badge variant="secondary">
                          <Globe2 className="mr-1 h-3 w-3" />
                          Public
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Template actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCreateTask(template)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Task
                      </DropdownMenuItem>
                      {user && template.userId === user.id && (
                        <>
                          <DropdownMenuItem onClick={() => handleTogglePublic(template)}>
                            <Globe2 className="mr-2 h-4 w-4" />
                            {template.isPublic ? 'Make Private' : 'Make Public'}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setLocation(`/task-templates/${template.id}/edit`)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Edit Template
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {template.description && (
                  <CardDescription className="line-clamp-2 mt-1">
                    {template.description}
                  </CardDescription>
                )}
                <div className="flex flex-wrap gap-1 mt-3">
                  {template.steps && template.steps.length > 0 && (
                    <Badge variant="outline" className="flex items-center">
                      <FolderOpen className="mr-1 h-3 w-3" />
                      {template.steps.length} steps
                    </Badge>
                  )}
                  {template.estimatedTime && (
                    <Badge variant="outline" className="flex items-center">
                      <Clock className="mr-1 h-3 w-3" />
                      {template.estimatedTime} min
                    </Badge>
                  )}
                  {template.tags && template.tags.length > 0 && (
                    <Badge variant="outline" className="flex items-center">
                      <Tag className="mr-1 h-3 w-3" />
                      {template.tags.length} tags
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between p-4 pt-0">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={() => handleCreateTask(template)}
                  disabled={createTaskMutation.isPending}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Use Template
                </Button>
                {template.userId && (
                  <div className="flex items-center space-x-1">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {template.user?.displayName?.charAt(0) || template.user?.username?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground/60" />
          <h3 className="mt-4 text-lg font-medium">No templates found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === 'my' ? "You haven't created any templates yet." : 
             filter === 'public' ? "No public templates available." : 
             "No templates match your search criteria."}
          </p>
          {filter === 'my' && (
            <Button
              onClick={() => setLocation('/task-templates/new')}
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to get priority badge variant
function getPriorityVariant(priority: string): "default" | "destructive" | "outline" | "secondary" {
  switch (priority.toLowerCase()) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'default';
    case 'low':
      return 'secondary';
    default:
      return 'outline';
  }
}