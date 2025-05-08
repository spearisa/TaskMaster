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
import { Component, ErrorInfo, ReactNode } from "react";
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
import SharedProfilePage from "@/pages/shared-profile";
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
// Marketplace Pages
import MarketplacePage from "@/pages/marketplace";
import MarketplaceListingPage from "@/pages/marketplace-listing";
import MarketplaceSellPage from "@/pages/marketplace-sell";
import MarketplaceFavoritesPage from "@/pages/marketplace-favorites";
import MarketplaceMyListingsPage from "@/pages/marketplace-my-listings";
import MarketplaceBidsPage from "@/pages/marketplace-bids";
// Hugging Face AI Models Pages
import AIModelsPage from "@/pages/ai-models";
import AIModelDetailPage from "@/pages/ai-model-detail";
import AppGeneratorPage from "@/pages/app-generator";
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
      <Route path="/profile/:id" component={SharedProfilePage} />
      
      {/* Marketplace routes */}
      <Route path="/marketplace" component={MarketplacePage} />
      <Route path="/marketplace/listing/:id" component={MarketplaceListingPage} />
      <ProtectedRoute path="/marketplace/sell" component={MarketplaceSellPage} />
      <ProtectedRoute path="/marketplace/favorites" component={MarketplaceFavoritesPage} />
      <ProtectedRoute path="/marketplace/my-listings" component={MarketplaceMyListingsPage} />
      <ProtectedRoute path="/marketplace/bids" component={MarketplaceBidsPage} />
      
      {/* AI Models routes */}
      <Route path="/ai-models" component={AIModelsPage} />
      <Route path="/ai-models/:id" component={AIModelDetailPage} />
      <ProtectedRoute path="/app-generator" component={AppGeneratorPage} />
      
      {/* Admin routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <AdminProtectedRoute path="/admin/dashboard" component={AdminDashboard} />
      <AdminProtectedRoute path="/admin/users" component={AdminUsersPage} />
      <AdminProtectedRoute path="/admin/blog" component={AdminBlogPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

// Error boundary to catch and display errors gracefully
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-4">We're sorry, but there was an error loading the application.</p>
          <p className="text-sm text-gray-500 mb-6">{this.state.error?.message}</p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              // Clear any cached data that might be causing issues
              localStorage.removeItem("taskManager_user");
              
              // Reload the page to reset the application state
              window.location.reload();
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
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
