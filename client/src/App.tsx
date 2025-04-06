import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MobileLayout } from "@/components/layouts/mobile-layout";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import HomePage from "@/pages/home";
import NewTaskPage from "@/pages/new-task";
import CalendarSimplePage from "@/pages/calendar-simple";
import AIAssistantPage from "@/pages/ai-assistant";
import CompletedPage from "@/pages/completed";
import TaskDetailPage from "@/pages/task-detail";
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
      <ProtectedRoute path="/completed" component={CompletedPage} />
      <ProtectedRoute path="/task/:id" component={TaskDetailPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/messenger" component={MessengerPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="app-container">
          <Router />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
