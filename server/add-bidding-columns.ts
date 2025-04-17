// Script to add any missing bidding columns to the database
import { pool } from './db';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current file path and dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function addBiddingColumns() {
  try {
    console.log('Adding bidding columns to the tasks table...');
    
    // Add budget column if it doesn't exist
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2)
    `);
    console.log('Added budget column (if needed)');
    
    // Add accepting_bids column if it doesn't exist
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS accepting_bids BOOLEAN DEFAULT false
    `);
    console.log('Added accepting_bids column (if needed)');
    
    // Add bidding_deadline column if it doesn't exist
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS bidding_deadline TIMESTAMP
    `);
    console.log('Added bidding_deadline column (if needed)');
    
    // Add winning_bid_id column if it doesn't exist
    await pool.query(`
      ALTER TABLE tasks 
      ADD COLUMN IF NOT EXISTS winning_bid_id INTEGER
    `);
    console.log('Added winning_bid_id column (if needed)');
    
    console.log('Successfully added all required bidding columns');
  } catch (error) {
    console.error('Error adding bidding columns:', error);
  }
}

// Run immediately if executed directly
if (import.meta.url === `file://${__filename}`) {
  addBiddingColumns()
    .then(() => {
      console.log('Database column additions complete!');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error in column addition process:', err);
      process.exit(1);
    });
}

export { addBiddingColumns };