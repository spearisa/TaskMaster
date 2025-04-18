import React from 'react';
import { useLocation, Link } from 'wouter';
import { 
  LayoutTemplate, 
  MessageSquare, 
  Plus, 
  Settings,
  Menu,
  FileText,
  User,
  Sparkles,
  Bell,
  BellOff,
  Globe,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Switch } from '@/components/ui/switch';
import { AppmoLogo } from '@/components/ui/logo';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
  onClick?: () => void;
}

function NavItem({ icon, label, href, active, onClick }: NavItemProps) {
  return (
    <Link href={href}>
      <div 
        className={cn(
          "flex items-center gap-2 px-4 py-3 transition-colors cursor-pointer border-l-4",
          active 
            ? "border-l-primary text-primary" 
            : "border-l-transparent text-gray-700 hover:border-l-gray-200"
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-center w-6 h-6">
          {icon}
        </div>
        <span className="font-medium">{label}</span>
      </div>
    </Link>
  );
}

export function SideNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Show navigation even for unauthenticated users, though with limited options
  
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };
  
  // Define navigation items with headers
  const navigationSections = [
    {
      title: "Tasks",
      icon: <FileText size={18} className="text-gray-500" />,
      items: [
        { label: "My Tasks", href: "/", icon: <FileText size={18} /> }
      ]
    },
    {
      title: "Templates",
      icon: <LayoutTemplate size={18} className="text-gray-500" />,
      items: [
        { label: "Templates", href: "/task-templates", icon: <LayoutTemplate size={18} /> }
      ]
    }
  ];

  // For mobile devices, show the hamburger menu
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu size={24} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col py-4">
            {/* Show different navigation options based on authentication */}
            {user ? (
              // Authenticated user navigation
              <>
                {/* Tasks Section */}
                <div className="flex gap-2 mb-1 px-4 pt-2">
                  <FileText size={18} className="text-gray-500" />
                  <span className="font-semibold text-gray-600">Tasks</span>
                </div>
                {/* My Tasks - Featured as main navigation item */}
                <Link href="/">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                      isActive('/') 
                        ? "border-l-primary text-primary font-bold" 
                        : "border-l-transparent text-gray-700 hover:border-l-gray-200"
                    )}
                  >
                    <span className="font-medium">My Tasks</span>
                  </div>
                </Link>
                <Link href="/new-task">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                      isActive('/new-task') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
                    )}
                  >
                    <span className="text-sm">New Task</span>
                  </div>
                </Link>
                
                <Link href="/calendar">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                      isActive('/calendar') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
                    )}
                  >
                    <span className="text-sm">Calendar</span>
                  </div>
                </Link>
                
                {/* Templates Section */}
                <div className="flex gap-2 mt-4 mb-1 px-4 pt-2">
                  <LayoutTemplate size={18} className="text-gray-500" />
                  <span className="font-semibold text-gray-600">Templates</span>
                </div>
                <Link href="/task-templates">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                      isActive('/task-templates') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
                    )}
                  >
                    <span className="text-sm">Templates</span>
                  </div>
                </Link>
                
                {/* Other links */}
                <div className="flex gap-2 mt-4 mb-1 px-4 pt-2">
                  <Globe size={18} className="text-gray-500" />
                  <span className="font-semibold text-gray-600">Discover</span>
                </div>
                <Link href="/public-tasks">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                      isActive('/public-tasks') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
                    )}
                  >
                    <span className="text-sm">Public Tasks</span>
                  </div>
                </Link>
                
                <Link href="/my-bids">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                      isActive('/my-bids') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
                    )}
                  >
                    <span className="text-sm">My Bids</span>
                  </div>
                </Link>
                
                <Link href="/messenger">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                      isActive('/messenger') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
                    )}
                  >
                    <span className="text-sm">Messages</span>
                  </div>
                </Link>
                
                {/* AI Section */}
                <div className="flex gap-2 mt-4 mb-1 px-4 pt-2">
                  <Sparkles size={18} className="text-gray-500" />
                  <span className="font-semibold text-gray-600">AI Tools</span>
                </div>
                <Link href="/ai-assistant">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                      isActive('/ai-assistant') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
                    )}
                  >
                    <span className="text-sm">AI Assistant</span>
                  </div>
                </Link>
                
                <Link href="/ai-tools">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                      isActive('/ai-tools') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
                    )}
                  >
                    <span className="text-sm">AI Tools</span>
                  </div>
                </Link>
                
                {/* Profile */}
                <div className="flex gap-2 mt-4 mb-1 px-4 pt-2">
                  <User size={18} className="text-gray-500" />
                  <span className="font-semibold text-gray-600">Account</span>
                </div>
                <Link href="/profile">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                      isActive('/profile') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
                    )}
                  >
                    <span className="text-sm">Profile</span>
                  </div>
                </Link>
              </>
            ) : (
              // Non-authenticated user navigation - show limited options
              <>
                {/* Discover Section */}
                <div className="flex gap-2 mb-1 px-4 pt-2">
                  <Globe size={18} className="text-gray-500" />
                  <span className="font-semibold text-gray-600">Discover</span>
                </div>
                <Link href="/public-tasks">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                      isActive('/public-tasks') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
                    )}
                  >
                    <span className="text-sm">Public Tasks</span>
                  </div>
                </Link>
                
                {/* Account Section */}
                <div className="flex gap-2 mt-4 mb-1 px-4 pt-2">
                  <User size={18} className="text-gray-500" />
                  <span className="font-semibold text-gray-600">Account</span>
                </div>
                <Link href="/auth">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                      isActive('/auth') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
                    )}
                  >
                    <span className="text-sm">Sign In</span>
                  </div>
                </Link>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  // For desktop, show a sidebar with content based on authentication status
  return (
    <div className="hidden md:flex flex-col w-56 border-r border-gray-200 min-h-screen fixed pt-4 z-30">
      {/* Logo at the top of sidebar */}
      <div className="px-4 mb-6">
        <Link href="/">
          <div className="flex items-center gap-2">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 100 100" 
              className="h-8 w-8 fill-[#5271ff]"
            >
              <path d="M70,12h-6c0-3.31-2.69-6-6-6H42c-3.31,0-6,2.69-6,6h-6c-7.73,0-14,6.27-14,14v54c0,7.73,6.27,14,14,14h40c7.73,0,14-6.27,14-14V26C84,18.27,77.73,12,70,12z M42,12h16v4H42V12z M70,86H30c-3.31,0-6-2.69-6-6V26c0-3.31,2.69-6,6-6h6v4c0,2.21,1.79,4,4,4h20c2.21,0,4-1.79,4-4v-4h6c3.31,0,6,2.69,6,6v54C76,83.31,73.31,86,70,86z"/>
              <circle cx="39" cy="41" r="4"/>
              <circle cx="39" cy="61" r="4"/>
              <rect x="49" y="39" width="20" height="4" rx="2"/>
              <rect x="49" y="59" width="20" height="4" rx="2"/>
            </svg>
            <span className="font-bold text-lg">Appmo</span>
          </div>
        </Link>
      </div>
      
      {user ? (
        // Authenticated user sidebar
        <>
          {/* Tasks Section */}
          <div className="flex gap-2 mb-1 px-4 pt-2">
            <FileText size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-600">Tasks</span>
          </div>
          {/* My Tasks - Featured as main navigation item */}
          <Link href="/">
            <div 
              className={cn(
                "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                isActive('/') 
                  ? "border-l-primary text-primary font-bold" 
                  : "border-l-transparent text-gray-700 hover:border-l-gray-200"
              )}
            >
              <span className="font-medium">My Tasks</span>
            </div>
          </Link>
          <Link href="/new-task">
            <div 
              className={cn(
                "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                isActive('/new-task') 
                  ? "border-l-primary text-primary" 
                  : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
              )}
            >
              <span className="text-sm">New Task</span>
            </div>
          </Link>
          
          <Link href="/calendar">
            <div 
              className={cn(
                "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                isActive('/calendar') 
                  ? "border-l-primary text-primary" 
                  : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
              )}
            >
              <span className="text-sm">Calendar</span>
            </div>
          </Link>
          
          {/* Templates Section */}
          <div className="flex gap-2 mt-4 mb-1 px-4 pt-2">
            <LayoutTemplate size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-600">Templates</span>
          </div>
          <Link href="/task-templates">
            <div 
              className={cn(
                "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                isActive('/task-templates') 
                  ? "border-l-primary text-primary" 
                  : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
              )}
            >
              <span className="text-sm">Templates</span>
            </div>
          </Link>
          
          {/* Discover Section */}
          <div className="flex gap-2 mt-4 mb-1 px-4 pt-2">
            <Globe size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-600">Discover</span>
          </div>
          <Link href="/public-tasks">
            <div 
              className={cn(
                "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                isActive('/public-tasks') 
                  ? "border-l-primary text-primary" 
                  : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
              )}
            >
              <span className="text-sm">Public Tasks</span>
            </div>
          </Link>
          
          <Link href="/my-bids">
            <div 
              className={cn(
                "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                isActive('/my-bids') 
                  ? "border-l-primary text-primary" 
                  : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
              )}
            >
              <span className="text-sm">My Bids</span>
            </div>
          </Link>
          
          <Link href="/messenger">
            <div 
              className={cn(
                "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                isActive('/messenger') 
                  ? "border-l-primary text-primary" 
                  : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
              )}
            >
              <span className="text-sm">Messages</span>
            </div>
          </Link>

          <Link href="/api-docs">
            <div 
              className={cn(
                "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                isActive('/api-docs') 
                  ? "border-l-primary text-primary" 
                  : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
              )}
            >
              <span className="text-sm">API Docs</span>
            </div>
          </Link>
          
          {/* AI Section */}
          <div className="flex gap-2 mt-4 mb-1 px-4 pt-2">
            <Sparkles size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-600">AI Tools</span>
          </div>
          <Link href="/ai-assistant">
            <div 
              className={cn(
                "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                isActive('/ai-assistant') 
                  ? "border-l-primary text-primary" 
                  : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
              )}
            >
              <span className="text-sm">AI Assistant</span>
            </div>
          </Link>
          
          <Link href="/ai-tools">
            <div 
              className={cn(
                "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                isActive('/ai-tools') 
                  ? "border-l-primary text-primary" 
                  : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
              )}
            >
              <span className="text-sm">AI Tools</span>
            </div>
          </Link>
          
          {/* Profile Section */}
          <div className="flex gap-2 mt-4 mb-1 px-4 pt-2">
            <User size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-600">Account</span>
          </div>
          <Link href="/profile">
            <div 
              className={cn(
                "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                isActive('/profile') 
                  ? "border-l-primary text-primary" 
                  : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
              )}
            >
              <span className="text-sm">Profile</span>
            </div>
          </Link>
        </>
      ) : (
        // Non-authenticated user sidebar - limited options
        <>
          {/* Discover Section */}
          <div className="flex gap-2 mb-1 px-4 pt-2">
            <Globe size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-600">Discover</span>
          </div>
          <Link href="/public-tasks">
            <div 
              className={cn(
                "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                isActive('/public-tasks') 
                  ? "border-l-primary text-primary" 
                  : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
              )}
            >
              <span className="text-sm">Public Tasks</span>
            </div>
          </Link>
          
          {/* Account Section */}
          <div className="flex gap-2 mt-4 mb-1 px-4 pt-2">
            <User size={18} className="text-gray-500" />
            <span className="font-semibold text-gray-600">Account</span>
          </div>
          <Link href="/auth">
            <div 
              className={cn(
                "flex items-center gap-2 px-7 py-2 transition-colors cursor-pointer border-l-4",
                isActive('/auth') 
                  ? "border-l-primary text-primary" 
                  : "border-l-transparent text-gray-600 hover:text-gray-900 hover:border-l-gray-200"
              )}
            >
              <span className="text-sm">Sign In</span>
            </div>
          </Link>
        </>
      )}
    </div>
  );
}

export function EnableReminders() {
  const [enabled, setEnabled] = React.useState(false);
  
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-amber-50 rounded-lg border border-amber-100 mb-4">
      <div className="flex items-center gap-2">
        {enabled ? <Bell className="text-amber-600" size={18} /> : <BellOff className="text-amber-600" size={18} />}
        <span className="text-amber-700">Enable Task Reminders</span>
      </div>
      <Switch 
        checked={enabled} 
        onCheckedChange={setEnabled} 
        className="data-[state=checked]:bg-amber-600"
      />
    </div>
  );
}

export function Navigation() {
  const isMobile = useIsMobile();
  
  return <SideNavigation />;
}