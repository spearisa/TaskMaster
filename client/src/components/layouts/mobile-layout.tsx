import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  User, ChevronLeft, Menu, X 
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { MobileNavigation, SideNavigation } from './navigation';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  showBackButton?: boolean;
  backButtonPath?: string;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  badge?: number | null;
}

export function MobileLayout({ 
  children, 
  pageTitle, 
  showBackButton = false, 
  backButtonPath = '/' 
}: MobileLayoutProps) {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const isMobile = useIsMobile();
  
  // Handle scroll for header shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Pages with appropriate title mapping
  const pageTitles: Record<string, string> = {
    '/': 'My Tasks',
    '/completed': 'Completed Tasks',
    '/assigned-tasks': 'Assigned Tasks',
    '/new-task': 'Add New Task',
    '/messenger': 'Messages',
    '/calendar': 'Calendar',
    '/ai-assistant': 'AI Assistant',
    '/profile': 'My Profile',
    '/public-tasks': 'Public Task Board',
  };

  // For paths with dynamic segments like /task/:id or /messenger/:userId
  if (location.startsWith('/task/')) {
    pageTitles[location] = 'Task Details';
  }
  if (location.startsWith('/messenger/')) {
    pageTitles[location] = 'Direct Message';
  }
  
  // Determine current page title
  const currentPageTitle = pageTitle || pageTitles[location] || 'TaskFlow';

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const contentPadding = isMobile ? '' : 'md:ml-48';

  return (
    <div className={`mx-auto bg-white min-h-screen relative ${contentPadding}`}>
      {/* Header Bar with Profile */}
      <div className={`sticky top-0 z-40 h-16 flex justify-between px-4 items-center bg-white ${isScrolled ? 'shadow-md' : 'shadow-sm'} transition-shadow duration-200`}>
        <div className="flex items-center space-x-3">
          {showBackButton ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(backButtonPath)}
              className="mr-1"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <SideNavigation />
          )}
          <h1 className="text-lg font-semibold">{currentPageTitle}</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/profile')}
            className="rounded-full" 
          >
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className={`p-4 ${isMobile ? 'pb-28' : 'pb-8'} page-content`}>
        {children}
      </main>

      {/* Bottom Navigation for Mobile */}
      {isMobile && <MobileNavigation />}
    </div>
  );
}