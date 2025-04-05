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
        password TEXT NOT NULL
      );
    `);
    
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
        user_id INTEGER REFERENCES users(id)
      );
    `);
    
    console.log("Database tables created successfully");
    return true;
  } catch (error) {
    console.error("Error creating database tables:", error);
    return false;
  }
}