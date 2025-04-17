import { db, pool } from './db';
import { sql } from 'drizzle-orm';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Add new columns to the direct_messages table to support enhanced chat features
 */
async function addMessageColumns() {
  try {
    console.log('Starting direct_messages table enhancement...');
    
    // First check if the required columns already exist
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'direct_messages' 
      AND column_name IN ('delivered', 'edited', 'edited_at', 'deleted', 'reactions', 'reply_to_id')
    `);

    const existingColumns = result.rows.map(row => row.column_name);
    
    // Add columns if they don't exist
    const columnsToAdd = [];
    
    if (!existingColumns.includes('delivered')) {
      columnsToAdd.push("ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS delivered BOOLEAN DEFAULT FALSE NOT NULL");
    }
    
    if (!existingColumns.includes('edited')) {
      columnsToAdd.push("ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS edited BOOLEAN DEFAULT FALSE");
    }
    
    if (!existingColumns.includes('edited_at')) {
      columnsToAdd.push("ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP");
    }
    
    if (!existingColumns.includes('deleted')) {
      columnsToAdd.push("ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE");
    }
    
    if (!existingColumns.includes('reactions')) {
      columnsToAdd.push("ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'");
    }
    
    if (!existingColumns.includes('reply_to_id')) {
      columnsToAdd.push("ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS reply_to_id INTEGER REFERENCES direct_messages(id)");
    }
    
    // Execute the ALTER TABLE statements if needed
    if (columnsToAdd.length > 0) {
      for (const alterStatement of columnsToAdd) {
        console.log(`Executing: ${alterStatement}`);
        await pool.query(alterStatement);
      }
      console.log('Direct messages table enhanced successfully with new columns.');
    } else {
      console.log('All required columns already exist in the direct_messages table.');
    }
    
  } catch (error) {
    console.error('Error enhancing direct_messages table:', error);
    throw error;
  } finally {
    console.log('Closing pool connection...');
  }
}

// Self-invoking function to run migration
(async () => {
  try {
    await addMessageColumns();
    console.log('Message columns migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
})();

export default addMessageColumns;