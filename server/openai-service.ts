import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { TaskWithStringDates } from "@shared/schema";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

// Initialize Anthropic client if API key is available
const anthropic = process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;
// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025

/**
 * Helper function to safely parse JSON or return a fallback
 * Enhanced with better error handling and validation
 */
function safeJsonParse(jsonString: string, fallback: any) {
  try {
    // Trim any whitespace that might cause parsing issues
    const trimmedString = jsonString.trim();
    
    // Check if the string is null or empty
    if (!trimmedString) {
      console.warn("Empty JSON string provided to safeJsonParse");
      return fallback;
    }
    
    // First check if string starts and ends with curly braces (basic JSON object check)
    if (!(trimmedString.startsWith('{') && trimmedString.endsWith('}'))) {
      console.warn("JSON string does not appear to be a valid JSON object:", trimmedString.substring(0, 100) + "...");
      return fallback;
    }
    
    // Now try to parse it
    const parsed = JSON.parse(trimmedString);
    
    // Validate that it's actually an object
    if (typeof parsed !== 'object' || parsed === null) {
      console.warn("JSON parsed successfully but result is not an object:", typeof parsed);
      return fallback;
    }
    
    return parsed;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    console.error("JSON string that failed to parse (first 200 chars):", jsonString.substring(0, 200));
    return fallback;
  }
}

/**
 * Get AI generated suggestions for optimizing task management based on current tasks
 */
export async function getTaskSuggestions(tasks: TaskWithStringDates[]) {
  try {
    const taskData = tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate || "",
      priority: task.priority as "high" | "medium" | "low", // Type assertion
      category: task.category,
      completed: task.completed,
      estimatedTime: task.estimatedTime || null
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI productivity assistant that helps users manage their tasks and optimize their schedule.
          Given a list of tasks with details including due dates, priorities, and categories, provide the following:
          1. Identify any tasks that are at risk due to tight deadlines or high priorities
          2. Suggest a logical sequence of completing tasks
          3. Provide time management tips specific to the user's current task load
          4. Break down complex tasks into smaller steps
          
          Respond with JSON in this format:
          {
            "urgentTasks": [
              { "id": number, "title": string, "reason": string }
            ],
            "scheduleSuggestion": [
              { "id": number, "title": string, "suggestedTime": string }
            ],
            "timeManagementTips": [
              string
            ],
            "taskBreakdowns": [
              {
                "taskId": number,
                "taskTitle": string,
                "steps": [
                  { "title": string, "estimatedTime": number }
                ]
              }
            ]
          }`
        },
        {
          role: "user",
          content: JSON.stringify(taskData)
        }
      ],
      response_format: { type: "json_object" }
    });

    // Return the response content directly (already JSON by OpenAI)
    return response.choices[0].message.content ? 
      safeJsonParse(response.choices[0].message.content, {
        urgentTasks: [],
        scheduleSuggestion: [],
        timeManagementTips: ["Focus on one task at a time"],
        taskBreakdowns: []
      }) : 
      {
        urgentTasks: [],
        scheduleSuggestion: [],
        timeManagementTips: ["Focus on one task at a time"],
        taskBreakdowns: []
      };
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error("Failed to generate AI suggestions");
  }
}

/**
 * Generate AI reminder for a specific task based on its details
 */
export async function generateTaskReminder(task: TaskWithStringDates) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI task reminder assistant. Generate an effective, motivating reminder 
          for a task based on its details. The reminder should be personalized based on:
          1. Task priority (high/medium/low)
          2. Due date proximity
          3. Category (Work, Personal, etc.)
          
          Respond with JSON in this format:
          {
            "reminderTitle": string,
            "reminderMessage": string,
            "suggestedTimingMinutesBefore": number,
            "motivationalTip": string
          }`
        },
        {
          role: "user",
          content: JSON.stringify({
            title: task.title,
            description: task.description || "",
            dueDate: task.dueDate || "",
            priority: task.priority as "high" | "medium" | "low", // Type assertion
            category: task.category,
            estimatedTime: task.estimatedTime || null
          })
        }
      ],
      response_format: { type: "json_object" }
    });

    // Return the response content directly (already JSON by OpenAI)
    const defaultReminder = {
      reminderTitle: `Reminder: ${task.title}`,
      reminderMessage: `Your task "${task.title}" is due soon. Don't forget to complete it!`,
      suggestedTimingMinutesBefore: 60,
      motivationalTip: "Taking small steps leads to big accomplishments."
    };

    return response.choices[0].message.content ? 
      safeJsonParse(response.choices[0].message.content, defaultReminder) : 
      defaultReminder;
  } catch (error) {
    console.error("Error calling OpenAI API for reminder:", error);
    return {
      reminderTitle: `Reminder: ${task.title}`,
      reminderMessage: `Your task "${task.title}" is due soon. Don't forget to complete it!`,
      suggestedTimingMinutesBefore: 60,
      motivationalTip: "Taking small steps leads to big accomplishments."
    };
  }
}

/**
 * Generate an optimized daily schedule based on user's tasks
 */
export async function generateDailySchedule(tasks: TaskWithStringDates[]) {
  try {
    const taskData = tasks.filter(task => !task.completed).map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate || "",
      priority: task.priority as "high" | "medium" | "low", // Type assertion
      category: task.category,
      estimatedTime: task.estimatedTime || 30 // Default to 30 min if not specified
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI productivity scheduler. Create an optimized daily schedule based on 
          the user's tasks. Consider:
          1. Task priorities
          2. Due dates
          3. Estimated time for tasks
          4. Task categories
          
          Organize these into time blocks throughout the day, with appropriate breaks.
          
          Respond with JSON in this format:
          {
            "morningTasks": [
              { "startTime": string, "endTime": string, "taskId": number, "taskTitle": string }
            ],
            "afternoonTasks": [
              { "startTime": string, "endTime": string, "taskId": number, "taskTitle": string }
            ],
            "eveningTasks": [
              { "startTime": string, "endTime": string, "taskId": number, "taskTitle": string }
            ],
            "breaks": [
              { "startTime": string, "endTime": string, "activity": string }
            ],
            "scheduleTips": [
              string
            ]
          }`
        },
        {
          role: "user",
          content: JSON.stringify(taskData)
        }
      ],
      response_format: { type: "json_object" }
    });

    // Return the response content directly (already JSON by OpenAI)
    const defaultSchedule = {
      morningTasks: [],
      afternoonTasks: [],
      eveningTasks: [],
      breaks: [],
      scheduleTips: ["Start with high priority tasks in the morning"]
    };

    return response.choices[0].message.content ? 
      safeJsonParse(response.choices[0].message.content, defaultSchedule) : 
      defaultSchedule;
  } catch (error) {
    console.error("Error calling OpenAI API for scheduling:", error);
    throw new Error("Failed to generate schedule");
  }
}

/**
 * Delegate a task to AI assistant to provide detailed completion steps and content
 */
export async function delegateTaskToAI(task: TaskWithStringDates, context?: string) {
  try {
    // Prepare task data for the AI
    const taskData = {
      id: task.id,
      title: task.title,
      description: task.description || "",
      dueDate: task.dueDate || "",
      priority: task.priority as "high" | "medium" | "low",
      category: task.category,
      estimatedTime: task.estimatedTime || null
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant specialized in completing delegated tasks.
          You've been assigned a task and need to help the user complete it effectively.
          Analyze the task details and provide a detailed response that will help the user
          complete this task efficiently.
          
          You MUST respond with JSON in EXACTLY this format (no variations allowed):
          {
            "taskTitle": string,
            "analysisAndContext": string,
            "completionSteps": [
              { "stepNumber": number, "description": string, "estimatedMinutes": number }
            ],
            "draftContent": string,
            "resourceSuggestions": [string],
            "totalEstimatedTime": number,
            "nextActions": string
          }`
        },
        {
          role: "user",
          content: `I need help completing this task:
          ${JSON.stringify(taskData)}
          
          ${context ? `Additional context: ${context}` : ''}
          
          Please help me complete this efficiently by providing detailed steps, draft content, 
          and anything else that would make this task easier to accomplish.`
        }
      ],
      response_format: { type: "json_object" }
    });

    // Default response in case of parsing error
    const defaultResponse = {
      taskTitle: task.title,
      analysisAndContext: "This task requires careful planning and execution.",
      completionSteps: [
        { stepNumber: 1, description: "Review task requirements", estimatedMinutes: 10 },
        { stepNumber: 2, description: "Gather necessary information", estimatedMinutes: 15 },
        { stepNumber: 3, description: "Complete the task", estimatedMinutes: 30 }
      ],
      draftContent: "Here's a draft to help you get started...",
      resourceSuggestions: ["Google Docs for document creation", "Project management tool for tracking"],
      totalEstimatedTime: 55,
      nextActions: "Begin by reviewing the task requirements in detail."
    };

    // Check if we have content from the API
    if (!response.choices[0].message.content) {
      console.warn("No content returned from AI API, using default response");
      return defaultResponse;
    }

    try {
      // Parse and validate the response
      const parsedContent = JSON.parse(response.choices[0].message.content);
      
      // Verify required fields exist
      if (!parsedContent.taskTitle || 
          !parsedContent.analysisAndContext || 
          !Array.isArray(parsedContent.completionSteps) ||
          !parsedContent.draftContent ||
          !Array.isArray(parsedContent.resourceSuggestions) ||
          typeof parsedContent.totalEstimatedTime !== 'number' ||
          !parsedContent.nextActions) {
        
        console.warn("AI response missing required fields, using default response");
        return defaultResponse;
      }
      
      // Validate completion steps structure
      const validSteps = parsedContent.completionSteps.every((step: any) => 
        typeof step.stepNumber === 'number' && 
        typeof step.description === 'string' && 
        typeof step.estimatedMinutes === 'number'
      );
      
      if (!validSteps) {
        console.warn("AI response has invalid completion steps structure, using default response");
        return defaultResponse;
      }
      
      return parsedContent;
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError);
      console.error("Raw AI response:", response.choices[0].message.content);
      return defaultResponse;
    }
  } catch (error) {
    console.error("Error delegating task to AI:", error);
    throw new Error("Failed to delegate task to AI");
  }
}

/**
 * Generate chat completion using either OpenAI or Anthropic based on availability and preference
 */
export async function generateChatCompletion(prompt: string, useModel: 'openai' | 'anthropic' = 'openai') {
  try {
    if (useModel === 'anthropic' && anthropic) {
      // Use Anthropic Claude if requested and available
      const response = await anthropic.messages.create({
        max_tokens: 1024,
        model: "claude-3-7-sonnet-20250219",
        messages: [
          { role: "user", content: prompt }
        ],
      });

      // Extract content correctly based on the response structure
      const content = typeof response.content[0] === 'object' && 'text' in response.content[0]
        ? response.content[0].text
        : '';

      return {
        content,
        model: "Claude"
      };
    } else {
      // Default to OpenAI
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant that provides concise, accurate, and helpful information."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      return {
        content: response.choices[0].message.content,
        model: "GPT-4o"
      };
    }
  } catch (error) {
    console.error("Error generating chat completion:", error);
    throw new Error("Failed to generate AI response");
  }
}

/**
 * Generate image using DALL-E
 */
export async function generateImage(prompt: string) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return {
      url: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt
    };
  } catch (error) {
    console.error("Error generating image:", error);
    throw new Error("Failed to generate image");
  }
}

/**
 * Generate code using OpenAI
 */
export async function generateCode(prompt: string, language: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert programmer with deep knowledge of ${language} programming.
          When responding to the user, provide only the code without explanation or comments outside the code.
          Make sure to include proper comments inside the code to explain important sections.
          Follow best practices for ${language} and ensure the code is secure, efficient, and well-structured.`
        },
        {
          role: "user",
          content: `Please write code in ${language} that ${prompt}`
        }
      ]
    });

    return {
      code: response.choices[0].message.content,
      language: language
    };
  } catch (error) {
    console.error("Error generating code:", error);
    throw new Error("Failed to generate code");
  }
}