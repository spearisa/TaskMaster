import { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  User, ChevronLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from "@/components/ui/button";
import { SideNavigation } from './navigation';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const { user, logoutMutation } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
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
  
  // Skip layout if on auth page or not authenticated
  if (location === '/auth' || !user) {
    return <>{children}</>;
  }

  // Remove the old header and just use the sidebar
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Left sidebar - only visible on desktop */}
      <div className="hidden md:block">
        <SideNavigation />
      </div>
      
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        <main>
          {children}
        </main>
      </div>
      
      {/* On mobile, the sidebar is shown via a sheet/drawer */}
      {isMobile && <SideNavigation />}
    </div>
  );
}