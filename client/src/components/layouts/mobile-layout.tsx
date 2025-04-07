import { ReactNode } from 'react';
import { useLocation, Link } from 'wouter';
import { Home, ListTodo, Calendar, LightbulbIcon, Plus, User, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Tasks', path: '/completed', icon: ListTodo },
    { label: 'Add', path: '/new-task', icon: Plus },
    { label: 'Messages', path: '/messenger', icon: MessageSquare },
    { label: 'Calendar', path: '/calendar', icon: Calendar },
    { label: 'AI', path: '/ai-assistant', icon: LightbulbIcon },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen relative pb-20">
      {/* Header Bar with Profile */}
      <div className="h-16 flex justify-between px-5 items-center bg-white shadow-sm">
        <div className="text-xl font-bold">daddie.net</div> {/* Updated app name */}
        <div 
          className="p-2 rounded-full hover:bg-gray-100 cursor-pointer" 
          onClick={() => window.location.href = '/profile'}
        >
          <User className="h-5 w-5" />
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-16">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            // Special styling for Add button
            if (item.label === 'Add') {
              return (
                <div key={item.path} onClick={() => window.location.href = item.path} className="cursor-pointer">
                  <div className="py-3 px-5 flex flex-col items-center relative">
                    <div className="absolute -top-5 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
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
                onClick={() => window.location.href = item.path}
                className={`py-3 px-5 flex flex-col items-center cursor-pointer ${
                  active ? 'text-primary' : 'text-neutral-500'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs mt-1">{item.label}</span>
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );
}