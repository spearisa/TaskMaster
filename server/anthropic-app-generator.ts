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
    console.log("Sending request to Claude with prompt:", enhancedPrompt.substring(0, 200) + "...");
    
    const response = await anthropic.messages.create({
      model: modelId,
      max_tokens: maxTokens,
      temperature: 0.1, // Lower temperature for more deterministic code generation
      system: "You are an expert developer specialized in generating complete, production-ready application code. Generate clean, well-structured, and documented code that follows best practices for the specific technology stack requested. Always organize your code in clear, separate files with explicit filenames in the format ```language filename.ext.",
      messages: [
        { role: 'user', content: enhancedPrompt }
      ],
    });

    // Extract text content from the response
    if (!response.content || response.content.length === 0) {
      throw new Error("No content received from Claude");
    }
    
    console.log("Received Claude response with content blocks:", response.content.length);
    
    // Claude can return different types of content blocks, we need to check which one we got
    let result = '';
    for (const block of response.content) {
      if (block.type === 'text') {
        result += block.text;
        console.log("Adding text block with length:", block.text.length);
      }
    }
    
    if (!result) {
      throw new Error("No text content found in Claude's response");
    }
    
    console.log("Total text content length:", result.length);
    console.log("First 200 chars of response:", result.substring(0, 200));
    
    // Check if the result has code blocks
    const hasCodeBlocks = result.includes("```");
    if (!hasCodeBlocks) {
      console.warn("No code blocks found in Claude's response");
      
      // Create a fallback file with the complete response
      return {
        generated_text: result,
        files: [{
          name: 'claude_response.txt',
          content: result,
          language: 'text'
        }]
      };
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

  // Create an array to store extracted files
  const files: { name: string; content: string; language: string }[] = [];
  let matchCount = 0;
  
  // Try multiple regex patterns to extract file information
  
  // Pattern 1: ```language filename.ext\n...code...```
  try {
    const pattern1 = /```([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_\-./]+)\n([\s\S]*?)```/g;
    let match;
    
    while ((match = pattern1.exec(generatedText)) !== null) {
      matchCount++;
      const language = match[1] || 'text';
      const fileName = match[2];
      const content = match[3].trim();
      
      console.log(`Pattern 1 - Match ${matchCount}: Language=${language}, Filename=${fileName}, Content length=${content.length}`);
      
      files.push({
        name: fileName,
        content,
        language
      });
    }
    
    console.log(`Pattern 1 extracted ${matchCount} files`);
  } catch (error) {
    console.error("Error with pattern 1:", error);
  }
  
  // Pattern 2: ```language\nfilename: filename.ext\n...code...```
  if (files.length === 0) {
    try {
      matchCount = 0;
      const pattern2 = /```([a-zA-Z0-9_]+)\s*\n(?:filename:?\s*)?([a-zA-Z0-9_\-./]+)\s*\n([\s\S]*?)```/g;
      let match;
      
      while ((match = pattern2.exec(generatedText)) !== null) {
        matchCount++;
        const language = match[1] || 'text';
        const fileName = match[2];
        const content = match[3].trim();
        
        console.log(`Pattern 2 - Match ${matchCount}: Language=${language}, Filename=${fileName}, Content length=${content.length}`);
        
        files.push({
          name: fileName,
          content,
          language
        });
      }
      
      console.log(`Pattern 2 extracted ${matchCount} files`);
    } catch (error) {
      console.error("Error with pattern 2:", error);
    }
  }
  
  // Pattern 3: File: filename.ext\n```language\n...code...```
  if (files.length === 0) {
    try {
      matchCount = 0;
      const pattern3 = /File:\s*([a-zA-Z0-9_\-./]+)\s*\n```([a-zA-Z0-9_]+)\n([\s\S]*?)```/g;
      let match;
      
      while ((match = pattern3.exec(generatedText)) !== null) {
        matchCount++;
        const fileName = match[1];
        const language = match[2] || 'text';
        const content = match[3].trim();
        
        console.log(`Pattern 3 - Match ${matchCount}: Language=${language}, Filename=${fileName}, Content length=${content.length}`);
        
        files.push({
          name: fileName,
          content,
          language
        });
      }
      
      console.log(`Pattern 3 extracted ${matchCount} files`);
    } catch (error) {
      console.error("Error with pattern 3:", error);
    }
  }
  
  // Pattern 4: Just extract code blocks and generate filenames
  if (files.length === 0) {
    try {
      matchCount = 0;
      const pattern4 = /```([a-zA-Z0-9_]+)\n([\s\S]*?)```/g;
      let match;
      
      while ((match = pattern4.exec(generatedText)) !== null) {
        matchCount++;
        const language = match[1] || 'text';
        const content = match[2].trim();
        const extension = getExtensionFromLanguage(language);
        
        // Try to infer a filename from the code
        let fileName = `file${matchCount}.${extension}`;
        
        // For package.json, index files, etc.
        if (content.includes("\"name\":") && extension === 'json') {
          fileName = "package.json";
        } else if (language === "javascript" || language === "js") {
          if (content.includes("import React") || content.includes("from 'react'")) {
            fileName = `App.jsx`;
          } else if (content.includes("export default function") || content.includes("ReactDOM.render")) {
            fileName = `index.js`;
          }
        } else if (language === "typescript" || language === "ts") {
          if (content.includes("import React") || content.includes("from 'react'")) {
            fileName = `App.tsx`;
          } else if (content.includes("export default function") || content.includes("ReactDOM.render")) {
            fileName = `index.tsx`;
          }
        } else if (language === "html") {
          fileName = "index.html";
        } else if (language === "css") {
          fileName = "styles.css";
        }
        
        console.log(`Pattern 4 - Match ${matchCount}: Language=${language}, Generated filename=${fileName}`);
        
        files.push({
          name: fileName,
          content,
          language
        });
      }
      
      console.log(`Pattern 4 extracted ${matchCount} files`);
    } catch (error) {
      console.error("Error with pattern 4:", error);
    }
  }
  
  // If we still have no files, create a single text file with all content
  if (files.length === 0) {
    console.log("No code blocks found, creating a single text file with all content");
    files.push({
      name: 'complete_response.txt',
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