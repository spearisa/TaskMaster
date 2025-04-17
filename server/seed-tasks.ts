// Script to seed the database with 100 unique public tasks
import { db } from './db';
import { tasks } from '@shared/schema';
import { storage } from './storage';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current file path and dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Categories for task variety
const categories = [
  'Work', 'Personal', 'Shopping', 'Health', 'Finance', 'Home', 'Education', 
  'Travel', 'Fitness', 'Social', 'Technology', 'Project', 'Creative', 'Family'
];

// Priorities
const priorities = ['low', 'medium', 'high'];

// Task themes for realistic data
const taskThemes = [
  // Professional tasks
  { title: "Analyze quarterly sales data", desc: "Review the Q1 sales figures and prepare a report for the management team.", category: "Work", time: 3 },
  { title: "Update company website content", desc: "Refresh the About Us page and add recent client testimonials.", category: "Work", time: 2 },
  { title: "Prepare presentation for client meeting", desc: "Create slides for the upcoming presentation to potential investors.", category: "Work", time: 4 },
  { title: "Research competitors' pricing strategy", desc: "Compile a report on how our main competitors are pricing their services.", category: "Work", time: 3 },
  { title: "Organize team building event", desc: "Plan activities and book venue for the upcoming team retreat.", category: "Work", time: 5 },
  { title: "Update project management documentation", desc: "Revise process documents to reflect recent workflow changes.", category: "Work", time: 2 },
  { title: "Conduct staff performance reviews", desc: "Schedule and complete quarterly performance evaluations for team members.", category: "Work", time: 6 },
  { title: "Optimize database queries", desc: "Improve the performance of the most frequently used database operations.", category: "Technology", time: 4 },
  { title: "Create social media content calendar", desc: "Plan posts for the next month across all company social channels.", category: "Work", time: 3 },
  { title: "File expense reports", desc: "Submit receipts and complete expense report for recent business trip.", category: "Finance", time: 1 },
  
  // Personal development
  { title: "Read chapter of programming book", desc: "Continue with the new JavaScript framework book, chapters 5-7.", category: "Education", time: 2 },
  { title: "Complete online course module", desc: "Finish the current module on data science fundamentals.", category: "Education", time: 3 },
  { title: "Practice language skills", desc: "Spend 30 minutes on the language learning app.", category: "Education", time: 1 },
  { title: "Attend industry webinar", desc: "Join the upcoming webinar on future tech trends.", category: "Education", time: 2 },
  { title: "Write blog post on recent learnings", desc: "Share insights from recent project for the company blog.", category: "Creative", time: 3 },
  { title: "Update professional portfolio", desc: "Add recent projects and update skills section on portfolio website.", category: "Personal", time: 2 },
  { title: "Research certification options", desc: "Investigate which professional certifications would be most valuable.", category: "Education", time: 2 },
  { title: "Watch tutorial videos", desc: "Complete the series on advanced Excel techniques.", category: "Education", time: 2 },
  { title: "Schedule mentor meeting", desc: "Set up monthly check-in with career mentor.", category: "Personal", time: 1 },
  { title: "Update resume with new skills", desc: "Revise resume to highlight recently acquired skills and experiences.", category: "Personal", time: 2 },
  
  // Health and fitness
  { title: "Schedule annual check-up", desc: "Book appointment with primary care physician for yearly physical.", category: "Health", time: 1 },
  { title: "Plan healthy meals for the week", desc: "Create shopping list and meal prep plan for nutritious dinners.", category: "Health", time: 2 },
  { title: "Go for a 30-minute run", desc: "Complete cardio workout according to training plan.", category: "Fitness", time: 1 },
  { title: "Attend yoga class", desc: "Join the 6pm yoga session at the local studio.", category: "Fitness", time: 2 },
  { title: "Track water intake", desc: "Ensure drinking recommended daily amount of water.", category: "Health", time: 1 },
  { title: "Schedule dental cleaning", desc: "Book semi-annual teeth cleaning appointment.", category: "Health", time: 1 },
  { title: "Try new healthy recipe", desc: "Prepare the quinoa salad recipe from the health magazine.", category: "Health", time: 2 },
  { title: "Complete strength training workout", desc: "Do the full-body resistance routine at the gym.", category: "Fitness", time: 2 },
  { title: "Order new running shoes", desc: "Research and purchase replacement for worn-out running shoes.", category: "Shopping", time: 2 },
  { title: "Meditate for stress reduction", desc: "Practice guided meditation using the mindfulness app.", category: "Health", time: 1 },
  
  // Home management
  { title: "Deep clean kitchen", desc: "Thoroughly clean appliances, cabinets, and pantry.", category: "Home", time: 3 },
  { title: "Organize digital files", desc: "Sort and categorize documents on computer and cloud storage.", category: "Technology", time: 2 },
  { title: "Pay monthly bills", desc: "Process payments for utilities, rent, and subscriptions.", category: "Finance", time: 1 },
  { title: "Declutter closet", desc: "Sort through clothing items and prepare donations.", category: "Home", time: 3 },
  { title: "Change air filters", desc: "Replace HVAC filters throughout the home.", category: "Home", time: 1 },
  { title: "Update home inventory", desc: "Add recent purchases to the home insurance inventory list.", category: "Home", time: 2 },
  { title: "Schedule plumber for leak repair", desc: "Find and book a plumber to fix the bathroom sink drip.", category: "Home", time: 1 },
  { title: "Clean out refrigerator", desc: "Remove old items and thoroughly clean all shelves.", category: "Home", time: 2 },
  { title: "Organize garage shelving", desc: "Sort and arrange tools and storage boxes in garage.", category: "Home", time: 4 },
  { title: "Research smart home upgrades", desc: "Compare smart thermostat options for energy efficiency.", category: "Technology", time: 2 },
  
  // Social and family
  { title: "Plan weekend family activity", desc: "Research local events and coordinate with family members.", category: "Family", time: 2 },
  { title: "Send birthday gift", desc: "Purchase and ship present for friend's upcoming birthday.", category: "Social", time: 2 },
  { title: "Schedule video call with parents", desc: "Set up time for weekly catch-up with family.", category: "Family", time: 1 },
  { title: "Organize dinner party", desc: "Plan menu and send invitations for Saturday gathering.", category: "Social", time: 3 },
  { title: "Help child with science project", desc: "Gather materials and assist with school assignment.", category: "Family", time: 3 },
  { title: "Send thank you notes", desc: "Write and mail notes for recent gifts received.", category: "Social", time: 2 },
  { title: "Plan anniversary celebration", desc: "Book restaurant and arrange special details for anniversary.", category: "Family", time: 2 },
  { title: "Research summer camp options", desc: "Compare programs and registration deadlines for kids' summer activities.", category: "Family", time: 3 },
  { title: "RSVP to wedding invitation", desc: "Respond to invitation and arrange gift from registry.", category: "Social", time: 1 },
  { title: "Schedule family photo session", desc: "Book photographer for updated family portraits.", category: "Family", time: 1 },
  
  // Travel and experiences
  { title: "Research vacation destinations", desc: "Compare options for upcoming holiday break.", category: "Travel", time: 3 },
  { title: "Book flights for business trip", desc: "Secure travel arrangements for next month's conference.", category: "Travel", time: 2 },
  { title: "Renew passport", desc: "Complete application and submit required documents for renewal.", category: "Travel", time: 2 },
  { title: "Create packing list", desc: "Prepare comprehensive list for upcoming international trip.", category: "Travel", time: 2 },
  { title: "Research local attractions", desc: "Find interesting sites and activities for weekend city visit.", category: "Travel", time: 2 },
  { title: "Reserve rental car", desc: "Book vehicle for upcoming trip to ensure availability.", category: "Travel", time: 1 },
  { title: "Purchase travel insurance", desc: "Compare policies and secure coverage for international journey.", category: "Travel", time: 2 },
  { title: "Make hotel reservations", desc: "Book accommodations for the conference in Chicago.", category: "Travel", time: 2 },
  { title: "Schedule pet sitter", desc: "Arrange care for pets during upcoming travel dates.", category: "Family", time: 1 },
  { title: "Research public transportation options", desc: "Plan how to get around efficiently at destination city.", category: "Travel", time: 2 },
  
  // Financial
  { title: "Review monthly budget", desc: "Analyze spending patterns and adjust categories as needed.", category: "Finance", time: 2 },
  { title: "Research investment options", desc: "Compare potential additions to investment portfolio.", category: "Finance", time: 3 },
  { title: "Set up automatic bill payments", desc: "Configure recurring transfers for monthly expenses.", category: "Finance", time: 2 },
  { title: "Contact insurance agent", desc: "Review current policies and discuss potential adjustments.", category: "Finance", time: 2 },
  { title: "Prepare tax documents", desc: "Gather and organize receipts and statements for tax filing.", category: "Finance", time: 4 },
  { title: "Update beneficiary information", desc: "Review and update beneficiaries on financial accounts.", category: "Finance", time: 2 },
  { title: "Cancel unused subscriptions", desc: "Identify and cancel services no longer being used.", category: "Finance", time: 1 },
  { title: "Contribute to retirement account", desc: "Make monthly contribution to IRA or 401(k).", category: "Finance", time: 1 },
  { title: "Compare credit card offers", desc: "Research better rates or rewards programs for new card.", category: "Finance", time: 2 },
  { title: "Set up college savings plan", desc: "Research and establish education fund for children.", category: "Finance", time: 3 },
];

async function createTask(userId: number, taskIdx: number) {
  // Get a task theme based on the index
  const themeIdx = taskIdx % taskThemes.length;
  const theme = taskThemes[themeIdx];
  
  // Add some variety to the title and description
  const titleSuffix = taskIdx > taskThemes.length ? ` ${Math.floor(taskIdx / taskThemes.length) + 1}` : '';
  const title = theme.title + titleSuffix;
  
  // Add slight variations to descriptions
  const descriptionAdditions = [
    " Make sure to be thorough and detailed.",
    " Complete by end of week if possible.",
    " High priority task that needs attention.",
    " Take notes for future reference.",
    " Consider innovative approaches."
  ];
  const descAddition = descriptionAdditions[taskIdx % descriptionAdditions.length];
  
  // Set a due date between today and 2 weeks from now
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + Math.floor(Math.random() * 14) + 1);
  
  // Create the task
  const newTask: any = {
    title,
    description: theme.desc + descAddition,
    dueDate: futureDate.toISOString(),
    completed: false,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    category: theme.category,
    estimatedTime: theme.time,
    userId,
    isPublic: true,
    // Add bidding attributes
    budget: ((Math.floor(Math.random() * 40) + 10) + (Math.random() * 0.99)).toFixed(2),
    acceptingBids: true,
    biddingDeadline: new Date(futureDate.getTime() + (3 * 24 * 60 * 60 * 1000)).toISOString() // 3 days after due date
  };
  
  // Save to database (using storage to ensure all fields are processed correctly)
  return await storage.createTask(newTask);
}

async function seedTasks() {
  console.log('Starting to seed tasks...');
  
  // Alternate between a few user IDs to simulate multiple users
  const userIds = [1, 2, 3, 4, 5, 6];
  
  try {
    for (let i = 0; i < 100; i++) {
      const userId = userIds[i % userIds.length];
      const task = await createTask(userId, i);
      console.log(`Created task ${i+1}/100: ${task.title} for user ${userId}`);
    }
    console.log('Task seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding tasks:', error);
  }
}

// Execute the seeding function if this file is run directly
if (import.meta.url === `file://${__filename}`) {
  seedTasks()
    .then(() => {
      console.log('Database seeding complete!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error in seeding process:', err);
      process.exit(1);
    });
}

// Export for use in other scripts
export { seedTasks };