import { TaskWithStringDates } from "@shared/schema";
import { generateChatCompletion } from "./openai-service";

// Revenue model information
interface PricingTier {
  name: string;
  price: number;  // Monthly price in USD
  features: string[];
  referralCommission: number; // Percentage of the subscription Appmo receives
}

// Taxonomy of AI applications by category with pricing information
const AI_APPLICATIONS = [
  {
    id: "business-tools",
    name: "Business & Productivity Tools",
    applications: [
      {
        id: "zoom",
        name: "Zoom",
        description: "Video conferencing solution with AI-enhanced features and automatic integration",
        url: "https://zoom.us/",
        useCases: ["meetings", "video conferencing", "webinars", "team collaboration", "remote work"],
        pricingTiers: [
          {
            name: "Free",
            price: 0,
            features: ["40-minute limit on group meetings", "Basic features", "100 participants"],
            referralCommission: 0
          },
          {
            name: "Pro",
            price: 14.99,
            features: ["30-hour meeting duration", "Social media streaming", "1GB cloud recording"],
            referralCommission: 25
          },
          {
            name: "Business",
            price: 19.99,
            features: ["300 participants", "Managed domains", "Company branding", "Recording transcripts"],
            referralCommission: 30
          }
        ]
      },
      {
        id: "salesforce",
        name: "Salesforce",
        description: "Customer relationship management platform with AI capabilities for sales automation",
        url: "https://www.salesforce.com/",
        useCases: ["sales", "customer management", "lead tracking", "analytics", "business intelligence"],
        pricingTiers: [
          {
            name: "Essentials",
            price: 25,
            features: ["Account management", "Lead management", "Basic sales automation"],
            referralCommission: 20
          },
          {
            name: "Professional",
            price: 75,
            features: ["Complete sales solution", "Forecasting", "Collaborative forecasting"],
            referralCommission: 25
          },
          {
            name: "Enterprise",
            price: 150,
            features: ["Advanced sales automation", "AI-powered insights", "Territory management"],
            referralCommission: 30
          }
        ]
      },
      {
        id: "hubspot",
        name: "HubSpot",
        description: "Marketing, sales, and service software with powerful automation and AI features",
        url: "https://www.hubspot.com/",
        useCases: ["marketing", "sales", "customer service", "CRM", "automation", "lead generation"],
        pricingTiers: [
          {
            name: "Starter",
            price: 45,
            features: ["Contact management", "Deal pipeline", "Task automation"],
            referralCommission: 20
          },
          {
            name: "Professional",
            price: 800,
            features: ["Marketing automation", "Smart content", "Campaign management"],
            referralCommission: 25
          },
          {
            name: "Enterprise",
            price: 3600,
            features: ["Advanced reporting", "Predictive lead scoring", "Custom event triggers"],
            referralCommission: 30
          }
        ]
      },
      {
        id: "slack",
        name: "Slack",
        description: "Business communication platform with AI integrations for team collaboration",
        url: "https://slack.com/",
        useCases: ["team chat", "collaboration", "file sharing", "integrations", "remote work"],
        pricingTiers: [
          {
            name: "Free",
            price: 0,
            features: ["10K searchable messages", "10 integrations", "1-to-1 video calls"],
            referralCommission: 0
          },
          {
            name: "Pro",
            price: 7.25,
            features: ["Unlimited message history", "Unlimited integrations", "Group video calls"],
            referralCommission: 20
          },
          {
            name: "Business+",
            price: 12.50,
            features: ["Advanced identity management", "Data exports", "24/7 support"],
            referralCommission: 25
          }
        ]
      },
      {
        id: "microsoft-teams",
        name: "Microsoft Teams",
        description: "Collaboration platform with video meetings, chat, and application integration",
        url: "https://www.microsoft.com/microsoft-teams/",
        useCases: ["team chat", "video conferencing", "file collaboration", "business communication"],
        pricingTiers: [
          {
            name: "Free",
            price: 0,
            features: ["Chat and collaboration", "100 participants meetings", "5GB cloud storage"],
            referralCommission: 0
          },
          {
            name: "Microsoft 365 Business Basic",
            price: 6,
            features: ["All free features", "Meeting recordings", "50GB mailbox"],
            referralCommission: 20
          },
          {
            name: "Microsoft 365 Business Standard",
            price: 12.50,
            features: ["Desktop Office apps", "Premium features", "Webinar hosting"],
            referralCommission: 25
          }
        ]
      },
      {
        id: "stripe",
        name: "Stripe",
        description: "Payment processing platform with AI fraud detection and revenue optimization",
        url: "https://stripe.com/",
        useCases: ["payments", "subscriptions", "invoicing", "financial services", "e-commerce"],
        pricingTiers: [
          {
            name: "Integrated",
            price: 0,
            features: ["2.9% + 30¢ per transaction", "Basic reporting", "Standard support"],
            referralCommission: 0.5
          },
          {
            name: "Customized",
            price: 0,
            features: ["Volume discounts", "Advanced reporting", "24/7 support"],
            referralCommission: 0.7
          },
          {
            name: "Enterprise",
            price: 0,
            features: ["Custom rates", "Dedicated account manager", "Enterprise features"],
            referralCommission: 1
          }
        ]
      },
      {
        id: "loom",
        name: "Loom",
        description: "Video messaging tool for work with AI transcription and summarization",
        url: "https://www.loom.com/",
        useCases: ["video messaging", "screen recording", "team updates", "tutorials", "feedback"],
        pricingTiers: [
          {
            name: "Starter",
            price: 0,
            features: ["25 videos per person", "5-minute video limit", "Basic editing tools"],
            referralCommission: 0
          },
          {
            name: "Business",
            price: 8,
            features: ["Unlimited videos", "Custom branding", "Engagement insights"],
            referralCommission: 20
          },
          {
            name: "Enterprise",
            price: 14,
            features: ["SSO", "Advanced security", "Dedicated support", "Advanced analytics"],
            referralCommission: 25
          }
        ]
      }
    ]
  },
  {
    id: "productivity-tools",
    name: "Productivity & Integration Tools",
    applications: [
      {
        id: "greenhouse",
        name: "Greenhouse",
        description: "Hiring software with AI-powered candidate screening and matching",
        url: "https://www.greenhouse.io/",
        useCases: ["recruiting", "hiring", "applicant tracking", "onboarding", "HR"],
        pricingTiers: [
          {
            name: "Essential",
            price: 0,
            features: ["Basic ATS", "Job posting", "Candidate tracking"],
            referralCommission: 20
          },
          {
            name: "Advance",
            price: 0,
            features: ["Advanced interviewing tools", "Custom pipelines", "CRM functionality"],
            referralCommission: 25
          },
          {
            name: "Enterprise",
            price: 0,
            features: ["Enterprise integrations", "Advanced permissions", "Custom workflows"],
            referralCommission: 30
          }
        ]
      },
      {
        id: "activecampaign",
        name: "ActiveCampaign",
        description: "Marketing automation platform with AI-driven customer experience features",
        url: "https://www.activecampaign.com/",
        useCases: ["email marketing", "marketing automation", "CRM", "sales automation"],
        pricingTiers: [
          {
            name: "Lite",
            price: 29,
            features: ["Email marketing", "Marketing automation", "500 contacts"],
            referralCommission: 20
          },
          {
            name: "Plus",
            price: 49,
            features: ["CRM with sales automation", "Contact scoring", "Landing pages"],
            referralCommission: 25
          },
          {
            name: "Professional",
            price: 149,
            features: ["Machine learning", "Split automation", "Predictive sending"],
            referralCommission: 30
          }
        ]
      },
      {
        id: "gong",
        name: "Gong",
        description: "Revenue intelligence platform with AI conversation analysis for sales teams",
        url: "https://www.gong.io/",
        useCases: ["sales intelligence", "call recording", "conversation analytics", "coaching"],
        pricingTiers: [
          {
            name: "Essential",
            price: 0,
            features: ["Call recording", "Basic analytics", "Integration with CRM"],
            referralCommission: 20
          },
          {
            name: "Business",
            price: 0,
            features: ["Advanced analytics", "Coaching capabilities", "Deal intelligence"],
            referralCommission: 25
          },
          {
            name: "Premium",
            price: 0,
            features: ["AI-powered insights", "Custom reporting", "Advanced integrations"],
            referralCommission: 30
          }
        ]
      },
      {
        id: "typeform",
        name: "Typeform",
        description: "Interactive forms and surveys with AI-powered analytics and personalization",
        url: "https://www.typeform.com/",
        useCases: ["forms", "surveys", "quizzes", "lead generation", "data collection"],
        pricingTiers: [
          {
            name: "Basic",
            price: 25,
            features: ["10 questions per form", "100 responses per month", "Basic logic jumps"],
            referralCommission: 20
          },
          {
            name: "Plus",
            price: 50,
            features: ["Unlimited questions", "1,000 responses per month", "Hidden fields"],
            referralCommission: 25
          },
          {
            name: "Business",
            price: 83,
            features: ["10,000 responses per month", "Payment field", "Priority support"],
            referralCommission: 30
          }
        ]
      },
      {
        id: "zapier",
        name: "Zapier",
        description: "Workflow automation platform with AI suggestions and integration capabilities",
        url: "https://zapier.com/",
        useCases: ["automation", "workflow", "app integration", "productivity", "business processes"],
        pricingTiers: [
          {
            name: "Free",
            price: 0,
            features: ["5 Zaps", "100 tasks/month", "Single-step Zaps"],
            referralCommission: 0
          },
          {
            name: "Starter",
            price: 19.99,
            features: ["20 Zaps", "750 tasks/month", "Multi-step Zaps"],
            referralCommission: 20
          },
          {
            name: "Professional",
            price: 49,
            features: ["Unlimited Zaps", "2,000 tasks/month", "Custom logic", "Paths"],
            referralCommission: 25
          }
        ]
      },
      {
        id: "make",
        name: "Make",
        description: "Visual automation platform with powerful workflow design capabilities",
        url: "https://www.make.com/",
        useCases: ["workflow automation", "app integration", "business process automation"],
        pricingTiers: [
          {
            name: "Free",
            price: 0,
            features: ["1,000 operations", "2 active scenarios", "5-minute interval"],
            referralCommission: 0
          },
          {
            name: "Core",
            price: 9,
            features: ["10,000 operations", "3 active scenarios", "1-minute interval"],
            referralCommission: 20
          },
          {
            name: "Pro",
            price: 16,
            features: ["10,000 operations", "10 active scenarios", "1-minute interval"],
            referralCommission: 25
          }
        ]
      }
    ]
  },
  {
    id: "payment-analytics",
    name: "Payment & Analytics Solutions",
    applications: [
      {
        id: "paypal",
        name: "PayPal",
        description: "Online payment system with AI fraud detection and business management tools",
        url: "https://www.paypal.com/",
        useCases: ["payments", "money transfers", "business transactions", "e-commerce"],
        pricingTiers: [
          {
            name: "Personal",
            price: 0,
            features: ["Send and receive money", "Shop online", "Mobile app access"],
            referralCommission: 0
          },
          {
            name: "Business",
            price: 0,
            features: ["Accept payments", "Invoicing", "Basic reporting", "2.9% + 30¢ per transaction"],
            referralCommission: 0.5
          },
          {
            name: "Enterprise",
            price: 0,
            features: ["Customized solutions", "Dedicated support", "Enhanced security"],
            referralCommission: 0.7
          }
        ]
      },
      {
        id: "google-analytics",
        name: "Google Analytics",
        description: "Web analytics service with AI-powered insights and traffic analysis",
        url: "https://analytics.google.com/",
        useCases: ["web analytics", "user behavior", "conversion tracking", "marketing attribution"],
        pricingTiers: [
          {
            name: "Free",
            price: 0,
            features: ["Standard reports", "Data collection", "Basic analysis"],
            referralCommission: 0
          },
          {
            name: "Google Analytics 360",
            price: 150000,
            features: ["Advanced analysis", "Unsampled reports", "Data-driven attribution"],
            referralCommission: 10
          }
        ]
      },
      {
        id: "meta-pixel",
        name: "Meta Pixel",
        description: "Analytics tool for tracking Facebook ad conversions and website activity",
        url: "https://www.facebook.com/business/tools/meta-pixel",
        useCases: ["ad tracking", "conversion optimization", "audience targeting", "retargeting"],
        pricingTiers: [
          {
            name: "Standard",
            price: 0,
            features: ["Conversion tracking", "Audience creation", "Event tracking"],
            referralCommission: 0
          },
          {
            name: "Advanced Matching",
            price: 0,
            features: ["Enhanced customer matching", "Better attribution", "Improved ROI"],
            referralCommission: 0
          }
        ]
      }
    ]
  },
  {
    id: "writing-tools",
    name: "Writing & Content",
    applications: [
      {
        id: "grammarly",
        name: "Grammarly",
        description: "AI-powered writing assistant for grammar and style improvements",
        url: "https://www.grammarly.com/",
        useCases: ["writing", "editing", "proofreading", "content creation", "reports", "documentation"],
        pricingTiers: [
          {
            name: "Free",
            price: 0,
            features: ["Basic Grammar Checks", "Spelling Corrections"],
            referralCommission: 0
          },
          {
            name: "Premium",
            price: 12.99,
            features: ["Advanced Grammar Checks", "Clarity Suggestions", "Tone Adjustments", "Plagiarism Detection"],
            referralCommission: 20
          },
          {
            name: "Business",
            price: 25.99,
            features: ["All Premium Features", "Admin Panel", "Team Analytics", "Priority Support"],
            referralCommission: 30
          }
        ]
      },
      {
        id: "copy-ai",
        name: "Copy.ai",
        description: "Generate marketing copy, blog posts, and creative content",
        url: "https://www.copy.ai/",
        useCases: ["marketing", "copywriting", "blog posts", "social media", "ads", "content creation"]
      },
      {
        id: "jasper",
        name: "Jasper",
        description: "AI content platform for marketing teams and creators",
        url: "https://www.jasper.ai/",
        useCases: ["marketing", "content creation", "blog posts", "reports", "social media"]
      }
    ]
  },
  {
    id: "developer-tools",
    name: "Developer Tools",
    applications: [
      {
        id: "github-copilot",
        name: "GitHub Copilot",
        description: "AI pair programmer that helps write and understand code",
        url: "https://github.com/features/copilot",
        useCases: ["coding", "programming", "development", "software engineering"]
      },
      {
        id: "calendly-api",
        name: "Calendly APIs",
        description: "Scheduling APIs for custom integrations and workflow automation",
        url: "https://developer.calendly.com/",
        useCases: ["scheduling", "integration", "workflow automation", "custom applications"],
        pricingTiers: [
          {
            name: "Basic",
            price: 0,
            features: ["REST API", "Basic integration", "Limited endpoints"],
            referralCommission: 0
          },
          {
            name: "Teams",
            price: 16,
            features: ["Expanded API access", "Webhook notifications", "Developer support"],
            referralCommission: 20
          },
          {
            name: "Enterprise",
            price: 0,
            features: ["Full API access", "Custom development", "Priority support"],
            referralCommission: 25
          }
        ]
      },
      {
        id: "chrome-extension",
        name: "Chrome Extension",
        description: "Browser extension for quick access to productivity tools and scheduling",
        url: "https://chrome.google.com/webstore/",
        useCases: ["browser integration", "productivity", "quick access", "workflow enhancement"],
        pricingTiers: [
          {
            name: "Free",
            price: 0,
            features: ["Basic functionality", "Bookmark integration", "Quick access"],
            referralCommission: 0
          },
          {
            name: "Premium",
            price: 4.99,
            features: ["Advanced features", "Cloud sync", "Priority support"],
            referralCommission: 20
          }
        ]
      }
    ]
  }
];

// Convert keywords to a map for faster lookups
const KEYWORD_TO_APP_MAP = new Map<string, string[]>();

// Initialize the map
function initializeKeywordMap() {
  AI_APPLICATIONS.forEach(category => {
    category.applications.forEach(app => {
      app.useCases.forEach(useCase => {
        const keywords = useCase.split(/\s+/);
        keywords.forEach(keyword => {
          keyword = keyword.toLowerCase().trim();
          if (keyword.length > 3) { // Skip very short keywords
            const appId = `${category.id}:${app.id}`;
            if (KEYWORD_TO_APP_MAP.has(keyword)) {
              KEYWORD_TO_APP_MAP.get(keyword)!.push(appId);
            } else {
              KEYWORD_TO_APP_MAP.set(keyword, [appId]);
            }
          }
        });
      });
    });
  });
}

// Initialize the keyword map
initializeKeywordMap();

// Extract keywords from task content
function extractKeywords(task: TaskWithStringDates): string[] {
  const content = `${task.title} ${task.description || ''} ${task.category}`.toLowerCase();
  
  // Simple keyword extraction (can be enhanced with NLP in the future)
  const words = content.split(/\W+/).filter(word => 
    word.length > 3 && 
    !['this', 'that', 'then', 'than', 'with', 'from', 'have', 'will'].includes(word)
  );
  
  return Array.from(new Set(words)); // Remove duplicates
}

// Find matching applications based on task keywords
function findMatchingApps(keywords: string[]): Map<string, number> {
  const appScores = new Map<string, number>();
  
  keywords.forEach(keyword => {
    const matchingApps = KEYWORD_TO_APP_MAP.get(keyword) || [];
    matchingApps.forEach(appId => {
      appScores.set(appId, (appScores.get(appId) || 0) + 1);
    });
  });
  
  return appScores;
}

// Get application details by ID
function getAppById(appId: string) {
  const [categoryId, actualAppId] = appId.split(':');
  const category = AI_APPLICATIONS.find(c => c.id === categoryId);
  if (!category) return null;
  
  const app = category.applications.find(a => a.id === actualAppId);
  if (!app) return null;
  
  return {
    ...app,
    category: category.name
  };
}

// Top AI applications using keyword matching
// Import the types for OpenAI service

export async function getTopAIApplicationsForTask(task: TaskWithStringDates, limit: number = 3): Promise<any[]> {
  // Extract keywords from task
  const keywords = extractKeywords(task);
  
  // Find matching applications and their scores
  const appScores = findMatchingApps(keywords);
  
  // Sort by score (descending)
  const sortedAppIds = Array.from(appScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
  
  // Get top N apps
  const topApps = sortedAppIds
    .slice(0, limit)
    .map(appId => getAppById(appId))
    .filter(app => app !== null); // Remove any null entries
  
  // Use enhanced AI recommendations if available (and we don't have enough keyword matches)
  if (topApps.length < limit) {
    try {
      const aiSuggestions = await getAIEnhancedRecommendations(task, limit - topApps.length);
      return [...topApps, ...aiSuggestions];
    } catch (error) {
      console.error('Error getting AI enhanced recommendations:', error);
      return topApps;
    }
  }
  
  return topApps;
}

// Use AI to generate enhanced recommendations when keyword matching isn't sufficient
async function getAIEnhancedRecommendations(task: TaskWithStringDates, limit: number): Promise<any[]> {
  try {
    // Create a list of all available applications
    const allApps = AI_APPLICATIONS.flatMap(category => 
      category.applications.map(app => ({
        id: `${category.id}:${app.id}`,
        name: app.name,
        description: app.description,
        category: category.name
      }))
    );
    
    const taskContent = `${task.title} ${task.description || ''} Category: ${task.category}`;
    
    // Prepare the prompt for the AI
    const prompt = `
I need to recommend AI applications for a user based on this task:
"${taskContent}"

Here are the available AI applications:
${allApps.map(app => `- ${app.name} (${app.category}): ${app.description}`).join('\n')}

Recommend exactly ${limit} AI applications from the list above that would be most helpful for this task.
For each recommendation, provide just the name of the app, nothing else.
Format your response as a JSON array of strings with just the app names.
`;

    // Get recommendations from AI
    const aiResponse = await generateChatCompletion(prompt);
    
    try {
      // Parse the JSON response (accounting for the response format from OpenAI/Anthropic)
      let responseContent = '';
      if (typeof aiResponse === 'string') {
        responseContent = aiResponse;
      } else if (aiResponse && typeof aiResponse === 'object' && aiResponse.content) {
        responseContent = aiResponse.content as string;
      }
      
      // Try to parse as JSON
      if (responseContent) {
        try {
          const recommendedAppNames = JSON.parse(responseContent);
          
          if (Array.isArray(recommendedAppNames)) {
            // Find the apps by name
            return recommendedAppNames
              .map(name => allApps.find(app => app.name.toLowerCase() === String(name).toLowerCase()))
              .filter(app => app !== undefined)
              .slice(0, limit);
          }
        } catch (parseError) {
          // If JSON parsing fails, try to extract app names manually
          const appNamesRegex = /"([^"]+)"/g;
          const matches = Array.from(responseContent.matchAll(appNamesRegex));
          const names = matches.map(match => match[1]);
          
          return names
            .map(name => allApps.find(app => app.name.toLowerCase() === name.toLowerCase()))
            .filter(app => app !== undefined)
            .slice(0, limit);
        }
      }
      
      // Return empty array if we couldn't parse any recommendations
      return [];
    } catch (e) {
      console.error("Error processing AI recommendations:", e);
      return [];
    }
    
    return [];
  } catch (error) {
    console.error('Error in AI-enhanced recommendations:', error);
    return [];
  }
}

// Get AI tools categories for filtering
export function getAIToolsCategories() {
  return AI_APPLICATIONS.map(category => ({
    id: category.id,
    name: category.name
  }));
}

// Get all AI tools
export function getAllAITools() {
  return AI_APPLICATIONS.map(category => ({
    id: category.id,
    name: category.name,
    applications: category.applications.map(app => ({
      id: app.id,
      name: app.name,
      description: app.description,
      url: app.url
    }))
  }));
}

// Get AI tools by category
export function getAIToolsByCategory(categoryId: string) {
  const category = AI_APPLICATIONS.find(c => c.id === categoryId);
  if (!category) return null;
  
  return {
    id: category.id,
    name: category.name,
    applications: category.applications.map(app => ({
      id: app.id,
      name: app.name,
      description: app.description,
      url: app.url
    }))
  };
}

// Get AI recommendations with pricing tiers and commission information for a task
export async function getAIRecommendations(task: TaskWithStringDates) {
  try {
    // Convert task for OpenAI processing
    const taskContent = `${task.title} ${task.description || ''} Category: ${task.category}`;
    
    // Create a prompt for the OpenAI API to analyze the task and suggest relevant AI tools
    const prompt = `
    I need to recommend AI applications with pricing tiers for a user based on this task:
    "${taskContent}"
    
    For each recommendation, provide:
    1. The name of the app
    2. A brief description of how it would help with this specific task
    3. The main category it belongs to
    4. The URL
    5. 2-3 specific features that would be relevant to this task
    6. 3 pricing tiers (Free/Basic, Premium, Enterprise) with prices and commission percentages
    
    Return exactly 3 AI applications that would be most helpful for this task.
    Format your response as a structured JSON array.
    `;
    
    // Get recommendations from AI
    const aiResponse = await generateChatCompletion(prompt);
    
    // Process the AI response
    let responseContent = '';
    if (typeof aiResponse === 'string') {
      responseContent = aiResponse;
    } else if (aiResponse && typeof aiResponse === 'object' && aiResponse.content) {
      responseContent = aiResponse.content as string;
    }
    
    // Try to extract a JSON array from the response
    const jsonMatch = responseContent.match(/\[\s*\{.*\}\s*\]/s);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[0];
      try {
        const recommendations = JSON.parse(jsonStr);
        
        // Format and enhance recommendations
        return recommendations.map((rec: any) => {
          // Ensure each recommendation has all required fields
          return {
            id: rec.id || generateAppId(rec.name),
            name: rec.name,
            description: rec.description || "AI-powered tool to enhance your workflow",
            url: rec.url || `https://www.example.com/${rec.name.toLowerCase().replace(/\s+/g, '-')}`,
            category: rec.category || "Productivity",
            useCases: rec.features || rec.useCases || ["productivity", "automation"],
            pricingTiers: rec.pricingTiers || [
              {
                name: "Free",
                price: 0,
                features: ["Basic features"],
                referralCommission: 0
              },
              {
                name: "Premium",
                price: 9.99,
                features: ["Advanced features", "Priority support"],
                referralCommission: 15
              },
              {
                name: "Enterprise",
                price: 29.99,
                features: ["All features", "Team collaboration", "Dedicated support"],
                referralCommission: 25
              }
            ]
          };
        });
      } catch (error) {
        console.error("Error parsing AI recommendation JSON:", error);
        // Fallback to keyword-based recommendations
        return getTopAIApplicationsForTask(task, 3);
      }
    } else {
      // Fallback to keyword-based recommendations if no JSON found
      return getTopAIApplicationsForTask(task, 3);
    }
  } catch (error) {
    console.error("Error in getAIRecommendations:", error);
    // Fallback to keyword-based recommendations
    return getTopAIApplicationsForTask(task, 3);
  }
}

// Helper function to generate an app ID from name
function generateAppId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}