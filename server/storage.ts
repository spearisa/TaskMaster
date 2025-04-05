import { tasks, type Task, type InsertTask, type User, users, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import { scrypt } from "crypto";
import { promisify } from "util";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const scryptAsync = promisify(scrypt);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getTasks(): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  getTasksByUserId(userId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  completeTask(id: number): Promise<Task | undefined>;
  
  sessionStore: session.Store;
}

/**
 * Database-backed storage implementation
 */
export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  /**
   * Hash a password with a salt
   */
  async hashPassword(password: string, salt: string): Promise<string> {
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }
  
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.id));
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async getTasksByUserId(userId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.id));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(insertTask).returning();
    return task;
  }

  async updateTask(id: number, updatedTask: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db.update(tasks)
      .set(updatedTask)
      .where(eq(tasks.id, id))
      .returning();
    
    return task;
  }

  async deleteTask(id: number): Promise<boolean> {
    const [deletedTask] = await db.delete(tasks)
      .where(eq(tasks.id, id))
      .returning();
    
    return !!deletedTask;
  }

  async completeTask(id: number): Promise<Task | undefined> {
    const [task] = await db.update(tasks)
      .set({ 
        completed: true,
        completedAt: new Date() 
      })
      .where(eq(tasks.id, id))
      .returning();
    
    return task;
  }

  /**
   * Initialize demo data if the database is empty
   */
  async initializeDemo(): Promise<void> {
    // Check if there are any users
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      return; // Database already has data
    }

    // Create demo user with properly hashed password
    // Using a hardcoded hash for reliability
    const hashedPassword = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8.abcdef1234567890";
    
    const [demoUser] = await db.insert(users).values({
      username: "demo",
      password: hashedPassword
    }).returning();

    // Create demo tasks
    const demoTasks: InsertTask[] = [
      {
        title: "Design new icons",
        description: "Create new UI icons for the application",
        dueDate: new Date(),
        completed: false,
        priority: "high",
        category: "Work",
        userId: demoUser.id,
        estimatedTime: 120
      },
      {
        title: "Go to the gym",
        description: "Cardio and strength training",
        dueDate: new Date(),
        completed: true,
        priority: "medium",
        category: "Personal",
        userId: demoUser.id,
        estimatedTime: 60
      },
      {
        title: "Buy groceries",
        description: "Milk, eggs, bread, vegetables",
        dueDate: new Date(Date.now() + 86400000), // tomorrow
        completed: false,
        priority: "medium",
        category: "Personal",
        userId: demoUser.id,
        estimatedTime: 30
      },
      {
        title: "Client presentation",
        description: "Prepare slides for the client meeting",
        dueDate: new Date(Date.now() + 3 * 86400000), // 3 days later
        completed: false,
        priority: "high",
        category: "Work",
        userId: demoUser.id,
        estimatedTime: 90
      },
      {
        title: "Plan weekend trip",
        description: "Research destinations and accommodations",
        dueDate: new Date(Date.now() + 4 * 86400000), // 4 days later
        completed: false,
        priority: "low",
        category: "Personal",
        userId: demoUser.id,
        estimatedTime: 60
      }
    ];
    
    // Insert all demo tasks
    await db.insert(tasks).values(demoTasks);
  }
}

export const storage = new DatabaseStorage();
