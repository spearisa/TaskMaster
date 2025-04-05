import OpenAI from "openai";
import { TaskWithStringDates } from "@shared/schema";

// Initialize the OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user

/**
 * Helper function to safely parse JSON or return a fallback
 */
function safeJsonParse(jsonString: string, fallback: any) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing JSON:", error);
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
          
          Respond with JSON in this format:
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

    return response.choices[0].message.content ? 
      safeJsonParse(response.choices[0].message.content, defaultResponse) : 
      defaultResponse;
  } catch (error) {
    console.error("Error delegating task to AI:", error);
    throw new Error("Failed to delegate task to AI");
  }
}