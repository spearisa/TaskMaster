import React from 'react';
import { useLocation, Link } from 'wouter';
import { 
  Home, 
  Calendar, 
  MessageSquare, 
  Plus,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/new-task', label: 'New', icon: Plus, highlight: true },
    { path: '/ai-assistant', label: 'AI', icon: Sparkles },
    { path: '/messenger', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 py-2 z-50">
      <div className="flex justify-around items-center w-full max-w-lg mx-auto px-4">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="flex flex-col items-center justify-center w-1/5"
          >
            {item.highlight ? (
              <div className="flex flex-col items-center justify-center">
                <div className="bg-blue-600 p-3 rounded-full mb-1">
                  <item.icon size={20} className="text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className={cn(
                  "p-2 mb-1",
                  isActive(item.path) ? "text-primary" : "text-gray-400"
                )}>
                  <item.icon size={20} />
                </div>
                <span className={cn(
                  "text-xs font-medium",
                  isActive(item.path) ? "text-primary" : "text-gray-400"
                )}>
                  {item.label}
                </span>
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

export default BottomNavigation;