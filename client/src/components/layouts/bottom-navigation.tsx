import React, { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { 
  Home, 
  Calendar, 
  MessageSquare, 
  User,
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

// Define the type for navigation items
interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

export function BottomNavigation() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  
  // Log when component mounts and shows current location
  useEffect(() => {
    console.log("[BottomNavigation] Mounted, current location:", location);
  }, [location]);
  
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  // Different navigation items based on authentication status
  const navItems: NavItem[] = user ? [
    // Authenticated user navigation
    { path: '/', label: 'Home', icon: Home },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/public-tasks', label: 'Public', icon: Globe },
    { path: '/messenger', label: 'Chat', icon: MessageSquare },
  ] : [
    // Non-authenticated user navigation - limited options
    { path: '/public-tasks', label: 'Public', icon: Globe },
    { path: '/auth', label: 'Sign In', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-200 py-0 h-12 z-50 shadow-lg md:hidden">
      <div className="flex justify-around items-center w-full max-w-lg mx-auto px-2 h-full">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="flex flex-col items-center justify-center w-1/4 h-full"
          >
            <div className="flex flex-col items-center justify-center">
              <div className={cn(
                "p-0 mb-0",
                isActive(item.path) ? "text-primary" : "text-gray-400"
              )}>
                <item.icon size={16} />
              </div>
              <span className={cn(
                "text-[9px] font-medium",
                isActive(item.path) ? "text-primary" : "text-gray-400"
              )}>
                {item.label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default BottomNavigation;