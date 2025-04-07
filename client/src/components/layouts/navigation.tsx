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
  Inbox
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
      <a 
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
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
      </a>
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50">
      <div className="flex justify-around items-center">
        <Link href="/">
          <a className={cn(
            "flex flex-col items-center p-2",
            isActive('/') ? "text-primary" : "text-gray-500"
          )}>
            <Home size={24} />
            <span className="text-xs mt-1">Home</span>
          </a>
        </Link>
        
        <Link href="/calendar">
          <a className={cn(
            "flex flex-col items-center p-2",
            isActive('/calendar') ? "text-primary" : "text-gray-500"
          )}>
            <Calendar size={24} />
            <span className="text-xs mt-1">Calendar</span>
          </a>
        </Link>
        
        <Link href="/new-task">
          <a className="flex flex-col items-center p-2 -mt-5">
            <div className="flex items-center justify-center bg-primary text-primary-foreground rounded-full w-12 h-12">
              <Plus size={24} />
            </div>
            <span className="text-xs mt-1">New Task</span>
          </a>
        </Link>
        
        <Link href="/messenger">
          <a className={cn(
            "flex flex-col items-center p-2",
            isActive('/messenger') ? "text-primary" : "text-gray-500"
          )}>
            <MessageSquare size={24} />
            <span className="text-xs mt-1">Messages</span>
          </a>
        </Link>
        
        <Link href="/profile">
          <a className={cn(
            "flex flex-col items-center p-2",
            isActive('/profile') ? "text-primary" : "text-gray-500"
          )}>
            <Settings size={24} />
            <span className="text-xs mt-1">Profile</span>
          </a>
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
              icon={<MessageSquare size={18} />}
              label="Messages"
              href="/messenger"
              active={isActive('/messenger')}
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
        icon={<MessageSquare size={18} />}
        label="Messages"
        href="/messenger"
        active={isActive('/messenger')}
      />
      <NavItem
        icon={<Settings size={18} />}
        label="Profile"
        href="/profile"
        active={isActive('/profile')}
      />
      
      <div className="mt-auto">
        <Link href="/new-task">
          <a className="flex items-center justify-center bg-primary text-primary-foreground rounded-md py-2 px-4 w-full">
            <Plus size={18} className="mr-2" />
            <span>New Task</span>
          </a>
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