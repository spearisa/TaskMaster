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
  BellOff
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
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col py-4">
            <NavItem
              icon={<LayoutTemplate size={18} />}
              label="Templates"
              href="/task-templates"
              active={isActive('/task-templates')}
            />
            <NavItem
              icon={<FileText size={18} />}
              label="My Tasks"
              href="/"
              active={isActive('/')}
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
          </div>
        </SheetContent>
      </Sheet>
    );
  }
  
  // For desktop, show a sidebar
  return (
    <div className="hidden md:flex flex-col w-56 border-r border-gray-200 min-h-screen fixed pt-4">
      <NavItem
        icon={<LayoutTemplate size={18} />}
        label="Templates"
        href="/task-templates"
        active={isActive('/task-templates')}
      />
      <NavItem
        icon={<FileText size={18} />}
        label="My Tasks"
        href="/"
        active={isActive('/')}
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