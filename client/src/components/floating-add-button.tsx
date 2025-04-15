import { Plus } from "lucide-react";
import { useLocation } from "wouter";

export function FloatingAddButton() {
  const [location, navigate] = useLocation();
  
  // Don't show the button on the new task page or when viewing task details
  const shouldHideButton = 
    location === "/new-task" || 
    location.startsWith("/task/") ||
    location === "/auth";

  if (shouldHideButton) {
    return null;
  }

  return (
    <button
      onClick={() => navigate("/new-task")}
      className="fixed bottom-24 right-6 w-16 h-16 rounded-full bg-primary hover:bg-primary/90 shadow-lg flex items-center justify-center z-50"
      aria-label="Add new task"
    >
      <Plus size={30} className="text-white" />
    </button>
  );
}