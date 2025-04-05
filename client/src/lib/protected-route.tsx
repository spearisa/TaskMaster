import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
}

export function ProtectedRoute({
  path,
  component: Component,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  console.log("Protected route at path:", path);
  console.log("Authentication state:", { user, isLoading });

  if (isLoading) {
    console.log("Auth is loading...");
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