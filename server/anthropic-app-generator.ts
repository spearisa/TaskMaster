import { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

/**
 * Claude AI service for generating application code and structures
 * Integrates with Anthropic Claude API for advanced code generation
 */

// Initialize the Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Available Claude models
export const CLAUDE_MODELS = {
  DEFAULT: 'claude-3-7-sonnet-20250219', // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
  ALTERNATIVE: 'claude-3-opus-20240229'
};

interface CodeGenerationRequest {
  prompt: string;
  technology?: string;
  appType?: string;
  features?: string[];
  modelId?: string;
  maxTokens?: number;
}

interface CodeGenerationResponse {
  generated_text: string;
  files?: {
    name: string;
    content: string;
    language: string;
  }[];
}

/**
 * Generate code from a natural language prompt using Claude model
 * 
 * @param options CodeGenerationRequest object containing prompt and parameters
 * @returns Promise with the generated code
 */
export async function generateCodeWithClaude(options: CodeGenerationRequest): Promise<CodeGenerationResponse> {
  const { 
    prompt, 
    technology = 'React', 
    appType = 'web application',
    features = [],
    modelId = CLAUDE_MODELS.DEFAULT, 
    maxTokens = 4000 
  } = options;

  // Enhance the prompt with specific instructions for file generation
  const enhancedPrompt = createEnhancedPrompt(prompt, technology, appType, features);
  
  try {
    const response = await anthropic.messages.create({
      model: modelId,
      max_tokens: maxTokens,
      system: "You are an expert developer specialized in generating complete, production-ready application code. Generate clean, well-structured, and documented code that follows best practices for the specific technology stack requested.",
      messages: [
        { role: 'user', content: enhancedPrompt }
      ],
    });

    // Extract text content from the response
    if (!response.content || response.content.length === 0) {
      throw new Error("No content received from Claude");
    }
    
    // Claude can return different types of content blocks, we need to check which one we got
    let result = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        result += block.text;
      }
    }
    
    if (!result) {
      throw new Error("No text content found in Claude's response");
    }
    
    return processGeneratedCode(result);
  } catch (error) {
    console.error('Failed to generate code with Claude:', error);
    throw error;
  }
}

/**
 * Create an enhanced prompt with specific instructions for code generation
 */
function createEnhancedPrompt(
  basePrompt: string, 
  technology: string, 
  appType: string,
  features: string[]
): string {
  // Format any requested features as a string
  const featuresText = features.length > 0 
    ? `The application should include the following features: ${features.join(', ')}.` 
    : '';
  
  return `
Please generate code for a ${technology} ${appType} based on the following description:

${basePrompt}

${featuresText}

Please organize your response in the following format:
1. Start with a brief overview of the app architecture and components.
2. Then generate each file with the content wrapped in markdown code blocks.
3. For each file, specify the filename at the top of the code block like this: \`\`\`language filename.ext
4. Include all necessary files for a complete application, including configuration files, dependencies, and any required assets.

The generated code should be production-ready, well-structured, and follow best practices for ${technology}.
`;
}

/**
 * Process the raw generated response into a structured format with individual files
 */
function processGeneratedCode(generatedText: string): CodeGenerationResponse {
  if (!generatedText) {
    throw new Error('No generated text received from the model');
  }

  // Parse the generated text into separate files using regex
  // This regex matches markdown code blocks with optional language and filename
  const filePattern = /```(?:(\w+))?\s*(?:([a-zA-Z0-9_\-./]+)\s*)?([^`]+)```/g;
  const files: { name: string; content: string; language: string }[] = [];
  
  let match;
  while ((match = filePattern.exec(generatedText)) !== null) {
    const language = match[1] || 'text';
    const fileName = match[2] || `file${files.length + 1}.${getExtensionFromLanguage(language)}`;
    const content = match[3].trim();
    
    files.push({
      name: fileName,
      content,
      language
    });
  }

  return {
    generated_text: generatedText,
    files: files.length > 0 ? files : undefined
  };
}

/**
 * Get appropriate file extension based on language
 */
function getExtensionFromLanguage(language: string): string {
  const extensions: {[key: string]: string} = {
    javascript: 'js',
    typescript: 'ts',
    jsx: 'jsx',
    tsx: 'tsx',
    html: 'html',
    css: 'css',
    scss: 'scss',
    python: 'py',
    java: 'java',
    php: 'php',
    ruby: 'rb',
    go: 'go',
    rust: 'rs',
    swift: 'swift',
    kotlin: 'kt',
    json: 'json',
    yaml: 'yaml',
    markdown: 'md',
    text: 'txt'
  };
  
  return extensions[language.toLowerCase()] || 'txt';
}

/**
 * API endpoint handler for code generation requests
 */
export async function handleClaudeCodeGenerationRequest(req: Request, res: Response) {
  try {
    const { prompt, technology, appType, features, modelId, maxTokens } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const result = await generateCodeWithClaude({
      prompt,
      technology,
      appType,
      features,
      modelId,
      maxTokens
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('Claude code generation request failed:', error);
    res.status(500).json({ 
      error: 'Failed to generate code with Claude',
      message: error.message 
    });
  }
}