import React from 'react';
import { useLocation, Link } from 'wouter';
import { Home, Calendar, CheckSquare, Users, Layers, Briefcase, MessageSquare, Settings, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const [location] = useLocation();
  
  // Determine active state based on current location
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/new-task', label: 'Add', icon: PlusCircle },
    { path: '/ai-assistant', label: 'AI', icon: Briefcase },
    { path: '/messenger', label: 'Messages', icon: MessageSquare },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border h-16 px-2">
      <div className="flex justify-between items-center h-full max-w-screen-lg mx-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-xs",
              isActive(item.path)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              {item.path === '/new-task' ? (
                <div className="bg-primary text-primary-foreground p-2 rounded-full">
                  <item.icon size={20} />
                </div>
              ) : (
                <item.icon 
                  size={20} 
                  className={cn(
                    isActive(item.path) ? "text-primary" : "text-muted-foreground"
                  )} 
                />
              )}
            </div>
            <span className="mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default BottomNav;