import { useLocation } from 'wouter';
import { TaskTemplateForm } from '@/components/task-template-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewTaskTemplatePage() {
  const [_, setLocation] = useLocation();

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => setLocation('/task-templates')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Templates
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Task Template</h1>
        <p className="text-muted-foreground mt-1">
          Design a reusable template for common tasks
        </p>
      </div>

      <div className="bg-card rounded-lg border shadow-sm p-6">
        <TaskTemplateForm 
          onSuccess={() => setLocation('/task-templates')}
        />
      </div>
    </div>
  );
}