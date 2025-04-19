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
    id: "productivity",
    name: "Productivity & Organization",
    applications: [
      {
        id: "notion-ai",
        name: "Notion AI",
        description: "AI writing assistant integrated with Notion workspace",
        url: "https://www.notion.so/product/ai",
        useCases: ["notes", "organization", "planning", "documentation", "project management"]
      },
      {
        id: "clockwise",
        name: "Clockwise",
        description: "AI calendar assistant to optimize your schedule",
        url: "https://www.getclockwise.com/",
        useCases: ["scheduling", "calendar", "meetings", "time management"]
      },
      {
        id: "timely",
        name: "Timely",
        description: "Automatic time tracking using AI to record your workday",
        url: "https://timelyapp.com/",
        useCases: ["time tracking", "productivity", "work hours", "billing"]
      }
    ]
  },
  {
    id: "research",
    name: "Research & Analysis",
    applications: [
      {
        id: "elicit",
        name: "Elicit",
        description: "AI research assistant that finds and summarizes papers",
        url: "https://elicit.org/",
        useCases: ["research", "academic", "literature review", "study", "analysis"]
      },
      {
        id: "consensus",
        name: "Consensus",
        description: "AI-powered search engine for research findings with citations",
        url: "https://consensus.app/",
        useCases: ["research", "science", "evidence", "academic", "study"]
      },
      {
        id: "scholarai",
        name: "Scholar AI",
        description: "AI research assistant for academic research and writing",
        url: "https://www.scholar.ai/",
        useCases: ["research", "academic", "papers", "citations", "study"]
      }
    ]
  },
  {
    id: "design",
    name: "Design & Creativity",
    applications: [
      {
        id: "midjourney",
        name: "Midjourney",
        description: "AI image generation tool for creating artistic visuals",
        url: "https://www.midjourney.com/",
        useCases: ["design", "art", "images", "visuals", "creative", "illustrations"]
      },
      {
        id: "adobe-firefly",
        name: "Adobe Firefly",
        description: "AI image generation integrated with Adobe Creative Cloud",
        url: "https://www.adobe.com/products/firefly.html",
        useCases: ["design", "images", "creative", "photoshop", "illustrations"]
      },
      {
        id: "canva",
        name: "Canva AI Tools",
        description: "AI design tools integrated into Canva",
        url: "https://www.canva.com/",
        useCases: ["design", "presentations", "social media", "marketing", "graphics"]
      }
    ]
  },
  {
    id: "data-analysis",
    name: "Data Analysis & Insights",
    applications: [
      {
        id: "obviously-ai",
        name: "Obviously AI",
        description: "No-code AI platform for data analysis and predictions",
        url: "https://www.obviously.ai/",
        useCases: ["data analysis", "predictions", "forecasting", "business intelligence"]
      },
      {
        id: "patterns",
        name: "Patterns",
        description: "AI-powered data analysis and visualization platform",
        url: "https://www.patterns.app/",
        useCases: ["data analysis", "visualization", "business intelligence", "reports"]
      },
      {
        id: "akkio",
        name: "Akkio",
        description: "No-code AI platform for data predictions and automation",
        url: "https://www.akkio.com/",
        useCases: ["data analysis", "predictions", "forecasting", "automation"]
      }
    ]
  },
  {
    id: "coding",
    name: "Software Development",
    applications: [
      {
        id: "github-copilot",
        name: "GitHub Copilot",
        description: "AI pair programmer that helps write and understand code",
        url: "https://github.com/features/copilot",
        useCases: ["coding", "programming", "development", "software engineering"]
      },
      {
        id: "codeium",
        name: "Codeium",
        description: "Free AI-powered code completion and generation tool",
        url: "https://codeium.com/",
        useCases: ["coding", "programming", "development", "software engineering"]
      },
      {
        id: "tabnine",
        name: "Tabnine",
        description: "AI code assistant with context-aware completions",
        url: "https://www.tabnine.com/",
        useCases: ["coding", "programming", "development", "software engineering"]
      }
    ]
  },
  {
    id: "communication",
    name: "Communication & Language",
    applications: [
      {
        id: "deepl",
        name: "DeepL",
        description: "AI-powered translation tool with natural-sounding results",
        url: "https://www.deepl.com/",
        useCases: ["translation", "languages", "international", "communication"]
      },
      {
        id: "otter-ai",
        name: "Otter.ai",
        description: "AI meeting assistant that transcribes and summarizes meetings",
        url: "https://otter.ai/",
        useCases: ["meetings", "transcription", "notes", "summaries", "calls"]
      },
      {
        id: "wordtune",
        name: "Wordtune",
        description: "AI writing companion that helps rephrase and improve text",
        url: "https://www.wordtune.com/",
        useCases: ["writing", "rephrasing", "editing", "communication"]
      }
    ]
  },
  {
    id: "finance",
    name: "Financial Tools",
    applications: [
      {
        id: "plentyai",
        name: "Plenty",
        description: "AI financial advisor for personal finance management",
        url: "https://www.plenty.ai/",
        useCases: ["finance", "budgeting", "investing", "personal finance"]
      },
      {
        id: "cleo",
        name: "Cleo",
        description: "AI assistant for personal finance and budgeting",
        url: "https://www.meetcleo.com/",
        useCases: ["budgeting", "finance", "saving", "personal finance"]
      },
      {
        id: "pricefy",
        name: "Pricefy",
        description: "AI-powered pricing optimization for businesses",
        url: "https://www.pricefy.io/",
        useCases: ["pricing", "business", "sales", "revenue"]
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
  
  return [...new Set(words)]; // Remove duplicates
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
export async function getTopAIApplicationsForTask(task: TaskWithStringDates, limit: number = 3): Promise<any[]> {
  // Extract keywords from task
  const keywords = extractKeywords(task);
  
  // Find matching applications and their scores
  const appScores = findMatchingApps(keywords);
  
  // Sort by score (descending)
  const sortedAppIds = [...appScores.entries()]
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
      // Parse the JSON response (assuming the AI returned a valid JSON array)
      const recommendedAppNames = JSON.parse(aiResponse);
      
      if (Array.isArray(recommendedAppNames)) {
        // Find the apps by name
        return recommendedAppNames
          .map(name => allApps.find(app => app.name.toLowerCase() === name.toLowerCase()))
          .filter(app => app !== undefined)
          .slice(0, limit);
      }
    } catch (e) {
      // If JSON parsing fails, try to extract app names manually
      const appNamesRegex = /"([^"]+)"/g;
      const matches = [...aiResponse.matchAll(appNamesRegex)];
      const names = matches.map(match => match[1]);
      
      return names
        .map(name => allApps.find(app => app.name.toLowerCase() === name.toLowerCase()))
        .filter(app => app !== undefined)
        .slice(0, limit);
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