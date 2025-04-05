import { useLocation } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AiAssistant } from '@/components/ai-assistant';

export default function AIAssistantPage() {
  const [_, navigate] = useLocation();

  return (
    <div>
      <header className="px-5 py-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-2">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">AI Assistant</h1>
      </header>

      <AiAssistant />
    </div>
  );
}
