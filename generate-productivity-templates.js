// Script to generate 100 productivity templates
import axios from 'axios';
import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { taskTemplates } from './shared/schema.js';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
const db = drizzle(pool);

// List of 100 productivity template ideas
const templateIdeas = [
  // Daily/Weekly Planning
  { title: "Morning Routine Optimization", category: "personal", priority: "high" },
  { title: "Weekly Planning Session", category: "work", priority: "high" },
  { title: "Daily Progress Journal", category: "personal", priority: "medium" },
  { title: "Evening Wind Down Routine", category: "personal", priority: "medium" },
  { title: "Sunday Reset Checklist", category: "personal", priority: "high" },
  { title: "Daily Intention Setting", category: "personal", priority: "medium" },
  { title: "Time Blocking Schedule", category: "work", priority: "high" },
  { title: "Weekly Review Process", category: "work", priority: "high" },
  { title: "Daily Gratitude Practice", category: "personal", priority: "medium" },
  { title: "30-Day Habit Tracker", category: "personal", priority: "medium" },
  
  // Work Productivity
  { title: "Effective Meeting Agenda", category: "work", priority: "high" },
  { title: "Project Kickoff Checklist", category: "work", priority: "high" },
  { title: "Email Management System", category: "work", priority: "medium" },
  { title: "Focus Session Protocol", category: "work", priority: "high" },
  { title: "Work-from-Home Setup Optimization", category: "work", priority: "medium" },
  { title: "Task Prioritization Matrix", category: "work", priority: "high" },
  { title: "Team Productivity Audit", category: "work", priority: "medium" },
  { title: "Professional Development Plan", category: "education", priority: "medium" },
  { title: "Delegation Workflow", category: "work", priority: "medium" },
  { title: "Workspace Organization", category: "work", priority: "low" },
  
  // Personal Development
  { title: "Personal Growth Tracking", category: "personal", priority: "medium" },
  { title: "Goal Setting Workshop", category: "personal", priority: "high" },
  { title: "Skill Acquisition Plan", category: "education", priority: "medium" },
  { title: "Reading List Management", category: "education", priority: "low" },
  { title: "Learning Reflection Practice", category: "education", priority: "medium" },
  { title: "Personal Values Clarification", category: "personal", priority: "medium" },
  { title: "Monthly Self-Assessment", category: "personal", priority: "medium" },
  { title: "Continuous Improvement System", category: "personal", priority: "medium" },
  { title: "Creative Project Pipeline", category: "personal", priority: "medium" },
  { title: "Knowledge Management System", category: "education", priority: "medium" },
  
  // Health & Wellness
  { title: "Workout Routine Builder", category: "health", priority: "high" },
  { title: "Meal Planning Process", category: "health", priority: "medium" },
  { title: "Sleep Optimization Protocol", category: "health", priority: "high" },
  { title: "Stress Management Toolkit", category: "health", priority: "high" },
  { title: "Hydration Tracking System", category: "health", priority: "medium" },
  { title: "Mental Health Check-in", category: "health", priority: "high" },
  { title: "Meditation Practice Guide", category: "health", priority: "medium" },
  { title: "Digital Detox Protocol", category: "health", priority: "medium" },
  { title: "Healthy Snack Preparation", category: "health", priority: "low" },
  { title: "Active Break Schedule", category: "health", priority: "medium" },
  
  // Home Management
  { title: "Home Cleaning Schedule", category: "home", priority: "medium" },
  { title: "Home Maintenance Calendar", category: "home", priority: "medium" },
  { title: "Meal Prep Workflow", category: "home", priority: "medium" },
  { title: "Decluttering System", category: "home", priority: "medium" },
  { title: "Pantry Organization", category: "home", priority: "low" },
  { title: "Digital File Organization", category: "home", priority: "medium" },
  { title: "Home Budget Review", category: "finance", priority: "high" },
  { title: "Family Calendar Management", category: "home", priority: "high" },
  { title: "Guest Preparation Checklist", category: "home", priority: "low" },
  { title: "Seasonal Home Refresh", category: "home", priority: "low" },
  
  // Finance & Budget
  { title: "Monthly Budget Review", category: "finance", priority: "high" },
  { title: "Expense Tracking System", category: "finance", priority: "high" },
  { title: "Financial Goal Planning", category: "finance", priority: "high" },
  { title: "Bill Payment Schedule", category: "finance", priority: "high" },
  { title: "Savings Automation Setup", category: "finance", priority: "medium" },
  { title: "Investment Portfolio Review", category: "finance", priority: "medium" },
  { title: "Debt Reduction Plan", category: "finance", priority: "high" },
  { title: "Tax Preparation Checklist", category: "finance", priority: "high" },
  { title: "Financial Document Organization", category: "finance", priority: "medium" },
  { title: "Subscription Service Audit", category: "finance", priority: "medium" },
  
  // Project Management
  { title: "Project Planning Framework", category: "work", priority: "high" },
  { title: "Task Breakdown Process", category: "work", priority: "high" },
  { title: "Project Timeline Creation", category: "work", priority: "high" },
  { title: "Resource Allocation System", category: "work", priority: "medium" },
  { title: "Project Risk Assessment", category: "work", priority: "medium" },
  { title: "Stakeholder Communication Plan", category: "work", priority: "high" },
  { title: "Milestone Tracking Template", category: "work", priority: "medium" },
  { title: "Project Retrospective Process", category: "work", priority: "medium" },
  { title: "Quality Assurance Checklist", category: "work", priority: "high" },
  { title: "Project Handover Protocol", category: "work", priority: "high" },
  
  // Travel & Events
  { title: "Travel Planning Checklist", category: "travel", priority: "medium" },
  { title: "Trip Packing System", category: "travel", priority: "medium" },
  { title: "Vacation Itinerary Builder", category: "travel", priority: "medium" },
  { title: "Event Planning Timeline", category: "general", priority: "medium" },
  { title: "Business Trip Preparation", category: "travel", priority: "high" },
  { title: "Conference Networking Strategy", category: "work", priority: "medium" },
  { title: "Travel Document Organization", category: "travel", priority: "high" },
  { title: "Trip Budget Management", category: "travel", priority: "medium" },
  { title: "Post-Trip Followup Checklist", category: "travel", priority: "low" },
  { title: "Event Hosting Preparation", category: "home", priority: "medium" },
  
  // Digital Productivity
  { title: "Email Organization System", category: "work", priority: "high" },
  { title: "Password Management Setup", category: "general", priority: "high" },
  { title: "Digital Workspace Optimization", category: "work", priority: "medium" },
  { title: "App & Tool Audit Process", category: "general", priority: "medium" },
  { title: "Note-Taking System Setup", category: "education", priority: "medium" },
  { title: "Digital Calendar Management", category: "work", priority: "high" },
  { title: "File Naming Convention System", category: "work", priority: "medium" },
  { title: "Browser Bookmark Organization", category: "general", priority: "low" },
  { title: "Cloud Storage Structure", category: "general", priority: "medium" },
  { title: "Digital Minimalism Practice", category: "general", priority: "medium" },
  
  // Miscellaneous
  { title: "Reading List Management", category: "education", priority: "low" },
  { title: "Networking Contact Management", category: "work", priority: "medium" },
  { title: "Hobby Project Planning", category: "personal", priority: "low" },
  { title: "Gift Planning System", category: "personal", priority: "low" },
  { title: "Vehicle Maintenance Schedule", category: "general", priority: "medium" },
  { title: "Emergency Preparedness Plan", category: "home", priority: "high" },
  { title: "Document Digitization System", category: "general", priority: "medium" },
  { title: "Social Media Content Calendar", category: "work", priority: "medium" },
  { title: "Volunteer Commitment Tracker", category: "personal", priority: "medium" },
  { title: "Learning Resource Organization", category: "education", priority: "medium" }
];

async function delegateTemplateToAI(template) {
  try {
    console.log(`Generating template for: ${template.title}`);
    
    // Make API request to delegate template to AI
    const response = await axios.post('http://localhost:5000/api/ai/delegate-template', {
      title: template.title,
      category: template.category,
      priority: template.priority,
      context: "Create a detailed and practical template that users can follow to implement this productivity practice in their daily lives."
    });
    
    return {
      ...template,
      description: response.data.description,
      isPublic: true,
      userId: 1 // Demo user ID
    };
  } catch (error) {
    console.error(`Error delegating template "${template.title}" to AI:`, error.message);
    // Provide a fallback description
    return {
      ...template,
      description: `Template for ${template.title} in the ${template.category} category.`,
      isPublic: true,
      userId: 1
    };
  }
}

async function saveTemplateToDatabase(template) {
  try {
    console.log(`Saving template to database: ${template.title}`);
    
    // Insert the template into the database
    const [savedTemplate] = await db.insert(taskTemplates).values(template).returning();
    
    console.log(`Successfully saved template ID ${savedTemplate.id}: ${savedTemplate.title}`);
    return savedTemplate;
  } catch (error) {
    console.error(`Error saving template "${template.title}" to database:`, error.message);
    return null;
  }
}

async function generateTemplates() {
  console.log(`Starting generation of ${templateIdeas.length} productivity templates`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process templates in batches of 5 to avoid overwhelming the AI service
  const batchSize = 5;
  
  for (let i = 0; i < templateIdeas.length; i += batchSize) {
    const batch = templateIdeas.slice(i, i + batchSize);
    console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(templateIdeas.length/batchSize)}`);
    
    // Process batch in parallel
    const promises = batch.map(async (template) => {
      try {
        const completeTemplate = await delegateTemplateToAI(template);
        const savedTemplate = await saveTemplateToDatabase(completeTemplate);
        
        if (savedTemplate) {
          successCount++;
          return savedTemplate;
        } else {
          errorCount++;
          return null;
        }
      } catch (e) {
        console.error(`Error processing template "${template.title}":`, e.message);
        errorCount++;
        return null;
      }
    });
    
    // Wait for the batch to complete
    await Promise.all(promises);
    
    // Add a small delay between batches to avoid rate limiting
    if (i + batchSize < templateIdeas.length) {
      console.log("Waiting 2 seconds before processing next batch...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`Completed template generation process.`);
  console.log(`Successfully created ${successCount} templates.`);
  console.log(`Failed to create ${errorCount} templates.`);
}

// Main execution
(async () => {
  try {
    await generateTemplates();
    // Close the database connection
    await pool.end();
    console.log("Database connection closed.");
  } catch (error) {
    console.error("Error in main execution:", error);
    // Ensure database connection is closed even if an error occurs
    try {
      await pool.end();
      console.log("Database connection closed after error.");
    } catch (e) {
      console.error("Error closing database connection:", e);
    }
  }
})();