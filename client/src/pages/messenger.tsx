
import { Messenger } from '@/components/messenger';
import { useLocation } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MessengerPage() {
  const [_, navigate] = useLocation();

  return (
    <div className="p-4">
      <header className="flex items-center mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-2">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">Messages</h1>
      </header>
      <Messenger />
    </div>
  );
}
