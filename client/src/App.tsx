import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MobileLayout } from "@/components/layouts/mobile-layout";
import HomePage from "@/pages/home";
import NewTaskPage from "@/pages/new-task";
import CalendarPage from "@/pages/calendar";
import AIAssistantPage from "@/pages/ai-assistant";
import CompletedPage from "@/pages/completed";
import TaskDetailPage from "@/pages/task-detail";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/new-task" component={NewTaskPage} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/ai-assistant" component={AIAssistantPage} />
      <Route path="/completed" component={CompletedPage} />
      <Route path="/task/:id" component={TaskDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="app-container">
        <Router />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
