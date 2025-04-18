import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
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
      color: 'from-blue-500 to-blue-700',
      path: '/ai-tools?tab=chat'
    },
    {
      id: 'image',
      icon: <Image className="h-5 w-5" />,
      label: 'Image Generator',
      description: 'Create images from text descriptions',
      color: 'from-purple-500 to-pink-600',
      path: '/ai-tools?tab=image'
    },
    {
      id: 'code',
      icon: <Code className="h-5 w-5" />,
      label: 'Code Assistant',
      description: 'Get help with programming',
      color: 'from-emerald-500 to-teal-700',
      path: '/ai-tools?tab=code'
    },
    {
      id: 'assistant',
      icon: <BrainCircuit className="h-5 w-5" />,
      label: 'Smart Assistant',
      description: 'Delegate tasks to AI assistant',
      color: 'from-amber-500 to-orange-600',
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
          "fixed bottom-24 right-4 z-30 transition-all duration-300 md:bottom-8 md:right-8",
          menuOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <Button
          onClick={() => setMenuOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:shadow-[0_0_20px_rgba(99,102,241,0.7)] border-2 border-white/80"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white absolute opacity-75 animate-pulse" />
            <BrainCircuit className="h-6 w-6 text-white animate-[spin_3s_linear_infinite]" />
          </div>
        </Button>
      </div>

      {/* Menu that appears when the button is clicked */}
      <div 
        className={cn(
          "fixed bottom-24 right-4 z-30 transition-all duration-300 md:bottom-8 md:right-8",
          !menuOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <div className="bg-white rounded-xl shadow-lg p-2 pb-3 border border-indigo-100 w-64 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-500 -mt-2 -mx-2 px-4 py-3 mb-2 flex justify-between items-center">
            <div className="flex items-center">
              <BrainCircuit className="h-5 w-5 text-white mr-2" />
              <h3 className="font-medium text-sm text-white">AI Tools</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(false)}
              className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/30"
            >
              <X className="h-4 w-4 text-white" />
            </Button>
          </div>
          
          <div className="space-y-2">
            {aiTools.map((tool) => (
              <Link key={tool.id} href={tool.path}>
                <div
                  onClick={() => setMenuOpen(false)}
                  className="w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className={cn("p-2 rounded-full bg-gradient-to-br", tool.color)}>
                    <div className="text-white">{tool.icon}</div>
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
          className="fixed inset-0 bg-indigo-900/10 backdrop-blur-sm z-20"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}