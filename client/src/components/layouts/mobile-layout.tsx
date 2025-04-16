import { ReactNode, useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { User, ChevronLeft, Menu, X, FileText, LayoutTemplate, MessageSquare, Sparkles, Globe, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from "@/components/ui/button";
import { BottomNavigation } from './bottom-navigation';
import { SideNavigation } from './navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
  const [menuOpen, setMenuOpen] = useState(false);
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
  
  // Skip layout only if on auth page
  if (location === '/auth') {
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

  // Menu items for sidebar navigation - different items based on authentication
  const menuItems = user ? [
    { path: '/', icon: <FileText size={18} />, label: 'My Tasks' },
    { path: '/task-templates', icon: <LayoutTemplate size={18} />, label: 'Templates' },
    { path: '/public-tasks', icon: <Globe size={18} />, label: 'Public Tasks' },
    { path: '/messenger', icon: <MessageSquare size={18} />, label: 'Messages' },
    { path: '/ai-assistant', icon: <Sparkles size={18} />, label: 'AI Assistant' },
    { path: '/ai-tools', icon: <Sparkles size={18} />, label: 'AI Tools' },
  ] : [
    // Only show public tasks and login for unauthenticated users
    { path: '/public-tasks', icon: <Globe size={18} />, label: 'Public Tasks' },
    { path: '/auth', icon: <User size={18} />, label: 'Sign In' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
      {/* Header with title and menu button - minimized height */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-10 flex justify-between items-center">
        <div className="flex items-center">
          {showBackButton ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(backButtonPath)}
              className="mr-2 h-6 w-6 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2 md:hidden h-6 w-6 p-0"
                onClick={() => setMenuOpen(true)}
              >
                <Menu size={16} />
              </Button>
          )}
          <h1 className="text-base font-semibold">{currentPageTitle}</h1>
        </div>
        
        {user ? (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/profile')}
            className="rounded-full h-6 w-6 p-0" 
          >
            <User className="h-4 w-4" />
          </Button>
        ) : (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/auth')}
            className="rounded-full h-6 p-0 text-xs" 
          >
            Login
          </Button>
        )}
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40" onClick={() => setMenuOpen(false)}>
          <div 
            className="fixed top-0 left-0 bottom-0 w-64 bg-white shadow-lg z-10" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="font-semibold">Menu</h2>
              <Button variant="ghost" size="sm" onClick={() => setMenuOpen(false)}>
                <X size={20} />
              </Button>
            </div>
            <div className="p-2">
              {menuItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  onClick={() => setMenuOpen(false)}
                >
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 transition-colors cursor-pointer border-l-4 my-1 rounded-r-md",
                      isActive(item.path) 
                        ? "border-l-primary text-primary bg-primary/5" 
                        : "border-l-transparent text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                </Link>
              ))}
              
              {/* Only show profile link for authenticated users */}
              {user && (
                <Link 
                  href="/profile"
                  onClick={() => setMenuOpen(false)}
                >
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 transition-colors cursor-pointer border-l-4 my-1 rounded-r-md",
                      isActive('/profile') 
                        ? "border-l-primary text-primary bg-primary/5" 
                        : "border-l-transparent text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <User size={18} />
                    </div>
                    <span className="font-medium">Profile</span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Left sidebar - only visible on desktop */}
      <div className="hidden md:block fixed left-0 top-0 h-full">
        <SideNavigation />
      </div>
      
      {/* Main content area - flex-grow to fill all available space */}
      <main className="flex-grow md:ml-56 px-3 pt-0">
        <div className="flex flex-col min-h-[calc(100vh-72px)]">
          {children}
        </div>
      </main>
      
      {/* Always show bottom navigation - hide only on very large screens */}
      <div className="h-12 md:hidden">
        {/* Spacer for bottom navigation */}
      </div>
      <BottomNavigation />
    </div>
  );
}