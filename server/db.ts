import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

// Create PostgreSQL connection pool
const pool = new Pool({
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