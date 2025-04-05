import { tasks, type Task, type InsertTask, type User, users, type InsertUser } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private userIdCounter: number;
  private taskIdCounter: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.userIdCounter = 1;
    this.taskIdCounter = 1;
    
    // Initialize with demo tasks
    this.initializeDemoTasks();
  }

  private initializeDemoTasks() {
    const demoUser: User = {
      id: this.userIdCounter++,
      username: "demo",
      password: "password"
    };
    this.users.set(demoUser.id, demoUser);

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
        completedAt: new Date(Date.now() - 3600000), // 1 hour ago
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

    demoTasks.forEach(task => {
      const id = this.taskIdCounter++;
      this.tasks.set(id, { ...task, id });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByUserId(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.userId === userId,
    );
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskIdCounter++;
    const task: Task = { ...insertTask, id };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updatedTask: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) {
      return undefined;
    }
    
    const updatedTaskObj: Task = { ...task, ...updatedTask };
    this.tasks.set(id, updatedTaskObj);
    return updatedTaskObj;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async completeTask(id: number): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) {
      return undefined;
    }
    
    const updatedTask: Task = { 
      ...task, 
      completed: true, 
      completedAt: new Date() 
    };
    
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
}

export const storage = new MemStorage();
