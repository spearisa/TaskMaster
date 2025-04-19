import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MobileLayout } from "@/components/layouts/mobile-layout";
import { FloatingAIButton } from "@/components/floating-ai-button";
import { LanguageRegionSelector } from "@/components/language-region-selector";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminProtectedRoute } from "@/lib/admin-protected-route";
import HomePage from "@/pages/home";
import NewTaskPage from "@/pages/new-task";
import CalendarPage from "@/pages/calendar";
import AIAssistantPage from "@/pages/ai-assistant";
import AiToolsPage from "@/pages/ai-tools";
import CompletedPage from "@/pages/completed";
import TaskDetailPage from "@/pages/task-detail";
import AssignedTasksPage from "@/pages/assigned-tasks";
import PublicTasksPage from "@/pages/public-tasks";
import TaskTemplatesPage from "@/pages/task-templates";
import NewTaskTemplatePage from "@/pages/new-task-template";
import SharedTaskPage from "@/pages/shared-task";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile";
import MessengerPage from "@/pages/messenger";
import MyBidsPage from "@/pages/my-bids";
import NotFound from "@/pages/not-found";
import ApiDocsPage from "@/pages/api-docs";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsersPage from "@/pages/admin/users";
import AdminBlogPage from "@/pages/admin/blog";
import AdminLogin from "@/pages/admin/login";
// Import i18n instance
import '@/lib/i18n';

function Router() {
  return (
    <Switch>
      {/* Normal routes */}
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/new-task" component={NewTaskPage} />
      <ProtectedRoute path="/calendar" component={CalendarPage} />
      <ProtectedRoute path="/ai-assistant" component={AIAssistantPage} />
      <ProtectedRoute path="/ai-tools" component={AiToolsPage} />
      <ProtectedRoute path="/completed" component={CompletedPage} />
      <ProtectedRoute path="/task/:id" component={TaskDetailPage} />
      <ProtectedRoute path="/assigned-tasks" component={AssignedTasksPage} />
      <Route path="/public-tasks" component={PublicTasksPage} />
      <ProtectedRoute path="/task-templates" component={TaskTemplatesPage} />
      <ProtectedRoute path="/task-templates/new" component={NewTaskTemplatePage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/messenger" component={MessengerPage} />
      <ProtectedRoute path="/messenger/:userId" component={MessengerPage} />
      <ProtectedRoute path="/my-bids" component={MyBidsPage} />
      <Route path="/api-docs" component={ApiDocsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/shared-task/:id" component={SharedTaskPage} />
      
      {/* Admin routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <AdminProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
      <AdminProtectedRoute path="/admin/users" component={AdminUsersPage} />
      <AdminProtectedRoute path="/admin/blog" component={AdminBlogPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { user } = useAuth();
  
  return (
    <main className="app-container" role="main" aria-label="Appmo Task Management Application">
      {/* Skip to content link for accessibility */}
      <a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>
      
      <MobileLayout>
        <div id="main-content">
          <Router />
        </div>
      </MobileLayout>
      
      {user && <FloatingAIButton />}
      
      {/* Language and Region Selector positioned appropriately for both mobile and desktop */}
      <div className="fixed bottom-20 left-4 z-50 md:bottom-8 md:left-8" aria-label="Language selection">
        <LanguageRegionSelector variant="minimal" />
      </div>
      
      <Toaster />
    </main>
  );
}

export default App;
