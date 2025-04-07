import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create drizzle instance with the schema
export const db = drizzle(pool, { schema });

// Export a function to check the database connection
export async function checkDatabaseConnection() {
  try {
    const client = await pool.connect();
    client.release();
    console.log("Database connection established successfully");
    return true;
  } catch (error) {
    console.error("Error connecting to database:", error);
    return false;
  }
}

// Create database tables if they don't exist
export async function createDatabaseTables() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        display_name TEXT,
        bio TEXT,
        interests TEXT[],
        skills TEXT[],
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Check if tasks table needs new columns
    const checkColumnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tasks';
    `);
    
    const existingColumns = checkColumnsResult.rows.map(row => row.column_name);
    
    // Drop and recreate tasks table if missing columns
    if (!existingColumns.includes('assigned_to_user_id') || !existingColumns.includes('is_public')) {
      console.log("Recreating tasks table with missing columns...");
      await pool.query(`DROP TABLE IF EXISTS tasks;`);
      
      // Create tasks table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          due_date TIMESTAMP,
          completed BOOLEAN NOT NULL DEFAULT false,
          priority TEXT NOT NULL,
          category TEXT NOT NULL,
          completed_at TIMESTAMP,
          estimated_time INTEGER,
          user_id INTEGER REFERENCES users(id),
          assigned_to_user_id INTEGER REFERENCES users(id),
          is_public BOOLEAN NOT NULL DEFAULT false
        );
      `);
    } else {
      console.log("Tasks table already has all columns");
    }

    // Create direct_messages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS direct_messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) NOT NULL,
        receiver_id INTEGER REFERENCES users(id) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create conversations table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user1_id INTEGER REFERENCES users(id) NOT NULL,
        user2_id INTEGER REFERENCES users(id) NOT NULL,
        last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        unread_count INTEGER NOT NULL DEFAULT 0
      );
    `);
    
    // Check if task templates table exists
    const checkTemplatesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'task_templates';
    `);
    
    // Create task templates table if needed
    if (checkTemplatesResult.rows.length === 0) {
      console.log("Creating task_templates table...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS task_templates (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          priority TEXT NOT NULL,
          category TEXT NOT NULL,
          estimated_time INTEGER,
          steps TEXT[],
          tags TEXT[],
          icon TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          user_id INTEGER REFERENCES users(id),
          is_public BOOLEAN NOT NULL DEFAULT false
        );
      `);
    }
    
    console.log("Database tables created successfully");
    return true;
  } catch (error) {
    console.error("Error creating database tables:", error);
    return false;
  }
}