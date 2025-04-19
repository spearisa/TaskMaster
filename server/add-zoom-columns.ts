
import { pool } from './db';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function addZoomColumns() {
  try {
    console.log('Adding Zoom columns to tasks table...');
    
    // Add Zoom meeting columns
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT,
      ADD COLUMN IF NOT EXISTS zoom_join_url TEXT,
      ADD COLUMN IF NOT EXISTS zoom_start_url TEXT
    `);
    
    console.log('Successfully added Zoom columns');
  } catch (error) {
    console.error('Error adding Zoom columns:', error);
    throw error;
  }
}

// Run immediately if executed directly
if (import.meta.url === `file://${__filename}`) {
  addZoomColumns()
    .then(() => {
      console.log('Database column additions complete!');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error in column addition process:', err);
      process.exit(1);
    });
}

export { addZoomColumns };
