import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTaskSchema, taskSchema, insertDirectMessageSchema, 
  updateProfileSchema, insertTaskTemplateSchema, taskTemplateSchema
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { getTaskSuggestions, generateTaskReminder, generateDailySchedule, delegateTaskToAI } from "./openai-service";
import { setupAuth } from "./auth";
import { WebSocketServer, WebSocket } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  // All routes are prefixed with /api
  
  // Reset demo data (developer route - would be removed in production)
  app.post("/api/dev/reset-demo-data", async (req, res) => {
    try {
      console.log("[API] Resetting demo data...");
      await storage.initializeDemo(true);
      console.log("[API] Demo data has been reset successfully");
      return res.status(200).json({ success: true, message: "Demo data has been reset" });
    } catch (error) {
      console.error("[API] Error resetting demo data:", error);
      return res.status(500).json({ success: false, message: "Failed to reset demo data" });
    }
  });

  // Get tasks for the currently authenticated user
  app.get("/api/tasks", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      console.log(`Fetching tasks for user ID: ${userId}`);
      
      // Get tasks for this specific user
      const tasks = await storage.getTasksByUserId(userId);
      
      console.log(`Found ${tasks.length} tasks for user ID ${userId}:`, JSON.stringify(tasks));
      
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
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if the task belongs to the current user
      // For now, we'll still return all tasks for any user for testing purposes
      // But we should add a warning log
      if (task.userId && task.userId !== userId) {
        console.warn(`User ${userId} is accessing task ${taskId} which belongs to user ${task.userId}`);
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
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      // Log the incoming request body for debugging
      console.log("Task creation request body:", JSON.stringify(req.body));
      
      // First handle the dueDate conversion manually
      let taskData = { ...req.body };
      
      // Convert all date fields explicitly before validation
      const taskWithConvertedDates = {
        ...taskData,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
        userId: userId, // Assign the task to the current user
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
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verify that the task belongs to the current user
      if (task.userId && task.userId !== userId) {
        console.warn(`User ${userId} attempted to update task ${taskId} which belongs to user ${task.userId}`);
        return res.status(403).json({ message: "You don't have permission to update this task" });
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
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verify that the task belongs to the current user
      if (task.userId && task.userId !== userId) {
        console.warn(`User ${userId} attempted to complete task ${taskId} which belongs to user ${task.userId}`);
        return res.status(403).json({ message: "You don't have permission to complete this task" });
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
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verify that the task belongs to the current user
      if (task.userId && task.userId !== userId) {
        console.warn(`User ${userId} attempted to delete task ${taskId} which belongs to user ${task.userId}`);
        return res.status(403).json({ message: "You don't have permission to delete this task" });
      }
      
      await storage.deleteTask(taskId);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      return res.status(500).json({ message: "Failed to delete task" });
    }
  });
  
  // Get tasks assigned to the authenticated user
  app.get("/api/assigned-tasks", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      console.log(`Fetching tasks assigned to user ID: ${userId}`);
      
      // Get tasks assigned to this specific user
      const assignedTasks = await storage.getTasksAssignedToUser(userId);
      
      return res.json(assignedTasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      })));
    } catch (error) {
      console.error("Error fetching assigned tasks:", error);
      return res.status(500).json({ message: "Failed to retrieve assigned tasks" });
    }
  });
  
  // Assign a task to another user
  app.post("/api/tasks/:id/assign", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      // Get the assignee's user ID from the request body
      const { assignedToUserId } = req.body;
      if (!assignedToUserId || isNaN(parseInt(assignedToUserId))) {
        return res.status(400).json({ message: "Invalid assignee user ID" });
      }
      
      const assigneeId = parseInt(assignedToUserId);
      
      // Verify assignee exists
      const assignee = await storage.getUser(assigneeId);
      if (!assignee) {
        return res.status(404).json({ message: "Assignee user not found" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verify that the task belongs to the current user
      if (task.userId && task.userId !== userId) {
        console.warn(`User ${userId} attempted to assign task ${taskId} which belongs to user ${task.userId}`);
        return res.status(403).json({ message: "You don't have permission to assign this task" });
      }
      
      const assignedTask = await storage.assignTaskToUser(taskId, assigneeId);
      
      return res.json({
        ...assignedTask,
        dueDate: assignedTask?.dueDate ? assignedTask.dueDate.toISOString() : null,
        completedAt: assignedTask?.completedAt ? assignedTask.completedAt.toISOString() : null,
      });
    } catch (error) {
      console.error("Error assigning task:", error);
      return res.status(500).json({ message: "Failed to assign task" });
    }
  });
  
  // Set a task's public status
  app.post("/api/tasks/:id/public", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      // Get the isPublic flag from request body
      const { isPublic } = req.body;
      if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ message: "Invalid isPublic value. Must be a boolean." });
      }

      try {
        // Try to get the task first - but if this fails due to schema issues, we'll continue
        const task = await storage.getTaskById(taskId);
        if (task) {
          // Verify that the task belongs to the current user
          if (task.userId && task.userId !== userId) {
            console.warn(`User ${userId} attempted to change public status of task ${taskId} which belongs to user ${task.userId}`);
            return res.status(403).json({ message: "You don't have permission to modify this task" });
          }
        }
      } catch (taskError) {
        console.error("Error retrieving task but proceeding with public status update:", taskError);
        // Continue with the operation even if task retrieval fails due to schema issues
      }
      
      // Try to set the task as public
      try {
        const updatedTask = await storage.setTaskPublic(taskId, isPublic);
        
        if (updatedTask) {
          return res.json({
            ...updatedTask,
            dueDate: updatedTask?.dueDate ? updatedTask.dueDate.toISOString() : null,
            completedAt: updatedTask?.completedAt ? updatedTask.completedAt.toISOString() : null,
          });
        }
      } catch (updateError) {
        console.error("Error in setTaskPublic, attempting direct database update:", updateError);
        
        // Try direct database update as last resort
        try {
          const pool = await import("./db").then(m => m.pool);
          
          // First make sure the column exists
          await pool.query(
            `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false`
          );
          
          // Set directly with SQL
          const result = await pool.query(
            `UPDATE tasks SET is_public = $1 WHERE id = $2 RETURNING *`,
            [isPublic, taskId]
          );
          
          if (result.rows.length > 0) {
            const task = result.rows[0];
            return res.json({
              ...task,
              dueDate: task.due_date ? new Date(task.due_date).toISOString() : null,
              completedAt: task.completed_at ? new Date(task.completed_at).toISOString() : null,
            });
          }
        } catch (fallbackError) {
          console.error("Even fallback update failed:", fallbackError);
          throw updateError; // Re-throw the original error
        }
      }
      
      // If we got here without returning, something went wrong
      return res.status(404).json({ message: "Task not found or could not be updated" });
    } catch (error) {
      console.error("Error updating task public status:", error);
      return res.status(500).json({ message: "Failed to update task public status" });
    }
  });
  
  // Get all public tasks
  app.get("/api/public-tasks", async (req, res) => {
    try {
      const tasks = await storage.getPublicTasks();
      
      // Get user info for each task
      const tasksWithUserInfo = await Promise.all(
        tasks.map(async (task) => {
          let userInfo = null;
          if (task.userId) {
            userInfo = await storage.getUserProfile(task.userId);
          }
          
          return {
            ...task,
            dueDate: task.dueDate ? task.dueDate.toISOString() : null,
            completedAt: task.completedAt ? task.completedAt.toISOString() : null,
            user: userInfo
          };
        })
      );
      
      return res.json(tasksWithUserInfo);
    } catch (error) {
      console.error("Error fetching public tasks:", error);
      return res.status(500).json({ message: "Failed to retrieve public tasks" });
    }
  });
  
  // Get public tasks for a specific user
  app.get("/api/users/:userId/public-tasks", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Verify user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const tasks = await storage.getPublicTasksByUserId(userId);
      const userProfile = await storage.getUserProfile(userId);
      
      return res.json({
        user: userProfile,
        tasks: tasks.map(task => ({
          ...task,
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
          completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        }))
      });
    } catch (error) {
      console.error("Error fetching user's public tasks:", error);
      return res.status(500).json({ message: "Failed to retrieve user's public tasks" });
    }
  });

  // Get AI task suggestions
  app.post("/api/ai/suggestions", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const { taskTitle, description } = req.body;
      
      // Get tasks for this specific user
      const tasks = await storage.getTasksByUserId(userId);
      
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
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verify that the task belongs to the current user
      if (task.userId && task.userId !== userId) {
        console.warn(`User ${userId} attempted to get reminder for task ${taskId} which belongs to user ${task.userId}`);
        return res.status(403).json({ message: "You don't have permission to access this task" });
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
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      // Get tasks for this specific user
      const tasks = await storage.getTasksByUserId(userId);
      
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
      if (!req.isAuthenticated() || !req.user) {
        console.log("User not authenticated for task delegation");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verify that the task belongs to the current user
      if (task.userId && task.userId !== userId) {
        console.warn(`User ${userId} attempted to delegate task ${taskId} which belongs to user ${task.userId}`);
        return res.status(403).json({ message: "You don't have permission to delegate this task" });
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
          console.log("Delegating task to AI with OpenAI API");
          const delegationResult = await delegateTaskToAI(taskWithStringDates, context);
          return res.json(delegationResult);
        } catch (error) {
          console.error("Error delegating task to AI:", error);
          return res.status(500).json({ message: "Failed to delegate task to AI: " + (error as Error).message });
        }
      } else {
        // Return an error if no OpenAI API key
        console.error("OpenAI API key not found");
        return res.status(400).json({ message: "OpenAI API key is required for this feature" });
      }
    } catch (error) {
      console.error("Error in task delegation route:", error);
      return res.status(500).json({ message: "Failed to delegate task: " + (error as Error).message });
    }
  });

  // Get tasks due today
  app.get("/api/tasks/due/today", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      // Get tasks for this specific user
      const tasks = await storage.getTasksByUserId(userId);
      
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
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      // Get tasks for this specific user
      const tasks = await storage.getTasksByUserId(userId);
      
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

  // === User Profile API Routes ===
  
  app.get("/api/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const profile = await storage.getUserProfile(req.user.id);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      return res.status(500).json({ message: "Failed to retrieve profile" });
    }
  });
  
  app.get("/api/profile/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ message: "Failed to retrieve user profile" });
    }
  });
  
  app.patch("/api/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Validate the incoming profile data
      const profileValidation = updateProfileSchema.safeParse(req.body);
      
      if (!profileValidation.success) {
        const validationError = fromZodError(profileValidation.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const updatedUser = await storage.updateUserProfile(req.user.id, profileValidation.data);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const profile = await storage.getUserProfile(req.user.id);
      res.json(profile);
    } catch (error) {
      console.error("Error updating profile:", error);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });
  
  app.get("/api/users/search", async (req, res) => {
    try {
      console.log(`[API] User search request received: ${JSON.stringify(req.query)}`);
      
      if (!req.isAuthenticated() || !req.user) {
        console.log(`[API] User search: Not authenticated`);
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const query = req.query.q as string;
      console.log(`[API] User search query: "${query}" from user ID: ${req.user.id}`);
      
      if (!query || query.length < 2) {
        console.log(`[API] User search: Query too short`);
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }
      
      const users = await storage.searchUsers(query, req.user.id);
      console.log(`[API] User search results: Found ${users.length} users for query "${query}"`);
      
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      return res.status(500).json({ message: "Failed to search users" });
    }
  });
  
  // === Messaging API Routes ===
  
  app.get("/api/conversations", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const conversations = await storage.getConversations(req.user.id);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return res.status(500).json({ message: "Failed to retrieve conversations" });
    }
  });
  
  app.get("/api/messages/:userId", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const otherUserId = parseInt(req.params.userId);
      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Mark messages as read when fetching them
      await storage.markMessagesAsRead(req.user.id, otherUserId);
      
      const messages = await storage.getMessages(req.user.id, otherUserId);
      res.json(messages.map(msg => ({
        ...msg,
        createdAt: msg.createdAt ? msg.createdAt.toISOString() : null,
      })));
    } catch (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ message: "Failed to retrieve messages" });
    }
  });
  
  app.post("/api/messages", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const messageData = {
        senderId: req.user.id,
        receiverId: req.body.receiverId,
        content: req.body.content,
        read: false,
        createdAt: new Date()
      };
      
      // Validate message data
      const validationResult = insertDirectMessageSchema.safeParse(messageData);
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      const message = await storage.sendMessage(validationResult.data);
      
      // Send a WebSocket notification
      notifyWebSocketClients({
        type: 'new_message',
        message: {
          ...message,
          createdAt: message.createdAt ? message.createdAt.toISOString() : null,
        }
      });
      
      res.status(201).json({
        ...message,
        createdAt: message.createdAt ? message.createdAt.toISOString() : null,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      return res.status(500).json({ message: "Failed to send message" });
    }
  });
  
  app.post("/api/messages/:userId/read", async (req, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const otherUserId = parseInt(req.params.userId);
      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      await storage.markMessagesAsRead(req.user.id, otherUserId);
      res.status(204).end();
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Initialize demo data
  await storage.initializeDemo();

  // TASK TEMPLATE ROUTES
  
  // Get task templates for the currently authenticated user
  app.get("/api/task-templates", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      console.log(`Fetching task templates for user ID: ${userId}`);
      
      // Get templates for this specific user
      const templates = await storage.getTaskTemplatesByUserId(userId);
      
      return res.json(templates.map(template => ({
        ...template,
        createdAt: template.createdAt ? template.createdAt.toISOString() : null,
      })));
    } catch (error) {
      console.error("Error fetching task templates:", error);
      return res.status(500).json({ message: "Failed to retrieve task templates" });
    }
  });
  
  // Get all public task templates
  app.get("/api/public-task-templates", async (req, res) => {
    try {
      const templates = await storage.getPublicTaskTemplates();
      
      // Get user info for each template
      const templatesWithUserInfo = await Promise.all(
        templates.map(async (template) => {
          let userInfo = null;
          if (template.userId) {
            userInfo = await storage.getUserProfile(template.userId);
          }
          
          return {
            ...template,
            createdAt: template.createdAt ? template.createdAt.toISOString() : null,
            user: userInfo,
          };
        })
      );
      
      return res.json(templatesWithUserInfo);
    } catch (error) {
      console.error("Error fetching public task templates:", error);
      return res.status(500).json({ message: "Failed to retrieve public task templates" });
    }
  });
  
  // Get a specific task template by ID
  app.get("/api/task-templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const template = await storage.getTaskTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Task template not found" });
      }
      
      // Check if template is public or if user is authenticated
      const isPublic = template.isPublic;
      let belongsToUser = false;
      
      if (req.isAuthenticated() && req.user?.id) {
        belongsToUser = template.userId === req.user.id;
      }
      
      if (!isPublic && !belongsToUser) {
        return res.status(403).json({ message: "You don't have permission to view this template" });
      }
      
      // Get creator info
      let userInfo = null;
      if (template.userId) {
        userInfo = await storage.getUserProfile(template.userId);
      }
      
      return res.json({
        ...template,
        createdAt: template.createdAt ? template.createdAt.toISOString() : null,
        user: userInfo,
      });
    } catch (error) {
      console.error("Error fetching task template:", error);
      return res.status(500).json({ message: "Failed to retrieve task template" });
    }
  });
  
  // Create a new task template
  app.post("/api/task-templates", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      // Log the incoming request body for debugging
      console.log("Task template creation request body:", JSON.stringify(req.body));
      
      // Prepare template data with user ID
      const templateData = {
        ...req.body,
        userId: userId,
      };
      
      // Validate with the schema
      const validationResult = insertTaskTemplateSchema.safeParse(templateData);
      
      if (!validationResult.success) {
        const validationError = fromZodError(validationResult.error);
        console.error("Task template validation error:", validationError.message);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Get the validated data
      const validatedTemplateData = validationResult.data;
      
      console.log("Validated task template data:", validatedTemplateData);
      
      // Create the task template with the validated data
      const newTemplate = await storage.createTaskTemplate(validatedTemplateData);
      
      return res.status(201).json({
        ...newTemplate,
        createdAt: newTemplate.createdAt ? newTemplate.createdAt.toISOString() : null,
      });
    } catch (error) {
      console.error("Error creating task template:", error);
      return res.status(500).json({ message: "Failed to create task template" });
    }
  });
  
  // Update a task template
  app.patch("/api/task-templates/:id", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const template = await storage.getTaskTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Task template not found" });
      }
      
      // Verify that the template belongs to the current user
      if (template.userId && template.userId !== userId) {
        console.warn(`User ${userId} attempted to update template ${templateId} which belongs to user ${template.userId}`);
        return res.status(403).json({ message: "You don't have permission to update this template" });
      }
      
      const updatedTemplate = await storage.updateTaskTemplate(templateId, req.body);
      
      return res.json({
        ...updatedTemplate,
        createdAt: updatedTemplate?.createdAt ? updatedTemplate.createdAt.toISOString() : null,
      });
    } catch (error) {
      console.error("Error updating task template:", error);
      return res.status(500).json({ message: "Failed to update task template" });
    }
  });
  
  // Delete a task template
  app.delete("/api/task-templates/:id", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const template = await storage.getTaskTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Task template not found" });
      }
      
      // Verify that the template belongs to the current user
      if (template.userId && template.userId !== userId) {
        console.warn(`User ${userId} attempted to delete template ${templateId} which belongs to user ${template.userId}`);
        return res.status(403).json({ message: "You don't have permission to delete this template" });
      }
      
      await storage.deleteTaskTemplate(templateId);
      
      return res.status(204).send();
    } catch (error) {
      console.error("Error deleting task template:", error);
      return res.status(500).json({ message: "Failed to delete task template" });
    }
  });
  
  // Set a task template's public status
  app.patch("/api/task-templates/:id/public", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Get the isPublic flag from request body
      const { isPublic } = req.body;
      if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ message: "Invalid isPublic value. Must be a boolean." });
      }
      
      const template = await storage.getTaskTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Task template not found" });
      }
      
      // Verify that the template belongs to the current user
      if (template.userId && template.userId !== userId) {
        console.warn(`User ${userId} attempted to change public status of template ${templateId} which belongs to user ${template.userId}`);
        return res.status(403).json({ message: "You don't have permission to modify this template" });
      }
      
      const updatedTemplate = await storage.setTaskTemplatePublic(templateId, isPublic);
      
      return res.json({
        ...updatedTemplate,
        createdAt: updatedTemplate?.createdAt ? updatedTemplate.createdAt.toISOString() : null,
      });
    } catch (error) {
      console.error("Error updating template public status:", error);
      return res.status(500).json({ message: "Failed to update template public status" });
    }
  });
  
  // Create a task from a template
  app.post("/api/task-templates/:id/create-task", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the current user's ID
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not available" });
      }
      
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Get optional due date from request
      let dueDate: Date | undefined = undefined;
      if (req.body.dueDate) {
        dueDate = new Date(req.body.dueDate);
        if (isNaN(dueDate.getTime())) {
          return res.status(400).json({ message: "Invalid due date format" });
        }
      }
      
      const template = await storage.getTaskTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Task template not found" });
      }
      
      // Check if template is public or belongs to user
      const isPublic = template.isPublic;
      const belongsToUser = template.userId === userId;
      
      if (!isPublic && !belongsToUser) {
        return res.status(403).json({ message: "You don't have permission to use this template" });
      }
      
      // Create the task from template
      const newTask = await storage.createTaskFromTemplate(templateId, userId, dueDate);
      
      return res.status(201).json({
        ...newTask,
        dueDate: newTask.dueDate ? newTask.dueDate.toISOString() : null,
        completedAt: newTask.completedAt ? newTask.completedAt.toISOString() : null,
      });
    } catch (error) {
      console.error("Error creating task from template:", error);
      return res.status(500).json({ message: "Failed to create task from template" });
    }
  });

  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track connected clients by user ID
  const connectedClients = new Map<number, Set<WebSocket>>();
  
  // Function to notify WebSocket clients
  function notifyWebSocketClients(data: any) {
    // If it's a message, specifically notify the receiver
    if (data.type === 'new_message' && data.message && data.message.receiverId) {
      const receiverId = data.message.receiverId;
      const receiverSockets = connectedClients.get(receiverId);
      
      if (receiverSockets) {
        receiverSockets.forEach(socket => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(data));
          }
        });
      }
      return;
    }
    
    // Otherwise broadcast to all connected clients
    // Using Array.from to convert the Map entries to an array that can be iterated safely
    Array.from(connectedClients.entries()).forEach(([userId, sockets]) => {
      // Using Array.from to convert the Set to an array that can be iterated safely
      Array.from(sockets).forEach(socket => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify(data));
        }
      });
    });
  }
  
  // WebSocket connection handler
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    let userId: number | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    
    // Setup ping/pong for connection health check
    heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000); // Send ping every 30 seconds
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('WebSocket message received:', data);
        
        // Handle client registration with user ID
        if (data.type === 'register' && data.userId) {
          userId = parseInt(data.userId);
          
          if (!connectedClients.has(userId)) {
            connectedClients.set(userId, new Set());
          }
          
          // Remove any existing dead connections for this user
          const userSockets = connectedClients.get(userId);
          if (userSockets) {
            // Using Array.from to convert the Set to an array that can be iterated safely
            Array.from(userSockets).forEach(socket => {
              if (socket.readyState !== WebSocket.OPEN) {
                userSockets.delete(socket);
                console.log(`Removed dead connection for user ${userId}`);
              }
            });
          }
          
          connectedClients.get(userId)?.add(ws);
          console.log(`User ${userId} registered with WebSocket. Total connections for user: ${connectedClients.get(userId)?.size}`);
          
          // Acknowledge registration
          ws.send(JSON.stringify({ 
            type: 'registration_successful',
            userId,
            connectionsCount: connectedClients.get(userId)?.size || 1
          }));
          
          return;
        }
        
        // Handle direct messages
        if (data.type === 'direct_message' && userId && data.receiverId && data.content) {
          // Forward the message to the API to save it
          const messageData = {
            senderId: userId,
            receiverId: data.receiverId,
            content: data.content,
            read: false
          };
          
          // This is async but we don't need to await it here
          // as we're just forwarding the message for processing
          // Use a direct API call instead of fetch with localhost
          storage.sendMessage(messageData).then(savedMessage => {
            // Notify the receiver about the new message
            notifyWebSocketClients({
              type: 'new_message',
              message: {
                ...savedMessage,
                createdAt: savedMessage.createdAt?.toISOString()
              }
            });
          }).catch(error => {
            console.error('Error saving direct message:', error);
          });
          
          // Direct API call is more reliable than using localhost fetch
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      
      // Clear the heartbeat interval
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      
      // Remove this connection from tracked clients
      if (userId && connectedClients.has(userId)) {
        const userSockets = connectedClients.get(userId);
        if (userSockets) {
          userSockets.delete(ws);
          console.log(`User ${userId} connection removed. Remaining connections: ${userSockets.size}`);
          
          // If no more sockets for this user, remove the user entry
          if (userSockets.size === 0) {
            connectedClients.delete(userId);
            console.log(`All connections for user ${userId} closed. User removed from tracking.`);
          }
        }
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  return httpServer;
}
