import { AddTaskForm } from "@/components/add-task-form";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewTaskPage() {
  const [_, navigate] = useLocation();

  return (
    <div className="pb-20">
      <header className="px-5 py-4 flex items-center border-b">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="mr-2">
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">New Task</h1>
      </header>
      <div className="px-4">
        <AddTaskForm />
      </div>
    </div>
  );
}
