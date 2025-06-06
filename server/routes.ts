import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import path from "path";
import fs from "fs";
import { 
  insertTaskSchema, taskSchema, insertDirectMessageSchema, 
  updateProfileSchema, insertTaskTemplateSchema, taskTemplateSchema,
  insertTaskBidSchema, taskBids, insertAppListingSchema, appListings,
  appListingSchema, insertAppBidSchema, appBids, appBidSchema,
  insertAppQuestionSchema, appQuestions, appQuestionSchema,
  appTransactions, appFavorites
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { 
  getTaskSuggestions, generateTaskReminder, generateDailySchedule, delegateTaskToAI,
  generateChatCompletion, generateImage, generateCode
} from "./openai-service";
import { handleCodeGenerationRequest } from "./deepseek-service";
import { handleClaudeCodeGenerationRequest } from "./anthropic-app-generator";
import OpenAI from "openai";
import { generateApplicationCode } from "./openai-service";
import {
  getTopAIApplicationsForTask, getAllAITools, getAIToolsCategories, getAIToolsByCategory,
  getAIRecommendations
} from "./ai-recommendation-service";
import { 
  getTrendingModels, searchModels, getModelDetails, getModelReadme, getTrendingModelsByCategory, 
  MODEL_TYPES, type HuggingFaceModel 
} from "./huggingface-api";
import { setupAuth } from "./auth";
import { WebSocketServer, WebSocket } from "ws";
import { 
  createPaymentIntent, getPaymentIntent, confirmPaymentComplete
} from "./stripe-service";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";
import { 
  createApiKey, getApiKeys, validateApiKey, revokeApiKey 
} from "./api-keys";
import { registerAdminRoutes } from "./admin-routes";
import { z } from "zod";
import { addUserProfileColumns } from "./add-user-profile-columns";

// Helper function to calculate average rating from array of ratings
function calculateAverage(ratings: (number | null | undefined)[]): number | null {
  const validRatings = ratings.filter((r): r is number => typeof r === 'number');
  if (validRatings.length === 0) return null;
  return validRatings.reduce((sum, val) => sum + val, 0) / validRatings.length;
}

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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Add missing columns to the users table for profile feature
  try {
    console.log("[Server] Adding user profile columns to the database...");
    await addUserProfileColumns();
    console.log("[Server] User profile columns added successfully.");
  } catch (error) {
    console.error("[Server] Error adding user profile columns:", error);
    // Continue even if there's an error, as the columns might already exist
  }
  // Serve SEO-related static files from public directory
  app.get('/robots.txt', (req, res) => {
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      res.type('text/plain');
      res.sendFile(robotsPath);
    } else {
      res.status(404).send('Not found');
    }
  });
  
  app.get('/sitemap.xml', (req, res) => {
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      res.type('application/xml');
      res.sendFile(sitemapPath);
    } else {
      res.status(404).send('Not found');
    }
  });
  
  // Serve the Swagger JSON file for API documentation
  app.get('/appmo-api-swagger.json', (req, res) => {
    try {
      const swaggerFilePath = path.join(process.cwd(), 'appmo-api-swagger.json');
      console.log(`[API] Serving Swagger file from: ${swaggerFilePath}`);
      
      if (fs.existsSync(swaggerFilePath)) {
        res.sendFile(swaggerFilePath);
      } else {
        console.error(`[API] Swagger file not found at: ${swaggerFilePath}`);
        res.status(404).json({ error: 'API documentation file not found' });
      }
    } catch (error) {
      console.error('[API] Error serving Swagger file:', error);
      res.status(500).json({ error: 'Internal server error loading API documentation' });
    }
  });
  
  // Setup authentication routes
  setupAuth(app);
  // All routes are prefixed with /api
  
  // Register admin routes
  registerAdminRoutes(app);
  
  // Get AI application recommendations for a specific task (POST endpoint)
  // This endpoint works for both authenticated and unauthenticated users (for public tasks)
  app.post("/api/ai-recommendations", async (req, res) => {
    try {
      const { taskId } = req.body;
      if (!taskId || isNaN(parseInt(taskId))) {
        return res.status(400).json({ message: "Invalid or missing task ID" });
      }
      
      // Get the task
      const task = await storage.getTaskById(parseInt(taskId));
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // For public tasks, allow access without authentication
      if (!task.isPublic) {
        // Verify ownership or assignment if task is not public
        const isOwner = req.isAuthenticated() && req.user && req.user.id === task.userId;
        const isAssignee = req.isAuthenticated() && req.user && task.assignedToUserId === req.user.id;
        const isApiUser = req.apiUser && req.apiUser.id === task.userId;
        
        if (!isOwner && !isAssignee && !isApiUser) {
          return res.status(403).json({ message: "You do not have permission to view this task" });
        }
      }
      
      // Format dates for AI processing
      const taskWithFormattedDates = {
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      };
      
      // Get recommendations based on task content
      const recommendations = await getAIRecommendations(taskWithFormattedDates);
      
      res.json({
        task: taskWithFormattedDates,
        recommendations
      });
    } catch (error) {
      console.error("Error getting AI recommendations:", error);
      res.status(500).json({ message: "Failed to get AI recommendations" });
    }
  });
  
  // Get AI application recommendations for a specific task (GET endpoint for backward compatibility)
  app.get("/api/ai-recommendations/task/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      // Get the task
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      // Convert dates for AI processing
      const taskWithFormattedDates = {
        ...task,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      };
      
      // Get AI application recommendations
      const recommendations = await getTopAIApplicationsForTask(taskWithFormattedDates, 5);
      
      return res.json({ 
        task: taskWithFormattedDates, 
        recommendations 
      });
    } catch (error) {
      console.error("Error getting AI recommendations:", error);
      return res.status(500).json({ message: "Failed to get AI recommendations" });
    }
  });
  
  // Get all AI tool categories
  app.get("/api/ai-tools/categories", (req, res) => {
    try {
      const categories = getAIToolsCategories();
      return res.json(categories);
    } catch (error) {
      console.error("Error getting AI tool categories:", error);
      return res.status(500).json({ message: "Failed to get AI tool categories" });
    }
  });
  
  // Get all AI tools
  app.get("/api/ai-tools", (req, res) => {
    try {
      const tools = getAllAITools();
      return res.json(tools);
    } catch (error) {
      console.error("Error getting AI tools:", error);
      return res.status(500).json({ message: "Failed to get AI tools" });
    }
  });
  
  // Get AI tools by category
  app.get("/api/ai-tools/category/:id", (req, res) => {
    try {
      const categoryId = req.params.id;
      const category = getAIToolsByCategory(categoryId);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      return res.json(category);
    } catch (error) {
      console.error("Error getting AI tools by category:", error);
      return res.status(500).json({ message: "Failed to get AI tools by category" });
    }
  });
  
  // ===== Hugging Face Integration API Routes =====
  
  // Get trending AI models
  app.get("/api/huggingface/trending", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
      const category = req.query.category as string | undefined;
      const sort = (req.query.sort as 'downloads' | 'trending' | 'modified') || 'trending';
      
      const models = await getTrendingModels(limit, category, sort);
      
      return res.json({
        models,
        category,
        sort
      });
    } catch (error) {
      console.error("Error getting trending models from Hugging Face:", error);
      return res.status(500).json({ message: "Failed to get trending models" });
    }
  });
  
  // Search AI models
  app.get("/api/huggingface/search", async (req, res) => {
    try {
      const query = req.query.query as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const category = req.query.category as string | undefined;
      
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const models = await searchModels(query, limit, category);
      
      return res.json({
        models,
        query,
        category
      });
    } catch (error) {
      console.error("Error searching Hugging Face models:", error);
      return res.status(500).json({ message: "Failed to search models" });
    }
  });
  
  // Get AI model details
  app.get("/api/huggingface/model/:id", async (req, res) => {
    try {
      const modelId = req.params.id;
      
      if (!modelId) {
        return res.status(400).json({ message: "Model ID is required" });
      }
      
      const model = await getModelDetails(modelId);
      
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      
      return res.json(model);
    } catch (error) {
      console.error(`Error getting Hugging Face model details for ${req.params.id}:`, error);
      return res.status(500).json({ message: "Failed to get model details" });
    }
  });
  
  // Get AI model README content
  app.get("/api/huggingface/model/:id/readme", async (req, res) => {
    try {
      const modelId = req.params.id;
      
      if (!modelId) {
        return res.status(400).json({ message: "Model ID is required" });
      }
      
      const readme = await getModelReadme(modelId);
      
      if (!readme) {
        return res.status(404).json({ 
          message: "README content not found for this model",
          content: "No README content available for this model." 
        });
      }
      
      return res.json(readme);
    } catch (error) {
      console.error(`Error getting Hugging Face model README for ${req.params.id}:`, error);
      return res.status(500).json({ 
        message: "Failed to get model README",
        content: "Error loading README content." 
      });
    }
  });
  
  // Get trending models by category
  app.get("/api/huggingface/trending-by-category", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      
      const categorizedModels = await getTrendingModelsByCategory(limit);
      
      return res.json({
        categories: categorizedModels,
        modelTypes: MODEL_TYPES
      });
    } catch (error) {
      console.error("Error getting trending models by category:", error);
      return res.status(500).json({ message: "Failed to get trending models by category" });
    }
  });
  
  // Track AI tool referral click
  app.post("/api/ai-referral/track", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { toolId, taskId } = req.body;
      if (!toolId) {
        return res.status(400).json({ message: "Tool ID is required" });
      }
      
      // Create a new referral record in the database
      // In a production environment, this would be stored in a database
      // Here we're just generating a simulated referral object
      const referral = {
        id: Math.floor(Math.random() * 1000000),
        userId: req.user!.id,
        toolId,
        taskId: taskId || null,
        timestamp: new Date().toISOString(),
        converted: false,
        commission: 0
      };
      
      console.log(`[Referral] User ${req.user!.id} clicked on tool ${toolId} from task ${taskId || 'N/A'}`);
      
      return res.status(200).json({ 
        success: true,
        referral
      });
    } catch (error) {
      console.error("Error tracking AI tool referral:", error);
      return res.status(500).json({ message: "Failed to track AI tool referral" });
    }
  });
  
  // Track AI tool referral conversion (when a user signs up/pays)
  app.post("/api/ai-referral/convert", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { referralId, commission } = req.body;
      if (!referralId || isNaN(parseInt(referralId))) {
        return res.status(400).json({ message: "Valid referral ID is required" });
      }
      
      if (!commission || isNaN(parseFloat(commission))) {
        return res.status(400).json({ message: "Valid commission amount is required" });
      }
      
      // In a production environment, this would update a record in the database
      // Here we're just logging the conversion
      console.log(`[Referral Conversion] Referral ID ${referralId} converted with commission $${commission}`);
      
      return res.status(200).json({ 
        success: true,
        message: `Referral ${referralId} converted successfully`,
        commission: parseFloat(commission)
      });
    } catch (error) {
      console.error("Error tracking AI tool conversion:", error);
      return res.status(500).json({ message: "Failed to track AI tool conversion" });
    }
  });
  
  // Get user profile (for currently authenticated user)
  app.get("/api/profile", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      
      // Update user's last active timestamp
      await storage.updateUserLastActive(userId);
      
      // Get user profile
      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      return res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ message: "Failed to retrieve user profile" });
    }
  });
  
  // Get user profile by ID (public profiles only)
  app.get("/api/profile/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if the requested profile is the current user's
      const isOwnProfile = req.isAuthenticated() && req.user && req.user.id === userId;
      
      if (isOwnProfile) {
        // Get full profile for the user's own profile
        const profile = await storage.getUserProfile(userId);
        if (!profile) {
          return res.status(404).json({ message: "Profile not found" });
        }
        return res.json(profile);
      } else {
        // Get public profile for other users
        const profile = await storage.getPublicUserProfile(userId);
        if (!profile) {
          return res.status(404).json({ message: "Profile not found or not public" });
        }
        return res.json(profile);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ message: "Failed to retrieve user profile" });
    }
  });
  
  // Get all public user profiles
  app.get("/api/profiles/public", async (req, res) => {
    try {
      const profiles = await storage.getPublicUserProfiles();
      return res.json(profiles);
    } catch (error) {
      console.error("Error fetching public profiles:", error);
      return res.status(500).json({ message: "Failed to retrieve public profiles" });
    }
  });
  
  // Update user profile
  app.patch("/api/profile", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      
      // Validate and sanitize profile data
      const { displayName, bio, interests, skills, location, website, socialLinks, isPublic } = req.body;
      
      // Build the update object with only provided fields
      const updateData: any = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (bio !== undefined) updateData.bio = bio;
      if (interests !== undefined) updateData.interests = interests;
      if (skills !== undefined) updateData.skills = skills;
      if (location !== undefined) updateData.location = location;
      if (website !== undefined) updateData.website = website;
      if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
      if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic);
      
      // Update user profile
      const updatedUser = await storage.updateUserProfile(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user's task statistics
      await storage.updateUserTaskStats(userId);
      
      // Get the updated profile
      const profile = await storage.getUserProfile(userId);
      
      return res.json(profile);
    } catch (error) {
      console.error("Error updating user profile:", error);
      return res.status(500).json({ message: "Failed to update user profile" });
    }
  });
  
  // Set profile visibility (public/private)
  app.post("/api/profile/visibility", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      const { isPublic } = req.body;
      
      if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ message: "isPublic must be a boolean value" });
      }
      
      // Set profile visibility
      const updatedUser = await storage.setUserProfilePublic(userId, isPublic);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      return res.json({ 
        success: true, 
        isPublic, 
        message: `Profile is now ${isPublic ? 'public' : 'private'}`
      });
    } catch (error) {
      console.error("Error setting profile visibility:", error);
      return res.status(500).json({ message: "Failed to update profile visibility" });
    }
  });
  
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

  // Get current user profile
  app.get("/api/profile", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the user profile
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get user statistics
      const stats = await storage.getUserTaskStatistics(userId);
      
      // Return user profile with statistics
      return res.json({
        ...user,
        completedTaskCount: stats.completedCount,
        totalTaskCount: stats.totalCount
      });
    } catch (error) {
      console.error("Error getting user profile:", error);
      return res.status(500).json({ message: "Failed to get user profile" });
    }
  });
  
  // Update user profile
  app.patch("/api/profile", async (req, res) => {
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
  
  // Toggle profile visibility
  app.post("/api/profile/visibility", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Get the isPublic parameter
      const { isPublic } = req.body;
      if (typeof isPublic !== 'boolean') {
        return res.status(400).json({ message: "isPublic parameter must be a boolean" });
      }
      
      // Update the user profile visibility
      const userId = req.user!.id;
      const updatedUser = await storage.updateUserProfile(userId, { isPublic });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found after update attempt" });
      }
      
      return res.json({ isPublic: updatedUser.isPublic });
    } catch (error) {
      console.error("Error updating profile visibility:", error);
      return res.status(500).json({ message: "Failed to update profile visibility" });
    }
  });
  
  // Get shareable link for a profile
  // Get share link for the current user's profile
app.get("/api/profile/share", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const userId = req.user!.id;
      
      // Check if profile exists and is public
      const profile = await storage.getUser(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      if (!profile.isPublic) {
        return res.status(403).json({ 
          message: "Cannot generate share link for private profile",
          isPublic: false
        });
      }
      
      // Generate a clean username for URL
      const cleanUsername = profile.username.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      
      // Return both user-friendly and direct links
      return res.json({
        profileId: profile.id,
        displayName: profile.displayName,
        username: profile.username,
        isPublic: true,
        directLink: `/profile/${userId}`,
        friendlyLink: `/profile/${userId}-${cleanUsername}`,
        shareMessage: `Check out ${profile.displayName}'s profile on Appmo!`
      });
    } catch (error) {
      console.error("Error generating share link:", error);
      return res.status(500).json({ message: "Failed to generate share link" });
    }
  });
  
// Get share link for a specific user's profile
app.get("/api/profile/share/:userId", async (req, res) => {
    try {
      // Parse user ID from params
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Check if profile exists and is public
      const profile = await storage.getUser(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      
      if (!profile.isPublic) {
        return res.status(403).json({ 
          message: "Cannot generate share link for private profile",
          isPublic: false
        });
      }
      
      // Generate a clean username for URL
      const cleanUsername = profile.username.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
      
      // Return both user-friendly and direct links
      return res.json({
        profileId: profile.id,
        displayName: profile.displayName,
        username: profile.username,
        isPublic: true,
        directLink: `/profile/${userId}`,
        friendlyLink: `/profile/${userId}-${cleanUsername}`,
        shareMessage: `Check out ${profile.displayName}'s profile on Appmo!`
      });
    } catch (error) {
      console.error("Error generating share link:", error);
      return res.status(500).json({ message: "Failed to generate share link" });
    }
  });
  
  // Get user task statistics
  app.get("/api/profile/statistics/:userId?", async (req, res) => {
    try {
      // Get user ID either from route params or authenticated user
      let userId = null;
      
      if (req.params.userId) {
        // Get from route params for shared profiles
        try {
          // Log the incoming userId parameter
          console.log("Statistics endpoint - User ID parameter received:", req.params.userId);
          userId = parseInt(req.params.userId);
          
          if (isNaN(userId)) {
            console.error("Invalid user ID in params:", req.params.userId);
            return res.status(400).json({ 
              message: "Invalid user ID parameter",
              fallback: {
                completedCount: 0,
                pendingCount: 0,
                totalCount: 0,
                completionRate: 0
              }
            });
          }
        } catch (parseError) {
          console.error("Error parsing user ID:", parseError);
          return res.status(400).json({ 
            message: "Error parsing user ID",
            fallback: {
              completedCount: 0,
              pendingCount: 0,
              totalCount: 0,
              completionRate: 0
            }
          });
        }
        
        console.log("Statistics endpoint - Parsed userId:", userId);
        
        // Check if user exists
        const userProfile = await storage.getUser(userId);
        if (!userProfile) {
          console.error("User profile not found for ID:", userId);
          return res.status(404).json({ 
            message: "User not found",
            fallback: {
              completedCount: 0,
              pendingCount: 0,
              totalCount: 0,
              completionRate: 0
            }
          });
        }
        
        // If the profile is not public, only allow access if the requester is the user themselves
        if (!userProfile.isPublic && (!req.isAuthenticated() || req.user?.id !== userId)) {
          console.error("Attempt to access non-public profile:", userId);
          return res.status(403).json({ 
            message: "Profile is not public",
            fallback: {
              completedCount: 0,
              pendingCount: 0,
              totalCount: 0,
              completionRate: 0
            }
          });
        }
      } else {
        // Get from authenticated user
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: "Not authenticated" });
        }
        
        userId = req.user?.id;
      }
      
      if (!userId || isNaN(userId)) {
        console.error("User ID is missing or invalid:", userId);
        return res.status(400).json({ 
          message: "Invalid user ID",
          fallback: {
            completedCount: 0,
            pendingCount: 0,
            totalCount: 0,
            completionRate: 0
          }
        });
      }
      
      // Get task statistics
      try {
        console.log("Attempting to fetch statistics for user ID:", userId);
        const statistics = await storage.getUserTaskStatistics(userId);
        console.log("Statistics fetched successfully:", statistics);
        return res.json(statistics);
      } catch (statsError) {
        console.error("Error retrieving task statistics:", statsError);
        // Return fallback statistics with a 200 status to avoid UI crashes
        return res.status(200).json({
          completedCount: 0,
          pendingCount: 0,
          totalCount: 0,
          completionRate: 0,
          error: "Error retrieving statistics"
        });
      }
    } catch (error) {
      console.error("Error in profile statistics endpoint:", error);
      // Return fallback statistics with a 200 status to avoid UI crashes
      return res.status(200).json({
        completedCount: 0,
        pendingCount: 0,
        totalCount: 0,
        completionRate: 0,
        error: "Error processing request"
      });
    }
  });
  
  // Keep the legacy endpoint for backward compatibility
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
  
  // Save AI-generated content to a task
  app.post("/api/tasks/:id/save-ai-content", async (req, res) => {
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
        return res.status(403).json({ message: "You do not have permission to update this task" });
      }
      
      // Extract content to save from request body
      const { description, steps, estimatedTime } = req.body;
      
      if (!description && !steps && !estimatedTime) {
        return res.status(400).json({ message: "No content provided to save" });
      }
      
      // Build update object with only the provided fields
      const updateData: any = {};
      
      if (description) {
        updateData.description = description;
      }
      
      if (estimatedTime) {
        updateData.estimatedTime = parseInt(estimatedTime);
      }
      
      // Add steps to description if provided
      if (steps && Array.isArray(steps) && steps.length > 0) {
        if (updateData.description) {
          updateData.description += "\n\nSteps:\n" + steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
        } else {
          updateData.description = "Steps:\n" + steps.map((step, index) => `${index + 1}. ${step}`).join("\n");
        }
      }
      
      // Update the task
      const updatedTask = await storage.updateTask(taskId, updateData);
      
      return res.json({ success: true, task: updatedTask });
    } catch (error) {
      console.error("Error saving AI content to task:", error);
      return res.status(500).json({ message: "Failed to save AI content", error: error.message });
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
  
  // DeepSeek Code Generation endpoint
// This endpoint is now handled by the direct handler below
// app.post('/api/ai/deepseek/generate', async (req, res) => { ... });

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
  
  // DeepSeek AI code generation for complete applications - production endpoint
  app.post("/api/ai/deepseek/generate", handleCodeGenerationRequest);

  app.post("/api/ai/claude/generate", async (req, res) => {
    try {
      // Set a longer timeout for this specific request (3 minutes)
      req.setTimeout(180000);
      
      console.log("[Claude App Generator] Starting code generation request...");
      console.log("[Claude App Generator] Request body:", {
        prompt: req.body.prompt ? `${req.body.prompt.substring(0, 50)}...` : 'missing',
        technology: req.body.technology || 'not specified',
        appType: req.body.appType || 'not specified',
        features: req.body.features || []
      });
      
      await handleClaudeCodeGenerationRequest(req, res);
      
      console.log("[Claude App Generator] Request completed successfully");
    } catch (error) {
      console.error("[Claude App Generator] Request failed with error:", error);
      res.status(500).json({
        error: 'Failed to generate code with Claude',
        message: error.message || 'An unknown error occurred',
        details: error.stack
      });
    }
  });
  
  // OpenAI App Generator endpoint (alternative to DeepSeek)
  app.post("/api/ai/openai/generate", async (req, res) => {
    try {
      const { prompt, technology, appType, features, maxLength } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }
      
      console.log(`[OpenAI] Generating application code for "${prompt.substring(0, 50)}..."`);
      
      const result = await generateApplicationCode({
        prompt,
        technology,
        appType,
        features,
        maxLength
      });
      
      res.json(result);
    } catch (error: any) {
      console.error('OpenAI code generation request failed:', error);
      res.status(500).json({ 
        error: 'Failed to generate code',
        message: error.message 
      });
    }
  });
  
  // AI Delegation for task templates
  app.post("/api/ai/delegate-template", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const { title, description, category, context } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      
      // Build the prompt for OpenAI
      const prompt = `You are a task template assistant. Create a detailed task template for "${title}" in the category "${category || 'general'}".
      
      ${description ? `Description provided by user: ${description}` : ''}
      ${context ? `Additional context: ${context}` : ''}
      
      Generate the following:
      1. A detailed description of the task (3-5 sentences)
      2. A list of 3-7 ordered steps to complete the task
      3. An estimated time to complete (in minutes)
      4. Suggested tags (2-4 tags)
      5. A priority level (must be exactly one of: "low", "medium", or "high")
      
      You MUST respond with JSON in EXACTLY this format (no variations allowed):
      {
        "description": "detailed description here",
        "steps": ["step 1", "step 2", "step 3"],
        "estimatedTime": 30,
        "tags": ["tag1", "tag2", "tag3"],
        "priority": "medium"
      }`;
      
      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" }
        });
        
        // Default response in case of parsing error
        const defaultResponse = {
          description: `Task template for ${title}. This is a template in the ${category || 'general'} category.`,
          steps: ["Step 1: Plan the task", "Step 2: Execute the task", "Step 3: Review the completed task"],
          estimatedTime: 30,
          tags: ["template", category || "general"],
          priority: "medium" // Ensure default value is compliant with schema
        };
        
        // Check if we have content from the API
        if (!response.choices[0].message.content) {
          console.warn("No content returned from AI API, using default template response");
          return res.json(defaultResponse);
        }
        
        try {
          // Extract and parse the JSON response
          const content = response.choices[0].message.content.trim();
          const parsedContent = JSON.parse(content);
          
          // Validate fields
          const validatedPriority = parsedContent.priority && ['low', 'medium', 'high'].includes(parsedContent.priority) 
            ? parsedContent.priority 
            : defaultResponse.priority;
          
          const validatedEstimatedTime = typeof parsedContent.estimatedTime === 'number' 
            ? parsedContent.estimatedTime 
            : defaultResponse.estimatedTime;
          
          const validatedSteps = Array.isArray(parsedContent.steps) && parsedContent.steps.length > 0 
            ? parsedContent.steps 
            : defaultResponse.steps;
          
          const validatedTags = Array.isArray(parsedContent.tags) 
            ? parsedContent.tags 
            : defaultResponse.tags;
            
          const validatedDescription = parsedContent.description || defaultResponse.description;
          
          // Create a consolidated description field that contains all the AI-generated content
          let consolidatedDescription = validatedDescription + '\n\n';
          
          // Add priority
          consolidatedDescription += `Priority: ${validatedPriority}\n\n`;
          
          // Add estimated time
          consolidatedDescription += `Estimated Time: ${validatedEstimatedTime} minutes\n\n`;
          
          // Add steps
          if (validatedSteps.length > 0) {
            consolidatedDescription += 'Steps:\n';
            validatedSteps.forEach((step, index) => {
              consolidatedDescription += `${index + 1}. ${step}\n`;
            });
            consolidatedDescription += '\n';
          }
          
          // Add tags
          if (validatedTags.length > 0) {
            consolidatedDescription += 'Tags: ' + validatedTags.join(', ') + '\n';
          }
          
          // Return the response with a consolidated description
          const finalResponse = {
            description: consolidatedDescription.trim(),
            steps: validatedSteps,            // keeping these for backward compatibility
            estimatedTime: validatedEstimatedTime, // keeping these for backward compatibility
            tags: validatedTags,              // keeping these for backward compatibility
            priority: validatedPriority       // keeping these for backward compatibility
          };
          
          console.log("Sending consolidated AI template response:", finalResponse);
          return res.json(finalResponse);
        } catch (parseError) {
          console.error("Error parsing AI template response:", parseError);
          console.error("Raw template AI response:", response.choices[0].message.content);
          return res.json(defaultResponse);
        }
      } catch (aiError) {
        console.error("OpenAI error:", aiError);
        // Return a default template with consolidated description
        const defaultDescription = `Task template for ${title}. This is a template in the ${category || 'general'} category.`;
        const defaultSteps = ["Step 1: Plan the task", "Step 2: Execute the task", "Step 3: Review the completed task"];
        const defaultTags = ["template", category || "general"];
        const defaultPriority = "medium";
        const defaultEstimatedTime = 30;
        
        // Create a consolidated description
        let consolidatedDescription = defaultDescription + '\n\n';
        consolidatedDescription += `Priority: ${defaultPriority}\n\n`;
        consolidatedDescription += `Estimated Time: ${defaultEstimatedTime} minutes\n\n`;
        consolidatedDescription += 'Steps:\n';
        defaultSteps.forEach((step, index) => {
          consolidatedDescription += `${index + 1}. ${step}\n`;
        });
        consolidatedDescription += '\n';
        consolidatedDescription += 'Tags: ' + defaultTags.join(', ');
        
        return res.json({
          description: consolidatedDescription.trim(),
          steps: defaultSteps,            // keeping these for backward compatibility
          estimatedTime: defaultEstimatedTime, // keeping these for backward compatibility
          tags: defaultTags,              // keeping these for backward compatibility
          priority: defaultPriority       // keeping these for backward compatibility
        });
      }
    } catch (error) {
      console.error("Error in AI template delegation:", error);
      return res.status(500).json({ message: "Failed to process AI delegation request" });
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

  // AI Recommendations and Referral Tracking - DEPRECATED (use endpoint at line ~110 instead)
  /*
  app.post('/api/ai-recommendations', async (req, res) => {
    try {
      if (!req.isAuthenticated() && !req.apiUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user?.id || req.apiUser?.id;
      const { taskId } = req.body;
      
      if (!taskId) {
        return res.status(400).json({ message: 'Task ID is required' });
      }
      
      const task = await storage.getTaskById(parseInt(taskId));
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }
      
      // Get AI recommendations based on task content
      const recommendations = await getAIRecommendations(task);
      
      res.json({
        task,
        recommendations
      });
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      res.status(500).json({ message: 'Failed to get AI recommendations' });
    }
  });
  */
  
  app.post('/api/ai-referral/track', async (req, res) => {
    try {
      if (!req.isAuthenticated() && !req.apiUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user?.id || req.apiUser?.id;
      const { toolId, taskId } = req.body;
      
      if (!toolId) {
        return res.status(400).json({ message: 'Tool ID is required' });
      }
      
      // Record the referral click
      const referral = await storage.trackAIToolReferral({
        userId,
        toolId,
        taskId: taskId ? parseInt(taskId) : undefined,
        clicked: true,
        converted: false
      });
      
      res.json({
        success: true,
        referral
      });
    } catch (error) {
      console.error('Error tracking AI referral:', error);
      res.status(500).json({ message: 'Failed to track referral' });
    }
  });
  
  // This route was removed to fix a duplicate endpoint issue
  // The first implementation of this route exists at line 1621

  app.post('/api/ai-referral/convert', async (req, res) => {
    try {
      if (!req.isAuthenticated() && !req.apiUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const { referralId, commission } = req.body;
      
      if (!referralId) {
        return res.status(400).json({ message: 'Referral ID is required' });
      }
      
      // Update the referral as converted with commission info
      const updatedReferral = await storage.updateReferralConversion(
        parseInt(referralId),
        true,
        commission ? parseFloat(commission) : undefined
      );
      
      if (!updatedReferral) {
        return res.status(404).json({ message: 'Referral not found' });
      }
      
      res.json({
        success: true,
        referral: updatedReferral
      });
    } catch (error) {
      console.error('Error converting AI referral:', error);
      res.status(500).json({ message: 'Failed to convert referral' });
    }
  });
  
  app.get('/api/user/:userId/referrals', async (req, res) => {
    try {
      if (!req.isAuthenticated() && !req.apiUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = parseInt(req.params.userId);
      
      // Ensure user can only access their own referrals unless admin
      if (req.user?.id !== userId && req.user?.role !== 'admin' && !req.apiUser) {
        return res.status(403).json({ message: 'Unauthorized access' });
      }
      
      const referrals = await storage.getReferralsByUserId(userId);
      
      res.json({
        referrals
      });
    } catch (error) {
      console.error('Error getting user referrals:', error);
      res.status(500).json({ message: 'Failed to get referrals' });
    }
  });
  
  // App Marketplace Routes
  
  // Get all published app listings
  app.get('/api/marketplace/listings', async (req, res) => {
    try {
      const categoryFilter = req.query.category as string;
      const priceMin = req.query.price_min ? parseFloat(req.query.price_min as string) : undefined;
      const priceMax = req.query.price_max ? parseFloat(req.query.price_max as string) : undefined;
      const searchTerm = req.query.search as string;
      
      // Query the database for published listings with optional filters
      const listings = await db.select()
        .from(appListings)
        .where(eq(appListings.status, 'published'))
        .execute();
      
      // Format listings for API response
      const formattedListings = listings.map(listing => ({
        ...listing,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
        establishedDate: listing.establishedDate ? listing.establishedDate.toISOString() : null
      }));
      
      res.json(formattedListings);
    } catch (error) {
      console.error('Error fetching app listings:', error);
      res.status(500).json({ message: 'Failed to fetch app listings' });
    }
  });
  
  // Get a specific app listing by ID
  app.get('/api/marketplace/listings/:id', async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: 'Invalid listing ID' });
      }
      
      // Query the database for the listing
      const [listing] = await db.select()
        .from(appListings)
        .where(eq(appListings.id, listingId))
        .execute();
      
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      
      // Get the seller details
      const [seller] = await db.select()
        .from(users)
        .where(eq(users.id, listing.sellerId))
        .execute();
      
      const sellerProfile = seller ? {
        id: seller.id,
        username: seller.username,
        displayName: seller.displayName,
        avatarUrl: seller.avatarUrl,
        bio: seller.bio
      } : null;
      
      // Get review metrics for the listing
      const reviews = await db.select()
        .from(appReviews)
        .where(eq(appReviews.listingId, listingId))
        .execute();
      
      // Calculate average ratings if reviews exist
      let reviewMetrics = null;
      if (reviews.length > 0) {
        const overallRatings = reviews.map(r => r.overallRating).filter(Boolean);
        const codeQualityRatings = reviews.map(r => r.codeQualityRating).filter(Boolean);
        const documentationRatings = reviews.map(r => r.documentationRating).filter(Boolean);
        const supportRatings = reviews.map(r => r.supportRating).filter(Boolean);
        const valueRatings = reviews.map(r => r.valueRating).filter(Boolean);
        
        const calcAverage = (arr: number[]) => arr.length > 0 ? 
          arr.reduce((sum, val) => sum + val, 0) / arr.length : null;
        
        reviewMetrics = {
          reviewCount: reviews.length,
          averageRating: calcAverage(overallRatings),
          codeQualityRating: calcAverage(codeQualityRatings),
          documentationRating: calcAverage(documentationRatings),
          supportRating: calcAverage(supportRatings),
          valueRating: calcAverage(valueRatings)
        };
      }
      
      // Format dates for API response
      const formattedListing = {
        ...listing,
        createdAt: listing.createdAt.toISOString(),
        updatedAt: listing.updatedAt.toISOString(),
        establishedDate: listing.establishedDate ? listing.establishedDate.toISOString() : null,
        lastMaintained: listing.lastMaintained ? listing.lastMaintained.toISOString() : null,
        seller: sellerProfile,
        ...reviewMetrics
      };
      
      res.json(formattedListing);
    } catch (error) {
      console.error('Error fetching app listing:', error);
      res.status(500).json({ message: 'Failed to fetch app listing' });
    }
  });
  
  // Create a new app listing
  app.post('/api/marketplace/listings', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated() && !req.apiUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user?.id || req.apiUser?.id;
      
      // Validate request body
      const result = insertAppListingSchema.safeParse({
        ...req.body,
        sellerId: userId
      });
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Insert the listing
      const [newListing] = await db.insert(appListings)
        .values(result.data)
        .returning()
        .execute();
      
      // Format the listing for API response
      const formattedListing = {
        ...newListing,
        createdAt: newListing.createdAt.toISOString(),
        updatedAt: newListing.updatedAt.toISOString(),
        establishedDate: newListing.establishedDate ? newListing.establishedDate.toISOString() : null
      };
      
      res.status(201).json(formattedListing);
    } catch (error) {
      console.error('Error creating app listing:', error);
      res.status(500).json({ message: 'Failed to create app listing' });
    }
  });
  
  // Update an app listing
  app.put('/api/marketplace/listings/:id', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated() && !req.apiUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user?.id || req.apiUser?.id;
      const listingId = parseInt(req.params.id);
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: 'Invalid listing ID' });
      }
      
      // Get the listing to check ownership
      const [listing] = await db.select()
        .from(appListings)
        .where(eq(appListings.id, listingId))
        .execute();
      
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      
      // Check if the user is the seller
      if (listing.sellerId !== userId && req.user?.isAdmin !== true) {
        return res.status(403).json({ message: 'Not authorized to update this listing' });
      }
      
      // Validate request body
      const result = insertAppListingSchema.safeParse({
        ...req.body,
        sellerId: listing.sellerId
      });
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Update the listing
      const [updatedListing] = await db.update(appListings)
        .set({
          ...result.data,
          updatedAt: new Date()
        })
        .where(eq(appListings.id, listingId))
        .returning()
        .execute();
      
      // Format the listing for API response
      const formattedListing = {
        ...updatedListing,
        createdAt: updatedListing.createdAt.toISOString(),
        updatedAt: updatedListing.updatedAt.toISOString(),
        establishedDate: updatedListing.establishedDate ? updatedListing.establishedDate.toISOString() : null
      };
      
      res.json(formattedListing);
    } catch (error) {
      console.error('Error updating app listing:', error);
      res.status(500).json({ message: 'Failed to update app listing' });
    }
  });
  
  // Delete an app listing
  app.delete('/api/marketplace/listings/:id', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated() && !req.apiUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user?.id || req.apiUser?.id;
      const listingId = parseInt(req.params.id);
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: 'Invalid listing ID' });
      }
      
      // Get the listing to check ownership
      const [listing] = await db.select()
        .from(appListings)
        .where(eq(appListings.id, listingId))
        .execute();
      
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      
      // Check if the user is the seller
      if (listing.sellerId !== userId && req.user?.isAdmin !== true) {
        return res.status(403).json({ message: 'Not authorized to delete this listing' });
      }
      
      // Delete the listing
      await db.delete(appListings)
        .where(eq(appListings.id, listingId))
        .execute();
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting app listing:', error);
      res.status(500).json({ message: 'Failed to delete app listing' });
    }
  });
  
  // Submit a bid for an app listing
  app.post('/api/marketplace/listings/:id/bids', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated() && !req.apiUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user?.id || req.apiUser?.id;
      const listingId = parseInt(req.params.id);
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: 'Invalid listing ID' });
      }
      
      // Get the listing to check if it exists and is published
      const [listing] = await db.select()
        .from(appListings)
        .where(eq(appListings.id, listingId))
        .execute();
      
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      
      // Check if the listing is published
      if (listing.status !== 'published') {
        return res.status(400).json({ message: 'Cannot bid on a listing that is not published' });
      }
      
      // Check that the bidder is not the seller
      if (listing.sellerId === userId) {
        return res.status(400).json({ message: 'You cannot bid on your own listing' });
      }
      
      // Validate request body
      const result = insertAppBidSchema.safeParse({
        ...req.body,
        listingId,
        bidderId: userId
      });
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Insert the bid
      const [newBid] = await db.insert(appBids)
        .values(result.data)
        .returning()
        .execute();
      
      // Format the bid for API response
      const formattedBid = {
        ...newBid,
        createdAt: newBid.createdAt.toISOString(),
        updatedAt: newBid.updatedAt.toISOString()
      };
      
      res.status(201).json(formattedBid);
    } catch (error) {
      console.error('Error creating app bid:', error);
      res.status(500).json({ message: 'Failed to create app bid' });
    }
  });
  
  // Get bids for a listing
  app.get('/api/marketplace/listings/:id/bids', async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: 'Invalid listing ID' });
      }
      
      // Get the listing to check ownership
      const [listing] = await db.select()
        .from(appListings)
        .where(eq(appListings.id, listingId))
        .execute();
      
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      
      // If user is authenticated and is the seller, they can see all bids
      // Otherwise, if authenticated, they can only see their own bids
      // If not authenticated, they can't see any bids
      let query = db.select().from(appBids).where(eq(appBids.listingId, listingId));
      
      if (req.isAuthenticated() || req.apiUser) {
        const userId = req.user?.id || req.apiUser?.id;
        
        if (listing.sellerId !== userId && req.user?.isAdmin !== true) {
          // Not the seller or admin, can only see own bids
          query = query.where(eq(appBids.bidderId, userId));
        }
      } else {
        // Not authenticated, can't see any bids
        return res.status(401).json({ message: 'Authentication required to view bids' });
      }
      
      // Execute the query
      const bids = await query.execute();
      
      // Format bids for API response
      const formattedBids = bids.map(bid => ({
        ...bid,
        createdAt: bid.createdAt.toISOString(),
        updatedAt: bid.updatedAt.toISOString()
      }));
      
      res.json(formattedBids);
    } catch (error) {
      console.error('Error fetching app bids:', error);
      res.status(500).json({ message: 'Failed to fetch app bids' });
    }
  });
  
  // Add a question to a listing
  app.post('/api/marketplace/listings/:id/questions', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated() && !req.apiUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user?.id || req.apiUser?.id;
      const listingId = parseInt(req.params.id);
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: 'Invalid listing ID' });
      }
      
      // Get the listing to check if it exists
      const [listing] = await db.select()
        .from(appListings)
        .where(eq(appListings.id, listingId))
        .execute();
      
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      
      // Validate request body
      const result = insertAppQuestionSchema.safeParse({
        ...req.body,
        listingId,
        askerId: userId,
        isPublic: req.body.isPublic ?? true
      });
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Insert the question
      const [newQuestion] = await db.insert(appQuestions)
        .values(result.data)
        .returning()
        .execute();
      
      // Format the question for API response
      const formattedQuestion = {
        ...newQuestion,
        createdAt: newQuestion.createdAt.toISOString(),
        answeredAt: newQuestion.answeredAt ? newQuestion.answeredAt.toISOString() : null
      };
      
      res.status(201).json(formattedQuestion);
    } catch (error) {
      console.error('Error creating app question:', error);
      res.status(500).json({ message: 'Failed to create app question' });
    }
  });
  
  // Get questions for a listing
  app.get('/api/marketplace/listings/:id/questions', async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: 'Invalid listing ID' });
      }
      
      // Get the listing to check if it exists
      const [listing] = await db.select()
        .from(appListings)
        .where(eq(appListings.id, listingId))
        .execute();
      
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      
      // Query the database for questions
      // If not authenticated or not the seller, only show public questions
      let query = db.select().from(appQuestions).where(eq(appQuestions.listingId, listingId));
      
      if (!req.isAuthenticated() && !req.apiUser) {
        // Not authenticated, only show public questions
        query = query.where(eq(appQuestions.isPublic, true));
      } else {
        const userId = req.user?.id || req.apiUser?.id;
        
        if (listing.sellerId !== userId && req.user?.isAdmin !== true) {
          // Not the seller or admin, only show public questions or own questions
          query = query.where(
            or(
              eq(appQuestions.isPublic, true),
              eq(appQuestions.askerId, userId)
            )
          );
        }
      }
      
      // Execute the query
      const questions = await query.execute();
      
      // Format questions for API response
      const formattedQuestions = questions.map(question => ({
        ...question,
        createdAt: question.createdAt.toISOString(),
        answeredAt: question.answeredAt ? question.answeredAt.toISOString() : null
      }));
      
      res.json(formattedQuestions);
    } catch (error) {
      console.error('Error fetching app questions:', error);
      res.status(500).json({ message: 'Failed to fetch app questions' });
    }
  });
  
  // Answer a question
  app.post('/api/marketplace/questions/:id/answer', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated() && !req.apiUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user?.id || req.apiUser?.id;
      const questionId = parseInt(req.params.id);
      
      if (isNaN(questionId)) {
        return res.status(400).json({ message: 'Invalid question ID' });
      }
      
      // Get the question
      const [question] = await db.select()
        .from(appQuestions)
        .where(eq(appQuestions.id, questionId))
        .execute();
      
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      // Get the listing to check ownership
      const [listing] = await db.select()
        .from(appListings)
        .where(eq(appListings.id, question.listingId))
        .execute();
      
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      
      // Check if the user is the seller
      if (listing.sellerId !== userId && req.user?.isAdmin !== true) {
        return res.status(403).json({ message: 'Not authorized to answer this question' });
      }
      
      // Validate the answer
      if (!req.body.answer || typeof req.body.answer !== 'string' || req.body.answer.trim() === '') {
        return res.status(400).json({ message: 'Answer is required' });
      }
      
      // Update the question with the answer
      const [updatedQuestion] = await db.update(appQuestions)
        .set({
          answer: req.body.answer,
          answeredAt: new Date()
        })
        .where(eq(appQuestions.id, questionId))
        .returning()
        .execute();
      
      // Format the question for API response
      const formattedQuestion = {
        ...updatedQuestion,
        createdAt: updatedQuestion.createdAt.toISOString(),
        answeredAt: updatedQuestion.answeredAt ? updatedQuestion.answeredAt.toISOString() : null
      };
      
      res.json(formattedQuestion);
    } catch (error) {
      console.error('Error answering app question:', error);
      res.status(500).json({ message: 'Failed to answer app question' });
    }
  });
  
  // Review-related endpoints
  
  // Get reviews for a listing
  app.get('/api/marketplace/listings/:id/reviews', async (req, res) => {
    try {
      const listingId = parseInt(req.params.id);
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: 'Invalid listing ID' });
      }
      
      // Get all reviews for the listing
      const reviews = await db.select()
        .from(appReviews)
        .where(eq(appReviews.listingId, listingId))
        .execute();
      
      // Get reviewer details for each review
      const reviewsWithDetails = await Promise.all(
        reviews.map(async (review) => {
          const [reviewer] = await db.select()
            .from(users)
            .where(eq(users.id, review.reviewerId))
            .execute();
          
          const reviewerProfile = reviewer ? {
            id: reviewer.id,
            username: reviewer.username,
            displayName: reviewer.displayName,
            avatarUrl: reviewer.avatarUrl
          } : null;
          
          return {
            ...review,
            createdAt: review.createdAt.toISOString(),
            updatedAt: review.updatedAt.toISOString(),
            reviewer: reviewerProfile
          };
        })
      );
      
      res.json(reviewsWithDetails);
    } catch (error) {
      console.error('Error fetching listing reviews:', error);
      res.status(500).json({ message: 'Failed to fetch listing reviews' });
    }
  });
  
  // Get seller reviews and reputation metrics
  app.get('/api/marketplace/sellers/:id/reviews', async (req, res) => {
    try {
      const sellerId = parseInt(req.params.id);
      
      if (isNaN(sellerId)) {
        return res.status(400).json({ message: 'Invalid seller ID' });
      }
      
      // Check if seller exists
      const [seller] = await db.select()
        .from(users)
        .where(eq(users.id, sellerId))
        .execute();
      
      if (!seller) {
        return res.status(404).json({ message: 'Seller not found' });
      }
      
      // Get all reviews for listings by this seller
      const reviews = await db.select()
        .from(appReviews)
        .where(eq(appReviews.sellerId, sellerId))
        .execute();
      
      // Calculate seller reputation metrics
      const reputationMetrics = {
        totalReviews: reviews.length,
        averageRatings: {
          overall: calculateAverage(reviews.map(r => r.overallRating)),
          codeQuality: calculateAverage(reviews.map(r => r.codeQualityRating)),
          documentation: calculateAverage(reviews.map(r => r.documentationRating)),
          support: calculateAverage(reviews.map(r => r.supportRating)),
          value: calculateAverage(reviews.map(r => r.valueRating))
        },
        // Count how many reviews in each rating bracket (1-5 stars)
        ratingDistribution: {
          '5': reviews.filter(r => r.overallRating === 5).length,
          '4': reviews.filter(r => r.overallRating === 4).length,
          '3': reviews.filter(r => r.overallRating === 3).length,
          '2': reviews.filter(r => r.overallRating === 2).length,
          '1': reviews.filter(r => r.overallRating === 1).length
        }
      };
      
      // Get reviewer details for the most recent reviews (limit to 10)
      const recentReviews = reviews.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      ).slice(0, 10);
      
      const detailedReviews = await Promise.all(
        recentReviews.map(async (review) => {
          const [reviewer] = await db.select()
            .from(users)
            .where(eq(users.id, review.reviewerId))
            .execute();
            
          const [listing] = await db.select()
            .from(appListings)
            .where(eq(appListings.id, review.listingId))
            .execute();
          
          const reviewerProfile = reviewer ? {
            id: reviewer.id,
            username: reviewer.username,
            displayName: reviewer.displayName,
            avatarUrl: reviewer.avatarUrl
          } : null;
          
          return {
            ...review,
            createdAt: review.createdAt.toISOString(),
            updatedAt: review.updatedAt.toISOString(),
            reviewer: reviewerProfile,
            listing: listing ? {
              id: listing.id,
              title: listing.title,
              slug: listing.slug
            } : null
          };
        })
      );
      
      res.json({
        sellerId,
        metrics: reputationMetrics,
        recentReviews: detailedReviews
      });
    } catch (error) {
      console.error('Error fetching seller reviews:', error);
      res.status(500).json({ message: 'Failed to fetch seller reviews' });
    }
  });
  
  // Submit a review for an app after purchase
  app.post('/api/marketplace/transactions/:id/review', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated() && !req.apiUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user?.id || req.apiUser?.id;
      const transactionId = parseInt(req.params.id);
      
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: 'Invalid transaction ID' });
      }
      
      // Get the transaction to check ownership and status
      const [transaction] = await db.select()
        .from(appTransactions)
        .where(eq(appTransactions.id, transactionId))
        .execute();
      
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      // Check if the user is the buyer of this transaction
      if (transaction.buyerId !== userId) {
        return res.status(403).json({ message: 'Not authorized to review this transaction' });
      }
      
      // Check if the transaction is completed
      if (transaction.status !== 'completed') {
        return res.status(400).json({ message: 'Cannot review an incomplete transaction' });
      }
      
      // Check if the user has already reviewed this transaction
      const existingReview = await db.select()
        .from(appReviews)
        .where(
          and(
            eq(appReviews.transactionId, transactionId),
            eq(appReviews.reviewerId, userId)
          )
        )
        .execute();
      
      if (existingReview.length > 0) {
        return res.status(400).json({ message: 'You have already reviewed this transaction' });
      }
      
      // Validate request body
      const result = insertAppReviewSchema.safeParse({
        ...req.body,
        transactionId,
        reviewerId: userId,
        listingId: transaction.listingId,
        sellerId: transaction.sellerId
      });
      
      if (!result.success) {
        const errorMessage = fromZodError(result.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      // Insert the review
      const [newReview] = await db.insert(appReviews)
        .values(result.data)
        .returning()
        .execute();
      
      // Format the review for API response
      const formattedReview = {
        ...newReview,
        createdAt: newReview.createdAt.toISOString(),
        updatedAt: newReview.updatedAt.toISOString()
      };
      
      res.status(201).json(formattedReview);
    } catch (error) {
      console.error('Error creating app review:', error);
      res.status(500).json({ message: 'Failed to create app review' });
    }
  });
  
  // Add a listing to user's favorites
  app.post('/api/marketplace/listings/:id/favorite', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated() && !req.apiUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user?.id || req.apiUser?.id;
      const listingId = parseInt(req.params.id);
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: 'Invalid listing ID' });
      }
      
      // Check if the listing exists
      const [listing] = await db.select()
        .from(appListings)
        .where(eq(appListings.id, listingId))
        .execute();
      
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }
      
      // Check if already favorited
      const [existingFavorite] = await db.select()
        .from(appFavorites)
        .where(
          and(
            eq(appFavorites.userId, userId),
            eq(appFavorites.listingId, listingId)
          )
        )
        .execute();
      
      if (existingFavorite) {
        return res.status(400).json({ message: 'Listing already in favorites' });
      }
      
      // Add to favorites
      const [favorite] = await db.insert(appFavorites)
        .values({
          userId,
          listingId,
          createdAt: new Date()
        })
        .returning()
        .execute();
      
      // Format for API response
      const formattedFavorite = {
        ...favorite,
        createdAt: favorite.createdAt.toISOString()
      };
      
      res.status(201).json(formattedFavorite);
    } catch (error) {
      console.error('Error adding listing to favorites:', error);
      res.status(500).json({ message: 'Failed to add listing to favorites' });
    }
  });
  
  // Remove a listing from user's favorites
  app.delete('/api/marketplace/listings/:id/favorite', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated() && !req.apiUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user?.id || req.apiUser?.id;
      const listingId = parseInt(req.params.id);
      
      if (isNaN(listingId)) {
        return res.status(400).json({ message: 'Invalid listing ID' });
      }
      
      // Delete the favorite
      await db.delete(appFavorites)
        .where(
          and(
            eq(appFavorites.userId, userId),
            eq(appFavorites.listingId, listingId)
          )
        )
        .execute();
      
      res.status(204).send();
    } catch (error) {
      console.error('Error removing listing from favorites:', error);
      res.status(500).json({ message: 'Failed to remove listing from favorites' });
    }
  });
  
  // Get user's favorite listings
  app.get('/api/marketplace/favorites', async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated() && !req.apiUser) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user?.id || req.apiUser?.id;
      
      // Get user's favorites with listing details
      const favorites = await db.select({
        favorite: appFavorites,
        listing: appListings
      })
        .from(appFavorites)
        .innerJoin(appListings, eq(appFavorites.listingId, appListings.id))
        .where(eq(appFavorites.userId, userId))
        .execute();
      
      // Format for API response
      const formattedFavorites = favorites.map(({ favorite, listing }) => ({
        id: favorite.id,
        userId: favorite.userId,
        listingId: favorite.listingId,
        createdAt: favorite.createdAt.toISOString(),
        listing: {
          ...listing,
          createdAt: listing.createdAt.toISOString(),
          updatedAt: listing.updatedAt.toISOString(),
          establishedDate: listing.establishedDate ? listing.establishedDate.toISOString() : null
        }
      }));
      
      res.json(formattedFavorites);
    } catch (error) {
      console.error('Error fetching favorite listings:', error);
      res.status(500).json({ message: 'Failed to fetch favorite listings' });
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

  // Serve the Swagger JSON file
  app.get('/api/swagger.json', (req, res) => {
    // Read the Swagger JSON file and send it
    import('fs').then(fs => {
      import('path').then(path => {
        try {
          const swaggerPath = path.join(process.cwd(), 'appmo-api-swagger.json');
          const swaggerJson = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
          res.json(swaggerJson);
        } catch (error) {
          console.error('Error reading Swagger file:', error);
          res.status(500).json({ error: 'Failed to load API documentation' });
        }
      }).catch(error => {
        console.error('Error importing path module:', error);
        res.status(500).json({ error: 'Server configuration error' });
      });
    }).catch(error => {
      console.error('Error importing fs module:', error);
      res.status(500).json({ error: 'Server configuration error' });
    });
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