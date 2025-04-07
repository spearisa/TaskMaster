import { useState } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskTemplateList } from '@/components/task-template-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function TaskTemplatesPage() {
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Task Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage reusable task templates
          </p>
        </div>
        <Button 
          onClick={() => setLocation('/task-templates/new')}
          className="mt-4 sm:mt-0"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Templates</TabsTrigger>
          <TabsTrigger value="my">My Templates</TabsTrigger>
          <TabsTrigger value="public">Public Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <TaskTemplateList filter="all" title="All Templates" />
        </TabsContent>
        <TabsContent value="my">
          <TaskTemplateList filter="my" title="My Templates" />
        </TabsContent>
        <TabsContent value="public">
          <TaskTemplateList filter="public" title="Public Templates" />
        </TabsContent>
      </Tabs>
    </div>
  );
}