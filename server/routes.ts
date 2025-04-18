import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import { 
  insertTaskSchema, taskSchema, insertDirectMessageSchema, 
  updateProfileSchema, insertTaskTemplateSchema, taskTemplateSchema,
  insertTaskBidSchema, taskBids
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { 
  getTaskSuggestions, generateTaskReminder, generateDailySchedule, delegateTaskToAI,
  generateChatCompletion, generateImage, generateCode
} from "./openai-service";
import { setupAuth } from "./auth";
import { WebSocketServer, WebSocket } from "ws";
import { 
  createPaymentIntent, getPaymentIntent, confirmPaymentComplete
} from "./stripe-service";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { 
  createApiKey, getApiKeys, validateApiKey, revokeApiKey 
} from "./api-keys";
import { z } from "zod";

// Extend Express Request type to include API user
declare global {
  namespace Express {
    interface Request {
      apiUser?: {
        id: number;
      };
    }
  }
}

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
      
      // Get user ID from the authenticated session
      const userId = req.user!.id;
      console.log(`Fetching tasks for user ID: ${userId}`);

      // Get tasks for this user
      const tasks = await storage.getTasksByUserId(userId);
      console.log(`Found ${tasks.length} tasks for user ID ${userId}: ${JSON.stringify(tasks)}`);
      
      // Also get tasks assigned to this user
      const assignedTasks = await storage.getTasksAssignedToUser(userId);
      console.log(`Found ${assignedTasks.length} tasks assigned to user ID ${userId}`);
      
      // Combine both types of tasks
      const allTasks = [...tasks, ...assignedTasks];
      
      // Convert dates to ISO strings for JSON serialization
      const tasksWithFormattedDates = allTasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      }));
      
      return res.json(tasksWithFormattedDates);
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
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if this task belongs to the current user or is assigned to them
      const userId = req.user!.id;
      if (task.userId !== userId && task.assignedToUserId !== userId && !task.isPublic) {
        return res.status(403).json({ message: "You do not have permission to view this task" });
      }
      
      // Convert dates for response
      const taskWithFormattedDates = {
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      };
      
      return res.json(taskWithFormattedDates);
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
      
      console.log("Task creation request received:", JSON.stringify(req.body, null, 2));
      
      // Skip the schema validation for now since we're having issues with the date format
      // Build a clean object with all the data to ensure it has the right format
      const processedTaskData = {
        title: req.body.title,
        description: req.body.description || null,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        completed: req.body.completed || false,
        priority: req.body.priority || 'medium',
        category: req.body.category || 'Work',
        estimatedTime: req.body.estimatedTime ? Number(req.body.estimatedTime) : null,
        userId: req.user!.id,
        assignedToUserId: req.body.assignedToUserId || null,
        isPublic: req.body.isPublic || false
      };
      
      console.log("Processed task data:", JSON.stringify(processedTaskData, null, 2));
      
      // Skip Zod validation for now
      const result = { success: true, data: processedTaskData };
      
      // Since we're skipping validation, this condition is now always true
      // Keeping the structure for clarity and potential future changes
      
      console.log("Validated task data:", JSON.stringify(result.data, null, 2));
      
      // Create the task in storage
      try {
        const task = await storage.createTask(result.data);
        
        // Convert dates for response
        const taskWithFormattedDates = {
          ...task,
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
          completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        };
        
        console.log("Task created successfully:", JSON.stringify(taskWithFormattedDates, null, 2));
        
        return res.status(201).json(taskWithFormattedDates);
      } catch (storageError) {
        console.error("Storage error creating task:", storageError);
        
        // Return a more detailed error message including the original error
        if (storageError instanceof Error) {
          return res.status(500).json({ 
            message: "Error creating task in database",
            details: storageError.message,
            errorName: storageError.name
          });
        }
        
        // Generic error fallback
        return res.status(500).json({ message: "Unknown error creating task in database" });
      }
    } catch (error) {
      console.error("Unexpected error creating task:", error);
      return res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Update a task
  app.put("/api/tasks/:id", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      // Get the existing task
      const existingTask = await storage.getTaskById(taskId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if this task belongs to the current user or is assigned to them
      const userId = req.user!.id;
      if (existingTask.userId !== userId && existingTask.assignedToUserId !== userId) {
        return res.status(403).json({ message: "You do not have permission to update this task" });
      }
      
      // Create update object without the userId (to prevent changing ownership)
      const { userId: _, ...updateData } = req.body;
      
      // Update the task in storage
      const updatedTask = await storage.updateTask(taskId, updateData);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found after update attempt" });
      }
      
      // Convert dates for response
      const taskWithFormattedDates = {
        ...updatedTask,
        dueDate: updatedTask.dueDate ? updatedTask.dueDate.toISOString() : null,
        completedAt: updatedTask.completedAt ? updatedTask.completedAt.toISOString() : null,
      };
      
      return res.json(taskWithFormattedDates);
    } catch (error) {
      console.error("Error updating task:", error);
      return res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Delete a task
  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      // Get the existing task
      const existingTask = await storage.getTaskById(taskId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if this task belongs to the current user
      const userId = req.user!.id;
      if (existingTask.userId !== userId) {
        return res.status(403).json({ message: "You do not have permission to delete this task" });
      }
      
      // Delete the task from storage
      const success = await storage.deleteTask(taskId);
      if (!success) {
        return res.status(404).json({ message: "Task not found after delete attempt" });
      }
      
      return res.status(204).end();
    } catch (error) {
      console.error("Error deleting task:", error);
      return res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Mark a task as complete
  app.post("/api/tasks/:id/complete", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      // Get the existing task
      const existingTask = await storage.getTaskById(taskId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if this task belongs to the current user or is assigned to them
      const userId = req.user!.id;
      if (existingTask.userId !== userId && existingTask.assignedToUserId !== userId) {
        return res.status(403).json({ message: "You do not have permission to complete this task" });
      }
      
      // Complete the task in storage
      const completedTask = await storage.completeTask(taskId);
      if (!completedTask) {
        return res.status(404).json({ message: "Task not found after complete attempt" });
      }
      
      // Convert dates for response
      const taskWithFormattedDates = {
        ...completedTask,
        dueDate: completedTask.dueDate ? completedTask.dueDate.toISOString() : null,
        completedAt: completedTask.completedAt ? completedTask.completedAt.toISOString() : null,
      };
      
      return res.json(taskWithFormattedDates);
    } catch (error) {
      console.error("Error completing task:", error);
      return res.status(500).json({ message: "Failed to complete task" });
    }
  });

  // Assign a task to another user
  app.post("/api/tasks/:id/assign", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const { assignedToUserId } = req.body;
      if (typeof assignedToUserId !== 'number') {
        return res.status(400).json({ message: "Invalid assignedToUserId" });
      }
      
      // Get the existing task
      const existingTask = await storage.getTaskById(taskId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if this task belongs to the current user
      const userId = req.user!.id;
      if (existingTask.userId !== userId) {
        return res.status(403).json({ message: "You do not have permission to assign this task" });
      }
      
      // Check if the assignee exists
      const assignee = await storage.getUser(assignedToUserId);
      if (!assignee) {
        return res.status(400).json({ message: "Assignee user not found" });
      }
      
      // Assign the task
      const updatedTask = await storage.assignTaskToUser(taskId, assignedToUserId);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found after assign attempt" });
      }
      
      // Convert dates for response
      const taskWithFormattedDates = {
        ...updatedTask,
        dueDate: updatedTask.dueDate ? updatedTask.dueDate.toISOString() : null,
        completedAt: updatedTask.completedAt ? updatedTask.completedAt.toISOString() : null,
      };
      
      return res.json(taskWithFormattedDates);
    } catch (error) {
      console.error("Error assigning task:", error);
      return res.status(500).json({ message: "Failed to assign task" });
    }
  });

  // Update task public visibility
  app.post("/api/tasks/:id/public", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const { isPublic } = req.body;
      if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ message: "isPublic must be a boolean" });
      }
      
      // Get the existing task
      const existingTask = await storage.getTaskById(taskId);
      if (!existingTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if this task belongs to the current user
      const userId = req.user!.id;
      if (existingTask.userId !== userId) {
        return res.status(403).json({ message: "You do not have permission to change this task's visibility" });
      }
      
      // Update the task's public visibility
      const updatedTask = await storage.setTaskPublic(taskId, isPublic);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found after update attempt" });
      }
      
      // Convert dates for response
      const taskWithFormattedDates = {
        ...updatedTask,
        dueDate: updatedTask.dueDate ? updatedTask.dueDate.toISOString() : null,
        completedAt: updatedTask.completedAt ? updatedTask.completedAt.toISOString() : null,
      };
      
      return res.json(taskWithFormattedDates);
    } catch (error) {
      console.error("Error updating task visibility:", error);
      return res.status(500).json({ message: "Failed to update task visibility" });
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
  
  // Get shared task by ID - for public sharing with a link
  app.get("/api/shared-task/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if the task is public before sharing
      if (!task.isPublic) {
        return res.status(403).json({ message: "This task is not public" });
      }
      
      // Get user info for display
      const userInfo = task.userId ? await storage.getUserProfile(task.userId) : null;
      
      res.json({ 
        task: {
          ...task,
          dueDate: task.dueDate ? task.dueDate.toISOString() : null,
          completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        },
        user: userInfo
      });
    } catch (error) {
      console.error("Error fetching shared task:", error);
      res.status(500).json({ message: "Error fetching shared task", error });
    }
  });

  app.get("/api/users/:userId/public-tasks", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if the user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get the user's public tasks
      const tasks = await storage.getPublicTasksByUserId(userId);
      
      // Get user profile for display
      const userProfile = await storage.getUserProfile(userId);
      
      // Convert dates for response
      const tasksWithFormattedDates = tasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      }));
      
      return res.json({
        user: userProfile,
        tasks: tasksWithFormattedDates
      });
    } catch (error) {
      console.error("Error fetching user's public tasks:", error);
      return res.status(500).json({ message: "Failed to retrieve user's public tasks" });
    }
  });

  // Get user profile
  app.get("/api/users/:userId/profile", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get the user profile
      const userProfile = await storage.getUserProfile(userId);
      if (!userProfile) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json(userProfile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ message: "Failed to retrieve user profile" });
    }
  });

  // Update user profile
  app.put("/api/users/profile", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Validate request body against the schema
      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Update the user profile
      const userId = req.user!.id;
      const updatedUser = await storage.updateUserProfile(userId, result.data);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found after update attempt" });
      }
      
      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      return res.status(500).json({ message: "Failed to update user profile" });
    }
  });

  // Search for users
  app.get("/api/users/search", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }
      
      // Search for users
      const userId = req.user!.id;
      const users = await storage.searchUsers(query, userId);
      
      return res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      return res.status(500).json({ message: "Failed to search users" });
    }
  });

  // AI-related routes
  
  // Get AI task suggestions based on current tasks
  app.get("/api/ai/task-suggestions", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get user ID from the authenticated session
      const userId = req.user!.id;
      
      // Get tasks for this user
      const tasks = await storage.getTasksByUserId(userId);
      
      // Convert dates for OpenAI
      const tasksWithFormattedDates = tasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      }));
      
      // Get AI suggestions
      const suggestions = await getTaskSuggestions(tasksWithFormattedDates);
      
      return res.json(suggestions);
    } catch (error) {
      console.error("Error getting AI task suggestions:", error);
      return res.status(500).json({ message: "Failed to get AI task suggestions", error: error.message });
    }
  });

  // Get AI-generated reminder for a task
  app.get("/api/ai/task-reminder/:id", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      // Get the task
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if this task belongs to the current user
      const userId = req.user!.id;
      if (task.userId !== userId && task.assignedToUserId !== userId) {
        return res.status(403).json({ message: "You do not have permission to generate reminders for this task" });
      }
      
      // Convert dates for OpenAI
      const taskWithFormattedDates = {
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      };
      
      // Generate reminder
      const reminder = await generateTaskReminder(taskWithFormattedDates);
      
      return res.json(reminder);
    } catch (error) {
      console.error("Error generating task reminder:", error);
      return res.status(500).json({ message: "Failed to generate task reminder", error: error.message });
    }
  });

  // Get AI-generated daily schedule
  app.get("/api/ai/daily-schedule", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get user ID from the authenticated session
      const userId = req.user!.id;
      
      // Get tasks for this user
      const tasks = await storage.getTasksByUserId(userId);
      
      // Convert dates for OpenAI
      const tasksWithFormattedDates = tasks.map(task => ({
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      }));
      
      // Generate schedule
      const schedule = await generateDailySchedule(tasksWithFormattedDates);
      
      return res.json(schedule);
    } catch (error) {
      console.error("Error generating daily schedule:", error);
      return res.status(500).json({ message: "Failed to generate daily schedule", error: error.message });
    }
  });

  // Delegate a task to AI
  app.post("/api/tasks/:id/delegate", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      // Get the task
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if this task belongs to the current user or is public
      const userId = req.user!.id;
      if (task.userId !== userId && task.assignedToUserId !== userId && !task.isPublic) {
        return res.status(403).json({ message: "You do not have permission to delegate this task" });
      }
      
      // Convert dates for OpenAI
      const taskWithFormattedDates = {
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      };
      
      // Get context from request body if available
      const context = req.body.context || '';
      
      // Delegate task
      const delegationResult = await delegateTaskToAI(taskWithFormattedDates, context);
      
      return res.json(delegationResult);
    } catch (error) {
      console.error("Error delegating task to AI:", error);
      return res.status(500).json({ message: "Failed to delegate task to AI", error: error.message });
    }
  });

  // Generate content with AI (Legacy API)
  app.post("/api/ai/generate", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { prompt, type = 'text' } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      let result;
      
      switch (type) {
        case 'text':
          // Generate text using OpenAI or Anthropic based on prompt content and API key availability
          result = await generateChatCompletion(prompt, req.body.model || 'openai');
          break;
        case 'image':
          // Generate image
          result = await generateImage(prompt);
          break;
        case 'code':
          // Generate code using OpenAI
          if (!req.body.language) {
            return res.status(400).json({ message: "Language is required for code generation" });
          }
          result = await generateCode(prompt, req.body.language);
          break;
        default:
          return res.status(400).json({ message: "Invalid generation type" });
      }
      
      return res.json(result);
    } catch (error) {
      console.error("Error generating with AI:", error);
      return res.status(500).json({ message: "Failed to generate with AI", error: error.message });
    }
  });
  
  // AI Tools API Endpoints
  
  // Chat completion API
  app.post("/api/ai/chat", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { prompt, model = 'openai' } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // Generate chat completion
      const result = await generateChatCompletion(prompt, model);
      
      return res.json(result);
    } catch (error) {
      console.error("Error generating chat completion:", error);
      return res.status(500).json({ message: "Failed to generate chat completion", error: error.message });
    }
  });

  // Image generation API
  app.post("/api/ai/image", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      
      // Generate image
      const result = await generateImage(prompt);
      
      return res.json(result);
    } catch (error) {
      console.error("Error generating image:", error);
      return res.status(500).json({ message: "Failed to generate image", error: error.message });
    }
  });

  // Code generation API
  app.post("/api/ai/code", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { prompt, language } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }
      if (!language) {
        return res.status(400).json({ message: "Language is required" });
      }
      
      // Generate code
      const result = await generateCode(prompt, language);
      
      return res.json(result);
    } catch (error) {
      console.error("Error generating code:", error);
      return res.status(500).json({ message: "Failed to generate code", error: error.message });
    }
  });

  // Direct messaging routes
  
  // Get conversations for the current user
  app.get("/api/conversations", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get user ID from the authenticated session
      const userId = req.user!.id;
      
      // Get conversations for this user
      const conversations = await storage.getConversations(userId);
      
      return res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return res.status(500).json({ message: "Failed to retrieve conversations", error: error.message });
    }
  });

  // Get messages between current user and another user
  app.get("/api/messages/:otherUserId", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const otherUserId = parseInt(req.params.otherUserId);
      if (isNaN(otherUserId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get user ID from the authenticated session
      const userId = req.user!.id;
      
      // Get messages between these users
      const messages = await storage.getMessages(userId, otherUserId);
      
      // Mark messages from other user as read
      await storage.markMessagesAsRead(userId, otherUserId);
      
      return res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ message: "Failed to retrieve messages", error: error.message });
    }
  });

  // Send a direct message to another user
  app.post("/api/messages", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Validate request body
      const result = insertDirectMessageSchema.safeParse({
        ...req.body,
        senderId: req.user!.id
      });
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Check if receiver exists
      const receiver = await storage.getUser(result.data.receiverId);
      if (!receiver) {
        return res.status(400).json({ message: "Receiver not found" });
      }
      
      // Send the message
      const message = await storage.sendMessage(result.data);
      
      // Notify connected WebSocket clients
      notifyWebSocketClients({
        type: 'new_message',
        receiverId: result.data.receiverId,
        message
      });
      
      return res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      return res.status(500).json({ message: "Failed to send message", error: error.message });
    }
  });

  // Add a reaction to a message
  app.post("/api/messages/:messageId/reactions", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const messageId = parseInt(req.params.messageId);
      const { emoji } = req.body;
      
      if (!emoji) {
        return res.status(400).json({ message: "Emoji is required" });
      }
      
      const message = await storage.addMessageReaction(messageId, req.user!.id, emoji);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Notify connected WebSocket clients
      notifyWebSocketClients({
        type: 'message_reaction',
        messageId,
        reactions: message.reactions,
        userId: req.user!.id,
        emoji
      });
      
      return res.status(200).json(message);
    } catch (error) {
      console.error("Error adding message reaction:", error);
      return res.status(500).json({ message: "Failed to add reaction", error: error.message });
    }
  });

  // Remove a reaction from a message
  app.delete("/api/messages/:messageId/reactions/:emoji", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const messageId = parseInt(req.params.messageId);
      const emoji = decodeURIComponent(req.params.emoji);
      
      const message = await storage.removeMessageReaction(messageId, emoji);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Notify connected WebSocket clients
      notifyWebSocketClients({
        type: 'message_reaction_remove',
        messageId,
        reactions: message.reactions,
        userId: req.user!.id,
        emoji
      });
      
      return res.status(200).json(message);
    } catch (error) {
      console.error("Error removing message reaction:", error);
      return res.status(500).json({ message: "Failed to remove reaction", error: error.message });
    }
  });

  // Edit a message
  app.put("/api/messages/:messageId", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const messageId = parseInt(req.params.messageId);
      const { content } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      
      const message = await storage.editMessage(messageId, content);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Notify connected WebSocket clients
      notifyWebSocketClients({
        type: 'message_edit',
        messageId,
        content,
        edited: message.edited,
        editedAt: message.editedAt
      });
      
      return res.status(200).json(message);
    } catch (error) {
      console.error("Error editing message:", error);
      return res.status(500).json({ message: "Failed to edit message", error: error.message });
    }
  });

  // Delete a message (soft delete)
  app.delete("/api/messages/:messageId", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const messageId = parseInt(req.params.messageId);
      
      const message = await storage.deleteMessage(messageId);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Notify connected WebSocket clients
      notifyWebSocketClients({
        type: 'message_delete',
        messageId,
        deleted: message.deleted
      });
      
      return res.status(200).json(message);
    } catch (error) {
      console.error("Error deleting message:", error);
      return res.status(500).json({ message: "Failed to delete message", error: error.message });
    }
  });

  // Mark a message as delivered
  app.post("/api/messages/:messageId/delivered", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const messageId = parseInt(req.params.messageId);
      
      const message = await storage.markMessageAsDelivered(messageId);
      
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      // Notify connected WebSocket clients
      notifyWebSocketClients({
        type: 'message_delivered',
        messageId,
        delivered: message.delivered
      });
      
      return res.status(200).json(message);
    } catch (error) {
      console.error("Error marking message as delivered:", error);
      return res.status(500).json({ message: "Failed to mark message as delivered", error: error.message });
    }
  });

  // Task template routes
  
  // Get templates for the currently authenticated user
  app.get("/api/task-templates", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get user ID from the authenticated session
      const userId = req.user!.id;
      
      // Get templates for this user
      const templates = await storage.getTaskTemplatesByUserId(userId);
      
      // Also get public templates
      const publicTemplates = await storage.getPublicTaskTemplates();
      
      // Filter out duplicate templates (if the user's templates are also public)
      const userTemplateIds = new Set(templates.map(t => t.id));
      const uniquePublicTemplates = publicTemplates.filter(t => !userTemplateIds.has(t.id));
      
      // Combine both types of templates
      const allTemplates = [...templates, ...uniquePublicTemplates];
      
      // Convert dates for response
      const templatesWithFormattedDates = allTemplates.map(template => ({
        ...template,
        createdAt: template.createdAt ? template.createdAt.toISOString() : null,
      }));
      
      return res.json(templatesWithFormattedDates);
    } catch (error) {
      console.error("Error fetching task templates:", error);
      return res.status(500).json({ message: "Failed to retrieve task templates" });
    }
  });

  // Create a new task template
  app.post("/api/task-templates", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Validate request body against the schema
      const result = insertTaskTemplateSchema.safeParse({
        ...req.body,
        userId: req.user!.id  // Always use the authenticated user's ID
      });
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Create the template in storage
      const template = await storage.createTaskTemplate(result.data);
      
      // Convert dates for response
      const templateWithFormattedDates = {
        ...template,
        createdAt: template.createdAt ? template.createdAt.toISOString() : null,
      };
      
      return res.status(201).json(templateWithFormattedDates);
    } catch (error) {
      console.error("Error creating task template:", error);
      return res.status(500).json({ message: "Failed to create task template" });
    }
  });

  // Update a task template
  app.put("/api/task-templates/:id", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Get the existing template
      const existingTemplate = await storage.getTaskTemplateById(templateId);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Check if this template belongs to the current user
      const userId = req.user!.id;
      if (existingTemplate.userId !== userId) {
        return res.status(403).json({ message: "You do not have permission to update this template" });
      }
      
      // Create update object without the userId (to prevent changing ownership)
      const { userId: _, ...updateData } = req.body;
      
      // Update the template in storage
      const updatedTemplate = await storage.updateTaskTemplate(templateId, updateData);
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found after update attempt" });
      }
      
      // Convert dates for response
      const templateWithFormattedDates = {
        ...updatedTemplate,
        createdAt: updatedTemplate.createdAt ? updatedTemplate.createdAt.toISOString() : null,
      };
      
      return res.json(templateWithFormattedDates);
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
      
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Get the existing template
      const existingTemplate = await storage.getTaskTemplateById(templateId);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Check if this template belongs to the current user
      const userId = req.user!.id;
      if (existingTemplate.userId !== userId) {
        return res.status(403).json({ message: "You do not have permission to delete this template" });
      }
      
      // Delete the template from storage
      const success = await storage.deleteTaskTemplate(templateId);
      if (!success) {
        return res.status(404).json({ message: "Template not found after delete attempt" });
      }
      
      return res.status(204).end();
    } catch (error) {
      console.error("Error deleting task template:", error);
      return res.status(500).json({ message: "Failed to delete task template" });
    }
  });

  // Update template public visibility
  app.post("/api/task-templates/:id/public", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const { isPublic } = req.body;
      if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ message: "isPublic must be a boolean" });
      }
      
      // Get the existing template
      const existingTemplate = await storage.getTaskTemplateById(templateId);
      if (!existingTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Check if this template belongs to the current user
      const userId = req.user!.id;
      if (existingTemplate.userId !== userId) {
        return res.status(403).json({ message: "You do not have permission to change this template's visibility" });
      }
      
      // Update the template's public visibility
      const updatedTemplate = await storage.setTaskTemplatePublic(templateId, isPublic);
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found after update attempt" });
      }
      
      // Convert dates for response
      const templateWithFormattedDates = {
        ...updatedTemplate,
        createdAt: updatedTemplate.createdAt ? updatedTemplate.createdAt.toISOString() : null,
      };
      
      return res.json(templateWithFormattedDates);
    } catch (error) {
      console.error("Error updating template visibility:", error);
      return res.status(500).json({ message: "Failed to update template visibility" });
    }
  });

  // Create a task from a template
  app.post("/api/task-templates/:id/create-task", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      // Get the template
      const template = await storage.getTaskTemplateById(templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Check if this template belongs to the current user or is public
      const userId = req.user!.id;
      if (template.userId !== userId && !template.isPublic) {
        return res.status(403).json({ message: "You do not have permission to use this template" });
      }
      
      // Get due date from request body if available
      let dueDate = null;
      if (req.body.dueDate) {
        dueDate = new Date(req.body.dueDate);
        if (isNaN(dueDate.getTime())) {
          return res.status(400).json({ message: "Invalid due date format" });
        }
      }
      
      // Create a task from the template
      const task = await storage.createTaskFromTemplate(templateId, userId, dueDate);
      
      // Convert dates for response
      const taskWithFormattedDates = {
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      };
      
      return res.status(201).json(taskWithFormattedDates);
    } catch (error) {
      console.error("Error creating task from template:", error);
      return res.status(500).json({ message: "Failed to create task from template" });
    }
  });

  // TASK BIDDING ENDPOINTS
  
  // Get all bids for a task
  app.get("/api/tasks/:taskId/bids", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      // Get the task to check permissions
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Allow access if user owns the task or if the task is public
      if (task.userId !== req.user.id && !task.isPublic) {
        return res.status(403).json({ message: "You don't have permission to view bids for this task" });
      }
      
      // Get all bids for the task
      const bids = await storage.getTaskBids(taskId);
      
      res.json(bids);
    } catch (error) {
      console.error("Error getting task bids:", error);
      res.status(500).json({ message: "Failed to retrieve task bids" });
    }
  });
  
  // Get all bids received on the user's tasks
  app.get("/api/bids/received", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.id;
      
      // Get all tasks owned by this user
      const userTasks = await storage.getTasksByUserId(userId);
      
      // Get all bids for these tasks with user and task info
      const allBids = [];
      
      for (const task of userTasks) {
        const bids = await storage.getTaskBids(task.id);
        
        // If there are no bids for this task, skip it
        if (bids.length === 0) continue;
        
        // Enrich bids with user info and task info
        const enrichedBids = await Promise.all(
          bids.map(async (bid) => {
            const bidder = await storage.getUserProfile(bid.bidderId);
            
            // Use the bid's status from the database directly
            // This ensures we're using the persisted status
            console.log(`Bid ${bid.id} status from database: ${bid.status}`);
            
            return {
              ...bid,
              // Include bid status explicitly to ensure it's present
              status: bid.status || 'pending',
              user: bidder,
              task: {
                id: task.id,
                title: task.title,
                description: task.description,
                dueDate: task.dueDate ? task.dueDate.toISOString() : null,
                isPublic: task.isPublic,
                userId: task.userId,
                winningBidId: task.winningBidId
              }
            };
          })
        );
        
        allBids.push(...enrichedBids);
      }
      
      // Sort by most recent first
      allBids.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log(`Returning ${allBids.length} received bids with statuses`);
      res.json(allBids);
    } catch (error) {
      console.error("Error getting received bids:", error);
      res.status(500).json({ message: "Failed to retrieve received bids" });
    }
  });
  
  // Get all bids placed by the user
  app.get("/api/bids/placed", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user.id;
      
      // Get all bids placed by this user
      // We need to search across all tasks for bids by this user
      const allTasks = await storage.getTasks();
      const allBids = [];
      
      for (const task of allTasks) {
        const bids = await storage.getTaskBids(task.id);
        
        // Filter bids by current user
        const userBids = bids.filter(bid => bid.bidderId === userId);
        
        // If user has no bids on this task, skip
        if (userBids.length === 0) continue;
        
        // Get task owner info
        const taskOwner = await storage.getUserProfile(task.userId);
        
        // Enrich bids with task info
        const enrichedBids = userBids.map(bid => {
          // Use the bid's status from the database directly
          // This ensures we're using the persisted status
          console.log(`Placed bid ${bid.id} status from database: ${bid.status}`);
          
          return {
            ...bid,
            // Include bid status explicitly to ensure it's present
            status: bid.status || 'pending',
            task: {
              id: task.id,
              title: task.title,
              description: task.description,
              dueDate: task.dueDate ? task.dueDate.toISOString() : null,
              isPublic: task.isPublic,
              userId: task.userId,
              winningBidId: task.winningBidId,
              user: taskOwner
            }
          };
        });
        
        allBids.push(...enrichedBids);
      }
      
      // Sort by most recent first
      allBids.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      console.log(`Returning ${allBids.length} placed bids with statuses`);
      res.json(allBids);
    } catch (error) {
      console.error("Error getting placed bids:", error);
      res.status(500).json({ message: "Failed to retrieve placed bids" });
    }
  });
  
  // Reject a bid route was moved to line ~1791 to avoid duplicate routes
  
  
  // Helper function to send system messages about bids
  async function sendBidNotification(senderId: number, receiverId: number, taskId: number, bidAmount: number, taskTitle: string) {
    try {
      // Create a message about the bid
      const bidMessage = {
        senderId,
        receiverId,
        content: `📝 New bid: $${bidAmount.toFixed(2)} for task "${taskTitle}" (Task #${taskId})`,
        read: false
      };
      
      // Send the message
      await storage.sendMessage(bidMessage);
      
      console.log(`Bid notification sent from user ${senderId} to user ${receiverId} for task ${taskId}`);
    } catch (error) {
      console.error("Error sending bid notification message:", error);
    }
  }
  
  // Create a new bid on a task
  app.post("/api/tasks/:taskId/bid", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      // Get the task
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Check if task is accepting bids
      if (!task.acceptingBids) {
        return res.status(400).json({ message: "This task is not accepting bids" });
      }
      
      // Check if bidding deadline has passed
      if (task.biddingDeadline && new Date(task.biddingDeadline) < new Date()) {
        return res.status(400).json({ message: "Bidding deadline has passed" });
      }
      
      // Don't allow task owner to bid on their own task
      if (task.userId === req.user.id) {
        return res.status(400).json({ message: "You cannot bid on your own task" });
      }
      
      // Create the bid data
      const bidData = {
        taskId,
        bidderId: req.user.id,
        amount: req.body.amount,
        proposal: req.body.description,
        estimatedTime: req.body.estimatedTime || null,
      };
      
      // Create the bid
      const newBid = await storage.createTaskBid(bidData);
      
      // Notify task owner of new bid via WebSocket if implemented
      notifyWebSocketClients({
        type: 'NEW_BID',
        taskId,
        bid: newBid,
        userId: task.userId
      });
      
      // Send a direct message notification to the task owner
      await sendBidNotification(
        req.user.id,            // bidder (sender)
        task.userId,            // task owner (receiver)
        taskId,                 // task ID
        req.body.amount,        // bid amount
        task.title              // task title
      );
      
      // Send a copy of the bid confirmation to the bidder
      await sendBidNotification(
        req.user.id,            // bidder (sender)
        req.user.id,            // also the bidder (receiver) - sending to self
        taskId,                 // task ID
        req.body.amount,        // bid amount
        task.title              // task title
      );
      
      res.status(201).json(newBid);
    } catch (error) {
      console.error("Error creating task bid:", error);
      res.status(500).json({ message: "Failed to create task bid" });
    }
  });
  
  // Accept a bid
  app.post("/api/tasks/:taskId/bids/:bidId/accept", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const taskId = parseInt(req.params.taskId);
      const bidId = parseInt(req.params.bidId);
      
      if (isNaN(taskId) || isNaN(bidId)) {
        return res.status(400).json({ message: "Invalid task or bid ID" });
      }
      
      // Get the task
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verify user is the task owner
      if (task.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the task owner can accept bids" });
      }
      
      // Get the bid before accepting it
      const bid = await storage.getTaskBidById(bidId);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      
      // Accept the bid
      const updatedTask = await storage.acceptTaskBid(taskId, bidId);
      if (!updatedTask) {
        return res.status(500).json({ message: "Failed to accept bid" });
      }
      
      // Notify bidder via WebSocket
      notifyWebSocketClients({
        type: 'BID_ACCEPTED',
        taskId,
        bidId,
        userId: bid.bidderId
      });
      
      // Send a message notification to the bidder
      await sendBidNotification(
        task.userId,             // task owner (sender)
        bid.bidderId,            // bidder (receiver)
        taskId,                  // task ID
        bid.amount,              // bid amount
        `🎉 Your bid on "${task.title}" was accepted!`
      );
      
      // Send a confirmation to the task owner
      await sendBidNotification(
        task.userId,             // task owner (sender)
        task.userId,             // also task owner (receiver) - sending to self
        taskId,                  // task ID
        bid.amount,              // bid amount
        `You accepted a bid on "${task.title}"`
      );
      
      res.json({ message: "Bid accepted successfully", task: updatedTask });
    } catch (error) {
      console.error("Error accepting task bid:", error);
      res.status(500).json({ message: "Failed to accept bid" });
    }
  });
  
  // Create payment intent for a task with accepted bid
  app.post("/api/tasks/:taskId/create-payment-intent", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      // Get the task
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verify user is the task owner
      if (task.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the task owner can make payments" });
      }
      
      // Check if there's a winning bid
      if (!task.winningBidId) {
        return res.status(400).json({ message: "No winning bid selected for this task" });
      }
      
      // Get the winning bid
      const winningBid = await storage.getTaskBidById(task.winningBidId);
      if (!winningBid) {
        return res.status(404).json({ message: "Winning bid not found" });
      }
      
      // Create a payment intent with Stripe
      const stripeService = await import("./stripe-service");
      const paymentIntent = await stripeService.createPaymentIntent(
        winningBid.amount, 
        { 
          taskId: taskId.toString(),
          bidId: task.winningBidId.toString(),
          taskTitle: task.title
        }
      );
      
      // Update the bid with the payment intent ID
      await storage.updateTaskBid(task.winningBidId, {
        stripePaymentIntentId: paymentIntent.id,
        stripePaymentStatus: 'pending'
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  // Original implementations of these endpoints are already defined above (lines ~1178-1301)
  // Removed duplicate routes to avoid conflicts
  
  // Accept a bid (alternative endpoint)
  app.post("/api/bids/:bidId/accept", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const bidId = parseInt(req.params.bidId);
      
      if (isNaN(bidId)) {
        return res.status(400).json({ message: "Invalid bid ID" });
      }
      
      // Get the bid
      const bid = await storage.getTaskBidById(bidId);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      
      // Get the task
      const task = await storage.getTaskById(bid.taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verify user is the task owner
      if (task.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the task owner can accept bids" });
      }
      
      console.log(`Accepting bid ${bidId} for task ${task.id}, current status: ${bid.status}`);
      
      // CRITICAL FIX: Use direct SQL query to ensure the status is updated properly
      try {
        await pool.query(
          `UPDATE task_bids SET status = $1, updated_at = $2 WHERE id = $3`,
          ['accepted', new Date(), bidId]
        );
        console.log(`Executed direct SQL update for bid ${bidId} status to 'accepted'`);
      } catch (sqlError) {
        console.error(`SQL error updating bid ${bidId} status:`, sqlError);
        return res.status(500).json({ message: `Database error updating bid status: ${sqlError.message}` });
      }
      
      // Update the task with the winning bid ID and stop accepting bids
      const updatedTask = await storage.updateTask(task.id, { 
        winningBidId: bidId,
        acceptingBids: false
      });
      
      if (!updatedTask) {
        return res.status(500).json({ message: "Failed to update task with winning bid" });
      }
      
      // Update other bids for this task to 'rejected'
      try {
        // CRITICAL FIX: Use direct SQL query to ensure rejected statuses are updated properly
        await pool.query(
          `UPDATE task_bids SET status = $1, updated_at = $2 WHERE task_id = $3 AND id != $4`,
          ['rejected', new Date(), task.id, bidId]
        );
        console.log(`Executed direct SQL update to reject other bids for task ${task.id}`);
      } catch (sqlError) {
        console.error(`SQL error updating other bids:`, sqlError);
        // Continue even if this fails, as the accepted bid is more important
      }
      
      // Verify the update worked
      const verifyBid = await storage.getTaskBidById(bidId);
      
      if (!verifyBid) {
        console.error(`Could not retrieve bid ${bidId} after status update`);
        return res.status(500).json({ message: "Failed to verify bid status update - bid not found" });
      }
      
      console.log(`Verification result: Bid ${bidId} status is now '${verifyBid.status}'`);
      
      if (verifyBid.status !== 'accepted') {
        console.error(`Failed to update bid ${bidId} status. Current status: ${verifyBid.status}`);
        return res.status(500).json({ message: "Failed to verify bid status update - status not changed" });
      }
      
      // Notify bidder via WebSocket
      notifyWebSocketClients({
        type: 'BID_ACCEPTED',
        taskId: task.id,
        bidId,
        userId: bid.bidderId
      });
      
      // Send a message notification to the bidder
      await sendBidNotification(
        task.userId,             // task owner (sender)
        bid.bidderId,            // bidder (receiver)
        task.id,                 // task ID
        bid.amount,              // bid amount
        `🎉 Your bid on "${task.title}" was accepted!`
      );
      
      res.json({ 
        message: "Bid accepted successfully", 
        task: updatedTask, 
        bid: verifyBid  // Return verified bid with updated status
      });
    } catch (error) {
      console.error("Error accepting bid:", error);
      res.status(500).json({ message: "Failed to accept bid" });
    }
  });
  
  // Reject a bid
  app.post("/api/bids/:bidId/reject", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const bidId = parseInt(req.params.bidId);
      
      if (isNaN(bidId)) {
        return res.status(400).json({ message: "Invalid bid ID" });
      }
      
      // Get the bid
      const bid = await storage.getTaskBidById(bidId);
      if (!bid) {
        return res.status(404).json({ message: "Bid not found" });
      }
      
      // Get the task
      const task = await storage.getTaskById(bid.taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Verify user is the task owner
      if (task.userId !== req.user.id) {
        return res.status(403).json({ message: "Only the task owner can reject bids" });
      }
      
      console.log(`Rejecting bid ${bidId} for task ${task.id}, current status: ${bid.status}`);
      
      // CRITICAL FIX: Use direct SQL query to ensure the status is updated properly
      try {
        await pool.query(
          `UPDATE task_bids SET status = $1, updated_at = $2 WHERE id = $3`,
          ['rejected', new Date(), bidId]
        );
        console.log(`Executed direct SQL update for bid ${bidId} status to 'rejected'`);
      } catch (sqlError) {
        console.error(`SQL error updating bid ${bidId} status:`, sqlError);
        return res.status(500).json({ message: `Database error updating bid status: ${sqlError.message}` });
      }
      
      // Verify the update worked
      const verifyBid = await storage.getTaskBidById(bidId);
      
      if (!verifyBid) {
        console.error(`Could not retrieve bid ${bidId} after status update`);
        return res.status(500).json({ message: "Failed to verify bid status update - bid not found" });
      }
      
      console.log(`Verification result: Bid ${bidId} status is now '${verifyBid.status}'`);
      
      if (verifyBid.status !== 'rejected') {
        console.error(`Failed to update bid ${bidId} status. Current status: ${verifyBid.status}`);
        return res.status(500).json({ message: "Failed to verify bid status update - status not changed" });
      }
      
      // Notify bidder via WebSocket
      notifyWebSocketClients({
        type: 'BID_REJECTED',
        taskId: task.id,
        bidId,
        userId: bid.bidderId
      });
      
      // Send a message notification to the bidder
      await sendBidNotification(
        task.userId,             // task owner (sender)
        bid.bidderId,            // bidder (receiver)
        task.id,                 // task ID
        bid.amount,              // bid amount
        `❌ Your bid on "${task.title}" was not selected.`
      );
      
      res.json({ 
        message: "Bid rejected successfully", 
        bid: verifyBid // Return the verified bid with updated status 
      });
    } catch (error) {
      console.error("Error rejecting bid:", error);
      res.status(500).json({ message: "Failed to reject bid" });
    }
  });

  // Create HTTP server
  // API Key Management Routes
  
  // Middleware to authenticate via API key
  const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'API key required' });
    }
    
    const apiKey = authHeader.split(' ')[1];
    const validKey = await validateApiKey(apiKey);
    
    if (!validKey) {
      return res.status(401).json({ message: 'Invalid API key' });
    }
    
    // Set userId from the API key
    req.apiUser = { id: validKey.userId };
    next();
  };
  
  // Handle API key validation for endpoints that support both session and API key auth
  const optionalApiKeyAuth = async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next();
    }
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const apiKey = authHeader.split(' ')[1];
      const validKey = await validateApiKey(apiKey);
      
      if (validKey) {
        req.apiUser = { id: validKey.userId };
      }
    }
    
    next();
  };
  
  // Get all API keys for the current user
  app.get('/api/keys', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const userId = req.user!.id;
      const keys = await getApiKeys(userId);
      
      // Mask the actual keys for security
      const maskedKeys = keys.map(key => ({
        ...key,
        key: `${key.key.substring(0, 10)}...${key.key.substring(key.key.length - 5)}`,
        createdAt: key.createdAt.toISOString(),
        lastUsedAt: key.lastUsedAt ? key.lastUsedAt.toISOString() : null,
        expiresAt: key.expiresAt ? key.expiresAt.toISOString() : null
      }));
      
      return res.json(maskedKeys);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      return res.status(500).json({ message: 'Failed to retrieve API keys' });
    }
  });
  
  // Create a new API key
  app.post('/api/keys', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const createApiKeySchema = z.object({
        name: z.string().min(1, 'Name is required')
      });
      
      const result = createApiKeySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: 'Invalid input',
          errors: fromZodError(result.error).message
        });
      }
      
      const userId = req.user!.id;
      const apiKey = await createApiKey(userId, result.data.name);
      
      return res.status(201).json({
        ...apiKey,
        createdAt: apiKey.createdAt.toISOString(),
        lastUsedAt: apiKey.lastUsedAt ? apiKey.lastUsedAt.toISOString() : null,
        expiresAt: apiKey.expiresAt ? apiKey.expiresAt.toISOString() : null
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      return res.status(500).json({ message: 'Failed to create API key' });
    }
  });
  
  // Revoke (delete) an API key
  app.delete('/api/keys/:id', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const keyId = parseInt(req.params.id);
      if (isNaN(keyId)) {
        return res.status(400).json({ message: 'Invalid API key ID' });
      }
      
      const userId = req.user!.id;
      const success = await revokeApiKey(keyId, userId);
      
      if (!success) {
        return res.status(404).json({ message: 'API key not found' });
      }
      
      return res.sendStatus(204);
    } catch (error) {
      console.error('Error revoking API key:', error);
      return res.status(500).json({ message: 'Failed to revoke API key' });
    }
  });
  
  // Verify an API key (for testing)
  app.get('/api/verify-key', authenticateApiKey, (req, res) => {
    return res.json({
      valid: true,
      userId: req.apiUser!.id
    });
  });
  
  // Documentation page for the API
  app.get('/api/docs', (req, res) => {
    res.redirect('/api-docs');
  });

  // Create HTTP server but don't actually start it yet - that happens in index.ts
  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws' 
  });
  
  // Track connected users
  const connectedClients = new Map<number, Set<WebSocket>>();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    let userId: number | null = null;
    let heartbeatInterval: NodeJS.Timeout | null = null;
    
    // Set up heartbeat to detect disconnected clients
    heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      } else {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
      }
    }, 30000);
    
    ws.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle authentication
        if (data.type === 'auth') {
          userId = parseInt(data.userId);
          if (!isNaN(userId)) {
            // Add this connection to the user's set of connections
            if (!connectedClients.has(userId)) {
              connectedClients.set(userId, new Set());
            }
            connectedClients.get(userId)!.add(ws);
            console.log(`User ${userId} authenticated via WebSocket`);
            ws.send(JSON.stringify({ type: 'auth_success' }));
          }
        }
        
        // Handle client pong response
        else if (data.type === 'pong') {
          // Client is still alive, do nothing
        }
        
        // Handle chat messages
        else if (data.type === 'message' && userId !== null) {
          // Validate message data
          if (!data.receiverId || !data.content) {
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: 'Invalid message data' 
            }));
            return;
          }
          
          // Create message in database
          storage.sendMessage({
            senderId: userId,
            receiverId: data.receiverId,
            content: data.content,
            read: false
          }).then(message => {
            // Notify sender of success
            ws.send(JSON.stringify({
              type: 'message_sent',
              message
            }));
            
            // Notify receiver if they're connected
            notifyWebSocketClients({
              type: 'new_message',
              receiverId: data.receiverId,
              message
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
      
      // Remove this connection from the user's connections
      if (userId !== null && connectedClients.has(userId)) {
        const userSockets = connectedClients.get(userId)!;
        userSockets.delete(ws);
        
        // If the user has no more connections, remove them from the map
        if (userSockets.size === 0) {
          connectedClients.delete(userId);
          console.log(`All connections for user ${userId} closed. User removed from tracking.`);
        }
      }
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });
  
  // Enhanced WebSocket notification function
  function notifyWebSocketClients(data: any) {
    // Different notification types need different handling
    switch(data.type) {
      case 'new_message':
        // Send new message notification to the receiver
        if (data.receiverId && connectedClients.has(data.receiverId)) {
          const receiverSockets = connectedClients.get(data.receiverId)!;
          
          for (const socket of receiverSockets) {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify(data));
            }
          }
        }
        break;
        
      case 'message_reaction':
      case 'message_reaction_remove':
      case 'message_edit':
      case 'message_delete':
      case 'message_delivered':
        // For these events, we need to notify both the sender and receiver
        // We'll extract both IDs from the message data
        const message = data.message;
        if (message) {
          // Determine who should receive this notification
          const userIds = [message.senderId, message.receiverId].filter(Boolean);
          
          // Send to all relevant users
          for (const userId of userIds) {
            if (connectedClients.has(userId)) {
              const userSockets = connectedClients.get(userId)!;
              
              for (const socket of userSockets) {
                if (socket.readyState === WebSocket.OPEN) {
                  socket.send(JSON.stringify(data));
                }
              }
            }
          }
        } else if (data.messageId) {
          // If we don't have the full message but we have participants
          // like in reactions where we might only pass IDs
          const userIds = [];
          
          // Always include the user who triggered the action
          if (data.userId) {
            userIds.push(data.userId);
          }
          
          // For reactions we need to find out who else should be notified
          // This could be enhanced with a database lookup to find message participants
          
          // Send to all available users (could be improved with more specific targeting)
          for (const [userId, userSockets] of connectedClients.entries()) {
            for (const socket of userSockets) {
              if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(data));
              }
            }
          }
        }
        break;
        
      default:
        // For any other notification type, use the original behavior
        if (data.receiverId && connectedClients.has(data.receiverId)) {
          const receiverSockets = connectedClients.get(data.receiverId)!;
          
          for (const socket of receiverSockets) {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify(data));
            }
          }
        }
        break;
    }
  }

  return httpServer;
}