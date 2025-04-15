import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { User, ChevronLeft, Menu } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { BottomNavigation } from './bottom-navigation';
import { SideNavigation } from './navigation';
import { useIsMobile } from '@/hooks/use-mobile';

interface MobileLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  showBackButton?: boolean;
  backButtonPath?: string;
}

export function MobileLayout({ 
  children, 
  pageTitle, 
  showBackButton = false, 
  backButtonPath = '/' 
}: MobileLayoutProps) {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const isMobile = useIsMobile();
  
  // Handle scroll for header shadow effect - always register this effect
  useEffect(() => {
    // Only add scroll listener if we're authenticated and not on auth page
    if (location !== '/auth' && user) {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 10);
      };
      
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [location, user]);
  
  // Skip layout if on auth page or not authenticated
  if (location === '/auth' || !user) {
    return <>{children}</>;
  }

  // Pages with appropriate title mapping
  const pageTitles: Record<string, string> = {
    '/': 'My Tasks',
    '/completed': 'Completed Tasks',
    '/assigned-tasks': 'Assigned Tasks',
    '/new-task': 'Add New Task',
    '/messenger': 'Messages',
    '/calendar': 'Calendar',
    '/ai-assistant': 'AI Assistant',
    '/ai-tools': 'AI Tools',
    '/profile': 'My Profile',
    '/public-tasks': 'Public Task Board',
    '/task-templates': 'Templates',
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

  return (
    <div className="bg-white min-h-screen">
      {/* Header with title and menu button */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          {showBackButton ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(backButtonPath)}
              className="mr-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2 md:hidden">
                  <Menu size={22} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SideNavigation />
              </SheetContent>
            </Sheet>
          )}
          <h1 className="text-lg font-semibold">{currentPageTitle}</h1>
        </div>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate('/profile')}
          className="rounded-full" 
        >
          <User className="h-5 w-5" />
        </Button>
      </header>

      {/* Left sidebar - only visible on desktop */}
      <div className="hidden md:block fixed left-0 top-0 h-full">
        <SideNavigation />
      </div>
      
      {/* Main content area - add pb-24 to ensure content doesn't get hidden behind bottom nav */}
      <main className={`${isMobile ? 'pb-24' : 'md:ml-56'}`}>
        {children}
      </main>
      
      {/* Bottom navigation - only visible on mobile */}
      {isMobile && <BottomNavigation />}
    </div>
  );
}