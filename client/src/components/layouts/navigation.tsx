import React from 'react';
import { useLocation, Link } from 'wouter';
import { 
  Home, 
  Calendar, 
  CheckSquare, 
  MessageSquare, 
  Plus, 
  Settings,
  Menu,
  UserPlus,
  Inbox,
  Globe,
  FileCode,
  BookTemplate,
  Bot,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';

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
          "flex items-center gap-2 px-3 py-2 rounded-md transition-colors cursor-pointer",
          active 
            ? "bg-primary text-primary-foreground" 
            : "hover:bg-gray-100 text-gray-700"
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

export function MobileNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  if (!user) return null;
  
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-1 py-2 z-50">
      <div className="flex justify-around items-center">
        <Link href="/">
          <div className={cn(
            "flex flex-col items-center p-1 cursor-pointer",
            isActive('/') ? "text-primary" : "text-gray-500"
          )}>
            <Home size={18} />
            <span className="text-xs mt-1">Home</span>
          </div>
        </Link>
        
        <Link href="/calendar">
          <div className={cn(
            "flex flex-col items-center p-1 cursor-pointer",
            isActive('/calendar') ? "text-primary" : "text-gray-500"
          )}>
            <Calendar size={18} />
            <span className="text-xs mt-1">Calendar</span>
          </div>
        </Link>
        
        <Link href="/new-task">
          <div className="flex flex-col items-center p-1 -mt-5 cursor-pointer">
            <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-12 h-12">
              <Plus size={24} />
            </div>
            <span className="text-xs mt-1">New Task</span>
          </div>
        </Link>
        
        <Link href="/public-tasks">
          <div className={cn(
            "flex flex-col items-center p-1 cursor-pointer",
            isActive('/public-tasks') ? "text-primary" : "text-gray-500"
          )}>
            <Globe size={18} />
            <span className="text-xs mt-1">Public</span>
          </div>
        </Link>
        
        <Link href="/task-templates">
          <div className={cn(
            "flex flex-col items-center p-1 cursor-pointer",
            isActive('/task-templates') ? "text-primary" : "text-gray-500"
          )}>
            <BookTemplate size={18} />
            <span className="text-xs mt-1">Templates</span>
          </div>
        </Link>
        
        <Link href="/messenger">
          <div className={cn(
            "flex flex-col items-center p-1 cursor-pointer",
            isActive('/messenger') ? "text-primary" : "text-gray-500"
          )}>
            <MessageSquare size={18} />
            <span className="text-xs mt-1">Messages</span>
          </div>
        </Link>

        <Link href="/ai-assistant">
          <div className={cn(
            "flex flex-col items-center p-1 cursor-pointer",
            isActive('/ai-assistant') ? "text-primary" : "text-gray-500"
          )}>
            <Sparkles size={18} />
            <span className="text-xs mt-1">AI Help</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function SideNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  if (!user) return null;
  
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
        <SheetContent side="left" className="w-64">
          <div className="flex flex-col gap-1 mt-8">
            <NavItem
              icon={<Home size={18} />}
              label="Home"
              href="/"
              active={isActive('/')}
            />
            <NavItem
              icon={<Calendar size={18} />}
              label="Calendar"
              href="/calendar"
              active={isActive('/calendar')}
            />
            <NavItem
              icon={<CheckSquare size={18} />}
              label="Completed Tasks"
              href="/completed"
              active={isActive('/completed')}
            />
            <NavItem
              icon={<Inbox size={18} />}
              label="Assigned Tasks"
              href="/assigned-tasks"
              active={isActive('/assigned-tasks')}
            />
            <NavItem
              icon={<Globe size={18} />}
              label="Public Tasks"
              href="/public-tasks"
              active={isActive('/public-tasks')}
            />
            <NavItem
              icon={<BookTemplate size={18} />}
              label="Templates"
              href="/task-templates"
              active={isActive('/task-templates')}
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
              icon={<Settings size={18} />}
              label="Profile"
              href="/profile"
              active={isActive('/profile')}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  // For desktop, show a sidebar
  return (
    <div className="hidden md:flex flex-col gap-1 w-48 p-4 border-r border-gray-200 h-screen fixed">
      <div className="text-xl font-bold mb-6">TaskFlow</div>
      <NavItem
        icon={<Home size={18} />}
        label="Home"
        href="/"
        active={isActive('/')}
      />
      <NavItem
        icon={<Calendar size={18} />}
        label="Calendar"
        href="/calendar"
        active={isActive('/calendar')}
      />
      <NavItem
        icon={<CheckSquare size={18} />}
        label="Completed Tasks"
        href="/completed"
        active={isActive('/completed')}
      />
      <NavItem
        icon={<Inbox size={18} />}
        label="Assigned Tasks"
        href="/assigned-tasks"
        active={isActive('/assigned-tasks')}
      />
      <NavItem
        icon={<Globe size={18} />}
        label="Public Tasks"
        href="/public-tasks"
        active={isActive('/public-tasks')}
      />
      <NavItem
        icon={<BookTemplate size={18} />}
        label="Templates"
        href="/task-templates"
        active={isActive('/task-templates')}
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
        icon={<Settings size={18} />}
        label="Profile"
        href="/profile"
        active={isActive('/profile')}
      />
      
      <div className="mt-auto">
        <Link href="/new-task">
          <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-md py-2 px-4 w-full cursor-pointer">
            <Plus size={18} className="mr-2" />
            <span>New Task</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function Navigation() {
  const isMobile = useIsMobile();
  
  return (
    <>
      {isMobile ? <MobileNavigation /> : <SideNavigation />}
    </>
  );
}