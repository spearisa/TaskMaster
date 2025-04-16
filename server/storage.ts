import { 
  tasks, type Task, type InsertTask, 
  users, type User, type InsertUser, type UpdateProfile, type UserProfile,
  directMessages, type DirectMessage, type InsertDirectMessage,
  conversations, type Conversation,
  taskTemplates, type TaskTemplate, type InsertTaskTemplate,
  taskBids, type TaskBid, type InsertTaskBid
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, asc, sql, not } from "drizzle-orm";
import { scrypt } from "crypto";
import { promisify } from "util";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const scryptAsync = promisify(scrypt);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(userId: number, profile: UpdateProfile): Promise<User | undefined>;
  searchUsers(query: string, currentUserId: number): Promise<UserProfile[]>;
  getUserProfile(userId: number): Promise<UserProfile | undefined>;
  
  // Task methods
  getTasks(): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  getTasksByUserId(userId: number): Promise<Task[]>;
  getTasksAssignedToUser(userId: number): Promise<Task[]>;
  getPublicTasks(): Promise<Task[]>;
  getPublicTasksByUserId(userId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  completeTask(id: number): Promise<Task | undefined>;
  assignTaskToUser(taskId: number, assignedToUserId: number): Promise<Task | undefined>;
  setTaskPublic(taskId: number, isPublic: boolean): Promise<Task | undefined>;
  
  // Task template methods
  getTaskTemplates(): Promise<TaskTemplate[]>;
  getTaskTemplateById(id: number): Promise<TaskTemplate | undefined>;
  getTaskTemplatesByUserId(userId: number): Promise<TaskTemplate[]>;
  getPublicTaskTemplates(): Promise<TaskTemplate[]>;
  createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate>;
  updateTaskTemplate(id: number, template: Partial<InsertTaskTemplate>): Promise<TaskTemplate | undefined>;
  deleteTaskTemplate(id: number): Promise<boolean>;
  setTaskTemplatePublic(templateId: number, isPublic: boolean): Promise<TaskTemplate | undefined>;
  createTaskFromTemplate(templateId: number, userId: number, dueDate?: Date): Promise<Task>;
  
  // Task bidding methods
  getTaskBids(taskId: number): Promise<TaskBid[]>;
  getTaskBidById(bidId: number): Promise<TaskBid | undefined>;
  createTaskBid(bid: InsertTaskBid): Promise<TaskBid>;
  updateTaskBid(bidId: number, bid: Partial<InsertTaskBid>): Promise<TaskBid | undefined>;
  deleteTaskBid(bidId: number): Promise<boolean>;
  acceptTaskBid(taskId: number, bidId: number): Promise<Task | undefined>;
  
  // Direct message methods
  getConversations(userId: number): Promise<{conversation: Conversation, user: UserProfile}[]>;
  getMessages(user1Id: number, user2Id: number): Promise<DirectMessage[]>;
  sendMessage(message: InsertDirectMessage): Promise<DirectMessage>;
  markMessagesAsRead(userId: number, otherUserId: number): Promise<void>;
  
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
  
  async updateUserProfile(userId: number, profile: UpdateProfile): Promise<User | undefined> {
    const [user] = await db.update(users)
      .set(profile)
      .where(eq(users.id, userId))
      .returning();
    
    return user;
  }
  
  async searchUsers(query: string, currentUserId: number): Promise<UserProfile[]> {
    console.log(`[Storage] Searching users with query: "${query}", currentUserId: ${currentUserId}`);
    
    // Make query lowercase for case-insensitive matching
    const lowerQuery = query.toLowerCase();
    
    // First, log all users in the database for debugging
    const debugAllUsers = await db.select().from(users);
    console.log(`[Storage] All users in database (${debugAllUsers.length}):`);
    debugAllUsers.forEach(user => {
      console.log(`  - ID: ${user.id}, Username: ${user.username}, Display Name: ${user.displayName}`);
      console.log(`    Interests: ${JSON.stringify(user.interests)}`);
      console.log(`    Skills: ${JSON.stringify(user.skills)}`);
    });
    
    // Search for users by username, displayName only 
    // Exclude the current user from results
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      bio: users.bio,
      interests: users.interests,
      skills: users.skills,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(
      not(eq(users.id, currentUserId))
    )
    .orderBy(asc(users.username));
    
    console.log(`[Storage] Got ${allUsers.length} users excluding current user`);
    
    // Manually filter results for better control over matching logic
    const results = allUsers.filter(user => {
      const matchesUsername = user.username.toLowerCase().includes(lowerQuery);
      const matchesDisplayName = user.displayName && user.displayName.toLowerCase().includes(lowerQuery);
      
      // Check if any interest includes the query
      const matchesInterests = user.interests && user.interests.some(interest => 
        interest && interest.toLowerCase().includes(lowerQuery)
      );
      
      // Check if any skill includes the query
      const matchesSkills = user.skills && user.skills.some(skill => 
        skill && skill.toLowerCase().includes(lowerQuery)
      );
      
      const matches = matchesUsername || matchesDisplayName || matchesInterests || matchesSkills;
      
      // Log details about each match evaluation for debugging
      console.log(`[Storage] User ${user.username} (${user.id}) match evaluation:`);
      console.log(`  - Searching for: "${lowerQuery}"`);
      console.log(`  - Username match: ${matchesUsername} (${user.username})`);
      console.log(`  - DisplayName match: ${matchesDisplayName} (${user.displayName})`);
      console.log(`  - Interests match: ${matchesInterests} (${JSON.stringify(user.interests)})`);
      console.log(`  - Skills match: ${matchesSkills} (${JSON.stringify(user.skills)})`);
      console.log(`  - Overall match: ${matches}`);
      
      return matches;
    }).slice(0, 20); // Limit to 20 results
    
    console.log(`[Storage] Found ${results.length} matching users for query "${query}"`);
    
    // Convert Date objects to strings to match our schema
    return results.map(profile => ({
      ...profile,
      createdAt: profile.createdAt ? profile.createdAt.toISOString() : null
    }));
  }
  
  async getUserProfile(userId: number): Promise<UserProfile | undefined> {
    const [profile] = await db.select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      bio: users.bio,
      interests: users.interests,
      skills: users.skills,
      avatarUrl: users.avatarUrl,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, userId));
    
    if (!profile) return undefined;
    
    // Convert Date to ISO string to match our schema
    return {
      ...profile,
      createdAt: profile.createdAt ? profile.createdAt.toISOString() : null
    };
  }

  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.id));
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    try {
      const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
      return task;
    } catch (error) {
      console.error("Error in getTaskById with ORM:", error);
      
      try {
        // Try with direct SQL query
        const pool = await import("./db").then(m => m.pool);
        const result = await pool.query(
          `SELECT * FROM tasks WHERE id = $1`,
          [id]
        );
        
        if (result.rows.length > 0) {
          return result.rows[0] as Task;
        }
        return undefined;
      } catch (fallbackError) {
        console.error("Failed to fetch task by ID:", fallbackError);
        return undefined;
      }
    }
  }

  async getTasksByUserId(userId: number): Promise<Task[]> {
    try {
      // First try with direct pool query which has better error reporting
      const pool = await import("./db").then(m => m.pool);
      console.log(`Executing raw SQL query to get tasks for user ${userId}`);
      
      const result = await pool.query(
        `SELECT * FROM tasks WHERE user_id = $1 ORDER BY id DESC`, 
        [userId]
      );
      
      console.log(`Raw SQL query returned ${result.rows.length} tasks for user ${userId}`);
      
      // Map the snake_case column names from SQL to camelCase for JS
      const tasks = result.rows.map(row => {
        return {
          id: row.id,
          title: row.title,
          description: row.description,
          dueDate: row.due_date,
          completed: row.completed,
          completedAt: row.completed_at,
          priority: row.priority,
          category: row.category,
          estimatedTime: row.estimated_time,
          userId: row.user_id,
          assignedToUserId: row.assigned_to_user_id,
          isPublic: row.is_public
        } as Task;
      });
      
      return tasks;
    } catch (error) {
      console.error("Error in getTasksByUserId with raw SQL:", error);
      return [];
    }
  }
  
  async getTasksAssignedToUser(userId: number): Promise<Task[]> {
    try {
      return await db.select().from(tasks).where(eq(tasks.assignedToUserId, userId)).orderBy(desc(tasks.id));
    } catch (error) {
      console.error("Error in getTasksAssignedToUser, falling back to empty array:", error);
      // Return empty array for now if column is missing
      return [];
    }
  }
  
  async getPublicTasks(): Promise<Task[]> {
    try {
      // First try using the standard Drizzle ORM approach
      return await db.select().from(tasks).where(eq(tasks.isPublic, true)).orderBy(desc(tasks.id));
    } catch (error) {
      console.error("Error in getPublicTasks with ORM:", error);
      
      try {
        // First, try to add the column if it doesn't exist
        const pool = await import("./db").then(m => m.pool);
        await pool.query(
          `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false`
        );
        
        // Try again with direct SQL
        const result = await pool.query(
          `SELECT * FROM tasks WHERE is_public = true ORDER BY id DESC`
        );
        
        return result.rows as Task[];
      } catch (fallbackError) {
        console.error("Failed to query public tasks:", fallbackError);
        // If there's a database schema mismatch, return an empty array
        return [];
      }
    }
  }
  
  async getPublicTasksByUserId(userId: number): Promise<Task[]> {
    try {
      // First try using the standard Drizzle ORM approach
      return await db.select().from(tasks)
        .where(and(
          eq(tasks.userId, userId),
          eq(tasks.isPublic, true)
        ))
        .orderBy(desc(tasks.id));
    } catch (error) {
      console.error("Error in getPublicTasksByUserId with ORM:", error);
      
      try {
        // First, try to add the column if it doesn't exist
        const pool = await import("./db").then(m => m.pool);
        await pool.query(
          `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false`
        );
        
        // Try again with direct SQL
        const result = await pool.query(
          `SELECT * FROM tasks WHERE user_id = $1 AND is_public = true ORDER BY id DESC`,
          [userId]
        );
        
        return result.rows as Task[];
      } catch (fallbackError) {
        console.error("Failed to query public tasks by user ID:", fallbackError);
        // If there's a database schema mismatch, return an empty array
        return [];
      }
    }
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    try {
      // First, ensure all the necessary columns exist
      try {
        // Add missing columns if they don't exist
        const pool = await import("./db").then(m => m.pool);
        
        // Add assigned_to_user_id column if it doesn't exist
        await pool.query(
          `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_user_id INTEGER`
        );
        
        // Add is_public column if it doesn't exist
        await pool.query(
          `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false`
        );
        
        console.log("Added missing columns to tasks table if needed");
      } catch (alterError) {
        console.error("Error adding columns to tasks table:", alterError);
        // Continue anyway as the next step might work
      }
      
      // Process and convert date strings to Date objects
      let processedDueDate = null;
      if (insertTask.dueDate) {
        if (typeof insertTask.dueDate === 'string') {
          // Convert string to Date if it's a string
          processedDueDate = new Date(insertTask.dueDate);
          console.log(`Converted date string '${insertTask.dueDate}' to Date object: ${processedDueDate}`);
        } else {
          // Already a Date object
          processedDueDate = insertTask.dueDate;
          console.log(`Using existing Date object: ${processedDueDate}`);
        }
      }

      // Try with all columns including the ones we just added
      const safeInsertTask = {
        title: insertTask.title,
        description: insertTask.description || null,
        dueDate: processedDueDate,
        completed: insertTask.completed || false,
        priority: insertTask.priority,
        category: insertTask.category,
        estimatedTime: insertTask.estimatedTime || null,
        userId: insertTask.userId || null,
        assignedToUserId: insertTask.assignedToUserId || null,
        isPublic: insertTask.isPublic || false
      };
      
      console.log("Safe insert task with converted date:", JSON.stringify(safeInsertTask, (key, value) => {
        // Handle Date objects in JSON stringify
        if (key === 'dueDate' && value instanceof Date) {
          return `Date object: ${value.toISOString()}`;
        }
        return value;
      }, 2));
      
      const [task] = await db.insert(tasks).values(safeInsertTask).returning();
      return task;
    } catch (error) {
      console.error("Error in createTask:", error);
      
      // If we still have issues, try the most basic raw SQL approach with only the columns we know exist
      try {
        console.log("Trying most basic insert with just the known columns");
        
        // Create a safe parameterized query using the pg module directly
        const pool = await import("./db").then(m => m.pool);
        const result = await pool.query(`
          INSERT INTO tasks (
            title, description, due_date, completed, priority, 
            category, completed_at, estimated_time, user_id
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          ) RETURNING *
        `, [
          insertTask.title,
          insertTask.description || null,
          // Handle date string to Date object conversion
          typeof insertTask.dueDate === 'string' ? new Date(insertTask.dueDate) : (insertTask.dueDate || null),
          insertTask.completed || false,
          insertTask.priority,
          insertTask.category,
          null, // completed_at
          insertTask.estimatedTime || null,
          insertTask.userId || null
        ]);
        
        if (result.rows.length > 0) {
          return result.rows[0] as Task;
        }
      } catch (fallbackError) {
        console.error("Even the fallback insert approach failed:", fallbackError);
      }
      
      // Re-throw the original error if our fallbacks didn't work
      throw error;
    }
  }

  async updateTask(id: number, updatedTask: Partial<InsertTask>): Promise<Task | undefined> {
    try {
      // First, ensure all necessary columns exist if we're trying to update them
      if (updatedTask.assignedToUserId !== undefined || updatedTask.isPublic !== undefined ||
          updatedTask.budget !== undefined || updatedTask.acceptingBids !== undefined || 
          updatedTask.biddingDeadline !== undefined) {
        try {
          // Add missing columns if they don't exist
          const pool = await import("./db").then(m => m.pool);
          
          // Add assigned_to_user_id column if it doesn't exist and we're trying to update it
          if (updatedTask.assignedToUserId !== undefined) {
            await pool.query(
              `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_user_id INTEGER`
            );
          }
          
          // Add is_public column if it doesn't exist and we're trying to update it
          if (updatedTask.isPublic !== undefined) {
            await pool.query(
              `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false`
            );
          }
          
          // Add bidding-related columns if they don't exist and we're trying to update them
          if (updatedTask.budget !== undefined) {
            await pool.query(
              `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2)`
            );
          }
          
          if (updatedTask.acceptingBids !== undefined) {
            await pool.query(
              `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS accepting_bids BOOLEAN DEFAULT false`
            );
          }
          
          if (updatedTask.biddingDeadline !== undefined) {
            await pool.query(
              `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS bidding_deadline TIMESTAMP`
            );
          }
          
          // Also add winning_bid_id column
          await pool.query(
            `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS winning_bid_id INTEGER`
          );
          
          console.log("Added missing columns to tasks table if needed for update");
        } catch (alterError) {
          console.error("Error adding columns to tasks table:", alterError);
          // Continue anyway as the next step might work
        }
      }
      
      // Create a safe update object with all columns
      const safeUpdateTask: Record<string, any> = {};
      
      // Include all fields, including the newly added ones
      if (updatedTask.title !== undefined) safeUpdateTask.title = updatedTask.title;
      if (updatedTask.description !== undefined) safeUpdateTask.description = updatedTask.description;
      if (updatedTask.dueDate !== undefined) safeUpdateTask.dueDate = updatedTask.dueDate;
      if (updatedTask.completed !== undefined) safeUpdateTask.completed = updatedTask.completed;
      if (updatedTask.priority !== undefined) safeUpdateTask.priority = updatedTask.priority;
      if (updatedTask.category !== undefined) safeUpdateTask.category = updatedTask.category;
      if (updatedTask.estimatedTime !== undefined) safeUpdateTask.estimatedTime = updatedTask.estimatedTime;
      if (updatedTask.userId !== undefined) safeUpdateTask.userId = updatedTask.userId;
      if (updatedTask.assignedToUserId !== undefined) safeUpdateTask.assignedToUserId = updatedTask.assignedToUserId;
      if (updatedTask.isPublic !== undefined) safeUpdateTask.isPublic = updatedTask.isPublic;
      
      // Add bidding-related fields
      if (updatedTask.budget !== undefined) safeUpdateTask.budget = updatedTask.budget;
      if (updatedTask.acceptingBids !== undefined) safeUpdateTask.acceptingBids = updatedTask.acceptingBids;
      if (updatedTask.biddingDeadline !== undefined) safeUpdateTask.biddingDeadline = updatedTask.biddingDeadline;
      
      // Only attempt to update if we have fields to update
      if (Object.keys(safeUpdateTask).length > 0) {
        const [task] = await db.update(tasks)
          .set(safeUpdateTask)
          .where(eq(tasks.id, id))
          .returning();
        
        return task;
      }
      
      // If nothing to update, retrieve the current task
      const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
      return task;
    } catch (error) {
      console.error("Error in updateTask:", error);
      
      // If we still have issues, try a raw SQL approach with only the known columns
      try {
        console.log("Trying update with raw SQL and known columns only");
        
        // Create a values string that excludes potential problematic fields
        const setClause = [];
        const values = [];
        let paramIndex = 1;
        
        // Only include fields that we know exist in the database based on our schema check
        if (updatedTask.title !== undefined) {
          setClause.push(`title = $${paramIndex++}`);
          values.push(updatedTask.title);
        }
        if (updatedTask.description !== undefined) {
          setClause.push(`description = $${paramIndex++}`);
          values.push(updatedTask.description);
        }
        if (updatedTask.dueDate !== undefined) {
          setClause.push(`due_date = $${paramIndex++}`);
          values.push(updatedTask.dueDate);
        }
        if (updatedTask.completed !== undefined) {
          setClause.push(`completed = $${paramIndex++}`);
          values.push(updatedTask.completed);
        }
        if (updatedTask.priority !== undefined) {
          setClause.push(`priority = $${paramIndex++}`);
          values.push(updatedTask.priority);
        }
        if (updatedTask.category !== undefined) {
          setClause.push(`category = $${paramIndex++}`);
          values.push(updatedTask.category);
        }
        if (updatedTask.estimatedTime !== undefined) {
          setClause.push(`estimated_time = $${paramIndex++}`);
          values.push(updatedTask.estimatedTime);
        }
        if (updatedTask.budget !== undefined) {
          setClause.push(`budget = $${paramIndex++}`);
          values.push(updatedTask.budget);
        }
        if (updatedTask.acceptingBids !== undefined) {
          setClause.push(`accepting_bids = $${paramIndex++}`);
          values.push(updatedTask.acceptingBids);
        }
        if (updatedTask.biddingDeadline !== undefined) {
          setClause.push(`bidding_deadline = $${paramIndex++}`);
          values.push(updatedTask.biddingDeadline);
        }
        // Add completion date if task is being marked as completed
        if (updatedTask.completed) {
          setClause.push(`completed_at = $${paramIndex++}`);
          values.push(new Date());
        }
        
        // If we have fields to update, do the update
        if (setClause.length > 0) {
          // Add the ID parameter to the values array
          values.push(id);
          
          // Build the dynamic SQL query using sql tagged template
          // Unfortunately this requires creating the SQL dynamically since we need to build 
          // the SET clause based on which fields are being updated
          const updateSql = `
            UPDATE tasks
            SET ${setClause.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
          `;
          
          // Create a safe parameterized query using the pg module directly
          const pool = await import("./db").then(m => m.pool);
          const result = await pool.query(updateSql, values);
          
          if (result.rows.length > 0) {
            return result.rows[0] as Task;
          }
        }
      } catch (fallbackError) {
        console.error("Even the fallback update approach failed:", fallbackError);
      }
      
      // Re-throw the original error if our fallbacks didn't work
      throw error;
    }
  }

  async deleteTask(id: number): Promise<boolean> {
    const [deletedTask] = await db.delete(tasks)
      .where(eq(tasks.id, id))
      .returning();
    
    return !!deletedTask;
  }

  async completeTask(id: number): Promise<Task | undefined> {
    try {
      // Try using standard Drizzle update first
      const [task] = await db.update(tasks)
        .set({ 
          completed: true,
          completedAt: new Date() 
        })
        .where(eq(tasks.id, id))
        .returning();
      
      return task;
    } catch (error) {
      console.error("Error in completeTask (possibly due to missing completedAt column):", error);
      
      // Fallback: use direct SQL to update only the columns we know exist
      try {
        const pool = await import("./db").then(m => m.pool);
        const result = await pool.query(
          `UPDATE tasks SET completed = true, completed_at = $1 WHERE id = $2 RETURNING *`,
          [new Date(), id]
        );
        
        if (result.rows.length > 0) {
          return result.rows[0] as Task;
        }
        return undefined;
      } catch (fallbackError) {
        console.error("Even the fallback complete approach failed:", fallbackError);
        throw error; // Rethrow original error if fallback also fails
      }
    }
  }
  
  async assignTaskToUser(taskId: number, assignedToUserId: number): Promise<Task | undefined> {
    try {
      // Try standard Drizzle approach first
      const [task] = await db.update(tasks)
        .set({ 
          assignedToUserId: assignedToUserId
        })
        .where(eq(tasks.id, taskId))
        .returning();
      
      return task;
    } catch (error) {
      console.error("Error in assignTaskToUser, database may be missing the column:", error);
      
      try {
        // Try to add the column if it doesn't exist
        const pool = await import("./db").then(m => m.pool);
        await pool.query(
          `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assigned_to_user_id INTEGER`
        );
        
        // Now try again with the direct pool
        const result = await pool.query(
          `UPDATE tasks SET assigned_to_user_id = $1 WHERE id = $2 RETURNING *`,
          [assignedToUserId, taskId]
        );
        
        if (result.rows.length > 0) {
          return result.rows[0] as Task;
        }
      } catch (fallbackError) {
        console.error("Failed to add or update assigned_to_user_id column:", fallbackError);
      }
      
      // If nothing worked, just return the task as is
      const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
      return task;
    }
  }
  
  async setTaskPublic(taskId: number, isPublic: boolean): Promise<Task | undefined> {
    try {
      // Try standard Drizzle approach first
      const [task] = await db.update(tasks)
        .set({ 
          isPublic: isPublic
        })
        .where(eq(tasks.id, taskId))
        .returning();
      
      return task;
    } catch (error) {
      console.error("Error in setTaskPublic, database may be missing the column:", error);
      
      try {
        // Try to add the column if it doesn't exist
        const pool = await import("./db").then(m => m.pool);
        await pool.query(
          `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false`
        );
        
        // Now try again with the direct pool
        const result = await pool.query(
          `UPDATE tasks SET is_public = $1 WHERE id = $2 RETURNING *`,
          [isPublic, taskId]
        );
        
        if (result.rows.length > 0) {
          return result.rows[0] as Task;
        }
      } catch (fallbackError) {
        console.error("Failed to add or update is_public column:", fallbackError);
      }
      
      // If nothing worked, just return the task as is
      const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
      return task;
    }
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: number): Promise<{conversation: Conversation, user: UserProfile}[]> {
    // Find all conversations where the user is either user1 or user2
    const conversationResults = await db
      .select()
      .from(conversations)
      .where(
        or(
          eq(conversations.user1Id, userId),
          eq(conversations.user2Id, userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));
      
    // For each conversation, get the other user's profile
    const results = await Promise.all(
      conversationResults.map(async (conv) => {
        const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
        const otherUser = await this.getUserProfile(otherUserId);
        
        if (!otherUser) {
          throw new Error(`User not found: ${otherUserId}`);
        }
        
        return {
          conversation: conv,
          user: otherUser
        };
      })
    );
    
    return results;
  }
  
  /**
   * Get messages between two users
   */
  async getMessages(user1Id: number, user2Id: number): Promise<DirectMessage[]> {
    // Find messages between these two users in either direction
    const messages = await db
      .select()
      .from(directMessages)
      .where(
        or(
          and(
            eq(directMessages.senderId, user1Id),
            eq(directMessages.receiverId, user2Id)
          ),
          and(
            eq(directMessages.senderId, user2Id),
            eq(directMessages.receiverId, user1Id)
          )
        )
      )
      .orderBy(asc(directMessages.createdAt));
    
    // Transform the messages to make them compatible with the frontend
    // Adding content property based on message for frontend compatibility
    return messages.map(msg => ({
      ...msg,
      // @ts-ignore - This adds a virtual 'content' field for frontend compatibility
      content: msg.message
    }));
  }
  
  /**
   * Send a message from one user to another
   */
  async sendMessage(message: InsertDirectMessage): Promise<DirectMessage> {
    // First, ensure conversation exists or create it
    const existingConversation = await db
      .select()
      .from(conversations)
      .where(
        or(
          and(
            eq(conversations.user1Id, message.senderId),
            eq(conversations.user2Id, message.receiverId)
          ),
          and(
            eq(conversations.user1Id, message.receiverId),
            eq(conversations.user2Id, message.senderId)
          )
        )
      )
      .limit(1);
      
    if (existingConversation.length === 0) {
      // Create new conversation
      await db.insert(conversations).values({
        user1Id: message.senderId,
        user2Id: message.receiverId,
        lastMessageAt: new Date(),
        unreadCount: 1
      });
    } else {
      // Update existing conversation
      const conv = existingConversation[0];
      await db.update(conversations)
        .set({
          lastMessageAt: new Date(),
          unreadCount: conv.unreadCount + 1
        })
        .where(eq(conversations.id, conv.id));
    }
    
    // Insert the message
    // Map 'content' to 'message' field for database compatibility
    const [newMessage] = await db
      .insert(directMessages)
      .values({
        senderId: message.senderId,
        receiverId: message.receiverId,
        message: message.content, // Map the content field to message field
        read: message.read || false,
        createdAt: message.createdAt || new Date()
      })
      .returning();
    
    // Add content property for frontend compatibility
    return {
      ...newMessage,
      // @ts-ignore - This adds a virtual 'content' field for frontend compatibility
      content: newMessage.message
    };
  }
  
  /**
   * Mark messages as read
   */
  async markMessagesAsRead(userId: number, otherUserId: number): Promise<void> {
    // Update all messages sent to this user by the other user
    await db.update(directMessages)
      .set({ read: true })
      .where(
        and(
          eq(directMessages.receiverId, userId),
          eq(directMessages.senderId, otherUserId),
          eq(directMessages.read, false)
        )
      );
      
    // Reset unread count in conversation
    await db.update(conversations)
      .set({ unreadCount: 0 })
      .where(
        or(
          and(
            eq(conversations.user1Id, userId),
            eq(conversations.user2Id, otherUserId)
          ),
          and(
            eq(conversations.user1Id, otherUserId),
            eq(conversations.user2Id, userId)
          )
        )
      );
  }
  
  // Task Template methods
  
  /**
   * Get all task templates
   */
  async getTaskTemplates(): Promise<TaskTemplate[]> {
    return await db.select().from(taskTemplates).orderBy(desc(taskTemplates.id));
  }
  
  /**
   * Get a task template by ID
   */
  async getTaskTemplateById(id: number): Promise<TaskTemplate | undefined> {
    const [template] = await db.select().from(taskTemplates).where(eq(taskTemplates.id, id));
    return template;
  }
  
  /**
   * Get task templates created by a specific user
   */
  async getTaskTemplatesByUserId(userId: number): Promise<TaskTemplate[]> {
    return await db.select()
      .from(taskTemplates)
      .where(eq(taskTemplates.userId, userId))
      .orderBy(desc(taskTemplates.id));
  }
  
  /**
   * Get all public task templates
   */
  async getPublicTaskTemplates(): Promise<TaskTemplate[]> {
    return await db.select()
      .from(taskTemplates)
      .where(eq(taskTemplates.isPublic, true))
      .orderBy(desc(taskTemplates.id));
  }
  
  /**
   * Create a new task template
   */
  async createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate> {
    const [newTemplate] = await db.insert(taskTemplates).values(template).returning();
    return newTemplate;
  }
  
  /**
   * Update an existing task template
   */
  async updateTaskTemplate(id: number, template: Partial<InsertTaskTemplate>): Promise<TaskTemplate | undefined> {
    const [updatedTemplate] = await db.update(taskTemplates)
      .set(template)
      .where(eq(taskTemplates.id, id))
      .returning();
    
    return updatedTemplate;
  }
  
  /**
   * Delete a task template
   */
  async deleteTaskTemplate(id: number): Promise<boolean> {
    const [deletedTemplate] = await db.delete(taskTemplates)
      .where(eq(taskTemplates.id, id))
      .returning();
    
    return !!deletedTemplate;
  }
  
  /**
   * Set a task template's public visibility
   */
  async setTaskTemplatePublic(templateId: number, isPublic: boolean): Promise<TaskTemplate | undefined> {
    const [template] = await db.update(taskTemplates)
      .set({ 
        isPublic: isPublic
      })
      .where(eq(taskTemplates.id, templateId))
      .returning();
    
    return template;
  }
  
  /**
   * Create a new task from a template
   */
  async createTaskFromTemplate(templateId: number, userId: number, dueDate?: Date): Promise<Task> {
    // First get the template
    const template = await this.getTaskTemplateById(templateId);
    
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }
    
    // Create a new task from the template
    const taskData: InsertTask = {
      title: template.title,
      description: template.description,
      priority: template.priority as "high" | "medium" | "low",
      category: template.category,
      estimatedTime: template.estimatedTime,
      completed: false,
      dueDate: dueDate || null,
      userId: userId,
      isPublic: false // Always create as private initially
    };
    
    return await this.createTask(taskData);
  }
  
  /**
   * Get all bids for a specific task
   */
  async getTaskBids(taskId: number): Promise<TaskBid[]> {
    try {
      await this.ensureTaskBidsColumns();
      
      const bids = await db.select().from(taskBids)
        .where(eq(taskBids.taskId, taskId))
        .orderBy(desc(taskBids.createdAt));
      
      // Add user info to each bid
      const bidsWithUsers = [];
      for (const bid of bids) {
        const user = await this.getUser(bid.bidderId);
        if (user) {
          bidsWithUsers.push({
            ...bid,
            user: {
              id: user.id,
              username: user.username,
              displayName: user.displayName,
              avatarUrl: user.avatarUrl
            }
          });
        } else {
          bidsWithUsers.push(bid);
        }
      }
      
      return bidsWithUsers;
    } catch (error) {
      console.error("Error getting task bids:", error);
      return [];
    }
  }
  
  /**
   * Get a specific bid by its ID
   */
  async getTaskBidById(bidId: number): Promise<TaskBid | undefined> {
    try {
      await this.ensureTaskBidsColumns();
      
      const [bid] = await db.select().from(taskBids)
        .where(eq(taskBids.id, bidId));
      
      if (!bid) return undefined;
      
      // Add user info to the bid
      const user = await this.getUser(bid.bidderId);
      if (user) {
        return {
          ...bid,
          user: {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl
          }
        };
      }
      
      return bid;
    } catch (error) {
      console.error("Error getting task bid by ID:", error);
      return undefined;
    }
  }
  
  /**
   * Create a new bid on a task
   */
  async createTaskBid(bid: InsertTaskBid): Promise<TaskBid> {
    try {
      await this.ensureTaskBidsColumns();
      
      const bidData = {
        ...bid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const [newBid] = await db.insert(taskBids).values(bidData).returning();
      return newBid;
    } catch (error) {
      console.error("Error creating task bid:", error);
      throw error;
    }
  }
  
  /**
   * Update an existing bid
   */
  async updateTaskBid(bidId: number, bid: Partial<InsertTaskBid> | {status: string, updatedAt?: Date}): Promise<TaskBid | undefined> {
    try {
      await this.ensureTaskBidsColumns();
      
      // Extract bid-specific properties and add updatedAt
      const updateData: any = {
        ...(bid.taskId !== undefined && { taskId: bid.taskId }),
        ...(bid.bidderId !== undefined && { bidderId: bid.bidderId }),
        ...(bid.amount !== undefined && { amount: bid.amount }),
        ...(bid.estimatedTime !== undefined && { estimatedTime: bid.estimatedTime }),
        ...(bid.proposal !== undefined && { proposal: bid.proposal }),
        ...(bid.status !== undefined && { status: bid.status }),
        updatedAt: bid.updatedAt || new Date()
      };
      
      console.log(`Updating bid ${bidId} with data:`, JSON.stringify(updateData));
      
      const [updatedBid] = await db.update(taskBids)
        .set(updateData)
        .where(eq(taskBids.id, bidId))
        .returning();
      
      console.log(`Updated bid result:`, JSON.stringify(updatedBid));
      
      return updatedBid;
    } catch (error) {
      console.error("Error updating task bid:", error);
      return undefined;
    }
  }
  
  /**
   * Delete a bid
   */
  async deleteTaskBid(bidId: number): Promise<boolean> {
    try {
      await this.ensureTaskBidsColumns();
      
      await db.delete(taskBids)
        .where(eq(taskBids.id, bidId));
      
      return true;
    } catch (error) {
      console.error("Error deleting task bid:", error);
      return false;
    }
  }
  
  /**
   * Accept a bid for a task
   */
  async acceptTaskBid(taskId: number, bidId: number): Promise<Task | undefined> {
    try {
      // Get the task
      const task = await this.getTaskById(taskId);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }
      
      // Get the bid
      const bid = await this.getTaskBidById(bidId);
      if (!bid) {
        throw new Error(`Bid with ID ${bidId} not found`);
      }
      
      // Make sure the bid is for this task
      if (bid.taskId !== taskId) {
        throw new Error(`Bid ${bidId} does not belong to task ${taskId}`);
      }
      
      console.log(`Accepting bid ${bidId} for task ${taskId}, current status: ${bid.status}`);
      
      // CRITICAL FIX: Use direct SQL query to ensure the status is updated properly
      try {
        await pool.query(
          `UPDATE task_bids SET status = $1, updated_at = $2 WHERE id = $3`,
          ['accepted', new Date(), bidId]
        );
        console.log(`Executed direct SQL update for bid ${bidId} status to 'accepted'`);
      } catch (sqlError) {
        console.error(`SQL error updating bid ${bidId} status:`, sqlError);
        throw new Error(`Database error updating bid status: ${sqlError.message}`);
      }
      
      // Verify the update worked
      console.log(`Verifying bid ${bidId} status update...`);
      const verifyBid = await this.getTaskBidById(bidId);
      
      if (!verifyBid) {
        throw new Error(`Could not retrieve bid ${bidId} after status update`);
      }
      
      console.log(`Verification result: Bid ${bidId} status is now '${verifyBid.status}'`);
      
      if (verifyBid.status !== 'accepted') {
        console.error(`Failed to update bid ${bidId} status. Current status: ${verifyBid.status}`);
        throw new Error(`Failed to update bid status to 'accepted'`);
      }
      
      // Update other bids for this task to 'rejected'
      try {
        // CRITICAL FIX: Use direct SQL query to ensure rejected statuses are updated properly
        await pool.query(
          `UPDATE task_bids SET status = $1, updated_at = $2 WHERE task_id = $3 AND id != $4`,
          ['rejected', new Date(), taskId, bidId]
        );
        console.log(`Executed direct SQL update to reject other bids for task ${taskId}`);
      } catch (sqlError) {
        console.error(`SQL error updating other bids:`, sqlError);
        // Continue even if this fails, as the accepted bid is more important
      }
      
      // Update the task with the winning bid ID and stop accepting bids
      const updatedTask = await this.updateTask(taskId, { 
        winningBidId: bidId,
        acceptingBids: false
      });
      
      if (!updatedTask) {
        throw new Error(`Failed to update task ${taskId} with winning bid ${bidId}`);
      }
      
      console.log(`Task ${taskId} updated with winning bid ${bidId}`);
      
      return updatedTask;
    } catch (error) {
      console.error("Error accepting task bid:", error);
      return undefined;
    }
  }
  
  /**
   * Ensure task_bids columns exist
   */
  private async ensureTaskBidsColumns(): Promise<void> {
    try {
      // Add necessary columns to tasks table if they don't exist
      await pool.query(`
        ALTER TABLE tasks 
        ADD COLUMN IF NOT EXISTS budget NUMERIC(10, 2),
        ADD COLUMN IF NOT EXISTS accepting_bids BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS bidding_deadline TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS winning_bid_id INTEGER;
      `);
    } catch (error) {
      console.error("Error ensuring task_bids columns exist:", error);
      throw error;
    }
  }
  
  /**
   * Initialize demo data if the database is empty
   * @param forceReset If true, will drop all existing data and recreate demo data
   */
  async initializeDemo(forceReset: boolean = false): Promise<void> {
    // Check if there are any users
    const existingUsers = await db.select().from(users);
    
    // If we have users and aren't doing a force reset, exit
    if (existingUsers.length > 0 && !forceReset) {
      return; // Database already has data
    }
    
    // If we're doing a force reset, drop all existing data
    if (forceReset && existingUsers.length > 0) {
      console.log("[DatabaseStorage] Force resetting demo data...");
      
      // Delete all data in reverse order of dependencies
      await db.delete(directMessages);
      await db.delete(conversations);
      await db.delete(tasks);
      await db.delete(users);
      
      console.log("[DatabaseStorage] All existing data cleared. Recreating demo data...");
    }

    // Create demo user with properly hashed password
    // Using a hardcoded hash for "password"
    const hashedPassword = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8.abcdef1234567890";
    
    const [demoUser] = await db.insert(users).values({
      username: "demo",
      // The column in the database is named 'display_name' but our Drizzle schema maps it to 'displayName'
      // The insert will handle the mapping correctly
      displayName: "Demo User",
      password: hashedPassword,
      bio: "I'm a productivity enthusiast who loves trying new task management methods.",
      interests: ["productivity", "technology", "time management"],
      skills: ["organization", "planning", "prioritization"]
    }).returning();
    
    // Create additional demo users for messaging
    const demoUsers = [
      {
        username: "alex",
        displayName: "Alex Johnson",
        password: hashedPassword,
        bio: "Software developer with a passion for clean code and efficient workflows.",
        interests: ["coding", "coffee", "music"],
        skills: ["javascript", "react", "nodejs"]
      },
      {
        username: "samantha",
        displayName: "Sam Carter",
        password: hashedPassword,
        bio: "Project manager focused on agile methodologies and team productivity.",
        interests: ["agile", "leadership", "team building"],
        skills: ["scrum", "kanban", "stakeholder management"]
      },
      {
        username: "jordan",
        displayName: "Jordan Smith",
        password: hashedPassword,
        bio: "UX designer who believes in creating intuitive and accessible interfaces.",
        interests: ["design", "accessibility", "user research"],
        skills: ["figma", "prototyping", "user testing"]
      }
    ];
    
    const createdUsers = [];
    for (const user of demoUsers) {
      const [createdUser] = await db.insert(users).values(user).returning();
      createdUsers.push(createdUser);
    }

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
    
    // Create demo conversations and messages
    if (createdUsers.length > 0) {
      // Create conversations between users
      const conversationPairs = [
        // Demo user conversations
        { user1Id: demoUser.id, user2Id: createdUsers[0].id, unreadCount: 1 }, // demo <-> alex
        { user1Id: demoUser.id, user2Id: createdUsers[1].id, unreadCount: 2 }, // demo <-> samantha
        { user1Id: demoUser.id, user2Id: createdUsers[2].id, unreadCount: 0 }, // demo <-> jordan
        
        // Other user conversations
        { user1Id: createdUsers[0].id, user2Id: createdUsers[1].id, unreadCount: 1 }, // alex <-> samantha
        { user1Id: createdUsers[0].id, user2Id: createdUsers[2].id, unreadCount: 3 }, // alex <-> jordan
        { user1Id: createdUsers[1].id, user2Id: createdUsers[2].id, unreadCount: 0 }, // samantha <-> jordan
      ];
      
      // Insert all conversations
      for (const convo of conversationPairs) {
        await db.insert(conversations).values({
          ...convo,
          lastMessageAt: new Date(Date.now() - Math.floor(Math.random() * 86400000)) // Random time in last 24 hours
        });
      }
      
      // Demo conversation between demo and alex (first user)
      const demoAlexMessages = [
        {
          senderId: createdUsers[0].id, // alex
          receiverId: demoUser.id, // demo
          message: "Hi there! I saw you're interested in productivity. Any favorite tools you're using?",
          read: true,
          createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          senderId: demoUser.id, // demo
          receiverId: createdUsers[0].id, // alex
          message: "Hey! I'm currently trying out this new task manager app. It's really helping me stay organized.",
          read: true,
          createdAt: new Date(Date.now() - 3000000) // 50 minutes ago
        },
        {
          senderId: createdUsers[0].id, // alex
          receiverId: demoUser.id, // demo
          message: "Sounds interesting! Does it have deadline reminders?",
          read: true,
          createdAt: new Date(Date.now() - 2400000) // 40 minutes ago
        },
        {
          senderId: demoUser.id, // demo
          receiverId: createdUsers[0].id, // alex
          message: "Yes, and it also has AI assistance for breaking down complex tasks!",
          read: false,
          createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
        }
      ];
      
      // Demo conversation between demo and samantha
      const demoSamanthaMessages = [
        {
          senderId: createdUsers[1].id, // samantha
          receiverId: demoUser.id, // demo
          message: "Hello! I heard you're using a new productivity app. As a project manager, I'm always looking for ways to improve my team's workflow.",
          read: true,
          createdAt: new Date(Date.now() - 7200000) // 2 hours ago
        },
        {
          senderId: demoUser.id, // demo
          receiverId: createdUsers[1].id, // samantha
          message: "Hi Sam! Yes, it's been great for managing both personal and team tasks. The priority system is really helpful.",
          read: true,
          createdAt: new Date(Date.now() - 7000000) // 116 minutes ago
        },
        {
          senderId: createdUsers[1].id, // samantha
          receiverId: demoUser.id, // demo
          message: "That sounds perfect for our upcoming project. Can we schedule a demo sometime?",
          read: true,
          createdAt: new Date(Date.now() - 6800000) // 113 minutes ago
        },
        {
          senderId: createdUsers[1].id, // samantha
          receiverId: demoUser.id, // demo
          message: "Also, do you know if it integrates with any agile boards?",
          read: false,
          createdAt: new Date(Date.now() - 5400000) // 90 minutes ago
        },
        {
          senderId: createdUsers[1].id, // samantha
          receiverId: demoUser.id, // demo
          message: "I'd love to implement it for our next sprint if it works well!",
          read: false,
          createdAt: new Date(Date.now() - 5000000) // 83 minutes ago
        }
      ];
      
      // Demo conversation between demo and jordan
      const demoJordanMessages = [
        {
          senderId: demoUser.id, // demo
          receiverId: createdUsers[2].id, // jordan
          message: "Hi Jordan! I really liked the UX improvements you suggested for our app.",
          read: true,
          createdAt: new Date(Date.now() - 10800000) // 3 hours ago
        },
        {
          senderId: createdUsers[2].id, // jordan
          receiverId: demoUser.id, // demo
          message: "Thanks! I've been focusing on making the interface more intuitive. How's the accessibility testing going?",
          read: true,
          createdAt: new Date(Date.now() - 10600000) // 176 minutes ago
        },
        {
          senderId: demoUser.id, // demo
          receiverId: createdUsers[2].id, // jordan
          message: "It's coming along well. The screen reader compatibility is much better now.",
          read: true,
          createdAt: new Date(Date.now() - 10400000) // 173 minutes ago
        }
      ];
      
      // Demo conversation between alex and samantha
      const alexSamanthaMessages = [
        {
          senderId: createdUsers[0].id, // alex
          receiverId: createdUsers[1].id, // samantha
          message: "Hey Sam, how's the project planning going?",
          read: true,
          createdAt: new Date(Date.now() - 14400000) // 4 hours ago
        },
        {
          senderId: createdUsers[1].id, // samantha
          receiverId: createdUsers[0].id, // alex
          message: "Good! I'm testing out some new task management approaches. Have you tried the AI delegation feature?",
          read: true,
          createdAt: new Date(Date.now() - 14200000) // 236 minutes ago
        },
        {
          senderId: createdUsers[0].id, // alex
          receiverId: createdUsers[1].id, // samantha
          message: "Not yet, but I'm interested. How does it handle complex technical tasks?",
          read: false,
          createdAt: new Date(Date.now() - 14000000) // 233 minutes ago
        }
      ];
      
      // Insert all messages
      await db.insert(directMessages).values([
        ...demoAlexMessages,
        ...demoSamanthaMessages,
        ...demoJordanMessages,
        ...alexSamanthaMessages
      ]);
    }
  }
}

export const storage = new DatabaseStorage();
