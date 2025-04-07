import { 
  tasks, type Task, type InsertTask, 
  users, type User, type InsertUser, type UpdateProfile, type UserProfile,
  directMessages, type DirectMessage, type InsertDirectMessage,
  conversations, type Conversation
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
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  completeTask(id: number): Promise<Task | undefined>;
  
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
    // Search for users by username, displayName, interests, or skills
    // Exclude the current user from results
    const results = await db.select({
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
      and(
        not(eq(users.id, currentUserId)),
        or(
          ilike(users.username, `%${query}%`),
          ilike(users.displayName || '', `%${query}%`),
          sql`${users.interests}::text[] && ARRAY[${query}]::text[]`,
          sql`${users.skills}::text[] && ARRAY[${query}]::text[]`
        )
      )
    )
    .orderBy(asc(users.username))
    .limit(20);
    
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
      // Create a conversation between demo user and first created user
      const [conversation1] = await db.insert(conversations).values({
        user1Id: demoUser.id,
        user2Id: createdUsers[0].id,
        lastMessageAt: new Date(),
        unreadCount: 0
      }).returning();
      
      // Add some demo messages
      const demoMessages = [
        {
          senderId: createdUsers[0].id,
          receiverId: demoUser.id,
          message: "Hi there! I saw you're interested in productivity. Any favorite tools you're using?",
          read: true,
          createdAt: new Date(Date.now() - 3600000) // 1 hour ago
        },
        {
          senderId: demoUser.id,
          receiverId: createdUsers[0].id,
          message: "Hey! I'm currently trying out this new task manager app. It's really helping me stay organized.",
          read: true,
          createdAt: new Date(Date.now() - 3000000) // 50 minutes ago
        },
        {
          senderId: createdUsers[0].id,
          receiverId: demoUser.id,
          message: "Sounds interesting! Does it have deadline reminders?",
          read: true,
          createdAt: new Date(Date.now() - 2400000) // 40 minutes ago
        },
        {
          senderId: demoUser.id,
          receiverId: createdUsers[0].id,
          message: "Yes, and it also has AI assistance for breaking down complex tasks!",
          read: false,
          createdAt: new Date(Date.now() - 1800000) // 30 minutes ago
        }
      ];
      
      await db.insert(directMessages).values(demoMessages);
    }
  }
}

export const storage = new DatabaseStorage();
