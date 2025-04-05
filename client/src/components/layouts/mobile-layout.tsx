import { ReactNode } from 'react';
import { useLocation, Link } from 'wouter';
import { Home, ListTodo, Calendar, LightbulbIcon, Plus } from 'lucide-react';

interface MobileLayoutProps {
  children: ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Tasks', path: '/completed', icon: ListTodo },
    { label: 'Add', path: '/new-task', icon: Plus },
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
      {/* iOS Status Bar */}
      <div className="h-11 flex justify-between px-5 items-center bg-white">
        <div className="font-semibold">9:41</div>
        <div className="flex space-x-1">
          {/* Status icons (Battery, WiFi, etc.) */}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
          </svg>
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-16">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            // Special styling for Add button
            if (item.label === 'Add') {
              return (
                <Link key={item.path} href={item.path}>
                  <a className="py-3 px-5 flex flex-col items-center relative">
                    <div className="absolute -top-5 w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs mt-7 text-transparent">Add</span>
                  </a>
                </Link>
              );
            }
            
            return (
              <Link key={item.path} href={item.path}>
                <a className={`py-3 px-5 flex flex-col items-center ${
                  active ? 'text-primary' : 'text-neutral-500'
                }`}>
                  <Icon className="h-6 w-6" />
                  <span className="text-xs mt-1">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
