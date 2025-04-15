import React, { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { 
  Home, 
  Calendar, 
  MessageSquare, 
  Plus,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const [location, navigate] = useLocation();
  
  // Log when component mounts and shows current location
  useEffect(() => {
    console.log("[BottomNavigation] Mounted, current location:", location);
  }, [location]);
  
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/new-task', label: 'New', icon: Plus, highlight: true },
    { path: '/public-tasks', label: 'Public', icon: Globe },
    { path: '/messenger', label: 'Chat', icon: MessageSquare },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 py-2 z-50 shadow-lg md:hidden">
      <div className="flex justify-around items-center w-full max-w-lg mx-auto px-4">
        {navItems.map((item) => (
          item.highlight ? (
            // Make the "New" button a direct clickable element
            <button
              key={item.path}
              onClick={() => navigate('/new-task')}
              className="flex flex-col items-center justify-center w-1/5"
            >
              <div className="flex flex-col items-center justify-center">
                <div className="bg-primary p-3 rounded-full mb-1 shadow-lg">
                  <item.icon size={24} className="text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
              </div>
            </button>
          ) : (
            // Regular navigation items
            <Link
              key={item.path}
              href={item.path}
              className="flex flex-col items-center justify-center w-1/5"
            >
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
            </Link>
          )
        ))}
      </div>
    </div>
  );
}

export default BottomNavigation;