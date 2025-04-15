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
  Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Switch } from '@/components/ui/switch';

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
                {/* My Tasks - Featured as main navigation item */}
                <Link href="/">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-4 py-4 transition-colors cursor-pointer border-l-4 bg-primary/5 mb-1",
                      isActive('/') 
                        ? "border-l-primary text-primary font-bold" 
                        : "border-l-transparent text-gray-700 hover:border-l-gray-200"
                    )}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <FileText size={20} />
                    </div>
                    <span className="font-medium text-lg">My Tasks</span>
                  </div>
                </Link>
                
                <Link href="/new-task">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 transition-colors cursor-pointer border-l-4",
                      isActive('/new-task') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-700 hover:border-l-gray-200"
                    )}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <Plus size={18} />
                    </div>
                    <span className="font-medium">New Task</span>
                  </div>
                </Link>
                
                <Link href="/task-templates">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 transition-colors cursor-pointer border-l-4",
                      isActive('/task-templates') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-700 hover:border-l-gray-200"
                    )}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <LayoutTemplate size={18} />
                    </div>
                    <span className="font-medium">Templates</span>
                  </div>
                </Link>
                
                <Link href="/public-tasks">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 transition-colors cursor-pointer border-l-4",
                      isActive('/public-tasks') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-700 hover:border-l-gray-200"
                    )}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <Globe size={18} />
                    </div>
                    <span className="font-medium">Public Tasks</span>
                  </div>
                </Link>
                
                <Link href="/messenger">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 transition-colors cursor-pointer border-l-4",
                      isActive('/messenger') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-700 hover:border-l-gray-200"
                    )}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <MessageSquare size={18} />
                    </div>
                    <span className="font-medium">Messages</span>
                  </div>
                </Link>
                
                <Link href="/ai-assistant">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 transition-colors cursor-pointer border-l-4",
                      isActive('/ai-assistant') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-700 hover:border-l-gray-200"
                    )}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <Sparkles size={18} />
                    </div>
                    <span className="font-medium">AI Assistant</span>
                  </div>
                </Link>
                
                <Link href="/ai-tools">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 transition-colors cursor-pointer border-l-4",
                      isActive('/ai-tools') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-700 hover:border-l-gray-200"
                    )}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <Sparkles size={18} />
                    </div>
                    <span className="font-medium">AI Tools</span>
                  </div>
                </Link>
                
                <Link href="/profile">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 transition-colors cursor-pointer border-l-4",
                      isActive('/profile') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-700 hover:border-l-gray-200"
                    )}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <User size={18} />
                    </div>
                    <span className="font-medium">Profile</span>
                  </div>
                </Link>
              </>
            ) : (
              // Non-authenticated user navigation - show limited options
              <>
                <Link href="/public-tasks">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 transition-colors cursor-pointer border-l-4",
                      isActive('/public-tasks') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-700 hover:border-l-gray-200"
                    )}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <Globe size={18} />
                    </div>
                    <span className="font-medium">Public Tasks</span>
                  </div>
                </Link>
                
                <Link href="/auth">
                  <div 
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 transition-colors cursor-pointer border-l-4",
                      isActive('/auth') 
                        ? "border-l-primary text-primary" 
                        : "border-l-transparent text-gray-700 hover:border-l-gray-200"
                    )}
                  >
                    <div className="flex items-center justify-center w-6 h-6">
                      <User size={18} />
                    </div>
                    <span className="font-medium">Sign In</span>
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
    <div className="hidden md:flex flex-col w-56 border-r border-gray-200 min-h-screen fixed pt-4">
      {user ? (
        // Authenticated user sidebar
        <>
          {/* My Tasks - Featured as main navigation item */}
          <Link href="/">
            <div 
              className={cn(
                "flex items-center gap-2 px-4 py-3 mb-1 transition-colors cursor-pointer border-l-4 bg-primary/5",
                isActive('/') 
                  ? "border-l-primary text-primary font-bold" 
                  : "border-l-transparent text-gray-700 hover:border-l-gray-200"
              )}
            >
              <div className="flex items-center justify-center w-6 h-6">
                <FileText size={20} />
              </div>
              <span className="font-medium text-lg">My Tasks</span>
            </div>
          </Link>
          <NavItem
            icon={<Plus size={18} />}
            label="New Task"
            href="/new-task"
            active={isActive('/new-task')}
          />
          <NavItem
            icon={<LayoutTemplate size={18} />}
            label="Templates"
            href="/task-templates"
            active={isActive('/task-templates')}
          />
          <NavItem
            icon={<Globe size={18} />}
            label="Public Tasks"
            href="/public-tasks"
            active={isActive('/public-tasks')}
          />
          <NavItem
            icon={<MessageSquare size={18} />}
            label="Messages"
            href="/messenger"
            active={isActive('/messenger')}
          />
          <NavItem
            icon={<Sparkles size={18} />}
            label="AI Assistant"
            href="/ai-assistant"
            active={isActive('/ai-assistant')}
          />
          <NavItem
            icon={<Sparkles size={18} />}
            label="AI Tools"
            href="/ai-tools"
            active={isActive('/ai-tools')}
          />
          <NavItem
            icon={<User size={18} />}
            label="Profile"
            href="/profile"
            active={isActive('/profile')}
          />
        </>
      ) : (
        // Non-authenticated user sidebar - limited options
        <>
          <NavItem
            icon={<Globe size={18} />}
            label="Public Tasks"
            href="/public-tasks"
            active={isActive('/public-tasks')}
          />
          <NavItem
            icon={<User size={18} />}
            label="Sign In"
            href="/auth"
            active={isActive('/auth')}
          />
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