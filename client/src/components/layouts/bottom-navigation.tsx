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
    <div className="fixed bottom-4 left-0 right-0 w-full z-50 md:hidden px-4">
      <div className="bg-white backdrop-blur-md border border-gray-100 rounded-full shadow-xl flex justify-around items-center max-w-md mx-auto h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="flex flex-col items-center justify-center h-full flex-1"
          >
            <div className={cn(
              "flex flex-col items-center justify-center transition-all duration-200",
              isActive(item.path) ? "scale-110" : "scale-100" 
            )}>
              <div className={cn(
                "rounded-full p-1.5 mb-0.5 transition-colors",
                isActive(item.path) 
                  ? "bg-primary/10 text-primary" 
                  : "text-gray-500 hover:text-gray-700"
              )}>
                <item.icon size={18} strokeWidth={2.5} />
              </div>
              <span className={cn(
                "text-[10px] font-medium tracking-tight",
                isActive(item.path) ? "text-primary" : "text-gray-500"
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