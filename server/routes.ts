import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, taskSchema } from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { getTaskSuggestions, generateTaskReminder, generateDailySchedule, delegateTaskToAI } from "./openai-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // All routes are prefixed with /api
  
  // Get all tasks
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      return res.json(tasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      })));
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return res.status(500).json({ message: "Failed to retrieve tasks" });
    }
  });

  // Get a specific task by ID
  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      return res.json({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      });
    } catch (error) {
      console.error("Error fetching task:", error);
      return res.status(500).json({ message: "Failed to retrieve task" });
    }
  });

  // Create a new task
  app.post("/api/tasks", async (req, res) => {
    try {
      // Log the incoming request body for debugging
      console.log("Task creation request body:", JSON.stringify(req.body));
      
      // First handle the dueDate conversion manually
      let taskData = { ...req.body };
      
      // Convert all date fields explicitly before validation
      const taskWithConvertedDates = {
        ...taskData,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
      };
      
      console.log("Task with converted dates:", taskWithConvertedDates);
      
      // Now validate with the schema
      const validationResult = insertTaskSchema.safeParse(taskWithConvertedDates);
      
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        console.error("Task validation error:", validationError.message);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Get the validated data
      const validatedTaskData = validationResult.data;
      
      console.log("Validated task data:", validatedTaskData);
      
      // Create the task with the validated data
      const newTask = await storage.createTask(validatedTaskData);
      
      return res.status(201).json({
        ...newTask,
        dueDate: newTask.dueDate ? newTask.dueDate.toISOString() : null,
        completedAt: newTask.completedAt ? newTask.completedAt.toISOString() : null,
      });
    } catch (error) {
      console.error("Error creating task:", error);
      return res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Update a task
  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Convert string dates to Date objects if present
      if (req.body.dueDate && typeof req.body.dueDate === 'string') {
        req.body.dueDate = new Date(req.body.dueDate);
      }
      
      const updatedTask = await storage.updateTask(taskId, req.body);
      
      return res.json({
        ...updatedTask,
        dueDate: updatedTask?.dueDate ? updatedTask.dueDate.toISOString() : null,
        completedAt: updatedTask?.completedAt ? updatedTask.completedAt.toISOString() : null,
      });
    } catch (error) {
      console.error("Error updating task:", error);
      return res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Complete a task
  app.post("/api/tasks/:id/complete", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const completedTask = await storage.completeTask(taskId);
      
      return res.json({
        ...completedTask,
        dueDate: completedTask?.dueDate ? completedTask.dueDate.toISOString() : null,
        completedAt: completedTask?.completedAt ? completedTask.completedAt.toISOString() : null,
      });
    } catch (error) {
      console.error("Error completing task:", error);
      return res.status(500).json({ message: "Failed to complete task" });
    }
  });

  // Delete a task
  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      await storage.deleteTask(taskId);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      return res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Get AI task suggestions
  app.post("/api/ai/suggestions", async (req, res) => {
    try {
      const { taskTitle, description } = req.body;
      
      // Get all tasks for context
      const tasks = await storage.getTasks();
      
      // Convert Date objects to strings for AI processing
      const tasksWithStringDates = tasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        // Ensure proper type for priority in the mapped object
        priority: task.priority as "high" | "medium" | "low"
      }));
      
      // If the OpenAI API key is set, use the AI service
      if (process.env.OPENAI_API_KEY) {
        try {
          const suggestions = await getTaskSuggestions(tasksWithStringDates);
          return res.json(suggestions);
        } catch (error) {
          console.error("Error getting AI suggestions:", error);
          // Fall back to demo data if AI fails
          return res.json([
            {
              title: "Launch your business website",
              steps: [
                { title: "Choose domain name", estimatedTime: 30 },
                { title: "Set up hosting", estimatedTime: 30 },
                { title: "Write homepage copy", estimatedTime: 60 },
                { title: "Design layout", estimatedTime: 120 }
              ],
              recommendation: "To stay on track, try finishing 2 of these today."
            }
          ]);
        }
      } else {
        // Return demo data if no OpenAI API key
        return res.json([
          {
            title: "Launch your business website",
            steps: [
              { title: "Choose domain name", estimatedTime: 30 },
              { title: "Set up hosting", estimatedTime: 30 },
              { title: "Write homepage copy", estimatedTime: 60 },
              { title: "Design layout", estimatedTime: 120 }
            ],
            recommendation: "To stay on track, try finishing 2 of these today."
          }
        ]);
      }
    } catch (error) {
      console.error("Error in AI suggestions route:", error);
      return res.status(500).json({ message: "Failed to generate task suggestions" });
    }
  });

  // Get AI-generated reminder for a specific task
  app.get("/api/tasks/:id/reminder", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Convert Date objects to strings for AI processing and ensure proper types
      const taskWithStringDates = {
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        // Ensure proper type for priority
        priority: task.priority as "high" | "medium" | "low"
      };
      
      // If the OpenAI API key is set, use the AI service
      if (process.env.OPENAI_API_KEY) {
        try {
          const reminder = await generateTaskReminder(taskWithStringDates);
          return res.json(reminder);
        } catch (error) {
          console.error("Error generating AI reminder:", error);
          // Return a basic reminder if AI fails
          return res.json({
            reminderTitle: `Reminder: ${task.title}`,
            reminderMessage: `Don't forget to complete your task: ${task.title}`,
            suggestedTimingMinutesBefore: 60,
            motivationalTip: "Small steps lead to big accomplishments!"
          });
        }
      } else {
        // Return a basic reminder if no OpenAI API key
        return res.json({
          reminderTitle: `Reminder: ${task.title}`,
          reminderMessage: `Don't forget to complete your task: ${task.title}`,
          suggestedTimingMinutesBefore: 60,
          motivationalTip: "You can do it! Just take the first step."
        });
      }
    } catch (error) {
      console.error("Error in task reminder route:", error);
      return res.status(500).json({ message: "Failed to generate task reminder" });
    }
  });

  // Get AI-generated daily schedule
  app.get("/api/schedule", async (req, res) => {
    try {
      // Get all tasks for scheduling
      const tasks = await storage.getTasks();
      
      // Convert Date objects to strings for AI processing
      const tasksWithStringDates = tasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        // Ensure proper type for priority
        priority: task.priority as "high" | "medium" | "low"
      }));
      
      // If the OpenAI API key is set, use the AI service
      if (process.env.OPENAI_API_KEY) {
        try {
          const schedule = await generateDailySchedule(tasksWithStringDates);
          return res.json(schedule);
        } catch (error) {
          console.error("Error generating AI schedule:", error);
          // Return a basic schedule if AI fails
          return res.status(500).json({ message: "Failed to generate daily schedule" });
        }
      } else {
        // Return an error if no OpenAI API key
        return res.status(400).json({ message: "OpenAI API key is required for this feature" });
      }
    } catch (error) {
      console.error("Error in schedule route:", error);
      return res.status(500).json({ message: "Failed to generate daily schedule" });
    }
  });
  
  // Delegate a task to AI for detailed completion assistance
  app.post("/api/tasks/:id/delegate", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Convert Date objects to strings for AI processing
      const taskWithStringDates = {
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        // Ensure proper type for priority
        priority: task.priority as "high" | "medium" | "low"
      };
      
      // Get any additional context from the request body
      const { context } = req.body;
      
      // If the OpenAI API key is set, use the AI service
      if (process.env.OPENAI_API_KEY) {
        try {
          const delegationResult = await delegateTaskToAI(taskWithStringDates, context);
          return res.json(delegationResult);
        } catch (error) {
          console.error("Error delegating task to AI:", error);
          return res.status(500).json({ message: "Failed to delegate task to AI" });
        }
      } else {
        // Return an error if no OpenAI API key
        return res.status(400).json({ message: "OpenAI API key is required for this feature" });
      }
    } catch (error) {
      console.error("Error in task delegation route:", error);
      return res.status(500).json({ message: "Failed to delegate task" });
    }
  });

  // Get tasks due today
  app.get("/api/tasks/due/today", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      
      // Filter tasks due today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const tasksDueToday = tasks.filter(task => {
        if (!task.dueDate || task.completed) return false;
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        return dueDate.getTime() === today.getTime();
      });
      
      return res.json(tasksDueToday.map(task => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      })));
    } catch (error) {
      console.error("Error fetching tasks due today:", error);
      return res.status(500).json({ message: "Failed to retrieve tasks due today" });
    }
  });

  // Get urgent tasks (due within next 2 days)
  app.get("/api/tasks/urgent", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      
      // Filter urgent tasks (due within 2 days)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const twoDaysLater = new Date(today);
      twoDaysLater.setDate(twoDaysLater.getDate() + 2);
      
      const urgentTasks = tasks.filter(task => {
        if (!task.dueDate || task.completed) return false;
        
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        
        return dueDate >= today && dueDate <= twoDaysLater;
      });
      
      return res.json(urgentTasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      })));
    } catch (error) {
      console.error("Error fetching urgent tasks:", error);
      return res.status(500).json({ message: "Failed to retrieve urgent tasks" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
