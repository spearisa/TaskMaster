import { useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, Zap, Lightbulb, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiAssistant } from '@/components/ai-assistant';
import { SmartTasks } from '@/components/smart-tasks';

export default function AIAssistantPage() {
  const [_, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('ai-tools');

  return (
    <div>
      <header className="px-5 py-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-2">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">AI Assistant</h1>
      </header>

      <Tabs 
        defaultValue="ai-tools" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="px-5 border-b">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg">
            <TabsTrigger value="ai-tools" className="flex items-center gap-2 rounded-md">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">AI Tools</span>
              <span className="sm:hidden">Tools</span>
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2 rounded-md">
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Suggestions</span>
              <span className="sm:hidden">Tips</span>
            </TabsTrigger>
            <TabsTrigger value="delegation" className="flex items-center gap-2 rounded-md">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Task Delegation</span>
              <span className="sm:hidden">Delegate</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="ai-tools" className="mt-0">
          <SmartTasks />
        </TabsContent>
        
        <TabsContent value="suggestions" className="mt-0">
          <AiAssistant />
        </TabsContent>
        
        <TabsContent value="delegation" className="mt-0">
          <div className="container mx-auto p-4">
            <h2 className="text-2xl font-bold mb-4">Delegate Tasks to AI</h2>
            <p className="text-gray-600 mb-6">
              Select a task from your to-do list to delegate to the AI assistant. 
              The assistant will break down the task, provide step-by-step instructions, 
              and even generate initial content where applicable.
            </p>
            
            {/* This component will show task delegation UI from AiAssistant */}
            <AiAssistant delegationMode={true} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
