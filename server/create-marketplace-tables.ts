import { pool } from './db';
import * as schema from '@shared/schema';

/**
 * Create the marketplace tables in the database
 */
async function createMarketplaceTables() {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    console.log('Creating marketplace tables...');
    
    // Create app_listings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_listings (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        short_description TEXT,
        seller_id INTEGER REFERENCES users(id) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        status TEXT DEFAULT 'draft' NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        technologies TEXT[],
        monthly_revenue DECIMAL(10, 2),
        monthly_profit DECIMAL(10, 2),
        monthly_traffic INTEGER,
        established_date TIMESTAMP,
        includes_source_code BOOLEAN DEFAULT TRUE,
        featured_image TEXT,
        additional_images TEXT[],
        demo_url TEXT,
        verified BOOLEAN DEFAULT FALSE,
        repo_url TEXT,
        support_period INTEGER,
        support_details TEXT,
        documentation_url TEXT,
        last_maintained TIMESTAMP
      );
    `);
    console.log('Created app_listings table');
    
    // Create app_bids table
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_bids (
        id SERIAL PRIMARY KEY,
        listing_id INTEGER REFERENCES app_listings(id) NOT NULL,
        bidder_id INTEGER REFERENCES users(id) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        message TEXT,
        status TEXT DEFAULT 'pending' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('Created app_bids table');
    
    // Create app_favorites table
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) NOT NULL,
        listing_id INTEGER REFERENCES app_listings(id) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('Created app_favorites table');
    
    // Create app_questions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_questions (
        id SERIAL PRIMARY KEY,
        listing_id INTEGER REFERENCES app_listings(id) NOT NULL,
        asker_id INTEGER REFERENCES users(id) NOT NULL,
        question TEXT NOT NULL,
        answer TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        answered_at TIMESTAMP
      );
    `);
    console.log('Created app_questions table');
    
    // Create app_transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_transactions (
        id SERIAL PRIMARY KEY,
        listing_id INTEGER REFERENCES app_listings(id) NOT NULL,
        seller_id INTEGER REFERENCES users(id) NOT NULL,
        buyer_id INTEGER REFERENCES users(id) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        stripe_payment_intent_id TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        completed_at TIMESTAMP
      );
    `);
    console.log('Created app_transactions table');
    
    // Create app_reviews table
    await client.query(`
      CREATE TABLE IF NOT EXISTS app_reviews (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER REFERENCES app_transactions(id) NOT NULL,
        reviewer_id INTEGER REFERENCES users(id) NOT NULL,
        listing_id INTEGER REFERENCES app_listings(id) NOT NULL,
        seller_id INTEGER REFERENCES users(id) NOT NULL,
        overall_rating INTEGER NOT NULL,
        code_quality_rating INTEGER,
        documentation_rating INTEGER,
        support_rating INTEGER,
        value_rating INTEGER,
        review TEXT,
        verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('Created app_reviews table');
    
    // Create some indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_app_listings_seller_id ON app_listings(seller_id);
      CREATE INDEX IF NOT EXISTS idx_app_listings_status ON app_listings(status);
      CREATE INDEX IF NOT EXISTS idx_app_listings_category ON app_listings(category);
      CREATE INDEX IF NOT EXISTS idx_app_bids_listing_id ON app_bids(listing_id);
      CREATE INDEX IF NOT EXISTS idx_app_bids_bidder_id ON app_bids(bidder_id);
      CREATE INDEX IF NOT EXISTS idx_app_favorites_user_id ON app_favorites(user_id);
      CREATE INDEX IF NOT EXISTS idx_app_favorites_listing_id ON app_favorites(listing_id);
      CREATE INDEX IF NOT EXISTS idx_app_questions_listing_id ON app_questions(listing_id);
      CREATE INDEX IF NOT EXISTS idx_app_transactions_listing_id ON app_transactions(listing_id);
      CREATE INDEX IF NOT EXISTS idx_app_reviews_listing_id ON app_reviews(listing_id);
    `);
    console.log('Created indexes for marketplace tables');
    
    // Insert test data for development
    await client.query(`
      INSERT INTO app_listings (
        title, description, short_description, seller_id, 
        price, status, category, technologies, 
        monthly_revenue, monthly_profit, monthly_traffic,
        established_date, demo_url, repo_url
      ) VALUES 
      (
        'Premium SaaS Analytics Dashboard',
        'A complete analytics solution for SaaS businesses with user tracking, revenue metrics, and customizable dashboards. Built with React, Node.js, and PostgreSQL. Includes subscription management, user segmentation, and detailed reporting tools.',
        'Complete analytics platform for SaaS businesses',
        1,
        12000.00,
        'published',
        'SaaS',
        ARRAY['React', 'Node.js', 'PostgreSQL', 'Chart.js', 'Redux'],
        1200.00,
        900.00,
        5000,
        '2024-01-15',
        'https://demo.example.com/analytics',
        'https://github.com/username/analytics-platform'
      ),
      (
        'E-commerce Mobile App + Backend',
        'Fully functional e-commerce mobile app with backend. Features include product catalog, shopping cart, secure checkout, user accounts, and admin dashboard. Built with React Native and Firebase.',
        'Complete e-commerce solution with mobile app and backend',
        1,
        8500.00,
        'published',
        'E-commerce',
        ARRAY['React Native', 'Firebase', 'Stripe', 'Redux', 'Node.js'],
        800.00,
        650.00,
        3000,
        '2023-11-10',
        'https://demo.example.com/ecommerce',
        'https://github.com/username/ecommerce-app'
      ),
      (
        'Content Management System for Bloggers',
        'A modern CMS built specifically for bloggers and content creators. Features include markdown editor, image management, SEO tools, and analytics dashboard. Built with Next.js and MongoDB.',
        'Modern CMS for serious content creators',
        1,
        5000.00,
        'published',
        'Content',
        ARRAY['Next.js', 'MongoDB', 'Tailwind CSS', 'Vercel'],
        400.00,
        350.00,
        2000,
        '2024-02-20',
        'https://demo-cms.example.com',
        null
      )
    ON CONFLICT DO NOTHING;
    `);
    console.log('Inserted sample marketplace listings');
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Successfully created marketplace tables');
    
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Error creating marketplace tables:', error);
    throw error;
  } finally {
    // Release client
    client.release();
  }
}

// Run the function
createMarketplaceTables()
  .then(() => {
    console.log('Marketplace tables creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to create marketplace tables:', error);
    process.exit(1);
  });

export { createMarketplaceTables };