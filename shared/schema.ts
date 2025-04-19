import { pgTable, text, serial, integer, boolean, timestamp, real, decimal, json } from "drizzle-orm/pg-core";
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
  isAdmin: boolean("is_admin").default(false).notNull(),
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
  zoomMeetingId: text("zoom_meeting_id"),
  zoomJoinUrl: text("zoom_join_url"),
  zoomStartUrl: text("zoom_start_url"),
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
  zoomMeetingId: z.string().optional(),
  zoomJoinUrl: z.string().optional(),
  zoomStartUrl: z.string().optional(),
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
  zoomMeetingId: z.string().optional(),
  zoomJoinUrl: z.string().optional(),
  zoomStartUrl: z.string().optional(),
});

// Create the direct messages table
export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  receiverId: integer("receiver_id").references(() => users.id).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  delivered: boolean("delivered").default(false).notNull(),
  edited: boolean("edited").default(false),
  editedAt: timestamp("edited_at"),
  deleted: boolean("deleted").default(false),
  reactions: json("reactions").default('{}'),
  replyToId: integer("reply_to_id").references(() => directMessages.id),
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
  delivered: z.boolean().default(false).optional(),
  edited: z.boolean().default(false).optional(),
  deleted: z.boolean().default(false).optional(),
  reactions: z.record(z.string(), z.number()).optional(),
  replyToId: z.number().optional().nullable(),
  createdAt: z.date().optional(),
});

// Schema for message reactions
export const messageReactionSchema = z.object({
  messageId: z.number(),
  userId: z.number(),
  emoji: z.string(),
});

// Schema for message editing
export const editMessageSchema = z.object({
  messageId: z.number(),
  content: z.string().min(1),
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
  status: z.enum(["pending", "accepted", "rejected", "completed"]).optional(),
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

// Blog post table
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  featuredImage: text("featured_image"),
  authorId: integer("author_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("draft"), // draft, published
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  tags: text("tags").array(),
  viewCount: integer("view_count").default(0),
});

// Blog categories table
export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: integer("parent_id").references(() => blogCategories.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Blog post categories relationship table
export const blogPostCategories = pgTable("blog_post_categories", {
  postId: integer("post_id").references(() => blogPosts.id).notNull(),
  categoryId: integer("category_id").references(() => blogCategories.id).notNull(),
});

// Blog comments table
export const blogComments = pgTable("blog_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => blogPosts.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  parentId: integer("parent_id").references(() => blogComments.id),
  content: text("content").notNull(),
  authorName: text("author_name"), // For guest comments
  authorEmail: text("author_email"), // For guest comments
  approved: boolean("approved").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Blog schema definitions
export const insertBlogPostSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  slug: z.string().min(1, { message: "Slug is required" }),
  content: z.string().min(1, { message: "Content is required" }),
  excerpt: z.string().optional().nullable(),
  featuredImage: z.string().optional().nullable(),
  authorId: z.number(),
  status: z.enum(["draft", "published"]),
  publishedAt: z.date().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  categories: z.array(z.number()).optional().default([]),
});

export const blogPostSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().optional().nullable(),
  featuredImage: z.string().optional().nullable(),
  authorId: z.number(),
  status: z.enum(["draft", "published"]),
  publishedAt: z.string().optional().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tags: z.array(z.string()).optional().nullable(),
  viewCount: z.number(),
  categories: z.array(z.number()).optional(),
  author: userProfileSchema.optional(),
});

export const insertBlogCategorySchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  slug: z.string().min(1, { message: "Slug is required" }),
  description: z.string().optional().nullable(),
  parentId: z.number().optional().nullable(),
});

export const blogCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().optional().nullable(),
  parentId: z.number().optional().nullable(),
  createdAt: z.string(),
});

export const insertBlogCommentSchema = z.object({
  postId: z.number(),
  userId: z.number().optional().nullable(),
  parentId: z.number().optional().nullable(),
  content: z.string().min(1, { message: "Content is required" }),
  authorName: z.string().optional().nullable(),
  authorEmail: z.string().email().optional().nullable(),
});

export const blogCommentSchema = z.object({
  id: z.number(),
  postId: z.number(),
  userId: z.number().optional().nullable(),
  parentId: z.number().optional().nullable(),
  content: z.string(),
  authorName: z.string().optional().nullable(),
  authorEmail: z.string().optional().nullable(),
  approved: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  user: userProfileSchema.optional(),
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type BlogPostWithStringDates = z.infer<typeof blogPostSchema>;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type BlogCategory = typeof blogCategories.$inferSelect;
export type BlogCategoryWithStringDates = z.infer<typeof blogCategorySchema>;
export type InsertBlogComment = z.infer<typeof insertBlogCommentSchema>;
export type BlogComment = typeof blogComments.$inferSelect;
export type BlogCommentWithStringDates = z.infer<typeof blogCommentSchema>;

// AI tool referrals tracking
export const aiToolReferrals = pgTable("ai_tool_referrals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  toolId: text("tool_id").notNull(), // Format: "categoryId:appId[:tierName]"
  taskId: integer("task_id").references(() => tasks.id),
  clicked: boolean("clicked").default(true).notNull(),
  converted: boolean("converted").default(false).notNull(),
  commissionEarned: decimal("commission_earned", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  conversionDate: timestamp("conversion_date"),
});

export const insertAiToolReferralSchema = createInsertSchema(aiToolReferrals).omit({
  id: true,
  createdAt: true,
  conversionDate: true,
});

export type InsertAiToolReferral = z.infer<typeof insertAiToolReferralSchema>;
export type AiToolReferral = typeof aiToolReferrals.$inferSelect;