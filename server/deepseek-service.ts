
import axios from 'axios';
import { Request, Response } from 'express';

const DEEPSEEK_API_URL = 'https://api-inference.huggingface.co/models/deepseek-ai/deepseek-coder-33b-instruct';

export const DEEPSEEK_MODELS = {
  DEEPSEEK_CODER_33B: 'deepseek-ai/deepseek-coder-33b-instruct'
};

interface CodeGenerationRequest {
  prompt: string;
  technology?: string;
  appType?: string;
  features?: string[];
  modelId?: string;
  maxLength?: number;
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
 * Generate code from a natural language prompt using DeepSeek model
 * 
 * @param options CodeGenerationRequest object containing prompt and parameters
 * @returns Promise with the generated code
 */
export async function generateCodeWithDeepSeek(options: CodeGenerationRequest): Promise<CodeGenerationResponse> {
  try {
    // Use HUGGINGFACE_API_KEY if available, otherwise try HUGGINGFACE_API_TOKEN
    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN;
    
    if (!apiKey) {
      throw new Error('Neither HUGGINGFACE_API_KEY nor HUGGINGFACE_API_TOKEN is set');
    }
    
    // Create enhanced prompt with additional context
    const enhancedPrompt = createEnhancedPrompt(
      options.prompt,
      options.technology,
      options.appType,
      options.features
    );
    
    console.log(`Sending request to DeepSeek API with model: ${options.modelId || DEEPSEEK_MODELS.DEEPSEEK_CODER_33B}`);
    
    // Setup request parameters
    const requestBody = { 
      inputs: enhancedPrompt,
      parameters: {
        max_new_tokens: options.maxLength || 4096,
        temperature: 0.7,
        top_p: 0.95,
        do_sample: true
      }
    };
    
    // Make the API request
    const response = await axios.post(
      DEEPSEEK_API_URL,
      requestBody,
      {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 180000 // 3 minute timeout
      }
    );
    
    // Process the response to extract code files
    return processGeneratedCode(response.data);
    
  } catch (error: any) {
    console.error('DeepSeek API Error:', error.response?.data || error.message);
    throw new Error(`Failed to generate code with DeepSeek: ${error.response?.data?.error || error.message}`);
  }
}

/**
 * Create an enhanced prompt with specific instructions for code generation
 */
function createEnhancedPrompt(
  prompt: string,
  technology?: string, 
  appType?: string, 
  features?: string[]
): string {
  let enhancedPrompt = `You are a senior developer specializing in ${technology || 'web development'}. 
Create a complete ${appType || 'application'} based on the following description.

User Requirements:
${prompt}

${features?.length ? `Important features to include:\n${features.map(f => `- ${f}`).join('\n')}` : ''}

Please follow these guidelines:
1. Organize code into separate files with names that follow best practices for ${technology || 'web'} development.
2. Include all necessary files for a complete, working application.
3. Provide fully implemented code, not just stubs or placeholders.
4. Each file should start with a markdown code block that includes the filename, e.g. \`\`\`filename.js
5. Use modern coding standards and best practices.

Return multiple code files that comprise a complete solution.`;

  return enhancedPrompt;
}

/**
 * Process the raw generated response into a structured format with individual files
 */
function processGeneratedCode(rawResponse: any): CodeGenerationResponse {
  let generatedText = '';
  
  // Handle different response formats from DeepSeek
  if (typeof rawResponse === 'string') {
    generatedText = rawResponse;
  } else if (Array.isArray(rawResponse) && rawResponse.length > 0) {
    // Some DeepSeek endpoints return an array
    generatedText = rawResponse[0].generated_text || '';
  } else if (rawResponse && rawResponse.generated_text) {
    generatedText = rawResponse.generated_text;
  } else {
    generatedText = JSON.stringify(rawResponse);
  }
  
  // Extract files from the generated text
  const files: CodeGenerationResponse['files'] = [];
  const filePattern = /```(?:(\w+)|(?:file|filename)[=: ]?['"]?([\w.-]+)['"]?)?\s*\n([\s\S]*?)```/g;
  
  let match;
  while ((match = filePattern.exec(generatedText)) !== null) {
    // Extract filename and content
    let language = match[1] || '';
    let filename = match[2] || '';
    const content = match[3] || '';
    
    // If no filename is provided, try to infer it from the language
    if (!filename && language) {
      filename = `main.${getExtensionFromLanguage(language)}`;
    } else if (!filename) {
      // Fallback filename
      filename = `file-${files.length + 1}.txt`;
    }
    
    // If language wasn't specified, try to infer from the filename
    if (!language) {
      const extension = filename.split('.').pop() || '';
      language = extension;
    }
    
    files.push({
      name: filename,
      content: content.trim(),
      language: language
    });
  }
  
  // If no files were extracted but we have text, create a single file
  if (files.length === 0 && generatedText.trim()) {
    files.push({
      name: 'response.txt',
      content: generatedText.trim(),
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
  const extensions: Record<string, string> = {
    'javascript': 'js',
    'js': 'js',
    'typescript': 'ts',
    'ts': 'ts',
    'jsx': 'jsx',
    'tsx': 'tsx',
    'python': 'py',
    'py': 'py',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'c++': 'cpp',
    'csharp': 'cs',
    'cs': 'cs',
    'go': 'go',
    'rust': 'rs',
    'ruby': 'rb',
    'php': 'php',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'yaml': 'yaml',
    'yml': 'yml',
    'markdown': 'md',
    'md': 'md',
    'sql': 'sql',
    'swift': 'swift',
    'kotlin': 'kt',
    'shell': 'sh',
    'bash': 'sh',
    'sh': 'sh'
  };
  
  return extensions[language.toLowerCase()] || 'txt';
}

/**
 * API endpoint handler for code generation requests
 */
export async function handleCodeGenerationRequest(req: Request, res: Response) {
  try {
    // Ensure req.body exists
    if (!req.body) {
      console.error('DeepSeek error: Request body is undefined');
      return res.status(400).json({ error: 'Request body is missing' });
    }
    
    console.log('DeepSeek received request body:', req.body);
    
    const { 
      prompt, 
      technology, 
      appType, 
      features,
      modelId,
      maxLength
    } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log(`Received DeepSeek code generation request: ${prompt.substring(0, 100)}...`);
    
    const result = await generateCodeWithDeepSeek({
      prompt,
      technology,
      appType,
      features,
      modelId: modelId || DEEPSEEK_MODELS.DEEPSEEK_CODER_33B,
      maxLength: maxLength || 4096
    });
    
    return res.json(result);
  } catch (error: any) {
    console.error('DeepSeek code generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate code with DeepSeek',
      message: error.message 
    });
  }
}
