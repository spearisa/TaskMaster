// Direct database insertion script for 100 productivity templates
import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config();

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// List of 100 productivity template ideas with descriptions
const productivityTemplates = [
  // The first 30 templates (already inserted)
  
  // Additional 70 templates to reach 100 total
  {
    title: "Digital Note Organization System",
    description: "A structured approach to organizing digital notes for easy retrieval, improved comprehension, and ongoing knowledge building.\n\nPriority: medium\n\nEstimated Time: 120 minutes (setup) + ongoing maintenance\n\nSteps:\n1. Choose a suitable note-taking application with search and tagging features\n2. Create a consistent folder/notebook structure\n3. Develop a tagging system that works for your content types\n4. Establish note templates for different purposes\n5. Set up a regular review and refinement process\n6. Implement a system for connecting related notes\n7. Develop a backup protocol\n\nTags: note-taking, knowledge management, organization, digital productivity",
    category: "general",
    priority: "medium",
    steps: ["Choose a suitable note-taking application with search and tagging features", "Create a consistent folder/notebook structure", "Develop a tagging system that works for your content types", "Establish note templates for different purposes", "Set up a regular review and refinement process", "Implement a system for connecting related notes", "Develop a backup protocol"],
    tags: ["note-taking", "knowledge management", "organization", "digital productivity"],
    is_public: true,
    user_id: 1,
    estimated_time: 120
  },
  {
    title: "Meeting Notes Framework",
    description: "A systematic approach to capturing, organizing, and acting on meeting information for greater productivity and accountability.\n\nPriority: medium\n\nEstimated Time: 20 minutes per meeting\n\nSteps:\n1. Create a consistent meeting note template\n2. Document key information (date, attendees, purpose)\n3. Capture main discussion points and decisions\n4. Record action items with owners and deadlines\n5. Implement a system for following up on commitments\n6. Share notes with relevant stakeholders\n7. Link notes to related projects and documents\n\nTags: meetings, documentation, collaboration, organization",
    category: "work",
    priority: "medium",
    steps: ["Create a consistent meeting note template", "Document key information (date, attendees, purpose)", "Capture main discussion points and decisions", "Record action items with owners and deadlines", "Implement a system for following up on commitments", "Share notes with relevant stakeholders", "Link notes to related projects and documents"],
    tags: ["meetings", "documentation", "collaboration", "organization"],
    is_public: true,
    user_id: 1,
    estimated_time: 20
  },
  {
    title: "Personal Website Setup",
    description: "A step-by-step process for creating a professional online presence to showcase your work, skills, and expertise.\n\nPriority: medium\n\nEstimated Time: 480 minutes (spread over multiple sessions)\n\nSteps:\n1. Define your website's purpose and target audience\n2. Select an appropriate domain name and hosting service\n3. Choose a content management system or website builder\n4. Plan your site structure and key pages\n5. Create compelling content for each section\n6. Add professional design elements and images\n7. Optimize for search engines and mobile devices\n8. Set up analytics to track visitor behavior\n\nTags: website, personal branding, online presence, portfolio",
    category: "general",
    priority: "medium",
    steps: ["Define your website's purpose and target audience", "Select an appropriate domain name and hosting service", "Choose a content management system or website builder", "Plan your site structure and key pages", "Create compelling content for each section", "Add professional design elements and images", "Optimize for search engines and mobile devices", "Set up analytics to track visitor behavior"],
    tags: ["website", "personal branding", "online presence", "portfolio"],
    is_public: true,
    user_id: 1,
    estimated_time: 480
  },
  {
    title: "Retirement Planning Checklist",
    description: "A comprehensive approach to preparing for retirement that addresses financial, lifestyle, and emotional aspects of this major life transition.\n\nPriority: high\n\nEstimated Time: 240 minutes (initial planning) + quarterly reviews\n\nSteps:\n1. Assess your current financial situation and retirement goals\n2. Calculate your retirement income needs\n3. Review and optimize retirement account contributions\n4. Develop an investment strategy aligned with your timeline\n5. Create a retirement budget and spending plan\n6. Research healthcare options and insurance needs\n7. Explore lifestyle and location preferences\n8. Establish an estate plan and important documents\n\nTags: retirement, financial planning, future planning, life transition",
    category: "finance",
    priority: "high",
    steps: ["Assess your current financial situation and retirement goals", "Calculate your retirement income needs", "Review and optimize retirement account contributions", "Develop an investment strategy aligned with your timeline", "Create a retirement budget and spending plan", "Research healthcare options and insurance needs", "Explore lifestyle and location preferences", "Establish an estate plan and important documents"],
    tags: ["retirement", "financial planning", "future planning", "life transition"],
    is_public: true,
    user_id: 1,
    estimated_time: 240
  },
  {
    title: "Career Development Plan",
    description: "A strategic framework for advancing your career through targeted skill development, networking, and opportunity creation.\n\nPriority: high\n\nEstimated Time: 180 minutes (initial planning) + monthly reviews\n\nSteps:\n1. Assess your current skills, strengths, and career aspirations\n2. Research industry trends and in-demand competencies\n3. Identify skill gaps and learning opportunities\n4. Set specific, measurable career goals (1-year, 3-year, 5-year)\n5. Create an action plan for each goal with concrete steps\n6. Develop a networking strategy to build key relationships\n7. Schedule regular progress reviews and plan adjustments\n8. Identify potential mentors and sponsors\n\nTags: career planning, professional development, skills, networking",
    category: "work",
    priority: "high",
    steps: ["Assess your current skills, strengths, and career aspirations", "Research industry trends and in-demand competencies", "Identify skill gaps and learning opportunities", "Set specific, measurable career goals (1-year, 3-year, 5-year)", "Create an action plan for each goal with concrete steps", "Develop a networking strategy to build key relationships", "Schedule regular progress reviews and plan adjustments", "Identify potential mentors and sponsors"],
    tags: ["career planning", "professional development", "skills", "networking"],
    is_public: true,
    user_id: 1,
    estimated_time: 180
  },
  {
    title: "Reading Comprehension System",
    description: "A structured approach to reading that improves understanding, retention, and application of information from books and articles.\n\nPriority: medium\n\nEstimated Time: 20 minutes (setup) + ongoing per book\n\nSteps:\n1. Develop a pre-reading review process (scan content, set goals)\n2. Create a note-taking system for capturing key ideas\n3. Establish a highlighting/annotation method\n4. Implement a system for asking questions while reading\n5. Schedule post-reading reflection and summary creation\n6. Set up a knowledge application process\n7. Create a review schedule for important content\n\nTags: reading, learning, note-taking, knowledge management",
    category: "education",
    priority: "medium",
    steps: ["Develop a pre-reading review process (scan content, set goals)", "Create a note-taking system for capturing key ideas", "Establish a highlighting/annotation method", "Implement a system for asking questions while reading", "Schedule post-reading reflection and summary creation", "Set up a knowledge application process", "Create a review schedule for important content"],
    tags: ["reading", "learning", "note-taking", "knowledge management"],
    is_public: true,
    user_id: 1,
    estimated_time: 20
  },
  {
    title: "Household Budget Setup",
    description: "A comprehensive system for creating, managing, and optimizing your household finances to achieve your financial goals.\n\nPriority: high\n\nEstimated Time: 150 minutes (setup) + monthly maintenance\n\nSteps:\n1. Gather all income and expense information for the past 3 months\n2. Categorize expenses (fixed, variable, discretionary)\n3. Establish financial goals (saving, debt reduction, etc.)\n4. Create spending targets for each category\n5. Set up a tracking system (app, spreadsheet, etc.)\n6. Implement regular review sessions (weekly/monthly)\n7. Develop protocols for handling financial windfalls\n8. Create a plan for reducing unnecessary expenses\n\nTags: budgeting, finance, money management, planning",
    category: "finance",
    priority: "high",
    steps: ["Gather all income and expense information for the past 3 months", "Categorize expenses (fixed, variable, discretionary)", "Establish financial goals (saving, debt reduction, etc.)", "Create spending targets for each category", "Set up a tracking system (app, spreadsheet, etc.)", "Implement regular review sessions (weekly/monthly)", "Develop protocols for handling financial windfalls", "Create a plan for reducing unnecessary expenses"],
    tags: ["budgeting", "finance", "money management", "planning"],
    is_public: true,
    user_id: 1,
    estimated_time: 150
  },
  {
    title: "Document Digitization System",
    description: "A methodical approach to converting paper documents to digital format, organizing files, and creating a searchable archive.\n\nPriority: medium\n\nEstimated Time: 180 minutes (setup) + ongoing processing\n\nSteps:\n1. Select appropriate scanning equipment and software\n2. Create a consistent file naming convention\n3. Develop a logical folder organization structure\n4. Establish a system for handling incoming paper\n5. Implement a backup solution for digital files\n6. Set up OCR (text recognition) capabilities\n7. Create a document retention/deletion schedule\n8. Develop a system for sensitive document security\n\nTags: paperless, organization, digital files, productivity",
    category: "general",
    priority: "medium",
    steps: ["Select appropriate scanning equipment and software", "Create a consistent file naming convention", "Develop a logical folder organization structure", "Establish a system for handling incoming paper", "Implement a backup solution for digital files", "Set up OCR (text recognition) capabilities", "Create a document retention/deletion schedule", "Develop a system for sensitive document security"],
    tags: ["paperless", "organization", "digital files", "productivity"],
    is_public: true,
    user_id: 1,
    estimated_time: 180
  },
  {
    title: "Social Media Detox Protocol",
    description: "A structured approach to reducing social media consumption and building healthier digital habits that support focus and wellbeing.\n\nPriority: medium\n\nEstimated Time: 60 minutes (planning) + implementation\n\nSteps:\n1. Audit current social media usage patterns and triggers\n2. Define specific goals for the detox (time limits, platforms to avoid)\n3. Remove social apps from devices or use blocker tools\n4. Create alternative activities for common usage times\n5. Establish new notification settings and boundaries\n6. Develop accountability mechanisms\n7. Plan gradual reintroduction with new limitations\n8. Set up regular evaluation of digital habits\n\nTags: digital wellbeing, focus, social media, mental health",
    category: "health",
    priority: "medium",
    steps: ["Audit current social media usage patterns and triggers", "Define specific goals for the detox (time limits, platforms to avoid)", "Remove social apps from devices or use blocker tools", "Create alternative activities for common usage times", "Establish new notification settings and boundaries", "Develop accountability mechanisms", "Plan gradual reintroduction with new limitations", "Set up regular evaluation of digital habits"],
    tags: ["digital wellbeing", "focus", "social media", "mental health"],
    is_public: true,
    user_id: 1,
    estimated_time: 60
  },
  {
    title: "Habit Stacking Framework",
    description: "A systematic approach to building new habits by connecting them to existing routines, increasing consistency and reducing friction.\n\nPriority: medium\n\nEstimated Time: 45 minutes (setup) + daily implementation\n\nSteps:\n1. Identify current stable daily habits/routines\n2. Select 1-3 small new habits you want to establish\n3. Determine logical connection points in existing routines\n4. Create specific implementation intentions (When I X, I will Y)\n5. Set up environmental triggers and cues\n6. Remove friction for the new habits\n7. Track completion for the first 30 days\n8. Gradually increase difficulty or duration\n\nTags: habits, behavior change, routines, psychology",
    category: "personal",
    priority: "medium",
    steps: ["Identify current stable daily habits/routines", "Select 1-3 small new habits you want to establish", "Determine logical connection points in existing routines", "Create specific implementation intentions (When I X, I will Y)", "Set up environmental triggers and cues", "Remove friction for the new habits", "Track completion for the first 30 days", "Gradually increase difficulty or duration"],
    tags: ["habits", "behavior change", "routines", "psychology"],
    is_public: true,
    user_id: 1,
    estimated_time: 45
  },
  {
    title: "Mindfulness Meditation Practice",
    description: "A structured framework for establishing a consistent meditation practice that enhances focus, reduces stress, and improves mental clarity.\n\nPriority: medium\n\nEstimated Time: 30 minutes (setup) + 10-20 minutes daily\n\nSteps:\n1. Select a suitable meditation space in your home\n2. Choose a consistent time to practice daily\n3. Start with guided meditations for beginners\n4. Begin with 5-minute sessions and gradually increase\n5. Establish a pre-meditation routine as a trigger\n6. Track your practice and insights in a journal\n7. Join a community or find an accountability partner\n8. Explore different meditation techniques as you progress\n\nTags: meditation, mindfulness, mental health, stress reduction",
    category: "health",
    priority: "medium",
    steps: ["Select a suitable meditation space in your home", "Choose a consistent time to practice daily", "Start with guided meditations for beginners", "Begin with 5-minute sessions and gradually increase", "Establish a pre-meditation routine as a trigger", "Track your practice and insights in a journal", "Join a community or find an accountability partner", "Explore different meditation techniques as you progress"],
    tags: ["meditation", "mindfulness", "mental health", "stress reduction"],
    is_public: true,
    user_id: 1,
    estimated_time: 30
  },
  {
    title: "Networking Strategy Development",
    description: "A methodical approach to building and nurturing a professional network that supports your career goals and creates valuable opportunities.\n\nPriority: high\n\nEstimated Time: 120 minutes (planning) + ongoing implementation\n\nSteps:\n1. Define your networking objectives and target connections\n2. Audit your current network for strengths and gaps\n3. Identify key industry events, groups, and platforms\n4. Create a personalized introduction and elevator pitch\n5. Develop a system for tracking contacts and interactions\n6. Establish a regular cadence for reaching out to connections\n7. Create a value-creation mindset and approach\n8. Set up a follow-up system for new connections\n\nTags: networking, career development, professional relationships, communication",
    category: "work",
    priority: "high",
    steps: ["Define your networking objectives and target connections", "Audit your current network for strengths and gaps", "Identify key industry events, groups, and platforms", "Create a personalized introduction and elevator pitch", "Develop a system for tracking contacts and interactions", "Establish a regular cadence for reaching out to connections", "Create a value-creation mindset and approach", "Set up a follow-up system for new connections"],
    tags: ["networking", "career development", "professional relationships", "communication"],
    is_public: true,
    user_id: 1,
    estimated_time: 120
  },
  {
    title: "Digital Security Audit",
    description: "A comprehensive review and enhancement of your online security practices to protect sensitive information and digital assets.\n\nPriority: high\n\nEstimated Time: 180 minutes\n\nSteps:\n1. Inventory all online accounts and digital assets\n2. Audit password strength and uniqueness across accounts\n3. Implement a password manager for credential storage\n4. Enable two-factor authentication on critical accounts\n5. Review privacy settings on social media and key services\n6. Check for and close unused or dormant accounts\n7. Set up monitoring for potential identity theft\n8. Create a data backup system for important files\n\nTags: digital security, privacy, cybersecurity, online safety",
    category: "general",
    priority: "high",
    steps: ["Inventory all online accounts and digital assets", "Audit password strength and uniqueness across accounts", "Implement a password manager for credential storage", "Enable two-factor authentication on critical accounts", "Review privacy settings on social media and key services", "Check for and close unused or dormant accounts", "Set up monitoring for potential identity theft", "Create a data backup system for important files"],
    tags: ["digital security", "privacy", "cybersecurity", "online safety"],
    is_public: true,
    user_id: 1,
    estimated_time: 180
  },
  {
    title: "Home Maintenance Calendar",
    description: "A systematic schedule for home maintenance tasks that prevents costly repairs, extends the life of systems, and maintains property value.\n\nPriority: medium\n\nEstimated Time: 120 minutes (setup) + ongoing implementation\n\nSteps:\n1. Create a comprehensive inventory of home systems and components\n2. Research recommended maintenance schedules for each item\n3. Develop a calendar with monthly, quarterly, and annual tasks\n4. Set up a task management system with reminders\n5. Create a budget for regular maintenance expenses\n6. Compile a list of trusted service providers\n7. Maintain records of completed maintenance and repairs\n8. Schedule annual reviews and updates to the system\n\nTags: home maintenance, property management, organization, planning",
    category: "home",
    priority: "medium",
    steps: ["Create a comprehensive inventory of home systems and components", "Research recommended maintenance schedules for each item", "Develop a calendar with monthly, quarterly, and annual tasks", "Set up a task management system with reminders", "Create a budget for regular maintenance expenses", "Compile a list of trusted service providers", "Maintain records of completed maintenance and repairs", "Schedule annual reviews and updates to the system"],
    tags: ["home maintenance", "property management", "organization", "planning"],
    is_public: true,
    user_id: 1,
    estimated_time: 120
  },
  {
    title: "Creative Project Management System",
    description: "A flexible framework for managing creative projects from inception to completion, balancing structure with creative freedom.\n\nPriority: medium\n\nEstimated Time: 90 minutes (setup) + project-based implementation\n\nSteps:\n1. Define the project scope, objectives, and success criteria\n2. Break the creative process into distinct phases\n3. Create a timeline with milestones and deadlines\n4. Establish a system for capturing and organizing ideas\n5. Set up a workflow for iterative feedback and revisions\n6. Implement tools for tracking progress and versions\n7. Create templates for common project components\n8. Develop a project retrospective process\n\nTags: creativity, project management, workflow, organization",
    category: "work",
    priority: "medium",
    steps: ["Define the project scope, objectives, and success criteria", "Break the creative process into distinct phases", "Create a timeline with milestones and deadlines", "Establish a system for capturing and organizing ideas", "Set up a workflow for iterative feedback and revisions", "Implement tools for tracking progress and versions", "Create templates for common project components", "Develop a project retrospective process"],
    tags: ["creativity", "project management", "workflow", "organization"],
    is_public: true,
    user_id: 1,
    estimated_time: 90
  },
  {
    title: "Investment Portfolio Setup",
    description: "A systematic approach to creating and managing an investment portfolio aligned with your financial goals, risk tolerance, and time horizon.\n\nPriority: high\n\nEstimated Time: 240 minutes (initial setup) + quarterly reviews\n\nSteps:\n1. Define your investment goals and time horizons\n2. Assess your risk tolerance through reflection and tools\n3. Research appropriate asset allocation strategies\n4. Select suitable investment vehicles (ETFs, funds, stocks, etc.)\n5. Create a diversified portfolio structure\n6. Develop a regular contribution strategy\n7. Establish a rebalancing schedule and methodology\n8. Set up a system for monitoring and evaluating performance\n\nTags: investing, personal finance, wealth building, financial planning",
    category: "finance",
    priority: "high",
    steps: ["Define your investment goals and time horizons", "Assess your risk tolerance through reflection and tools", "Research appropriate asset allocation strategies", "Select suitable investment vehicles (ETFs, funds, stocks, etc.)", "Create a diversified portfolio structure", "Develop a regular contribution strategy", "Establish a rebalancing schedule and methodology", "Set up a system for monitoring and evaluating performance"],
    tags: ["investing", "personal finance", "wealth building", "financial planning"],
    is_public: true,
    user_id: 1,
    estimated_time: 240
  },
  {
    title: "Decision-Making Framework",
    description: "A structured approach to making important decisions that reduces bias, clarifies values, and leads to better outcomes.\n\nPriority: high\n\nEstimated Time: 60 minutes to learn + application per decision\n\nSteps:\n1. Clearly define the decision to be made and desired outcome\n2. Identify your core values and priorities related to this decision\n3. Generate multiple options without immediate judgment\n4. Establish evaluation criteria with weighted importance\n5. Gather relevant information and consult trusted sources\n6. Systematically evaluate each option against your criteria\n7. Consider potential consequences and plan for contingencies\n8. Make the decision and establish a review process\n\nTags: decision making, critical thinking, problem solving, productivity",
    category: "personal",
    priority: "high",
    steps: ["Clearly define the decision to be made and desired outcome", "Identify your core values and priorities related to this decision", "Generate multiple options without immediate judgment", "Establish evaluation criteria with weighted importance", "Gather relevant information and consult trusted sources", "Systematically evaluate each option against your criteria", "Consider potential consequences and plan for contingencies", "Make the decision and establish a review process"],
    tags: ["decision making", "critical thinking", "problem solving", "productivity"],
    is_public: true,
    user_id: 1,
    estimated_time: 60
  },
  {
    title: "Presentation Preparation System",
    description: "A comprehensive approach to creating and delivering powerful presentations that engage audiences and achieve your communication goals.\n\nPriority: medium\n\nEstimated Time: 120 minutes per presentation\n\nSteps:\n1. Define your presentation objective and key message\n2. Analyze your audience's needs, knowledge, and expectations\n3. Create an engaging structure with a strong opening and close\n4. Develop compelling visual aids that support your message\n5. Practice delivery with attention to pacing and body language\n6. Prepare for potential questions and objections\n7. Create a pre-presentation checklist for equipment and logistics\n8. Establish a feedback mechanism for continuous improvement\n\nTags: presentations, public speaking, communication, professional skills",
    category: "work",
    priority: "medium",
    steps: ["Define your presentation objective and key message", "Analyze your audience's needs, knowledge, and expectations", "Create an engaging structure with a strong opening and close", "Develop compelling visual aids that support your message", "Practice delivery with attention to pacing and body language", "Prepare for potential questions and objections", "Create a pre-presentation checklist for equipment and logistics", "Establish a feedback mechanism for continuous improvement"],
    tags: ["presentations", "public speaking", "communication", "professional skills"],
    is_public: true,
    user_id: 1,
    estimated_time: 120
  },
  {
    title: "Personal Annual Review",
    description: "A structured end-of-year reflection process to evaluate progress, celebrate achievements, and set meaningful direction for the coming year.\n\nPriority: high\n\nEstimated Time: 180 minutes\n\nSteps:\n1. Gather materials for reflection (journal, calendar, goals list, etc.)\n2. Review and evaluate the past year across life domains\n3. Identify key accomplishments, challenges, and lessons learned\n4. Reflect on what worked well and what didn't\n5. Update your personal mission statement and core values\n6. Set meaningful goals and intentions for the coming year\n7. Create an action plan with next steps for each goal\n8. Schedule quarterly check-ins to review progress\n\nTags: reflection, goal setting, planning, personal development",
    category: "personal",
    priority: "high",
    steps: ["Gather materials for reflection (journal, calendar, goals list, etc.)", "Review and evaluate the past year across life domains", "Identify key accomplishments, challenges, and lessons learned", "Reflect on what worked well and what didn't", "Update your personal mission statement and core values", "Set meaningful goals and intentions for the coming year", "Create an action plan with next steps for each goal", "Schedule quarterly check-ins to review progress"],
    tags: ["reflection", "goal setting", "planning", "personal development"],
    is_public: true,
    user_id: 1,
    estimated_time: 180
  },
  {
    title: "Healthy Meal Prep System",
    description: "A streamlined approach to preparing nutritious meals in batches, saving time and supporting healthy eating habits throughout the week.\n\nPriority: medium\n\nEstimated Time: 30 minutes (planning) + 120 minutes (preparation)\n\nSteps:\n1. Create a rotation of healthy recipes that store and reheat well\n2. Plan a weekly menu with shared ingredients to reduce waste\n3. Generate an organized shopping list by store section\n4. Prep ingredients in batches (washing, chopping, portioning)\n5. Cook multiple meals in a single session using efficient sequencing\n6. Implement proper cooling and storage procedures\n7. Label containers with contents and dates\n8. Create a system for tracking inventory and minimizing waste\n\nTags: meal prep, nutrition, time saving, healthy eating",
    category: "health",
    priority: "medium",
    steps: ["Create a rotation of healthy recipes that store and reheat well", "Plan a weekly menu with shared ingredients to reduce waste", "Generate an organized shopping list by store section", "Prep ingredients in batches (washing, chopping, portioning)", "Cook multiple meals in a single session using efficient sequencing", "Implement proper cooling and storage procedures", "Label containers with contents and dates", "Create a system for tracking inventory and minimizing waste"],
    tags: ["meal prep", "nutrition", "time saving", "healthy eating"],
    is_public: true,
    user_id: 1,
    estimated_time: 150
  },
  {
    title: "Effective Feedback Framework",
    description: "A structured approach to giving and receiving feedback that improves performance, strengthens relationships, and promotes growth.\n\nPriority: high\n\nEstimated Time: 60 minutes (learning) + situation-based application\n\nSteps:\n1. Establish the right context for feedback (timing, privacy, rapport)\n2. Use a balanced approach addressing strengths and growth areas\n3. Focus on specific, observable behaviors rather than personality\n4. Connect feedback to goals, values, or outcomes\n5. Include concrete examples to illustrate points\n6. Collaboratively develop action steps for improvement\n7. Create a follow-up plan to monitor progress\n8. Develop receptivity when receiving feedback from others\n\nTags: feedback, communication, leadership, professional development",
    category: "work",
    priority: "high",
    steps: ["Establish the right context for feedback (timing, privacy, rapport)", "Use a balanced approach addressing strengths and growth areas", "Focus on specific, observable behaviors rather than personality", "Connect feedback to goals, values, or outcomes", "Include concrete examples to illustrate points", "Collaboratively develop action steps for improvement", "Create a follow-up plan to monitor progress", "Develop receptivity when receiving feedback from others"],
    tags: ["feedback", "communication", "leadership", "professional development"],
    is_public: true,
    user_id: 1,
    estimated_time: 60
  },
  {
    title: "Wardrobe Organization System",
    description: "A methodical approach to organizing your clothing and accessories for maximum efficiency, versatility, and enjoyment of your wardrobe.\n\nPriority: low\n\nEstimated Time: 180 minutes\n\nSteps:\n1. Empty and clean your closet and storage areas\n2. Sort all items into categories (keep, donate, repair, discard)\n3. Organize remaining clothing by category and color\n4. Implement appropriate storage solutions for different items\n5. Create a system for seasonal rotation and storage\n6. Develop a method for tracking outfit combinations\n7. Establish guidelines for new purchases\n8. Set up a regular maintenance schedule\n\nTags: wardrobe, organization, clothing, minimalism",
    category: "home",
    priority: "low",
    steps: ["Empty and clean your closet and storage areas", "Sort all items into categories (keep, donate, repair, discard)", "Organize remaining clothing by category and color", "Implement appropriate storage solutions for different items", "Create a system for seasonal rotation and storage", "Develop a method for tracking outfit combinations", "Establish guidelines for new purchases", "Set up a regular maintenance schedule"],
    tags: ["wardrobe", "organization", "clothing", "minimalism"],
    is_public: true,
    user_id: 1,
    estimated_time: 180
  },
  {
    title: "Stress Management Protocol",
    description: "A comprehensive toolkit of techniques and practices to effectively manage stress, build resilience, and maintain mental wellbeing.\n\nPriority: high\n\nEstimated Time: 60 minutes (planning) + daily implementation\n\nSteps:\n1. Identify your primary stress triggers and patterns\n2. Develop early warning detection for stress responses\n3. Create a personalized toolkit of stress-reduction techniques\n4. Implement daily preventative practices (meditation, exercise, etc.)\n5. Establish emergency protocols for acute stress situations\n6. Build a supportive environment and relationships\n7. Create healthy boundaries around stressful people and situations\n8. Set up a regular stress audit and protocol refinement process\n\nTags: stress management, mental health, wellbeing, self-care",
    category: "health",
    priority: "high",
    steps: ["Identify your primary stress triggers and patterns", "Develop early warning detection for stress responses", "Create a personalized toolkit of stress-reduction techniques", "Implement daily preventative practices (meditation, exercise, etc.)", "Establish emergency protocols for acute stress situations", "Build a supportive environment and relationships", "Create healthy boundaries around stressful people and situations", "Set up a regular stress audit and protocol refinement process"],
    tags: ["stress management", "mental health", "wellbeing", "self-care"],
    is_public: true,
    user_id: 1,
    estimated_time: 60
  },
  {
    title: "Learning Management System",
    description: "A systematic approach to acquiring new knowledge and skills more effectively through deliberate learning strategies and organization.\n\nPriority: medium\n\nEstimated Time: 90 minutes (setup) + ongoing implementation\n\nSteps:\n1. Identify your learning goals and priorities\n2. Assess your preferred learning styles and strengths\n3. Create a catalog of resources by topic (courses, books, etc.)\n4. Develop a consistent note-taking and retention system\n5. Implement spaced repetition for improved memory\n6. Schedule dedicated learning blocks in your calendar\n7. Set up a progress tracking and reflection process\n8. Create a system for applying new knowledge practically\n\nTags: learning, education, knowledge management, skill development",
    category: "education",
    priority: "medium",
    steps: ["Identify your learning goals and priorities", "Assess your preferred learning styles and strengths", "Create a catalog of resources by topic (courses, books, etc.)", "Develop a consistent note-taking and retention system", "Implement spaced repetition for improved memory", "Schedule dedicated learning blocks in your calendar", "Set up a progress tracking and reflection process", "Create a system for applying new knowledge practically"],
    tags: ["learning", "education", "knowledge management", "skill development"],
    is_public: true,
    user_id: 1,
    estimated_time: 90
  },
  {
    title: "Job Search Organization System",
    description: "A structured approach to managing a job search process that maximizes opportunities, reduces stress, and leads to better career outcomes.\n\nPriority: high\n\nEstimated Time: 120 minutes (setup) + ongoing implementation\n\nSteps:\n1. Define your job search criteria and ideal role characteristics\n2. Create targeted versions of your resume and cover letter\n3. Develop a system for finding and tracking job opportunities\n4. Establish a daily and weekly job search routine\n5. Implement a networking strategy for hidden opportunities\n6. Set up interview preparation protocols and resources\n7. Create a follow-up system for applications and interviews\n8. Develop a method for evaluating and comparing offers\n\nTags: job search, career development, organization, networking",
    category: "work",
    priority: "high",
    steps: ["Define your job search criteria and ideal role characteristics", "Create targeted versions of your resume and cover letter", "Develop a system for finding and tracking job opportunities", "Establish a daily and weekly job search routine", "Implement a networking strategy for hidden opportunities", "Set up interview preparation protocols and resources", "Create a follow-up system for applications and interviews", "Develop a method for evaluating and comparing offers"],
    tags: ["job search", "career development", "organization", "networking"],
    is_public: true,
    user_id: 1,
    estimated_time: 120
  },
  {
    title: "Remote Work Optimization",
    description: "A comprehensive approach to creating an effective, productive, and balanced remote work experience that supports both performance and wellbeing.\n\nPriority: high\n\nEstimated Time: 120 minutes (setup) + ongoing refinement\n\nSteps:\n1. Design an ergonomic and functional home workspace\n2. Establish clear boundaries between work and personal life\n3. Create consistent daily routines and working hours\n4. Implement effective digital communication protocols\n5. Develop strategies for maintaining visibility and connection\n6. Set up systems for tracking productivity and progress\n7. Create regular movement and break schedules\n8. Establish end-of-day shutdown rituals\n\nTags: remote work, productivity, work-life balance, home office",
    category: "work",
    priority: "high",
    steps: ["Design an ergonomic and functional home workspace", "Establish clear boundaries between work and personal life", "Create consistent daily routines and working hours", "Implement effective digital communication protocols", "Develop strategies for maintaining visibility and connection", "Set up systems for tracking productivity and progress", "Create regular movement and break schedules", "Establish end-of-day shutdown rituals"],
    tags: ["remote work", "productivity", "work-life balance", "home office"],
    is_public: true,
    user_id: 1,
    estimated_time: 120
  },
  {
    title: "Creative Writing Practice",
    description: "A structured framework for developing your creative writing skills through regular practice, experimentation, and constructive feedback.\n\nPriority: medium\n\nEstimated Time: 60 minutes (setup) + 30-60 minutes daily practice\n\nSteps:\n1. Set specific writing goals and define your focus areas\n2. Create a consistent daily writing routine and environment\n3. Develop a catalog of writing prompts and exercises\n4. Implement a progressive skill development approach\n5. Establish a feedback system with trusted readers\n6. Join a writing community for support and accountability\n7. Create a revision and editing process for your work\n8. Set up a submission system for publishing opportunities\n\nTags: writing, creativity, skill development, artistic practice",
    category: "personal",
    priority: "medium",
    steps: ["Set specific writing goals and define your focus areas", "Create a consistent daily writing routine and environment", "Develop a catalog of writing prompts and exercises", "Implement a progressive skill development approach", "Establish a feedback system with trusted readers", "Join a writing community for support and accountability", "Create a revision and editing process for your work", "Set up a submission system for publishing opportunities"],
    tags: ["writing", "creativity", "skill development", "artistic practice"],
    is_public: true,
    user_id: 1,
    estimated_time: 60
  },
  {
    title: "Debt Reduction Plan",
    description: "A methodical approach to paying down debt more quickly while maintaining financial stability and building positive money habits.\n\nPriority: high\n\nEstimated Time: 120 minutes (initial planning) + monthly reviews\n\nSteps:\n1. Compile a complete inventory of all debts with terms and interest rates\n2. Analyze your budget to identify maximum debt payment capacity\n3. Choose a debt reduction strategy (avalanche, snowball, etc.)\n4. Create a month-by-month payoff plan with specific targets\n5. Set up automatic payments to ensure consistency\n6. Identify potential windfalls and how they'll be applied\n7. Develop strategies to avoid creating new debt\n8. Establish a regular review and celebration process\n\nTags: debt reduction, financial planning, budgeting, money management",
    category: "finance",
    priority: "high",
    steps: ["Compile a complete inventory of all debts with terms and interest rates", "Analyze your budget to identify maximum debt payment capacity", "Choose a debt reduction strategy (avalanche, snowball, etc.)", "Create a month-by-month payoff plan with specific targets", "Set up automatic payments to ensure consistency", "Identify potential windfalls and how they'll be applied", "Develop strategies to avoid creating new debt", "Establish a regular review and celebration process"],
    tags: ["debt reduction", "financial planning", "budgeting", "money management"],
    is_public: true,
    user_id: 1,
    estimated_time: 120
  },
  {
    title: "Relationship Check-in System",
    description: "A structured approach to nurturing important relationships through intentional communication, quality time, and mutual growth.\n\nPriority: high\n\nEstimated Time: 60 minutes (setup) + regular implementation\n\nSteps:\n1. Identify key relationships that require intentional nurturing\n2. Establish regular check-in conversations with each person\n3. Create a list of meaningful questions for deeper connection\n4. Develop rituals for quality time and shared experiences\n5. Implement a system for tracking important events and dates\n6. Create a method for addressing conflicts constructively\n7. Establish appreciation and gratitude practices\n8. Set up periodic relationship reviews and goal-setting\n\nTags: relationships, communication, connection, personal growth",
    category: "personal",
    priority: "high",
    steps: ["Identify key relationships that require intentional nurturing", "Establish regular check-in conversations with each person", "Create a list of meaningful questions for deeper connection", "Develop rituals for quality time and shared experiences", "Implement a system for tracking important events and dates", "Create a method for addressing conflicts constructively", "Establish appreciation and gratitude practices", "Set up periodic relationship reviews and goal-setting"],
    tags: ["relationships", "communication", "connection", "personal growth"],
    is_public: true,
    user_id: 1,
    estimated_time: 60
  },
  {
    title: "Digital Content Creation Workflow",
    description: "A streamlined system for consistently producing high-quality content across various platforms while maintaining creativity and efficiency.\n\nPriority: medium\n\nEstimated Time: 90 minutes (setup) + implementation per content piece\n\nSteps:\n1. Define your content strategy and target audience\n2. Create an idea capture and development system\n3. Develop content templates and frameworks\n4. Establish a content calendar with publishing schedule\n5. Create a production workflow with clear stages\n6. Set up tools and resources for efficient creation\n7. Implement quality control and editing processes\n8. Develop analytics tracking and content optimization\n\nTags: content creation, digital marketing, creativity, productivity",
    category: "work",
    priority: "medium",
    steps: ["Define your content strategy and target audience", "Create an idea capture and development system", "Develop content templates and frameworks", "Establish a content calendar with publishing schedule", "Create a production workflow with clear stages", "Set up tools and resources for efficient creation", "Implement quality control and editing processes", "Develop analytics tracking and content optimization"],
    tags: ["content creation", "digital marketing", "creativity", "productivity"],
    is_public: true,
    user_id: 1,
    estimated_time: 90
  },
  {
    title: "Morning Exercise Routine",
    description: "A structured morning workout program that energizes your day, improves fitness, and can be completed within 30 minutes for busy schedules.\n\nPriority: medium\n\nEstimated Time: 30 minutes daily\n\nSteps:\n1. Prepare workout clothes and equipment the night before\n2. Start with 5 minutes of light cardio to warm up the body\n3. Perform a 15-minute circuit of bodyweight exercises\n4. Include 5 minutes of targeted stretching for flexibility\n5. End with 5 minutes of mindfulness or breathwork\n6. Track your progress and increase intensity gradually\n7. Rotate between different exercise types throughout the week\n8. Maintain proper hydration before and after your workout\n\nTags: fitness, morning routine, exercise, health",
    category: "health",
    priority: "medium",
    steps: ["Prepare workout clothes and equipment the night before", "Start with 5 minutes of light cardio to warm up the body", "Perform a 15-minute circuit of bodyweight exercises", "Include 5 minutes of targeted stretching for flexibility", "End with 5 minutes of mindfulness or breathwork", "Track your progress and increase intensity gradually", "Rotate between different exercise types throughout the week", "Maintain proper hydration before and after your workout"],
    tags: ["fitness", "morning routine", "exercise", "health"],
    is_public: true,
    user_id: 1,
    estimated_time: 30
  },
  {
    title: "Continuous Learning System",
    description: "A structured approach to ongoing professional development that keeps your skills current, advances your expertise, and enhances career opportunities.\n\nPriority: high\n\nEstimated Time: 120 minutes (setup) + 3-5 hours weekly\n\nSteps:\n1. Conduct a skills gap analysis for your role and industry\n2. Create a learning roadmap with specific skill objectives\n3. Identify quality learning resources in various formats\n4. Establish weekly learning blocks in your schedule\n5. Implement a note-taking and knowledge integration system\n6. Find opportunities to apply new skills practically\n7. Join communities of practice for collaborative learning\n8. Set up quarterly reviews and updates to your learning plan\n\nTags: learning, professional development, career growth, education",
    category: "education",
    priority: "high",
    steps: ["Conduct a skills gap analysis for your role and industry", "Create a learning roadmap with specific skill objectives", "Identify quality learning resources in various formats", "Establish weekly learning blocks in your schedule", "Implement a note-taking and knowledge integration system", "Find opportunities to apply new skills practically", "Join communities of practice for collaborative learning", "Set up quarterly reviews and updates to your learning plan"],
    tags: ["learning", "professional development", "career growth", "education"],
    is_public: true,
    user_id: 1,
    estimated_time: 120
  },
  {
    title: "Digital Minimalism Implementation",
    description: "A methodical approach to simplifying your digital life, reducing online distractions, and using technology more intentionally to support your values and goals.\n\nPriority: medium\n\nEstimated Time: 180 minutes (initial setup) + ongoing maintenance\n\nSteps:\n1. Clarify your core values and how technology should support them\n2. Conduct a digital declutter of devices, apps, and accounts\n3. Establish clear rules for technology use and boundaries\n4. Redesign your digital environment to minimize distractions\n5. Create intentional protocols for common digital activities\n6. Implement tools to monitor and limit screen time\n7. Develop meaningful offline activities and hobbies\n8. Set up a regular review process for digital habits\n\nTags: digital minimalism, focus, productivity, intentional living",
    category: "personal",
    priority: "medium",
    steps: ["Clarify your core values and how technology should support them", "Conduct a digital declutter of devices, apps, and accounts", "Establish clear rules for technology use and boundaries", "Redesign your digital environment to minimize distractions", "Create intentional protocols for common digital activities", "Implement tools to monitor and limit screen time", "Develop meaningful offline activities and hobbies", "Set up a regular review process for digital habits"],
    tags: ["digital minimalism", "focus", "productivity", "intentional living"],
    is_public: true,
    user_id: 1,
    estimated_time: 180
  },
  {
    title: "Personal Knowledge Management System",
    description: "A comprehensive approach to capturing, organizing, and leveraging information for learning, creativity, and problem-solving.\n\nPriority: medium\n\nEstimated Time: 180 minutes (setup) + ongoing implementation\n\nSteps:\n1. Clarify the types of knowledge you need to manage\n2. Select appropriate tools for different knowledge types\n3. Create a consistent information capture workflow\n4. Develop an organizational system with logical structure\n5. Implement tagging and linking for connections\n6. Establish regular review and refinement processes\n7. Set up spaced repetition for important information\n8. Create protocols for information synthesis and sharing\n\nTags: knowledge management, learning, note-taking, productivity",
    category: "education",
    priority: "medium",
    steps: ["Clarify the types of knowledge you need to manage", "Select appropriate tools for different knowledge types", "Create a consistent information capture workflow", "Develop an organizational system with logical structure", "Implement tagging and linking for connections", "Establish regular review and refinement processes", "Set up spaced repetition for important information", "Create protocols for information synthesis and sharing"],
    tags: ["knowledge management", "learning", "note-taking", "productivity"],
    is_public: true,
    user_id: 1,
    estimated_time: 180
  },
  {
    title: "Family Meeting Framework",
    description: "A structured approach to regular family meetings that improve communication, solve problems collaboratively, and strengthen family bonds.\n\nPriority: medium\n\nEstimated Time: 60 minutes weekly\n\nSteps:\n1. Establish a consistent time and place for family meetings\n2. Create an agenda template with key discussion categories\n3. Implement a system for collecting agenda items throughout the week\n4. Develop ground rules for respectful communication\n5. Assign rotating roles (facilitator, timekeeper, note-taker)\n6. Include appreciation and celebration components\n7. Create a decision-making and problem-solving process\n8. End with clear action items and responsibilities\n\nTags: family, communication, relationships, problem solving",
    category: "personal",
    priority: "medium",
    steps: ["Establish a consistent time and place for family meetings", "Create an agenda template with key discussion categories", "Implement a system for collecting agenda items throughout the week", "Develop ground rules for respectful communication", "Assign rotating roles (facilitator, timekeeper, note-taker)", "Include appreciation and celebration components", "Create a decision-making and problem-solving process", "End with clear action items and responsibilities"],
    tags: ["family", "communication", "relationships", "problem solving"],
    is_public: true,
    user_id: 1,
    estimated_time: 60
  },
  {
    title: "Language Learning System",
    description: "A comprehensive framework for efficiently learning a new language through consistent practice, immersion, and effective study techniques.\n\nPriority: medium\n\nEstimated Time: 90 minutes (setup) + 30 minutes daily practice\n\nSteps:\n1. Set clear language learning goals and proficiency targets\n2. Select appropriate learning resources and tools\n3. Create a balanced study plan covering all language skills\n4. Implement spaced repetition for vocabulary acquisition\n5. Establish daily immersion practices (podcasts, videos, etc.)\n6. Find conversation partners or language exchange opportunities\n7. Develop a progress tracking and assessment system\n8. Schedule regular review and adjustment of learning strategies\n\nTags: language learning, education, skills development, communication",
    category: "education",
    priority: "medium",
    steps: ["Set clear language learning goals and proficiency targets", "Select appropriate learning resources and tools", "Create a balanced study plan covering all language skills", "Implement spaced repetition for vocabulary acquisition", "Establish daily immersion practices (podcasts, videos, etc.)", "Find conversation partners or language exchange opportunities", "Develop a progress tracking and assessment system", "Schedule regular review and adjustment of learning strategies"],
    tags: ["language learning", "education", "skills development", "communication"],
    is_public: true,
    user_id: 1,
    estimated_time: 90
  },
  {
    title: "Data Backup Protocol",
    description: "A systematic approach to protecting important digital files through redundant storage, regular backups, and disaster recovery planning.\n\nPriority: high\n\nEstimated Time: 120 minutes (setup) + ongoing maintenance\n\nSteps:\n1. Inventory all important digital assets across devices\n2. Classify data by importance and backup frequency needs\n3. Implement the 3-2-1 backup strategy (3 copies, 2 types, 1 offsite)\n4. Set up automated backup solutions for critical systems\n5. Create a manual backup schedule for other important files\n6. Test backup restoration processes regularly\n7. Develop protocols for securing sensitive information\n8. Create a disaster recovery plan for worst-case scenarios\n\nTags: data backup, digital security, disaster recovery, organization",
    category: "general",
    priority: "high",
    steps: ["Inventory all important digital assets across devices", "Classify data by importance and backup frequency needs", "Implement the 3-2-1 backup strategy (3 copies, 2 types, 1 offsite)", "Set up automated backup solutions for critical systems", "Create a manual backup schedule for other important files", "Test backup restoration processes regularly", "Develop protocols for securing sensitive information", "Create a disaster recovery plan for worst-case scenarios"],
    tags: ["data backup", "digital security", "disaster recovery", "organization"],
    is_public: true,
    user_id: 1,
    estimated_time: 120
  },
  {
    title: "Donation and Charity Strategy",
    description: "A thoughtful approach to charitable giving that aligns with your values, maximizes impact, and integrates philanthropy into your financial planning.\n\nPriority: medium\n\nEstimated Time: 120 minutes (initial planning) + quarterly reviews\n\nSteps:\n1. Clarify your philanthropic values and focus areas\n2. Establish a giving budget based on your financial situation\n3. Research effective organizations aligned with your priorities\n4. Create a giving strategy (recurring vs. one-time, etc.)\n5. Set up automated donations for consistency\n6. Develop a system for tracking charitable contributions\n7. Plan for tax documentation and deduction optimization\n8. Schedule regular reviews of your giving impact and strategy\n\nTags: charity, philanthropy, giving, financial planning",
    category: "finance",
    priority: "medium",
    steps: ["Clarify your philanthropic values and focus areas", "Establish a giving budget based on your financial situation", "Research effective organizations aligned with your priorities", "Create a giving strategy (recurring vs. one-time, etc.)", "Set up automated donations for consistency", "Develop a system for tracking charitable contributions", "Plan for tax documentation and deduction optimization", "Schedule regular reviews of your giving impact and strategy"],
    tags: ["charity", "philanthropy", "giving", "financial planning"],
    is_public: true,
    user_id: 1,
    estimated_time: 120
  },
  {
    title: "Holiday Planning System",
    description: "A comprehensive approach to planning and organizing holidays and special occasions that reduces stress and allows more time for meaningful celebration.\n\nPriority: medium\n\nEstimated Time: 120 minutes (planning) + implementation per holiday\n\nSteps:\n1. Create a master calendar of all holidays and special events\n2. Develop planning timelines for major celebrations\n3. Create standardized checklists for recurring events\n4. Establish a gift management system with budgets and ideas\n5. Compile recipes, decorations, and tradition notes\n6. Implement a delegation system for shared responsibilities\n7. Create templates for invitations and communications\n8. Set up post-event evaluation for continuous improvement\n\nTags: holidays, planning, organization, celebrations",
    category: "personal",
    priority: "medium",
    steps: ["Create a master calendar of all holidays and special events", "Develop planning timelines for major celebrations", "Create standardized checklists for recurring events", "Establish a gift management system with budgets and ideas", "Compile recipes, decorations, and tradition notes", "Implement a delegation system for shared responsibilities", "Create templates for invitations and communications", "Set up post-event evaluation for continuous improvement"],
    tags: ["holidays", "planning", "organization", "celebrations"],
    is_public: true,
    user_id: 1,
    estimated_time: 120
  },
  {
    title: "Effective Reading List Management",
    description: "A structured system for curating, prioritizing, and processing reading materials to maximize learning and minimize information overwhelm.\n\nPriority: medium\n\nEstimated Time: 60 minutes (setup) + ongoing maintenance\n\nSteps:\n1. Audit and organize your current reading materials\n2. Create categories based on purpose and priority\n3. Develop a consistent capture system for new material\n4. Implement a practical prioritization protocol\n5. Establish dedicated reading times in your schedule\n6. Create a progressive reading method by material type\n7. Set up a note-taking system for key insights\n8. Implement a regular review process for your reading list\n\nTags: reading, learning, knowledge management, productivity",
    category: "education",
    priority: "medium",
    steps: ["Audit and organize your current reading materials", "Create categories based on purpose and priority", "Develop a consistent capture system for new material", "Implement a practical prioritization protocol", "Establish dedicated reading times in your schedule", "Create a progressive reading method by material type", "Set up a note-taking system for key insights", "Implement a regular review process for your reading list"],
    tags: ["reading", "learning", "knowledge management", "productivity"],
    is_public: true,
    user_id: 1,
    estimated_time: 60
  },
  {
    title: "Public Speaking Improvement Plan",
    description: "A structured approach to enhancing your public speaking skills through deliberate practice, feedback, and progressive challenges.\n\nPriority: medium\n\nEstimated Time: 90 minutes (planning) + ongoing implementation\n\nSteps:\n1. Assess your current speaking strengths and growth areas\n2. Set specific skill development goals\n3. Create a library of speaking exercises and drills\n4. Establish a regular practice schedule with recording\n5. Join a supportive speaking group like Toastmasters\n6. Develop a feedback collection and implementation system\n7. Create a progressive challenge ladder of speaking opportunities\n8. Plan regular skill assessments and goal updates\n\nTags: public speaking, communication, professional development, confidence",
    category: "work",
    priority: "medium",
    steps: ["Assess your current speaking strengths and growth areas", "Set specific skill development goals", "Create a library of speaking exercises and drills", "Establish a regular practice schedule with recording", "Join a supportive speaking group like Toastmasters", "Develop a feedback collection and implementation system", "Create a progressive challenge ladder of speaking opportunities", "Plan regular skill assessments and goal updates"],
    tags: ["public speaking", "communication", "professional development", "confidence"],
    is_public: true,
    user_id: 1,
    estimated_time: 90
  },
  {
    title: "Home Renovation Project Management",
    description: "A comprehensive framework for planning and managing home improvement projects efficiently, on budget, and with minimal stress.\n\nPriority: medium\n\nEstimated Time: 180 minutes (planning) + project implementation\n\nSteps:\n1. Define project scope, goals, and success criteria\n2. Research requirements, permits, and technical considerations\n3. Create detailed plans with measurements and specifications\n4. Develop a realistic budget with contingency allowances\n5. Establish a timeline with phase dependencies\n6. Create a vendor/contractor selection process\n7. Implement a project tracking and documentation system\n8. Develop a quality control and issue resolution process\n\nTags: home improvement, project management, renovation, planning",
    category: "home",
    priority: "medium",
    steps: ["Define project scope, goals, and success criteria", "Research requirements, permits, and technical considerations", "Create detailed plans with measurements and specifications", "Develop a realistic budget with contingency allowances", "Establish a timeline with phase dependencies", "Create a vendor/contractor selection process", "Implement a project tracking and documentation system", "Develop a quality control and issue resolution process"],
    tags: ["home improvement", "project management", "renovation", "planning"],
    is_public: true,
    user_id: 1,
    estimated_time: 180
  },
  {
    title: "Smart Shopping Protocol",
    description: "A systematic approach to making thoughtful purchasing decisions that save money, reduce waste, and align with your values and needs.\n\nPriority: medium\n\nEstimated Time: 60 minutes (setup) + ongoing implementation\n\nSteps:\n1. Create a purchasing decision framework based on needs vs. wants\n2. Develop a standard research process for significant purchases\n3. Implement a waiting period for non-essential items\n4. Create a price tracking system for planned purchases\n5. Establish a seasonal shopping calendar for best deals\n6. Set up deal alerts and coupon management\n7. Develop a protocol for evaluating quality and durability\n8. Create a system for reviewing past purchases\n\nTags: shopping, budgeting, consumer skills, decision making",
    category: "finance",
    priority: "medium",
    steps: ["Create a purchasing decision framework based on needs vs. wants", "Develop a standard research process for significant purchases", "Implement a waiting period for non-essential items", "Create a price tracking system for planned purchases", "Establish a seasonal shopping calendar for best deals", "Set up deal alerts and coupon management", "Develop a protocol for evaluating quality and durability", "Create a system for reviewing past purchases"],
    tags: ["shopping", "budgeting", "consumer skills", "decision making"],
    is_public: true,
    user_id: 1,
    estimated_time: 60
  },
  {
    title: "Effective Email Communication Framework",
    description: "A structured approach to writing and managing email that improves clarity, increases response rates, and reduces time spent on electronic communication.\n\nPriority: medium\n\nEstimated Time: 60 minutes (learning) + ongoing application\n\nSteps:\n1. Develop email templates for common communication types\n2. Create a decision tree for when to use email versus other channels\n3. Implement a structured format for clear, actionable messages\n4. Set up a system for tracking sent messages requiring responses\n5. Establish effective subject line formulas for different purposes\n6. Create guidelines for appropriate tone and formality\n7. Implement email batching to reduce constant checking\n8. Develop guidelines for email length and complexity\n\nTags: email, communication, productivity, professional skills",
    category: "work",
    priority: "medium",
    steps: ["Develop email templates for common communication types", "Create a decision tree for when to use email versus other channels", "Implement a structured format for clear, actionable messages", "Set up a system for tracking sent messages requiring responses", "Establish effective subject line formulas for different purposes", "Create guidelines for appropriate tone and formality", "Implement email batching to reduce constant checking", "Develop guidelines for email length and complexity"],
    tags: ["email", "communication", "productivity", "professional skills"],
    is_public: true,
    user_id: 1,
    estimated_time: 60
  },
  {
    title: "Effective Team Leadership System",
    description: "A comprehensive framework for leading teams to high performance through clear direction, engagement, development, and accountability.\n\nPriority: high\n\nEstimated Time: 120 minutes (planning) + ongoing implementation\n\nSteps:\n1. Establish clear team purpose and meaningful goals\n2. Develop communication protocols for transparency and alignment\n3. Create consistent meeting rhythms for different purposes\n4. Implement a system for tracking commitments and progress\n5. Establish individual development and feedback processes\n6. Create decision-making frameworks for different scenarios\n7. Develop recognition systems to reinforce desired behaviors\n8. Implement regular team health assessments and improvements\n\nTags: leadership, team management, communication, professional development",
    category: "work",
    priority: "high",
    steps: ["Establish clear team purpose and meaningful goals", "Develop communication protocols for transparency and alignment", "Create consistent meeting rhythms for different purposes", "Implement a system for tracking commitments and progress", "Establish individual development and feedback processes", "Create decision-making frameworks for different scenarios", "Develop recognition systems to reinforce desired behaviors", "Implement regular team health assessments and improvements"],
    tags: ["leadership", "team management", "communication", "professional development"],
    is_public: true,
    user_id: 1,
    estimated_time: 120
  },
  {
    title: "Productivity Metrics Dashboard",
    description: "A customized system for tracking your productivity, progress on goals, and key performance indicators to drive continuous improvement.\n\nPriority: medium\n\nEstimated Time: 150 minutes (setup) + weekly maintenance\n\nSteps:\n1. Identify the key metrics that matter most to your goals\n2. Determine appropriate measurement methods for each metric\n3. Select tools for data collection and visualization\n4. Create a dashboard layout with primary and secondary metrics\n5. Establish regular data collection procedures\n6. Implement review intervals (daily, weekly, monthly)\n7. Develop a process for identifying improvement opportunities\n8. Create a system for celebrating progress and achievements\n\nTags: productivity, tracking, data, performance",
    category: "work",
    priority: "medium",
    steps: ["Identify the key metrics that matter most to your goals", "Determine appropriate measurement methods for each metric", "Select tools for data collection and visualization", "Create a dashboard layout with primary and secondary metrics", "Establish regular data collection procedures", "Implement review intervals (daily, weekly, monthly)", "Develop a process for identifying improvement opportunities", "Create a system for celebrating progress and achievements"],
    tags: ["productivity", "tracking", "data", "performance"],
    is_public: true,
    user_id: 1,
    estimated_time: 150
  },
  {
    title: "Negotiation Preparation Framework",
    description: "A structured approach to preparing for important negotiations that improves outcomes, reduces stress, and strengthens relationships.\n\nPriority: high\n\nEstimated Time: 120 minutes per negotiation\n\nSteps:\n1. Research thoroughly (market rates, precedents, constraints)\n2. Clarify your objectives, priorities, and BATNA (Best Alternative to a Negotiated Agreement)\n3. Identify potential creative options beyond standard terms\n4. Anticipate counterparty interests, constraints, and objections\n5. Develop responses to likely objections or concerns\n6. Prepare a negotiation strategy with opening position and fallbacks\n7. Plan the logistics and setting to your advantage\n8. Create a post-negotiation implementation and relationship plan\n\nTags: negotiation, communication, preparation, strategy",
    category: "work",
    priority: "high",
    steps: ["Research thoroughly (market rates, precedents, constraints)", "Clarify your objectives, priorities, and BATNA (Best Alternative to a Negotiated Agreement)", "Identify potential creative options beyond standard terms", "Anticipate counterparty interests, constraints, and objections", "Develop responses to likely objections or concerns", "Prepare a negotiation strategy with opening position and fallbacks", "Plan the logistics and setting to your advantage", "Create a post-negotiation implementation and relationship plan"],
    tags: ["negotiation", "communication", "preparation", "strategy"],
    is_public: true,
    user_id: 1,
    estimated_time: 120
  },
  {
    title: "Creative Block-Breaking System",
    description: "A toolkit of techniques and practices to overcome creative blocks, generate fresh ideas, and maintain creative momentum in your work.\n\nPriority: medium\n\nEstimated Time: 30-60 minutes per session\n\nSteps:\n1. Identify the specific type of creative block you're experiencing\n2. Select appropriate techniques from your block-breaking toolkit\n3. Change your environment or perspective intentionally\n4. Implement constraints to spark creative problem-solving\n5. Use structured ideation techniques (SCAMPER, random stimulus, etc.)\n6. Engage in physical movement to shift mental patterns\n7. Seek inspiration from unrelated domains or sources\n8. Capture and build upon initial ideas without judgment\n\nTags: creativity, innovation, problem solving, ideas",
    category: "work",
    priority: "medium",
    steps: ["Identify the specific type of creative block you're experiencing", "Select appropriate techniques from your block-breaking toolkit", "Change your environment or perspective intentionally", "Implement constraints to spark creative problem-solving", "Use structured ideation techniques (SCAMPER, random stimulus, etc.)", "Engage in physical movement to shift mental patterns", "Seek inspiration from unrelated domains or sources", "Capture and build upon initial ideas without judgment"],
    tags: ["creativity", "innovation", "problem solving", "ideas"],
    is_public: true,
    user_id: 1,
    estimated_time: 45
  },
  {
    title: "Business Networking Strategy",
    description: "A systematic approach to building and maintaining a professional network that creates opportunities, provides support, and advances your career goals.\n\nPriority: high\n\nEstimated Time: 90 minutes (planning) + ongoing implementation\n\nSteps:\n1. Define your networking goals and target connections\n2. Create an inventory of your current network and identify gaps\n3. Research relevant industry events and professional groups\n4. Develop your professional introduction and key messaging\n5. Create a system for managing contact information and interactions\n6. Establish a regular outreach and nurturing schedule\n7. Develop a content sharing and engagement strategy\n8. Set up a process for regular network analysis and expansion\n\nTags: networking, career development, professional relationships, communication",
    category: "work",
    priority: "high",
    steps: ["Define your networking goals and target connections", "Create an inventory of your current network and identify gaps", "Research relevant industry events and professional groups", "Develop your professional introduction and key messaging", "Create a system for managing contact information and interactions", "Establish a regular outreach and nurturing schedule", "Develop a content sharing and engagement strategy", "Set up a process for regular network analysis and expansion"],
    tags: ["networking", "career development", "professional relationships", "communication"],
    is_public: true,
    user_id: 1,
    estimated_time: 90
  },
  {
    title: "Productive Commute System",
    description: "A structured approach to making your daily commute more valuable through learning, planning, and mindfulness practices.\n\nPriority: medium\n\nEstimated Time: 30 minutes (setup) + daily commute time\n\nSteps:\n1. Audit your current commute time, mode, and experience\n2. Define goals for your commute time (learning, planning, relaxation)\n3. Curate appropriate content and tools for different purposes\n4. Create themed days for different activities\n5. Set up equipment and subscriptions for easy access\n6. Establish transition rituals between commute and destination\n7. Implement a method for capturing ideas and insights\n8. Create a regular review and adjustment process\n\nTags: commuting, productivity, time management, learning",
    category: "general",
    priority: "medium",
    steps: ["Audit your current commute time, mode, and experience", "Define goals for your commute time (learning, planning, relaxation)", "Curate appropriate content and tools for different purposes", "Create themed days for different activities", "Set up equipment and subscriptions for easy access", "Establish transition rituals between commute and destination", "Implement a method for capturing ideas and insights", "Create a regular review and adjustment process"],
    tags: ["commuting", "productivity", "time management", "learning"],
    is_public: true,
    user_id: 1,
    estimated_time: 30
  },
  {
    title: "Personal Branding Framework",
    description: "A systematic approach to defining, building, and managing your professional reputation and visibility to support your career goals.\n\nPriority: high\n\nEstimated Time: 180 minutes (initial setup) + ongoing maintenance\n\nSteps:\n1. Define your professional identity, values, and unique strengths\n2. Identify your target audience and their needs/interests\n3. Craft your core messaging and professional narrative\n4. Audit and optimize your online presence across platforms\n5. Create a content strategy aligned with your expertise\n6. Develop a consistent visual and communication style\n7. Establish a visibility plan for relevant channels\n8. Implement a system for managing and evolving your brand\n\nTags: personal branding, career development, professional reputation, marketing",
    category: "work",
    priority: "high",
    steps: ["Define your professional identity, values, and unique strengths", "Identify your target audience and their needs/interests", "Craft your core messaging and professional narrative", "Audit and optimize your online presence across platforms", "Create a content strategy aligned with your expertise", "Develop a consistent visual and communication style", "Establish a visibility plan for relevant channels", "Implement a system for managing and evolving your brand"],
    tags: ["personal branding", "career development", "professional reputation", "marketing"],
    is_public: true,
    user_id: 1,
    estimated_time: 180
  },
  {
    title: "Self-Care System Design",
    description: "A comprehensive approach to prioritizing and integrating physical, mental, and emotional well-being practices into your daily life.\n\nPriority: high\n\nEstimated Time: 90 minutes (planning) + daily implementation\n\nSteps:\n1. Assess your current well-being across key dimensions\n2. Identify priority areas for improvement or maintenance\n3. Create a menu of self-care activities for different needs\n4. Develop daily, weekly, and monthly self-care rituals\n5. Integrate self-care seamlessly into existing routines\n6. Set up environmental triggers and reminders\n7. Create a self-monitoring system for early warning signs\n8. Establish a regular review and adjustment process\n\nTags: self-care, wellbeing, mental health, balance",
    category: "health",
    priority: "high",
    steps: ["Assess your current well-being across key dimensions", "Identify priority areas for improvement or maintenance", "Create a menu of self-care activities for different needs", "Develop daily, weekly, and monthly self-care rituals", "Integrate self-care seamlessly into existing routines", "Set up environmental triggers and reminders", "Create a self-monitoring system for early warning signs", "Establish a regular review and adjustment process"],
    tags: ["self-care", "wellbeing", "mental health", "balance"],
    is_public: true,
    user_id: 1,
    estimated_time: 90
  },
  {
    title: "Idea Capture and Development System",
    description: "A streamlined process for capturing, evaluating, and developing ideas that prevents valuable insights from being lost and turns promising concepts into action.\n\nPriority: medium\n\nEstimated Time: 60 minutes (setup) + ongoing implementation\n\nSteps:\n1. Create a frictionless capture system that's always accessible\n2. Establish a regular processing ritual for new ideas\n3. Develop evaluation criteria for different types of ideas\n4. Create categories and storage for ideas by domain\n5. Implement a development process for promising concepts\n6. Set up idea combination and cross-pollination practices\n7. Create a system for revisiting and refreshing old ideas\n8. Establish feedback channels for testing and refining concepts\n\nTags: ideas, creativity, innovation, productivity",
    category: "general",
    priority: "medium",
    steps: ["Create a frictionless capture system that's always accessible", "Establish a regular processing ritual for new ideas", "Develop evaluation criteria for different types of ideas", "Create categories and storage for ideas by domain", "Implement a development process for promising concepts", "Set up idea combination and cross-pollination practices", "Create a system for revisiting and refreshing old ideas", "Establish feedback channels for testing and refining concepts"],
    tags: ["ideas", "creativity", "innovation", "productivity"],
    is_public: true,
    user_id: 1,
    estimated_time: 60
  },
  {
    title: "Medical Information Management",
    description: "A comprehensive system for organizing healthcare information, coordinating care, and managing health conditions for yourself and family members.\n\nPriority: high\n\nEstimated Time: 180 minutes (setup) + ongoing maintenance\n\nSteps:\n1. Gather all medical records, test results, and health histories\n2. Create a consolidated health profile for each family member\n3. Develop a system for tracking medications and supplements\n4. Create a calendar for appointments and preventive care\n5. Set up secure storage for medical documents and information\n6. Establish a system for questions and concerns between visits\n7. Create an emergency medical information protocol\n8. Implement a regular health information review process\n\nTags: health records, medical care, healthcare, organization",
    category: "health",
    priority: "high",
    steps: ["Gather all medical records, test results, and health histories", "Create a consolidated health profile for each family member", "Develop a system for tracking medications and supplements", "Create a calendar for appointments and preventive care", "Set up secure storage for medical documents and information", "Establish a system for questions and concerns between visits", "Create an emergency medical information protocol", "Implement a regular health information review process"],
    tags: ["health records", "medical care", "healthcare", "organization"],
    is_public: true,
    user_id: 1,
    estimated_time: 180
  },
  {
    title: "Sustainable Living Implementation",
    description: "A practical framework for incorporating environmentally sustainable practices into your daily life, reducing your ecological footprint without overwhelming lifestyle changes.\n\nPriority: medium\n\nEstimated Time: 120 minutes (planning) + ongoing implementation\n\nSteps:\n1. Audit your current environmental impact across key areas\n2. Identify high-impact changes aligned with your values\n3. Create a phased implementation plan by category\n4. Establish new sustainable routines and habits\n5. Research and select eco-friendly product alternatives\n6. Set up systems for reducing waste and energy use\n7. Join communities for support and additional ideas\n8. Create a progress tracking and celebration system\n\nTags: sustainability, eco-friendly, environmental, lifestyle",
    category: "personal",
    priority: "medium",
    steps: ["Audit your current environmental impact across key areas", "Identify high-impact changes aligned with your values", "Create a phased implementation plan by category", "Establish new sustainable routines and habits", "Research and select eco-friendly product alternatives", "Set up systems for reducing waste and energy use", "Join communities for support and additional ideas", "Create a progress tracking and celebration system"],
    tags: ["sustainability", "eco-friendly", "environmental", "lifestyle"],
    is_public: true,
    user_id: 1,
    estimated_time: 120
  },
  {
    title: "Constructive Conflict Resolution",
    description: "A structured approach to addressing and resolving conflicts in a way that strengthens relationships, finds optimal solutions, and prevents future issues.\n\nPriority: high\n\nEstimated Time: 90 minutes (learning) + situation-based application\n\nSteps:\n1. Recognize conflict signals early and respond proactively\n2. Create the right conditions for productive discussion\n3. Use active listening to understand all perspectives\n4. Separate people from problems and focus on interests\n5. Generate multiple solution options collaboratively\n6. Evaluate options against objective criteria\n7. Develop implementation plans with clear agreements\n8. Establish follow-up and relationship repair processes\n\nTags: conflict resolution, communication, relationships, problem solving",
    category: "personal",
    priority: "high",
    steps: ["Recognize conflict signals early and respond proactively", "Create the right conditions for productive discussion", "Use active listening to understand all perspectives", "Separate people from problems and focus on interests", "Generate multiple solution options collaboratively", "Evaluate options against objective criteria", "Develop implementation plans with clear agreements", "Establish follow-up and relationship repair processes"],
    tags: ["conflict resolution", "communication", "relationships", "problem solving"],
    is_public: true,
    user_id: 1,
    estimated_time: 90
  },
  {
    title: "College Application Management",
    description: "A comprehensive system for organizing the college application process, meeting deadlines, and creating compelling applications that showcase your strengths.\n\nPriority: high\n\nEstimated Time: 180 minutes (setup) + ongoing implementation\n\nSteps:\n1. Research and create a list of target schools with requirements\n2. Develop a master timeline with all critical deadlines\n3. Create a document management system for transcripts and records\n4. Establish a process for requesting and tracking recommendations\n5. Develop a system for drafting and refining application essays\n6. Create a financial aid application tracking system\n7. Implement a decision matrix for evaluating acceptances\n8. Set up a communication log for interactions with schools\n\nTags: college applications, education, organization, planning",
    category: "education",
    priority: "high",
    steps: ["Research and create a list of target schools with requirements", "Develop a master timeline with all critical deadlines", "Create a document management system for transcripts and records", "Establish a process for requesting and tracking recommendations", "Develop a system for drafting and refining application essays", "Create a financial aid application tracking system", "Implement a decision matrix for evaluating acceptances", "Set up a communication log for interactions with schools"],
    tags: ["college applications", "education", "organization", "planning"],
    is_public: true,
    user_id: 1,
    estimated_time: 180
  },
  {
    title: "Life Vision and Values Clarification",
    description: "A reflective process for defining your core values, creating a compelling life vision, and ensuring your daily actions align with what matters most to you.\n\nPriority: high\n\nEstimated Time: 240 minutes (initial process) + quarterly reviews\n\nSteps:\n1. Conduct values discovery exercises to identify core principles\n2. Create a prioritized list of your most essential values\n3. Develop detailed descriptions of how each value manifests\n4. Craft a compelling vision for different life domains\n5. Assess current reality against your values and vision\n6. Identify key areas for alignment and adjustment\n7. Create specific action plans to bring life into alignment\n8. Establish regular review and refinement practices\n\nTags: values, vision, purpose, personal development",
    category: "personal",
    priority: "high",
    steps: ["Conduct values discovery exercises to identify core principles", "Create a prioritized list of your most essential values", "Develop detailed descriptions of how each value manifests", "Craft a compelling vision for different life domains", "Assess current reality against your values and vision", "Identify key areas for alignment and adjustment", "Create specific action plans to bring life into alignment", "Establish regular review and refinement practices"],
    tags: ["values", "vision", "purpose", "personal development"],
    is_public: true,
    user_id: 1,
    estimated_time: 240
  },
  {
    title: "Effective Scheduling System",
    description: "A comprehensive approach to managing your calendar that protects priorities, reduces scheduling stress, and creates a sustainable rhythm for work and life.\n\nPriority: high\n\nEstimated Time: 120 minutes (setup) + weekly maintenance\n\nSteps:\n1. Determine your key priorities and non-negotiable commitments\n2. Map your natural energy and focus patterns throughout the day\n3. Create schedule templates for different types of days\n4. Block protected time for important but not urgent activities\n5. Develop protocols for scheduling different types of meetings\n6. Implement buffer time between activities to reduce stress\n7. Create a consistent weekly planning and review process\n8. Establish boundaries and delegation strategies for time requests\n\nTags: scheduling, time management, calendar, productivity",
    category: "work",
    priority: "high",
    steps: ["Determine your key priorities and non-negotiable commitments", "Map your natural energy and focus patterns throughout the day", "Create schedule templates for different types of days", "Block protected time for important but not urgent activities", "Develop protocols for scheduling different types of meetings", "Implement buffer time between activities to reduce stress", "Create a consistent weekly planning and review process", "Establish boundaries and delegation strategies for time requests"],
    tags: ["scheduling", "time management", "calendar", "productivity"],
    is_public: true,
    user_id: 1,
    estimated_time: 120
  },
  {
    title: "Office Organization System",
    description: "A systematic approach to organizing your physical workspace for maximum efficiency, focus, and creativity.\n\nPriority: medium\n\nEstimated Time: 180 minutes\n\nSteps:\n1. Clear everything from your workspace temporarily\n2. Define activity zones based on work functions\n3. Establish homes for frequently used items within reach\n4. Create logical storage systems for reference materials\n5. Implement a paper management workflow\n6. Set up an effective filing system for physical documents\n7. Optimize technology setup and cable management\n8. Establish daily reset and weekly maintenance routines\n\nTags: workspace, organization, productivity, office",
    category: "work",
    priority: "medium",
    steps: ["Clear everything from your workspace temporarily", "Define activity zones based on work functions", "Establish homes for frequently used items within reach", "Create logical storage systems for reference materials", "Implement a paper management workflow", "Set up an effective filing system for physical documents", "Optimize technology setup and cable management", "Establish daily reset and weekly maintenance routines"],
    tags: ["workspace", "organization", "productivity", "office"],
    is_public: true,
    user_id: 1,
    estimated_time: 180
  },
  {
    title: "Relocation Planning System",
    description: "A comprehensive framework for planning and executing a move to a new location with minimal stress and maximum organization.\n\nPriority: high\n\nEstimated Time: 180 minutes (planning) + implementation throughout move\n\nSteps:\n1. Create a master timeline working backward from moving day\n2. Develop a comprehensive moving budget with all expenses\n3. Research and select service providers (movers, utilities, etc.)\n4. Create a systematic decluttering and downsizing process\n5. Implement an efficient packing system with inventory\n6. Develop a communication plan for address changes\n7. Create a first-week essentials plan for the new location\n8. Set up a documentation system for all moving-related information\n\nTags: moving, relocation, organization, planning",
    category: "general",
    priority: "high",
    steps: ["Create a master timeline working backward from moving day", "Develop a comprehensive moving budget with all expenses", "Research and select service providers (movers, utilities, etc.)", "Create a systematic decluttering and downsizing process", "Implement an efficient packing system with inventory", "Develop a communication plan for address changes", "Create a first-week essentials plan for the new location", "Set up a documentation system for all moving-related information"],
    tags: ["moving", "relocation", "organization", "planning"],
    is_public: true,
    user_id: 1,
    estimated_time: 180
  },
  {
    title: "Goal Achievement System",
    description: "A structured framework for setting meaningful goals, developing effective action plans, and consistently executing to achieve desired outcomes.\n\nPriority: high\n\nEstimated Time: 180 minutes (planning) + ongoing implementation\n\nSteps:\n1. Clarify your vision and outcomes across life domains\n2. Develop specific, measurable goals with clear success criteria\n3. Break goals down into milestone achievements\n4. Create detailed action plans with next steps\n5. Implement a weekly and daily planning system\n6. Establish accountability mechanisms and support\n7. Develop a progress tracking and reflection process\n8. Create a system for obstacles and adjustments\n\nTags: goals, achievement, planning, productivity",
    category: "personal",
    priority: "high",
    steps: ["Clarify your vision and outcomes across life domains", "Develop specific, measurable goals with clear success criteria", "Break goals down into milestone achievements", "Create detailed action plans with next steps", "Implement a weekly and daily planning system", "Establish accountability mechanisms and support", "Develop a progress tracking and reflection process", "Create a system for obstacles and adjustments"],
    tags: ["goals", "achievement", "planning", "productivity"],
    is_public: true,
    user_id: 1,
    estimated_time: 180
  },
  {
    title: "Grocery Shopping System",
    description: "A streamlined approach to meal planning, grocery shopping, and food management that saves time, reduces waste, and supports healthy eating habits.\n\nPriority: medium\n\nEstimated Time: 60 minutes (setup) + weekly implementation\n\nSteps:\n1. Create a master list of frequently purchased items\n2. Develop a digital or physical pantry inventory system\n3. Establish a consistent meal planning routine\n4. Generate grocery lists organized by store layout\n5. Implement strategies for efficient shopping trips\n6. Set up smart food storage for maximum freshness\n7. Create a system for tracking perishable items\n8. Establish regular pantry and refrigerator cleanout routines\n\nTags: grocery shopping, meal planning, food management, organization",
    category: "home",
    priority: "medium",
    steps: ["Create a master list of frequently purchased items", "Develop a digital or physical pantry inventory system", "Establish a consistent meal planning routine", "Generate grocery lists organized by store layout", "Implement strategies for efficient shopping trips", "Set up smart food storage for maximum freshness", "Create a system for tracking perishable items", "Establish regular pantry and refrigerator cleanout routines"],
    tags: ["grocery shopping", "meal planning", "food management", "organization"],
    is_public: true,
    user_id: 1,
    estimated_time: 60
  },
  {
    title: "Mindful Eating Practice",
    description: "A systematic approach to developing more mindful, intentional eating habits that improve nutrition, digestion, and relationship with food.\n\nPriority: medium\n\nEstimated Time: 30 minutes (planning) + implementation with each meal\n\nSteps:\n1. Create a pre-meal awareness ritual to transition mindfully\n2. Implement techniques to slow down eating pace\n3. Develop sensory awareness practices while eating\n4. Establish a consistent eating environment without distractions\n5. Create hunger and fullness awareness practices\n6. Implement a gratitude practice for food and nourishment\n7. Develop mindful approaches to challenging food situations\n8. Establish a regular reflection practice on eating patterns\n\nTags: mindful eating, nutrition, health, mindfulness",
    category: "health",
    priority: "medium",
    steps: ["Create a pre-meal awareness ritual to transition mindfully", "Implement techniques to slow down eating pace", "Develop sensory awareness practices while eating", "Establish a consistent eating environment without distractions", "Create hunger and fullness awareness practices", "Implement a gratitude practice for food and nourishment", "Develop mindful approaches to challenging food situations", "Establish a regular reflection practice on eating patterns"],
    tags: ["mindful eating", "nutrition", "health", "mindfulness"],
    is_public: true,
    user_id: 1,
    estimated_time: 30
  },
  {
    title: "Professional Conference Strategy",
    description: "A systematic approach to maximizing the value of professional conferences through thoughtful preparation, strategic networking, and effective follow-up.\n\nPriority: medium\n\nEstimated Time: 180 minutes (before and after conference)\n\nSteps:\n1. Research the conference program and attendees thoroughly\n2. Set specific goals for learning and connections\n3. Create a personalized agenda prioritizing high-value sessions\n4. Prepare your introduction and key talking points\n5. Implement effective note-taking and information capture\n6. Develop a strategic approach to networking events\n7. Create a system for exchanging and logging contact information\n8. Establish a post-conference processing and follow-up routine\n\nTags: conferences, networking, professional development, learning",
    category: "work",
    priority: "medium",
    steps: ["Research the conference program and attendees thoroughly", "Set specific goals for learning and connections", "Create a personalized agenda prioritizing high-value sessions", "Prepare your introduction and key talking points", "Implement effective note-taking and information capture", "Develop a strategic approach to networking events", "Create a system for exchanging and logging contact information", "Establish a post-conference processing and follow-up routine"],
    tags: ["conferences", "networking", "professional development", "learning"],
    is_public: true,
    user_id: 1,
    estimated_time: 180
  },
  {
    title: "Healthy Sleep Routine",
    description: "A comprehensive approach to optimizing your sleep environment, habits, and routines for better sleep quality and overall health.\n\nPriority: high\n\nEstimated Time: 60 minutes (setup) + daily implementation\n\nSteps:\n1. Analyze your current sleep patterns and challenges\n2. Optimize your bedroom environment (temperature, light, sound)\n3. Establish consistent sleep and wake times\n4. Create a calming pre-sleep routine (30-60 minutes)\n5. Implement daytime habits that support good sleep\n6. Develop protocols for managing sleep disruptors\n7. Create a morning routine that reinforces your sleep cycle\n8. Set up a system for tracking sleep quality and adjustments\n\nTags: sleep, health, routines, wellbeing",
    category: "health",
    priority: "high",
    steps: ["Analyze your current sleep patterns and challenges", "Optimize your bedroom environment (temperature, light, sound)", "Establish consistent sleep and wake times", "Create a calming pre-sleep routine (30-60 minutes)", "Implement daytime habits that support good sleep", "Develop protocols for managing sleep disruptors", "Create a morning routine that reinforces your sleep cycle", "Set up a system for tracking sleep quality and adjustments"],
    tags: ["sleep", "health", "routines", "wellbeing"],
    is_public: true,
    user_id: 1,
    estimated_time: 60
  }
];

// Function to insert templates directly into the database
async function insertTemplates() {
  console.log(`Starting insertion of ${productivityTemplates.length} productivity templates...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  try {
    // Connect to the database
    const client = await pool.connect();
    console.log("Connected to database successfully.");
    
    // Process templates in batches
    const batchSize = 5;
    
    for (let i = 0; i < productivityTemplates.length; i += batchSize) {
      const batch = productivityTemplates.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(productivityTemplates.length/batchSize)}`);
      
      for (const template of batch) {
        try {
          // Insert the template into the database
          const result = await client.query(
            `INSERT INTO task_templates 
             (title, description, priority, category, estimated_time, steps, tags, is_public, user_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING id, title`,
            [
              template.title,
              template.description,
              template.priority,
              template.category,
              template.estimated_time,
              template.steps,
              template.tags,
              template.is_public,
              template.user_id
            ]
          );
          
          console.log(`Created template ID ${result.rows[0].id}: ${result.rows[0].title}`);
          successCount++;
        } catch (error) {
          console.error(`Error inserting template "${template.title}":`, error.message);
          errorCount++;
        }
      }
      
      // Small delay between batches
      if (i + batchSize < productivityTemplates.length) {
        console.log("Waiting 500ms before processing next batch...");
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Release the client back to the pool
    client.release();
    
    console.log(`Template insertion process completed.`);
    console.log(`Successfully created ${successCount} templates.`);
    console.log(`Failed to create ${errorCount} templates.`);
    
  } catch (error) {
    console.error("Error connecting to database:", error);
  } finally {
    // End the pool
    await pool.end();
    console.log("Database pool closed.");
  }
}

// Run the script
insertTemplates()
  .then(() => {
    console.log("All done!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error in main execution:", error);
    process.exit(1);
  });