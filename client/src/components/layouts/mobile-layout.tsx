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
    <div className="bg-gradient-to-b from-white to-gray-50 min-h-screen flex flex-col">
      {/* Header with title and menu button - improved height and styling */}
      <header className={`sticky top-0 z-40 bg-white/80 backdrop-blur-sm transition-shadow ${isScrolled ? 'shadow-md' : 'shadow-sm'} px-4 h-14 flex justify-between items-center`}>
        <div className="flex items-center">
          {showBackButton ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(backButtonPath)}
              className="mr-2 h-9 w-9 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          ) : (
            <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2 md:hidden h-9 w-9 rounded-full hover:bg-gray-100"
                onClick={() => setMenuOpen(true)}
              >
                <Menu size={18} />
              </Button>
          )}
          <h1 className="text-lg font-semibold text-gray-800">{currentPageTitle}</h1>
        </div>
        
        {user ? (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/profile')}
            className="rounded-full h-9 w-9 bg-primary/10 hover:bg-primary/20 text-primary" 
          >
            <User className="h-5 w-5" />
          </Button>
        ) : (
          <Button 
            variant="outline"
            size="sm"
            onClick={() => navigate('/auth')}
            className="rounded-full px-4 border-primary/20 hover:bg-primary/10 text-primary" 
          >
            Login
          </Button>
        )}
      </header>

      {/* Mobile menu overlay with animation */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setMenuOpen(false)}
        >
          <div 
            className="fixed top-0 left-0 bottom-0 w-72 bg-white/95 backdrop-blur-sm shadow-xl z-10 animate-in slide-in-from-left duration-300" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">TaskFlow</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setMenuOpen(false)}
                  className="h-9 w-9 rounded-full hover:bg-gray-100"
                >
                  <X size={18} />
                </Button>
              </div>
              
              {user && (
                <div className="bg-primary/5 rounded-xl p-4 mb-6 flex items-center gap-3">
                  <div className="bg-primary text-white rounded-full h-10 w-10 flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.displayName || user.username}</p>
                    <p className="text-sm text-gray-500">@{user.username}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <Link 
                    key={item.path} 
                    href={item.path}
                    onClick={() => setMenuOpen(false)}
                  >
                    <div 
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 transition-all rounded-lg",
                        isActive(item.path) 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-md",
                        isActive(item.path) ? "bg-primary/20" : "bg-gray-100"
                      )}>
                        {item.icon}
                      </div>
                      <span>{item.label}</span>
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
                        "flex items-center gap-3 px-3 py-2.5 transition-all rounded-lg",
                        isActive('/profile') 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-md",
                        isActive('/profile') ? "bg-primary/20" : "bg-gray-100"
                      )}>
                        <User size={18} />
                      </div>
                      <span>Profile</span>
                    </div>
                  </Link>
                )}
              </div>
              
              {/* App version */}
              <div className="mt-auto pt-6 text-center text-xs text-gray-400">
                TaskFlow v1.0
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left sidebar - only visible on desktop */}
      <div className="hidden md:block fixed left-0 top-0 h-full">
        <SideNavigation />
      </div>
      
      {/* Main content area - improved spacing and visual design */}
      <main className="flex-grow md:ml-56 px-4 pt-5 pb-20 md:pb-8">
        <div className="flex flex-col h-full max-w-screen-md mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-100/80 p-6">
            {children}
          </div>
        </div>
      </main>
      
      {/* Always show bottom navigation - hide only on very large screens */}
      <div className="h-16 md:hidden">
        {/* Spacer for bottom navigation */}
      </div>
      <BottomNavigation />
    </div>
  );
}