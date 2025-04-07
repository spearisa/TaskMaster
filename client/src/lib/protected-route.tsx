import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

// Constants for local storage
const AUTH_CHECK_KEY = "taskManager_lastAuthCheck";
const AUTH_MAX_AGE = 60 * 1000; // 60 seconds

export function ProtectedRoute({
  path,
  component: Component,
}: ProtectedRouteProps) {
  const { user, isLoading, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Attempt to refresh user data if necessary
  useEffect(() => {
    // If we already have a user or are loading, no need to refresh
    if (user || isLoading || isRefreshing) return;
    
    const attemptRefresh = async () => {
      const lastAuthCheck = localStorage.getItem(AUTH_CHECK_KEY);
      const now = Date.now();
      
      // Skip if we've checked recently
      if (lastAuthCheck && now - parseInt(lastAuthCheck, 10) < AUTH_MAX_AGE) {
        return;
      }
      
      try {
        console.log("Protected route refreshing auth status...");
        setIsRefreshing(true);
        await refreshUser();
        localStorage.setItem(AUTH_CHECK_KEY, now.toString());
      } catch (error) {
        console.error("Failed to refresh auth:", error);
      } finally {
        setIsRefreshing(false);
      }
    };
    
    attemptRefresh();
  }, [user, isLoading, refreshUser, isRefreshing]);

  // Output detailed debug info
  console.log("Protected route at path:", path);
  console.log("Authentication state:", { user, isLoading, isRefreshing });

  // Show loading state
  if (isLoading || isRefreshing) {
    console.log("Auth is loading or refreshing...");
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      {(params) => {
        if (!user) {
          console.log("User not authenticated, redirecting to /auth");
          return <Redirect to="/auth" />;
        }
        
        console.log("User authenticated, rendering component");
        return <Component params={params} />;
      }}
    </Route>
  );
}