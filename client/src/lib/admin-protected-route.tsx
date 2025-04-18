import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

/**
 * Protected route component that requires admin privileges
 * If the user is not authenticated or doesn't have admin privileges, they will be redirected
 */
export function AdminProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/admin/login" />
      </Route>
    );
  }

  if (!user.isAdmin) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-amber-50">
          <h1 className="text-2xl font-bold mb-2 text-amber-700">Admin Access Denied</h1>
          <p className="text-center text-gray-600 mb-6">
            You don't have the necessary administrator privileges to access this page.
          </p>
          <div className="flex gap-4">
            <a 
              href="/admin/login" 
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
            >
              Login as Admin
            </a>
            <a 
              href="/" 
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
            >
              Return to Homepage
            </a>
          </div>
        </div>
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}