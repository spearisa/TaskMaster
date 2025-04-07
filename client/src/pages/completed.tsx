import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { TaskList } from '@/components/task-list';
import { MobileTaskList } from '@/components/mobile-task-list';
import { useIsMobile } from '@/hooks/use-mobile';

export default function CompletedPage() {
  const [_, navigate] = useLocation();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const moods = [
    { value: 'great', label: 'Great', emoji: '😊' },
    { value: 'okay', label: 'Okay', emoji: '😐' },
    { value: 'bad', label: 'Bad', emoji: '😞' }
  ];
  
  const handleMoodSelection = (value: string) => {
    setSelectedMood(value);
  };
  
  const handleSubmitMood = () => {
    // In a real app, this would save the mood to a backend
    toast({
      title: "Feedback recorded",
      description: "Thanks for sharing how your day went!",
    });
    
    // Reset selection
    setSelectedMood(null);
    
    // Navigate back to home
    navigate('/');
  };

  return (
    <div>
      <header className="px-5 py-4 flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-2">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">Completed</h1>
      </header>

      {isMobile ? (
        <MobileTaskList filter="completed" title="Completed Tasks" />
      ) : (
        <TaskList filter="completed" title="Completed Tasks" />
      )}

      {/* Mood Tracking Section */}
      <div className="px-5 py-4">
        <div className="mt-6 bg-gray-50 rounded-xl p-5">
          <h3 className="text-lg font-semibold mb-4 text-center">All tasks completed</h3>
          <p className="text-center mb-4">How did your day go?</p>
          <div className="flex flex-col space-y-3 mb-4">
            {moods.map(mood => (
              <Button
                key={mood.value}
                variant="outline"
                className={`h-12 border ${
                  selectedMood === mood.value 
                    ? 'border-primary text-primary' 
                    : 'border-neutral-300'
                } rounded-xl p-3 text-center justify-center`}
                onClick={() => handleMoodSelection(mood.value)}
              >
                <span className="text-xl mr-2">{mood.emoji}</span> {mood.label}
              </Button>
            ))}
          </div>
          <Button
            className="w-full bg-primary text-white py-3 h-12 rounded-xl"
            onClick={handleSubmitMood}
            disabled={!selectedMood}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
