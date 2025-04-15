import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  Sparkles, 
  MessageSquare, 
  Image,
  Code,
  X,
  BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AIToolOption {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  path: string;
}

export function FloatingAIButton() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [_, setLocation] = useLocation();

  const aiTools: AIToolOption[] = [
    {
      id: 'chat',
      icon: <MessageSquare className="h-5 w-5" />,
      label: 'AI Chat',
      description: 'Ask questions and get assistance from AI',
      color: 'bg-blue-500',
      path: '/ai-tools?tab=chat'
    },
    {
      id: 'image',
      icon: <Image className="h-5 w-5" />,
      label: 'Image Generator',
      description: 'Create images from text descriptions',
      color: 'bg-purple-500',
      path: '/ai-tools?tab=image'
    },
    {
      id: 'code',
      icon: <Code className="h-5 w-5" />,
      label: 'Code Assistant',
      description: 'Get help with programming',
      color: 'bg-green-500',
      path: '/ai-tools?tab=code'
    },
    {
      id: 'assistant',
      icon: <BrainCircuit className="h-5 w-5" />,
      label: 'Smart Assistant',
      description: 'Delegate tasks to AI assistant',
      color: 'bg-amber-500',
      path: '/ai-assistant'
    }
  ];

  const handleToolSelect = (path: string) => {
    setMenuOpen(false);
    setOpen(false);
    setLocation(path);
  };

  return (
    <>
      {/* Main floating button */}
      <div 
        className={cn(
          "fixed bottom-24 right-4 z-50 transition-all duration-300",
          menuOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <Button
          onClick={() => setMenuOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 hover:shadow-xl"
        >
          <Sparkles className="h-6 w-6 text-white" />
        </Button>
      </div>

      {/* Menu that appears when the button is clicked */}
      <div 
        className={cn(
          "fixed bottom-24 right-4 z-50 transition-all duration-300",
          !menuOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <div className="bg-white rounded-xl shadow-lg p-2 pb-3 border border-gray-200 w-64">
          <div className="flex justify-between items-center mb-2 px-2">
            <h3 className="font-medium text-sm text-gray-700">AI Tools</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(false)}
              className="h-7 w-7 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {aiTools.map((tool) => (
              <Link key={tool.id} href={tool.path}>
                <div
                  onClick={() => setMenuOpen(false)}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className={cn("p-2 rounded-full", tool.color)}>
                    {tool.icon}
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{tool.label}</div>
                    <div className="text-xs text-gray-500">{tool.description}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Backdrop overlay when menu is open */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black/10 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}