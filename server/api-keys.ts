import { pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { db } from './db';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// Define the apiKeys table schema
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  userId: serial("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  revoked: text("revoked").default("false"),
});

// Type for API key objects
export interface ApiKey {
  id: number;
  key: string;
  name: string;
  userId: number;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revoked: string;
}

// Function to generate a new API key
export function generateApiKey(prefix: string = 'appmo') {
  const key = `${prefix}_${randomBytes(16).toString('hex')}`;
  return key;
}

// Function to create a new API key for a user
export async function createApiKey(userId: number, name: string): Promise<ApiKey> {
  const key = generateApiKey();
  
  const [apiKey] = await db
    .insert(apiKeys)
    .values({
      key,
      name,
      userId,
      createdAt: new Date(),
    })
    .returning();
    
  return apiKey as ApiKey;
}

// Function to get all API keys for a user
export async function getApiKeys(userId: number): Promise<ApiKey[]> {
  const keys = await db
    .select()
    .from(apiKeys)
    .where(and(
      eq(apiKeys.userId, userId),
      eq(apiKeys.revoked, "false")
    ));
    
  return keys as ApiKey[];
}

// Function to validate an API key
export async function validateApiKey(key: string): Promise<ApiKey | null> {
  const [apiKey] = await db
    .select()
    .from(apiKeys)
    .where(and(
      eq(apiKeys.key, key),
      eq(apiKeys.revoked, "false")
    ));
    
  if (!apiKey) {
    return null;
  }
  
  // Update last used timestamp
  await db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, apiKey.id));
    
  // Check if key is expired
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return null;
  }
  
  return apiKey as ApiKey;
}

// Function to revoke (delete) an API key
export async function revokeApiKey(id: number, userId: number): Promise<boolean> {
  const [apiKey] = await db
    .update(apiKeys)
    .set({ revoked: "true" })
    .where(and(
      eq(apiKeys.id, id),
      eq(apiKeys.userId, userId)
    ))
    .returning();
    
  return !!apiKey;
}