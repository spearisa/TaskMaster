import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function FloatingAddButton() {
  const [location, navigate] = useLocation();
  
  useEffect(() => {
    console.log("[FloatingAddButton] Mounted, current location:", location);
  }, [location]);
  
  // Only hide on specific pages
  const shouldHideButton = 
    location === "/new-task" || 
    location.startsWith("/task/") ||
    location === "/auth";

  if (shouldHideButton) {
    console.log("[FloatingAddButton] Hidden on page:", location);
    return null;
  }

  return (
    <div 
      className="fixed bottom-28 right-6 z-[9999]"
      style={{
        filter: "drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.3))"
      }}
    >
      <button
        onClick={() => navigate("/new-task")}
        className="w-20 h-20 rounded-full bg-[#6366F1] hover:bg-[#4F46E5] border-4 border-white flex items-center justify-center"
        aria-label="Add new task"
        style={{
          boxShadow: "0px 6px 16px rgba(0, 0, 0, 0.15)"
        }}
      >
        <Plus size={36} className="text-white" />
      </button>
    </div>
  );
}