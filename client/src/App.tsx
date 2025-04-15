import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MobileLayout } from "@/components/layouts/mobile-layout";
import { FloatingAIButton } from "@/components/floating-ai-button";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import HomePage from "@/pages/home";
import NewTaskPage from "@/pages/new-task";
import CalendarSimplePage from "@/pages/calendar-simple";
import AIAssistantPage from "@/pages/ai-assistant";
import AiToolsPage from "@/pages/ai-tools";
import CompletedPage from "@/pages/completed";
import TaskDetailPage from "@/pages/task-detail";
import AssignedTasksPage from "@/pages/assigned-tasks";
import PublicTasksPage from "@/pages/public-tasks";
import TaskTemplatesPage from "@/pages/task-templates";
import NewTaskTemplatePage from "@/pages/new-task-template";
import AuthPage from "@/pages/auth-page";
import ProfilePage from "@/pages/profile";
import MessengerPage from "@/pages/messenger";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/new-task" component={NewTaskPage} />
      <ProtectedRoute path="/calendar" component={CalendarSimplePage} />
      <ProtectedRoute path="/ai-assistant" component={AIAssistantPage} />
      <ProtectedRoute path="/ai-tools" component={AiToolsPage} />
      <ProtectedRoute path="/completed" component={CompletedPage} />
      <ProtectedRoute path="/task/:id" component={TaskDetailPage} />
      <ProtectedRoute path="/assigned-tasks" component={AssignedTasksPage} />
      <ProtectedRoute path="/public-tasks" component={PublicTasksPage} />
      <ProtectedRoute path="/task-templates" component={TaskTemplatesPage} />
      <ProtectedRoute path="/task-templates/new" component={NewTaskTemplatePage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/messenger" component={MessengerPage} />
      <ProtectedRoute path="/messenger/:userId" component={MessengerPage} />
      <Route path="/auth" component={AuthPage} />
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
    <div className="app-container">
      <MobileLayout>
        <Router />
      </MobileLayout>
      {user && <FloatingAIButton />}
      <Toaster />
    </div>
  );
}

export default App;
