// This script seeds 30 productivity templates directly into the database
import { db } from './server/db.js';
import { taskTemplates } from './shared/schema.js';

// List of productivity template ideas with descriptions
const productivityTemplates = [
  // Daily/Weekly Planning
  {
    title: "Morning Routine Optimization",
    description: "A structured morning routine sets the tone for a productive day. This template helps you create an energizing morning ritual that aligns with your goals and values.\n\nPriority: high\n\nEstimated Time: 30 minutes\n\nSteps:\n1. Track your current morning habits for 3 days\n2. Identify energy-draining and energy-boosting activities\n3. Design an ideal morning sequence (30-90 minutes)\n4. Prepare your environment the night before\n5. Test your routine for one week and adjust as needed",
    category: "personal",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  {
    title: "Weekly Planning Session",
    description: "A systematic approach to planning your week that ensures you focus on high-impact activities and maintain work-life balance.\n\nPriority: high\n\nEstimated Time: 45 minutes\n\nSteps:\n1. Review previous week's accomplishments and incomplete tasks\n2. Identify your top 3 priorities for the coming week\n3. Schedule focused work blocks for important projects\n4. Plan buffer time for unexpected tasks\n5. Schedule personal commitments and self-care activities\n6. Prepare your workspace and tools for Monday",
    category: "work",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  {
    title: "Daily Progress Journal",
    description: "A reflective daily practice that helps track accomplishments, identify patterns, and maintain momentum toward your goals.\n\nPriority: medium\n\nEstimated Time: 15 minutes\n\nSteps:\n1. Record 3 achievements from today (big or small)\n2. Note any challenges or roadblocks encountered\n3. Identify one thing you learned today\n4. List the top 3 priorities for tomorrow\n5. Write one thing you are grateful for",
    category: "personal", 
    priority: "medium",
    isPublic: true,
    userId: 1
  },
  {
    title: "Evening Wind Down Routine",
    description: "A calming evening routine that helps you disconnect from work, improve sleep quality, and prepare for the next day.\n\nPriority: medium\n\nEstimated Time: 60 minutes\n\nSteps:\n1. Set a consistent cutoff time for work and screens\n2. Create a quick cleanup routine for your living space\n3. Review tomorrow's calendar and prepare any materials\n4. Choose a relaxing activity (reading, stretching, meditation)\n5. Establish a consistent bedtime ritual",
    category: "personal",
    priority: "medium",
    isPublic: true,
    userId: 1
  },
  {
    title: "Sunday Reset Checklist",
    description: "A weekly reset routine that helps you refresh your space, mind, and schedule before a new week begins.\n\nPriority: high\n\nEstimated Time: 120 minutes\n\nSteps:\n1. Quick home reset (30-minute tidying and cleaning)\n2. Review and update your calendar for the week\n3. Meal plan and grocery shop for the week ahead\n4. Set 3 personal and 3 professional goals for the week\n5. Prepare your workspace and materials\n6. Schedule self-care and personal commitments",
    category: "personal",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  {
    title: "Daily Intention Setting",
    description: "A mindful practice to set clear intentions for your day, helping you stay focused, purposeful, and aligned with your values.\n\nPriority: medium\n\nEstimated Time: 10 minutes\n\nSteps:\n1. Find a quiet moment at the start of your day\n2. Review your calendar and commitments\n3. Identify your 3 most important tasks (MITs)\n4. Set a positive intention or theme for the day\n5. Visualize successfully completing your priorities",
    category: "personal",
    priority: "medium",
    isPublic: true,
    userId: 1
  },
  {
    title: "Time Blocking Schedule",
    description: "A method for creating a visual, structured schedule that allocates specific time blocks for different types of work and activities.\n\nPriority: high\n\nEstimated Time: 30 minutes\n\nSteps:\n1. List all your recurring commitments and meetings\n2. Identify your peak energy periods during the day\n3. Schedule focused deep work during high-energy times\n4. Block time for email/communication in batches\n5. Include breaks and transitions between blocks\n6. Set aside planning and review blocks",
    category: "work",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  {
    title: "Weekly Review Process",
    description: "A comprehensive review system to evaluate progress, capture lessons learned, and realign your efforts with long-term goals.\n\nPriority: high\n\nEstimated Time: 60 minutes\n\nSteps:\n1. Clear your workspace and gather necessary materials\n2. Review and process all notes, emails, and tasks\n3. Evaluate progress on projects and goals\n4. Identify what went well and areas for improvement\n5. Update your project plans and task lists\n6. Set key priorities and intentions for the coming week",
    category: "work", 
    priority: "high",
    isPublic: true,
    userId: 1
  },
  {
    title: "Daily Gratitude Practice",
    description: "A simple but powerful daily ritual to cultivate gratitude, positivity, and perspective in your life and work.\n\nPriority: medium\n\nEstimated Time: 5 minutes\n\nSteps:\n1. Choose a consistent time each day (morning or evening)\n2. Find a quiet space with minimal distractions\n3. Write down 3-5 things you are grateful for today\n4. Include at least one work-related gratitude\n5. Be specific about why each item matters to you",
    category: "personal",
    priority: "medium",
    isPublic: true,
    userId: 1
  },
  {
    title: "30-Day Habit Tracker",
    description: "A visual system to track and reinforce new habits during the critical first month of habit formation.\n\nPriority: medium\n\nEstimated Time: 15 minutes (setup) + 1 minute daily\n\nSteps:\n1. Select 1-3 specific habits you want to establish\n2. Create a tracking grid with 30 days and your habits\n3. Define what counts as success for each habit\n4. Set a consistent time to check off your progress daily\n5. Add visual rewards or milestones every 7 days\n6. Review and adjust your system weekly",
    category: "personal",
    priority: "medium",
    isPublic: true,
    userId: 1
  },
  
  // Work Productivity
  {
    title: "Effective Meeting Agenda",
    description: "A structured framework for planning and running meetings that respect everyone's time and drive meaningful outcomes.\n\nPriority: high\n\nEstimated Time: 20 minutes\n\nSteps:\n1. Define the meeting purpose and desired outcomes\n2. List specific agenda topics with time allocations\n3. Assign roles (facilitator, timekeeper, note-taker)\n4. Distribute agenda and pre-work 24+ hours in advance\n5. Include start/end times and required preparation\n6. End with clear action items, owners, and deadlines",
    category: "work",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  {
    title: "Project Kickoff Checklist",
    description: "A comprehensive checklist for starting a new project that ensures clarity, alignment, and proper setup from day one.\n\nPriority: high\n\nEstimated Time: 90 minutes\n\nSteps:\n1. Define project scope, objectives, and success metrics\n2. Identify key stakeholders and their expectations\n3. Create a responsibility matrix (RACI chart)\n4. Establish communication protocols and meeting cadence\n5. Set up project management tools and workspaces\n6. Develop initial timeline with major milestones\n7. Identify potential risks and mitigation strategies",
    category: "work",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  {
    title: "Email Management System",
    description: "A methodical approach to processing email that reduces stress, prevents things from falling through the cracks, and reclaims your focus.\n\nPriority: medium\n\nEstimated Time: 60 minutes (setup) + 30 minutes daily\n\nSteps:\n1. Set up folder structure (Action, Waiting, Archive, Reference)\n2. Establish specific times for checking email (e.g., 10am, 2pm, 5pm)\n3. Process inbox using the 2-minute rule (do it now if quick)\n4. Create templates for common responses\n5. Unsubscribe from low-value newsletters\n6. Configure filters and rules for automatic organization",
    category: "work",
    priority: "medium",
    isPublic: true,
    userId: 1
  },
  {
    title: "Focus Session Protocol",
    description: "A structured method for creating distraction-free deep work sessions that maximize your cognitive output on important tasks.\n\nPriority: high\n\nEstimated Time: 90 minutes per session\n\nSteps:\n1. Identify a single, important task that requires deep focus\n2. Set a clear, achievable objective for the session\n3. Eliminate all potential distractions (notifications, phone, etc.)\n4. Set a timer for 25-90 minutes depending on your capacity\n5. Work exclusively on the chosen task until the timer ends\n6. Take a 5-15 minute break before starting another session",
    category: "work",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  {
    title: "Task Prioritization Matrix",
    description: "A decision-making framework that helps you identify which tasks deserve your immediate attention and which can wait.\n\nPriority: high\n\nEstimated Time: 25 minutes\n\nSteps:\n1. List all current tasks and commitments\n2. Create a 2x2 matrix (Urgent/Not Urgent, Important/Not Important)\n3. Place each task in the appropriate quadrant\n4. Schedule important but not urgent tasks (Quadrant 2) first\n5. Address urgent and important tasks (Quadrant 1) next\n6. Delegate or batch urgent but not important tasks (Quadrant 3)\n7. Eliminate or minimize not urgent and not important tasks (Quadrant 4)",
    category: "work",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  
  // Personal Development
  {
    title: "Personal Growth Tracking",
    description: "A systematic approach to monitoring and celebrating your progress in various life domains, helping maintain motivation and direction.\n\nPriority: medium\n\nEstimated Time: 60 minutes (setup) + 15 minutes weekly\n\nSteps:\n1. Identify 3-5 key life domains to track (career, health, relationships, etc.)\n2. Define specific metrics or indicators for each domain\n3. Create a simple tracking system (spreadsheet, journal, or app)\n4. Schedule weekly check-ins to record progress\n5. Implement monthly reviews to identify patterns\n6. Set quarterly milestones to celebrate progress\n7. Adjust goals and metrics as needed",
    category: "personal",
    priority: "medium",
    isPublic: true,
    userId: 1
  },
  {
    title: "Goal Setting Workshop",
    description: "A comprehensive process for setting meaningful, achievable goals that align with your values and vision for the future.\n\nPriority: high\n\nEstimated Time: 180 minutes\n\nSteps:\n1. Reflect on personal values and priorities\n2. Create a vision statement for 1, 3, and 10 years ahead\n3. Identify goals in key life domains (career, health, relationships, etc.)\n4. Format goals using the SMART framework (Specific, Measurable, Achievable, Relevant, Time-bound)\n5. Break down each goal into milestone achievements\n6. Identify potential obstacles and mitigation strategies\n7. Develop a regular review and adjustment system",
    category: "personal",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  {
    title: "Skill Acquisition Plan",
    description: "A structured approach to learning and mastering new skills efficiently through deliberate practice and feedback loops.\n\nPriority: medium\n\nEstimated Time: 90 minutes (planning) + ongoing practice\n\nSteps:\n1. Define the specific skill you want to acquire\n2. Research the components and sub-skills involved\n3. Find high-quality learning resources (courses, books, mentors)\n4. Break down the skill into practice elements\n5. Create a progressive practice schedule (start easy, increase difficulty)\n6. Establish feedback mechanisms to assess progress\n7. Schedule regular review and adjustment of your approach",
    category: "education",
    priority: "medium",
    isPublic: true,
    userId: 1
  },
  
  // Health & Wellness
  {
    title: "Workout Routine Builder",
    description: "A systematic approach to creating a balanced, effective exercise program that fits your goals, preferences, and schedule.\n\nPriority: high\n\nEstimated Time: 90 minutes\n\nSteps:\n1. Define your primary fitness goals (strength, endurance, flexibility, etc.)\n2. Assess your current fitness level and limitations\n3. Determine available equipment and workout environment\n4. Select appropriate exercises for each muscle group/fitness component\n5. Structure a weekly schedule with appropriate intensity and recovery\n6. Create a progression plan for increasing challenge over time\n7. Schedule regular assessment points to track progress",
    category: "health",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  {
    title: "Meal Planning Process",
    description: "A streamlined system for planning nutritious meals that save time, reduce stress, and support your health goals.\n\nPriority: medium\n\nEstimated Time: 60 minutes weekly\n\nSteps:\n1. Review your schedule for the coming week\n2. Check your pantry and refrigerator inventory\n3. Create a balanced meal plan considering nutritional needs\n4. Develop a consolidated shopping list organized by store section\n5. Schedule batch cooking sessions if applicable\n6. Prepare meal components in advance as needed\n7. Implement a system for using or repurposing leftovers",
    category: "health",
    priority: "medium",
    isPublic: true,
    userId: 1
  },
  {
    title: "Sleep Optimization Protocol",
    description: "A comprehensive approach to improving sleep quality through environment, habits, and routines for better health and productivity.\n\nPriority: high\n\nEstimated Time: 90 minutes (setup) + daily implementation\n\nSteps:\n1. Assess current sleep patterns and challenges\n2. Optimize your sleep environment (temperature, light, sound)\n3. Develop a consistent pre-sleep routine (30-60 minutes)\n4. Establish regular sleep and wake times\n5. Adjust daytime habits that affect sleep (caffeine, exercise, etc.)\n6. Create a plan for managing sleep disruptors\n7. Track sleep quality and adjust approach as needed",
    category: "health",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  
  // Project Management
  {
    title: "Project Planning Framework",
    description: "A comprehensive approach to planning projects that ensures clear objectives, appropriate resources, and realistic timelines.\n\nPriority: high\n\nEstimated Time: 180 minutes\n\nSteps:\n1. Define the project scope, objectives, and success criteria\n2. Identify key stakeholders and their requirements\n3. Break the project into phases and major deliverables\n4. Create a work breakdown structure (WBS)\n5. Estimate resource requirements and availability\n6. Develop a realistic timeline with dependencies\n7. Identify potential risks and mitigation strategies\n8. Establish communication and reporting protocols",
    category: "work",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  
  // Travel & Events
  {
    title: "Travel Planning Checklist",
    description: "A systematic approach to planning trips that reduces stress, ensures nothing is forgotten, and maximizes enjoyment.\n\nPriority: medium\n\nEstimated Time: 120 minutes\n\nSteps:\n1. Establish trip objectives, dates, and budget\n2. Research and book transportation and accommodations\n3. Create a day-by-day itinerary with flexibility built in\n4. Make a packing list categorized by type\n5. Prepare home for your absence (mail, plants, security)\n6. Gather and organize travel documents\n7. Set up phone/tech for international use if applicable\n8. Research local customs, phrases, and safety information",
    category: "travel",
    priority: "medium",
    isPublic: true,
    userId: 1
  },
  
  // Digital Productivity
  {
    title: "Password Management Setup",
    description: "A secure, organized system for creating, storing, and managing passwords to enhance digital security while maintaining convenience.\n\nPriority: high\n\nEstimated Time: 90 minutes\n\nSteps:\n1. Choose a reputable password manager application\n2. Set up your master password and recovery options\n3. Import existing passwords from browsers/other sources\n4. Audit and update weak or duplicate passwords\n5. Create strong, unique passwords for important accounts\n6. Organize passwords into logical categories\n7. Set up two-factor authentication where available\n8. Establish a regular password review schedule",
    category: "general",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  
  // Finance & Budget
  {
    title: "Monthly Budget Review",
    description: "A systematic process for reviewing your financial activity, tracking progress toward goals, and making necessary adjustments.\n\nPriority: high\n\nEstimated Time: 60 minutes\n\nSteps:\n1. Gather all financial statements and records\n2. Compare actual spending to budgeted categories\n3. Identify unexpected expenses or variances\n4. Review progress toward savings and debt reduction goals\n5. Adjust upcoming month's budget based on insights\n6. Update financial tracking tools and dashboards",
    category: "finance",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  {
    title: "Expense Tracking System",
    description: "A practical system for monitoring and categorizing all expenses, providing clarity and control over your financial life.\n\nPriority: high\n\nEstimated Time: 45 minutes (setup) + 5 minutes daily\n\nSteps:\n1. Choose a tracking method (app, spreadsheet, or journal)\n2. Define relevant spending categories for your lifestyle\n3. Set up automatic import from financial accounts if possible\n4. Establish a daily routine for logging cash expenses\n5. Create weekly review checkpoint\n6. Set up visualization tools for spending patterns",
    category: "finance",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  {
    title: "Financial Goal Planning",
    description: "A structured approach to establishing, prioritizing, and achieving your short and long-term financial objectives.\n\nPriority: high\n\nEstimated Time: 120 minutes\n\nSteps:\n1. Identify financial goals across different time horizons\n2. Prioritize goals based on importance and timing\n3. Research the costs and requirements for each goal\n4. Create specific, measurable targets with deadlines\n5. Develop action plans with savings and investment strategies\n6. Set up automated systems for goal funding\n7. Establish quarterly review checkpoints",
    category: "finance",
    priority: "high",
    isPublic: true,
    userId: 1
  },
  
  // Home Management
  {
    title: "Home Cleaning Schedule",
    description: "An organized system for maintaining a clean home through distributed tasks that prevent overwhelm and marathon cleaning sessions.\n\nPriority: medium\n\nEstimated Time: 40 minutes (planning) + implementation\n\nSteps:\n1. List all cleaning tasks needed for your home\n2. Categorize by frequency (daily, weekly, monthly, seasonal)\n3. Assign tasks to specific days of the week\n4. Create cleaning checklists for each room\n5. Set up a supply management system\n6. Implement 15-minute daily maintenance sessions\n7. Schedule quarterly deep cleaning projects",
    category: "home",
    priority: "medium",
    isPublic: true,
    userId: 1
  },
  {
    title: "Decluttering System",
    description: "A methodical approach to reducing physical clutter that creates more space, reduces stress, and makes your environment more functional.\n\nPriority: medium\n\nEstimated Time: Variable (30 minutes per session)\n\nSteps:\n1. Define your decluttering goals and priorities\n2. Break your space into manageable zones\n3. Create a schedule for tackling one zone at a time\n4. Sort items using the four-box method (keep, donate, sell, trash)\n5. Establish clear criteria for keeping items\n6. Process discarded items promptly\n7. Implement systems to prevent future clutter",
    category: "home",
    priority: "medium",
    isPublic: true,
    userId: 1
  },
  {
    title: "Emergency Preparedness Plan",
    description: "A comprehensive approach to preparing your household for emergencies, ensuring safety and peace of mind during unexpected events.\n\nPriority: high\n\nEstimated Time: 180 minutes (setup) + periodic updates\n\nSteps:\n1. Identify potential emergency scenarios for your region\n2. Create a household communication plan\n3. Assemble emergency kits for home and vehicles\n4. Document important information and contacts\n5. Develop evacuation routes and meeting locations\n6. Store copies of critical documents securely\n7. Schedule regular drills and supply refreshment",
    category: "home",
    priority: "high",
    isPublic: true,
    userId: 1
  }
];

// Function to insert templates into the database
async function seedTemplates() {
  try {
    console.log(`Starting to seed ${productivityTemplates.length} productivity templates...`);
    
    // Insert templates in batches
    const batchSize = 5;
    let successCount = 0;
    
    for (let i = 0; i < productivityTemplates.length; i += batchSize) {
      const batch = productivityTemplates.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(productivityTemplates.length/batchSize)}`);
      
      try {
        const result = await db.insert(taskTemplates).values(batch).returning();
        successCount += result.length;
        console.log(`Successfully inserted ${result.length} templates (total: ${successCount})`);
      } catch (error) {
        console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error.message);
      }
      
      // Small delay between batches
      if (i + batchSize < productivityTemplates.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`Completed template seeding process.`);
    console.log(`Successfully created ${successCount} templates.`);
    
  } catch (error) {
    console.error("Error in seed process:", error);
  }
}

// Run the seed function
seedTemplates()
  .then(() => {
    console.log("Seeding completed successfully.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error during seeding:", error);
    process.exit(1);
  });