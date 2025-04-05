import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
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
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  completedAt: true,
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
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type TaskWithStringDates = z.infer<typeof taskSchema>;
