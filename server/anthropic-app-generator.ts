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

  console.log("Processing generated text:", generatedText.substring(0, 200) + "...");

  // More flexible regex pattern that can handle various code block formats
  // This should work with both ```language filename.ext and ```language\nfilename.ext formats
  const filePattern = /```([\w]+)(?:\s+([a-zA-Z0-9_\-./]+)|\n+([a-zA-Z0-9_\-./]+))?\n([\s\S]*?)```/g;
  const files: { name: string; content: string; language: string }[] = [];
  
  let match;
  let matchCount = 0;
  
  while ((match = filePattern.exec(generatedText)) !== null) {
    matchCount++;
    const language = match[1] || 'text';
    // Filename could be in group 2 or 3 depending on format
    const fileName = match[2] || match[3] || `file${files.length + 1}.${getExtensionFromLanguage(language)}`;
    const content = match[4].trim();
    
    console.log(`Match ${matchCount}: Language=${language}, Filename=${fileName}, Content length=${content.length}`);
    
    files.push({
      name: fileName,
      content,
      language
    });
  }
  
  // If no files were extracted with the main pattern, try a fallback pattern
  if (files.length === 0) {
    console.log("No files found with primary pattern, trying fallback...");
    // Simpler fallback pattern
    const fallbackPattern = /```([\w]+)\n([\s\S]*?)```/g;
    let fallbackMatch;
    let fallbackCount = 0;
    
    while ((fallbackMatch = fallbackPattern.exec(generatedText)) !== null) {
      fallbackCount++;
      const language = fallbackMatch[1] || 'text';
      const content = fallbackMatch[2].trim();
      const fileName = `file${fallbackCount}.${getExtensionFromLanguage(language)}`;
      
      console.log(`Fallback match ${fallbackCount}: Language=${language}, Generated filename=${fileName}`);
      
      files.push({
        name: fileName,
        content,
        language
      });
    }
  }

  console.log(`Total files extracted: ${files.length}`);
  
  // If we still have no files, create a single text file with all content
  if (files.length === 0) {
    console.log("No code blocks found, creating a single text file with all content");
    files.push({
      name: 'response.txt',
      content: generatedText,
      language: 'text'
    });
  }

  return {
    generated_text: generatedText,
    files: files
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