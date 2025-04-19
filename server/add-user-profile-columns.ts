import { pool } from "./db";

/**
 * Add new columns to the users table to support enhanced user profiles
 */
async function addUserProfileColumns() {
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Add is_public column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false
    `);
    
    // Add location column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS location TEXT
    `);
    
    // Add website column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS website TEXT
    `);
    
    // Add social_links column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'
    `);
    
    // Add completed_task_count column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS completed_task_count INTEGER DEFAULT 0
    `);
    
    // Add total_task_count column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS total_task_count INTEGER DEFAULT 0
    `);
    
    // Add joined_at column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT NOW()
    `);
    
    // Add last_active column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS last_active TIMESTAMP
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Successfully added user profile columns to the users table');
    
    // Update task statistics for all users
    await updateTaskStatistics(client);
    
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Error adding user profile columns:', error);
    throw error;
  } finally {
    // Release client back to the pool
    client.release();
  }
}

/**
 * Update task statistics for all users
 */
async function updateTaskStatistics(client: any) {
  try {
    // Get all users
    const usersResult = await client.query('SELECT id FROM users');
    const users = usersResult.rows;
    
    console.log(`Updating task statistics for ${users.length} users`);
    
    // For each user, update their task statistics
    for (const user of users) {
      const userId = user.id;
      
      // Get total task count
      const totalResult = await client.query(
        'SELECT COUNT(*) FROM tasks WHERE user_id = $1',
        [userId]
      );
      const totalCount = parseInt(totalResult.rows[0].count);
      
      // Get completed task count
      const completedResult = await client.query(
        'SELECT COUNT(*) FROM tasks WHERE user_id = $1 AND completed = true',
        [userId]
      );
      const completedCount = parseInt(completedResult.rows[0].count);
      
      // Update user record
      await client.query(
        'UPDATE users SET total_task_count = $1, completed_task_count = $2 WHERE id = $3',
        [totalCount, completedCount, userId]
      );
      
      console.log(`Updated user ${userId} with ${totalCount} total tasks and ${completedCount} completed tasks`);
    }
    
    console.log('Successfully updated task statistics for all users');
    
  } catch (error) {
    console.error('Error updating task statistics:', error);
  }
}

// In an ESM environment, we don't use the require.main check
// We'll just export the function for use in other modules

export { addUserProfileColumns };