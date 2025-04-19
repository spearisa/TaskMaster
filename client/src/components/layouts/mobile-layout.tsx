import { ReactNode, useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { User, ChevronLeft, Menu, X, FileText, LayoutTemplate, MessageSquare, Sparkles, Globe, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from "@/components/ui/button";
import { LanguageRegionSelector } from '@/components/language-region-selector';
import { BottomNavigation } from './bottom-navigation';
import { SideNavigation } from './navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';

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
  const { t } = useTranslation();
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

  // Pages with appropriate title mapping using translations
  const pageTitles: Record<string, string> = {
    '/': t('navigation.tasks'),
    '/completed': t('tasks.completedTasks'),
    '/assigned-tasks': t('navigation.assignedTasks'),
    '/new-task': t('tasks.newTask'),
    '/messenger': t('navigation.messenger'),
    '/calendar': t('navigation.calendar'),
    '/ai-assistant': t('navigation.aiTools'),
    '/ai-tools': t('navigation.aiTools'),
    '/profile': t('navigation.profile'),
    '/public-tasks': t('navigation.publicTasks'),
    '/task-templates': t('tasks.templates'),
    '/api-docs': t('navigation.apiDocs'),
  };

  // For paths with dynamic segments like /task/:id or /messenger/:userId
  if (location.startsWith('/task/')) {
    pageTitles[location] = t('tasks.taskDetails');
  }
  if (location.startsWith('/messenger/')) {
    pageTitles[location] = t('messages.directMessage');
  }

  // Determine current page title
  const currentPageTitle = pageTitle || pageTitles[location] || t('common.appName');

  // Menu items for sidebar navigation - different items based on authentication
  const menuItems = user ? [
    { path: '/', icon: <FileText size={18} />, label: t('navigation.tasks') },
    { path: '/task-templates', icon: <LayoutTemplate size={18} />, label: t('tasks.templates') },
    { path: '/public-tasks', icon: <Globe size={18} />, label: t('navigation.publicTasks') },
    { path: '/messenger', icon: <MessageSquare size={18} />, label: t('navigation.messenger') },
    { path: '/ai-assistant', icon: <Sparkles size={18} />, label: t('navigation.aiTools') },
    { path: '/ai-tools', icon: <Sparkles size={18} />, label: t('navigation.aiTools') },
  ] : [
    // Only show public tasks and login for unauthenticated users
    { path: '/public-tasks', icon: <Globe size={18} />, label: t('navigation.publicTasks') },
    { path: '/auth', icon: <User size={18} />, label: t('auth.login') },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="bg-white min-h-screen flex flex-col" role="document">
      {/* Header with title and menu button - minimized height */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-12 flex justify-between items-center shadow-sm" role="banner">
        <div className="flex items-center">
          {showBackButton ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(backButtonPath)}
              className="mr-2 h-6 w-6 p-0"
              aria-label={t('navigation.back')}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">{t('navigation.back')}</span>
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2 md:hidden h-6 w-6 p-0"
              onClick={() => setMenuOpen(true)}
              aria-label={t('navigation.openMenu')}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
            >
              <Menu size={16} />
              <span className="sr-only">{t('navigation.openMenu')}</span>
            </Button>
          )}
          {location === '/' ? (
            <Link href="/">
              <div className="flex items-center gap-2 cursor-pointer" aria-label="Appmo Home">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 100 100" 
                  className="h-6 w-6 fill-[#5271ff]"
                  aria-hidden="true"
                  role="img"
                >
                  <title>Appmo Logo</title>
                  <path d="M70,12h-6c0-3.31-2.69-6-6-6H42c-3.31,0-6,2.69-6,6h-6c-7.73,0-14,6.27-14,14v54c0,7.73,6.27,14,14,14h40c7.73,0,14-6.27,14-14V26C84,18.27,77.73,12,70,12z M42,12h16v4H42V12z M70,86H30c-3.31,0-6-2.69-6-6V26c0-3.31,2.69-6,6-6h6v4c0,2.21,1.79,4,4,4h20c2.21,0,4-1.79,4-4v-4h6c3.31,0,6,2.69,6,6v54C76,83.31,73.31,86,70,86z"/>
                  <circle cx="39" cy="41" r="4"/>
                  <circle cx="39" cy="61" r="4"/>
                  <rect x="49" y="39" width="20" height="4" rx="2"/>
                  <rect x="49" y="59" width="20" height="4" rx="2"/>
                </svg>
                <span className="font-bold text-sm">Appmo</span>
              </div>
            </Link>
          ) : (
            <h1 className="text-base font-semibold">{currentPageTitle}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          <LanguageRegionSelector />

          {user ? (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/profile')}
              className="rounded-full h-6 w-6 p-0" 
              aria-label={t('navigation.profile')}
            >
              <User className="h-4 w-4" />
              <span className="sr-only">{t('navigation.profile')}</span>
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/auth')}
              className="rounded-full h-6 p-0 text-xs" 
            >
              {t('auth.login')}
            </Button>
          )}
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-40" 
          onClick={() => setMenuOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('navigation.menu')}
        >
          <nav 
            id="mobile-menu"
            className="fixed top-0 left-0 bottom-0 w-64 bg-white shadow-lg z-10" 
            onClick={(e) => e.stopPropagation()}
            role="navigation"
            aria-label={t('navigation.mainNavigation')}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <div className="flex items-center gap-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 100 100" 
                  className="h-6 w-6 fill-[#5271ff]"
                  aria-hidden="true"
                  role="img"
                >
                  <title>Appmo Logo</title>
                  <path d="M70,12h-6c0-3.31-2.69-6-6-6H42c-3.31,0-6,2.69-6,6h-6c-7.73,0-14,6.27-14,14v54c0,7.73,6.27,14,14,14h40c7.73,0,14-6.27,14-14V26C84,18.27,77.73,12,70,12z M42,12h16v4H42V12z M70,86H30c-3.31,0-6-2.69-6-6V26c0-3.31,2.69-6,6-6h6v4c0,2.21,1.79,4,4,4h20c2.21,0,4-1.79,4-4v-4h6c3.31,0,6,2.69,6,6v54C76,83.31,73.31,86,70,86z"/>
                  <circle cx="39" cy="41" r="4"/>
                  <circle cx="39" cy="61" r="4"/>
                  <rect x="49" y="39" width="20" height="4" rx="2"/>
                  <rect x="49" y="59" width="20" height="4" rx="2"/>
                </svg>
                <span className="font-bold text-sm">Appmo</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setMenuOpen(false)}
                aria-label={t('navigation.closeMenu')}
              >
                <X size={20} />
                <span className="sr-only">{t('navigation.closeMenu')}</span>
              </Button>
            </div>
            <ul className="p-2 list-none m-0">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive(item.path) ? "page" : undefined}
                  >
                    <div 
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 transition-colors cursor-pointer border-l-4 my-1 rounded-r-md",
                        isActive(item.path) 
                          ? "border-l-primary text-primary bg-primary/5" 
                          : "border-l-transparent text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center justify-center w-6 h-6" aria-hidden="true">
                        {item.icon}
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                </li>
              ))}

              {/* Only show profile link for authenticated users */}
              {user && (
                <li>
                  <Link 
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive('/profile') ? "page" : undefined}
                  >
                    <div 
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 transition-colors cursor-pointer border-l-4 my-1 rounded-r-md",
                        isActive('/profile') 
                          ? "border-l-primary text-primary bg-primary/5" 
                          : "border-l-transparent text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center justify-center w-6 h-6" aria-hidden="true">
                        <User size={18} />
                      </div>
                      <span className="font-medium">{t('navigation.profile')}</span>
                    </div>
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}

      {/* Left sidebar - only visible on desktop */}
      <nav 
        className="hidden md:block fixed left-0 top-0 h-full z-30"
        role="navigation"
        aria-label={t('navigation.sideNavigation')}
      >
        <SideNavigation />
      </nav>

      {/* Main content area - flex-grow to fill all available space */}
      <main 
        className="flex-grow md:ml-56 px-3 pt-2 pb-16 md:px-4 md:pt-4 md:pb-4 overflow-y-auto"
        role="main"
        id="main-content"
      >
        <div className="flex flex-col h-full max-w-screen-lg mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom navigation - fixed positioning and z-index for overlap prevention */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-sm"
        role="navigation"
        aria-label={t('navigation.bottomNavigation')}
      >
        <BottomNavigation />
      </nav>
    </div>
  );
}