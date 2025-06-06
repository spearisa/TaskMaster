import React, { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { 
  Home, 
  Calendar, 
  MessageSquare, 
  User,
  Globe,
  BookOpen,
  ShieldAlert,
  Store,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';

// Define the type for navigation items
interface NavItem {
  path: string;
  labelKey: string;
  icon: React.ElementType;
}

export function BottomNavigation() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  
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
  const getNavItems = (): NavItem[] => {
    if (user) {
      return [
        // Authenticated user navigation
        { path: '/', labelKey: 'navigation.appGenerator', icon: Sparkles },
        { path: '/tasks', labelKey: 'navigation.tasks', icon: Home },
        { path: '/calendar', labelKey: 'navigation.calendar', icon: Calendar },
        { path: '/marketplace', labelKey: 'navigation.marketplace', icon: Store },
        { path: '/messenger', labelKey: 'messages.messages', icon: MessageSquare },
      ];
    } else {
      return [
        // Non-authenticated user navigation - limited options
        { path: '/', labelKey: 'navigation.appGenerator', icon: Sparkles },
        { path: '/public-tasks', labelKey: 'navigation.publicTasks', icon: Globe },
        { path: '/marketplace', labelKey: 'navigation.marketplace', icon: Store },
        { path: '/auth', labelKey: 'auth.signIn', icon: User },
      ];
    }
  };
  
  const navItems = getNavItems();

  return (
    <div className="py-0 h-12 md:hidden" role="navigation" aria-label={t('navigation.bottomNavigation')}>
      <div className="flex justify-around items-center w-full max-w-lg mx-auto px-1 h-full">
        {navItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className="flex flex-col items-center justify-center w-1/5 h-full"
            aria-label={t(item.labelKey)}
            aria-current={isActive(item.path) ? "page" : undefined}
          >
            <div className="flex flex-col items-center justify-center">
              <div className={cn(
                "p-0 mb-0",
                isActive(item.path) ? "text-primary" : "text-gray-400"
              )} 
                aria-hidden="true"
              >
                <item.icon size={16} />
              </div>
              <span className={cn(
                "text-[9px] font-medium mt-0.5",
                isActive(item.path) ? "text-primary" : "text-gray-400"
              )}>
                {t(item.labelKey)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default BottomNavigation;