import { pgTable, text, serial, integer, boolean, timestamp, real, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  interests: text("interests").array(),
  skills: text("skills").array(),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  completed: boolean("completed").default(false).notNull(),
  priority: text("priority").notNull(),
  category: text("category").notNull(),
  completedAt: timestamp("completed_at"),
  estimatedTime: integer("estimated_time"), // in minutes
  userId: integer("user_id").references(() => users.id),
  assignedToUserId: integer("assigned_to_user_id").references(() => users.id),
  isPublic: boolean("is_public").default(false).notNull(),
  budget: decimal("budget", { precision: 10, scale: 2 }), // Budget for task in dollars
  acceptingBids: boolean("accepting_bids").default(false), // Whether the task is open for bidding
  biddingDeadline: timestamp("bidding_deadline"), // Deadline for submitting bids
  winningBidId: integer("winning_bid_id"), // Reference to the selected bid
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  bio: true,
  interests: true,
  skills: true,
  avatarUrl: true,
});

export const updateProfileSchema = createInsertSchema(users).pick({
  displayName: true,
  bio: true,
  interests: true,
  skills: true,
  avatarUrl: true,
});

export const userProfileSchema = z.object({
  id: z.number(),
  username: z.string(),
  displayName: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  interests: z.array(z.string()).optional().nullable(),
  skills: z.array(z.string()).optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
});

// Create a custom insert schema for tasks with proper validation
export const insertTaskSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional().nullable(),
  dueDate: z.date().optional().nullable(),
  completed: z.boolean().default(false),
  priority: z.enum(["high", "medium", "low"]),
  category: z.string(),
  estimatedTime: z.number().int().positive().optional().nullable(),
  userId: z.number().optional().nullable(),
  assignedToUserId: z.number().optional().nullable(),
  isPublic: z.boolean().default(false).optional(),
  budget: z.number().optional().nullable(),
  acceptingBids: z.boolean().default(false).optional(),
  biddingDeadline: z.date().optional().nullable(),
});

export const taskSchema = z.object({
  id: z.number(),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  completed: z.boolean().default(false),
  priority: z.enum(["high", "medium", "low"]),
  category: z.string(),
  completedAt: z.string().optional().nullable(),
  estimatedTime: z.number().optional().nullable(),
  userId: z.number().optional().nullable(),
  assignedToUserId: z.number().optional().nullable(),
  isPublic: z.boolean().default(false),
  budget: z.number().optional().nullable(),
  acceptingBids: z.boolean().default(false).optional(),
  biddingDeadline: z.string().optional().nullable(),
  winningBidId: z.number().optional().nullable(),
});

// Create the direct messages table
export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create the conversations table to track unique conversations between users
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").references(() => users.id).notNull(),
  user2Id: integer("user2_id").references(() => users.id).notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  unreadCount: integer("unread_count").default(0).notNull(),
});

// Task template table for the one-click task template library
export const taskTemplates = pgTable("task_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull(),
  category: text("category").notNull(),
  estimatedTime: integer("estimated_time"),
  steps: text("steps").array(),
  tags: text("tags").array(),
  icon: text("icon"),
  createdAt: timestamp("created_at").defaultNow(),
  userId: integer("user_id").references(() => users.id),
  isPublic: boolean("is_public").default(false).notNull(),
});

// Custom schema for direct messages that maps 'content' to 'message' in the database
export const insertDirectMessageSchema = z.object({
  senderId: z.number(),
  receiverId: z.number(),
  content: z.string().min(1),
  read: z.boolean().default(false).optional(),
  createdAt: z.date().optional(),
});

// Schema for inserting task templates
export const insertTaskTemplateSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional().nullable(),
  priority: z.enum(["high", "medium", "low"]),
  category: z.string(),
  estimatedTime: z.number().int().positive().optional().nullable(),
  steps: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  icon: z.string().optional().nullable(),
  userId: z.number().optional().nullable(),
  isPublic: z.boolean().default(false).optional(),
});

// Schema for task templates with string dates
// Task bids table for the bidding system
export const taskBids = pgTable("task_bids", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => tasks.id).notNull(),
  bidderId: integer("bidder_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  estimatedTime: integer("estimated_time"), // in minutes
  proposal: text("proposal").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, completed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripePaymentStatus: text("stripe_payment_status"),
});

export const taskTemplateSchema = z.object({
  id: z.number(),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional().nullable(),
  priority: z.enum(["high", "medium", "low"]),
  category: z.string(),
  estimatedTime: z.number().optional().nullable(),
  steps: z.array(z.string()).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  icon: z.string().optional().nullable(),
  createdAt: z.string().optional().nullable(),
  userId: z.number().optional().nullable(),
  isPublic: z.boolean().default(false),
});

// Schema for inserting task bids
export const insertTaskBidSchema = z.object({
  taskId: z.number(),
  bidderId: z.number(),
  amount: z.number().positive({ message: "Bid amount must be positive" }),
  estimatedTime: z.number().int().positive().optional().nullable(),
  proposal: z.string().min(1, { message: "Proposal is required" }),
});

// Schema for task bids with string dates
export const taskBidSchema = z.object({
  id: z.number(),
  taskId: z.number(),
  bidderId: z.number(),
  amount: z.number(),
  estimatedTime: z.number().optional().nullable(),
  proposal: z.string(),
  status: z.enum(["pending", "accepted", "rejected", "completed"]),
  createdAt: z.string().optional().nullable(),
  updatedAt: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  stripePaymentIntentId: z.string().optional().nullable(),
  stripePaymentStatus: z.string().optional().nullable(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserProfile = z.infer<typeof userProfileSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type TaskWithStringDates = z.infer<typeof taskSchema>;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;
export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type TaskTemplateWithStringDates = z.infer<typeof taskTemplateSchema>;
export type InsertTaskBid = z.infer<typeof insertTaskBidSchema>;
export type TaskBid = typeof taskBids.$inferSelect;
export type TaskBidWithStringDates = z.infer<typeof taskBidSchema>;
