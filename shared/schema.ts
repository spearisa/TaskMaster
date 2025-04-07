import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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

// Custom schema for direct messages that maps 'content' to 'message' in the database
export const insertDirectMessageSchema = z.object({
  senderId: z.number(),
  receiverId: z.number(),
  content: z.string().min(1),
  read: z.boolean().default(false).optional(),
  createdAt: z.date().optional(),
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
