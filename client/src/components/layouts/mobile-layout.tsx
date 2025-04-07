import { ReactNode, useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { 
  Home, ListTodo, Calendar, LightbulbIcon, Plus, User, 
  MessageSquare, Bell, ChevronLeft, Menu, X 
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
  const [unreadMessages, setUnreadMessages] = useState<number | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  
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
    '/new-task': 'Add New Task',
    '/messenger': 'Messages',
    '/calendar': 'Calendar',
    '/ai-assistant': 'AI Assistant',
    '/profile': 'My Profile',
  };

  // For paths with dynamic segments like /task/:id or /messenger/:userId
  if (location.startsWith('/task/')) {
    pageTitles[location] = 'Task Details';
  }
  if (location.startsWith('/messenger/')) {
    pageTitles[location] = 'Direct Message';
  }
  
  // Determine current page title
  const currentPageTitle = pageTitle || pageTitles[location] || 'Daddie';

  const navItems: NavItem[] = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Tasks', path: '/completed', icon: ListTodo },
    { label: 'Add', path: '/new-task', icon: Plus },
    { label: 'Messages', path: '/messenger', icon: MessageSquare, badge: unreadMessages },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    { label: 'AI', path: '/ai-assistant', icon: LightbulbIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path) && path !== '/') return true;
    return false;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative pb-20">
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
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80%] sm:w-[350px]">
                <SheetHeader className="mb-6">
                  <SheetTitle className="text-left">Navigation Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-2">
                  {/* User Profile Section in Sidebar */}
                  {user && (
                    <>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-2">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatarUrl || undefined} />
                          <AvatarFallback>{user.username?.substring(0, 2).toUpperCase() || '??'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.displayName || user.username}</div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                      <Separator className="my-2" />
                    </>
                  )}
                  
                  {/* Navigation Links */}
                  <div className="space-y-1 pt-2">
                    {navItems.map((item) => (
                      <SheetClose asChild key={item.path}>
                        <Button 
                          variant={isActive(item.path) ? "default" : "ghost"}
                          className={`w-full justify-start ${isActive(item.path) ? 'bg-primary text-primary-foreground' : ''}`}
                          onClick={() => navigate(item.path)}
                        >
                          <item.icon className="mr-2 h-5 w-5" />
                          {item.label}
                          {item.badge && (
                            <Badge variant="destructive" className="ml-auto">
                              {item.badge}
                            </Badge>
                          )}
                        </Button>
                      </SheetClose>
                    ))}
                  </div>
                  
                  <Separator className="my-2" />
                  
                  {/* Bottom Section */}
                  <div className="mt-auto pt-4">
                    <SheetClose asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-gray-500"
                        onClick={() => navigate('/profile')}
                      >
                        <User className="mr-2 h-5 w-5" />
                        Profile Settings
                      </Button>
                    </SheetClose>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <X className="mr-2 h-5 w-5" />
                      Logout
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
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
      <main className="p-4 pb-20">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            // Special styling for Add button
            if (item.label === 'Add') {
              return (
                <div 
                  key={item.path} 
                  onClick={() => navigate(item.path)} 
                  className="cursor-pointer" 
                  aria-label="Add new task"
                >
                  <div className="py-3 px-5 flex flex-col items-center relative">
                    <div 
                      className="absolute -top-5 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95" 
                      role="button"
                    >
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs mt-7 text-transparent">Add</span>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={item.path} 
                onClick={() => navigate(item.path)}
                className={`py-2 px-3 flex flex-col items-center cursor-pointer relative transition-colors duration-200 ${
                  active ? 'text-primary' : 'text-neutral-500 hover:text-neutral-700'
                }`}
                role="button"
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={`h-6 w-6 ${active ? 'stroke-[2.5px]' : ''}`} />
                <span className={`text-xs mt-1 ${active ? 'font-medium' : ''}`}>
                  {item.label}
                </span>
                
                {/* Badge for notifications */}
                {item.badge && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
                
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute -bottom-2 h-1 w-1 rounded-full bg-primary"></span>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}