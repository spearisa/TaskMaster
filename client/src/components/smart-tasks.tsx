import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MessageSquare, Image, Code, Music, Zap, Search, 
  CheckCircle, Clock, AlertCircle, Loader2, BellRing
} from "lucide-react";
import { AiService } from "@/lib/ai-service";

// Smart task type definition
interface SmartTask {
  id: number;
  title: string;
  dueDate?: string; // Optional for tasks like "Create a flyer" that don't have a due date
  icon: 'chat' | 'image' | 'reminder' | 'completed'; // Icons for different types of AI tools
  aiTool: 'ChatGPT' | 'Claude' | 'DALL-E' | 'Reminder' | 'Completed';
  status: 'pending' | 'completed';
  color: string;
}

export function SmartTasks() {
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatModel, setChatModel] = useState<'openai' | 'anthropic'>('openai');
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [currentReminderTask, setCurrentReminderTask] = useState<SmartTask | null>(null);
  const { toast } = useToast();
  
  // Example smart tasks
  const smartTasks: SmartTask[] = [
    {
      id: 1,
      title: 'Finish report using ChatGPT',
      dueDate: 'Tomorrow 3:00 PM',
      icon: 'chat',
      aiTool: 'ChatGPT',
      status: 'pending',
      color: '#6366F1',
    },
    {
      id: 2,
      title: 'Create a flyer',
      icon: 'image',
      aiTool: 'DALL-E',
      status: 'pending',
      color: '#10B981',
    },
    {
      id: 3,
      title: 'Remind me to review notes',
      dueDate: 'Tomorrow 1:00 PM',
      icon: 'reminder',
      aiTool: 'Reminder',
      status: 'pending',
      color: '#3B82F6',
    },
    {
      id: 4,
      title: 'Fix email reply',
      icon: 'completed',
      aiTool: 'Completed',
      status: 'completed',
      color: '#10B981',
    },
  ];

  const handleTaskAction = async (task: SmartTask) => {
    try {
      setIsGenerating(true);
      setAiResponse(null);
      setImageUrl(null);
      
      if (task.aiTool === 'ChatGPT') {
        // Use the chat generation API with GPT-4
        const response = await AiService.generateChat({
          prompt: `Help me with: ${task.title}`,
          model: 'openai'
        });
        setAiResponse(response.content);
        setActiveTab('chat');
      } else if (task.aiTool === 'Claude') {
        // Use the chat generation API with Claude
        const response = await AiService.generateChat({
          prompt: `Help me with: ${task.title}`,
          model: 'anthropic'
        });
        setAiResponse(response.content);
        setActiveTab('chat');
      } else if (task.aiTool === 'DALL-E') {
        // Use the image generation API
        const response = await AiService.generateImage({
          prompt: `Create a professional image for: ${task.title}`
        });
        setImageUrl(response.url);
        setActiveTab('image');
      } else if (task.aiTool === 'Reminder') {
        // Open reminder dialog
        setCurrentReminderTask(task);
        setReminderDialogOpen(true);
        setIsGenerating(false);
        return; // Early return to prevent setIsGenerating(false) in finally block
      }
    } catch (error) {
      console.error("Error launching AI tool:", error);
      toast({
        title: "Error",
        description: "Failed to launch AI tool. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    try {
      setIsGenerating(true);
      setAiResponse(null);
      setImageUrl(null);
      
      // Send the prompt to the appropriate AI tool based on the active tab
      if (activeTab === 'chat') {
        const response = await AiService.generateChat({
          prompt,
          model: chatModel
        });
        setAiResponse(response.content);
      } else if (activeTab === 'image') {
        const response = await AiService.generateImage({ prompt });
        setImageUrl(response.url);
      } else if (activeTab === 'code') {
        const response = await AiService.generateCode({
          prompt,
          language: codeLanguage
        });
        setAiResponse(response.code);
      }
      
      setPrompt('');
    } catch (error) {
      console.error(`Error with ${activeTab} generation:`, error);
      toast({
        title: "Generation Failed",
        description: `Failed to generate ${activeTab}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const renderTaskIcon = (task: SmartTask) => {
    switch (task.icon) {
      case 'chat':
        return <MessageSquare className="h-6 w-6 text-white" />;
      case 'image':
        return <Image className="h-6 w-6 text-white" />;
      case 'reminder':
        return <Clock className="h-6 w-6 text-white" />;
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-white" />;
      default:
        return null;
    }
  };

  const renderActionButton = (task: SmartTask) => {
    if (task.status === 'completed') {
      return null;
    }
    
    let buttonText = '';
    switch (task.aiTool) {
      case 'ChatGPT':
        buttonText = 'Ask GPT-4o';
        break;
      case 'Claude':
        buttonText = 'Ask Claude';
        break;
      case 'DALL-E':
        buttonText = 'Generate Image';
        break;
      case 'Reminder':
        buttonText = 'Set Reminder';
        break;
    }
    
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="ml-auto text-blue-600 rounded-full border border-blue-200 hover:bg-blue-50"
        onClick={() => handleTaskAction(task)}
        disabled={isGenerating}
      >
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : buttonText}
      </Button>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI Tools</h1>
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>
      </div>

      <Tabs defaultValue="chat" className="mb-8">
        <TabsList className="mb-4 bg-gray-100 p-1 rounded-md">
          <TabsTrigger value="chat" onClick={() => setActiveTab('chat')} className="rounded-md">
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="image" onClick={() => setActiveTab('image')} className="rounded-md">
            <Image className="h-4 w-4 mr-2" />
            Image
          </TabsTrigger>
          <TabsTrigger value="code" onClick={() => setActiveTab('code')} className="rounded-md">
            <Code className="h-4 w-4 mr-2" />
            Code
          </TabsTrigger>
          <TabsTrigger value="music" onClick={() => setActiveTab('music')} className="rounded-md">
            <Music className="h-4 w-4 mr-2" />
            Music
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <div className="flex space-x-2 mb-2">
            <Select value={chatModel} onValueChange={(value: 'openai' | 'anthropic') => setChatModel(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">GPT-4o (OpenAI)</SelectItem>
                <SelectItem value="anthropic">Claude (Anthropic)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              placeholder="Enter your prompt..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 shadow-sm"
              disabled={isGenerating}
            />
            <Button 
              type="submit" 
              disabled={isGenerating}
              className="rounded-full bg-blue-500 hover:bg-blue-600"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit
            </Button>
          </form>
          
          {aiResponse && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Response</CardTitle>
                <CardDescription>
                  From {chatModel === 'openai' ? 'GPT-4o' : 'Claude'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap">{aiResponse}</div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="image" className="space-y-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              placeholder="Describe the image you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 shadow-sm"
              disabled={isGenerating}
            />
            <Button 
              type="submit" 
              disabled={isGenerating}
              className="rounded-full bg-blue-500 hover:bg-blue-600"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Generate
            </Button>
          </form>
          
          {imageUrl && (
            <Card className="mt-4 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Generated Image</CardTitle>
                <CardDescription>
                  Using DALL-E 3
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <img 
                  src={imageUrl} 
                  alt="AI generated image" 
                  className="w-full h-auto"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="code" className="space-y-4">
          <div className="flex space-x-2 mb-2">
            <Select value={codeLanguage} onValueChange={(value) => setCodeLanguage(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="java">Java</SelectItem>
                <SelectItem value="csharp">C#</SelectItem>
                <SelectItem value="html">HTML</SelectItem>
                <SelectItem value="css">CSS</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              placeholder="Describe the code you want to generate..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 shadow-sm"
              disabled={isGenerating}
            />
            <Button 
              type="submit" 
              disabled={isGenerating}
              className="rounded-full bg-blue-500 hover:bg-blue-600"
            >
              {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Generate
            </Button>
          </form>
          
          {aiResponse && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">Generated Code</CardTitle>
                <CardDescription>
                  {codeLanguage.charAt(0).toUpperCase() + codeLanguage.slice(1)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
                  <code>{aiResponse}</code>
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="music" className="space-y-4">
          <form className="flex space-x-2">
            <Input
              placeholder="Music generation coming soon..."
              disabled
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 shadow-sm"
            />
            <Button 
              disabled
              className="rounded-full bg-blue-500 hover:bg-blue-600 opacity-50"
            >
              Coming Soon
            </Button>
          </form>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-lg">Music Generation</CardTitle>
              <CardDescription>
                This feature is coming soon!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Music generation capabilities will be added in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Smart Tasks</h2>
        <p className="text-gray-500 mb-4">AI-powered to-do list</p>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {smartTasks.map((task) => (
              <Card key={task.id} className="flex items-center p-4 border border-gray-200 rounded-lg shadow-sm">
                <div 
                  className="w-10 h-10 rounded-md flex items-center justify-center mr-4 flex-shrink-0"
                  style={{ backgroundColor: task.color }}
                >
                  {renderTaskIcon(task)}
                </div>
                
                <div className="flex-1">
                  <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : ''}`}>
                    {task.title}
                  </h3>
                  {task.dueDate && (
                    <p className="text-sm text-gray-500">{task.dueDate}</p>
                  )}
                  {task.status === 'completed' && (
                    <p className="text-sm text-green-500">Completed</p>
                  )}
                  {task.aiTool === 'DALL-E' && !task.dueDate && (
                    <p className="text-sm text-gray-500">AI-Powered</p>
                  )}
                </div>
                
                {renderActionButton(task)}
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Set Reminder
            </DialogTitle>
            <DialogDescription>
              {currentReminderTask?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="text-right text-sm font-medium col-span-1">When:</p>
              <div className="col-span-3">
                <p className="text-sm font-medium">{currentReminderTask?.dueDate}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <p className="text-right text-sm font-medium col-span-1">Notify:</p>
              <div className="col-span-3">
                <Select defaultValue="15min">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select notification time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5min">5 minutes before</SelectItem>
                    <SelectItem value="15min">15 minutes before</SelectItem>
                    <SelectItem value="30min">30 minutes before</SelectItem>
                    <SelectItem value="1hour">1 hour before</SelectItem>
                    <SelectItem value="1day">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setReminderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                toast({
                  title: "Reminder Set",
                  description: `You will be reminded to ${currentReminderTask?.title.toLowerCase()} at ${currentReminderTask?.dueDate}`,
                  variant: "default",
                });
                setReminderDialogOpen(false);
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Set Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SmartTasks;