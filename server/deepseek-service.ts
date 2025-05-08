
import axios from 'axios';
import { Request, Response } from 'express';

// The Hugging Face Inference API endpoint for DeepSeek Coder
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
    
    const modelId = options.modelId || DEEPSEEK_MODELS.DEEPSEEK_CODER_33B;
    console.log(`Generating code with DeepSeek using model: ${modelId}`);
    
    // Create enhanced prompt with additional context
    const enhancedPrompt = createEnhancedPrompt(
      options.prompt,
      options.technology,
      options.appType,
      options.features
    );
    
    console.log(`Enhanced prompt created (${enhancedPrompt.length} chars), requesting code generation...`);
    
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
    
    // Determine the API URL dynamically based on the model ID
    const apiUrl = `https://api-inference.huggingface.co/models/${modelId}`;
    console.log(`Making request to Hugging Face API: ${apiUrl}`);
    
    // Log the headers we're using (without the actual API key)
    console.log('Making request with headers:', {
      'Authorization': 'Bearer [REDACTED]',
      'Content-Type': 'application/json'
    });
    
    // Make the API request
    const response = await axios.post(
      apiUrl,
      requestBody,
      {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 180000 // 3 minute timeout
      }
    );
    
    if (!response.data) {
      throw new Error('Empty response from DeepSeek API');
    }
    
    console.log('Received response from DeepSeek API:', 
      typeof response.data === 'string' 
        ? `${response.data.substring(0, 100)}...` 
        : `Response type: ${typeof response.data}`
    );
    
    // Process the response to extract code files
    const result = processGeneratedCode(response.data);
    console.log(`Processed ${result.files?.length || 0} files from DeepSeek response`);
    
    return result;
    
  } catch (error: any) {
    console.error('Error generating code with DeepSeek:', error);
    
    // Create a more informative error message based on the error type
    let errorMessage = 'Unknown error occurred';
    
    if (error.response) {
      // The request was made and the server responded with a status code
      const responseData = error.response.data || {};
      errorMessage = `DeepSeek API error (${error.response.status}): ${JSON.stringify(responseData)}`;
      
      // Log detailed error information
      console.error('Error response data:', responseData);
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', error.response.headers);
      
      // Check specifically for permission/authentication errors
      if (error.response.status === 401 || error.response.status === 403) {
        if (typeof responseData === 'string' && responseData.includes('sufficient permissions')) {
          errorMessage = 'Permission error: The API key does not have sufficient permissions for the DeepSeek model';
        } else if (typeof responseData === 'object' && responseData.error && responseData.error.includes('authorization')) {
          errorMessage = 'Authorization error: ' + responseData.error;
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = `DeepSeek API request failed: No response received (timeout after ${error.request._currentRequest?.timeout || 'unknown'} ms)`;
      console.error('Error request:', error.request);
    } else {
      // Something else happened in setting up the request
      errorMessage = `DeepSeek error: ${error.message}`;
      
      // Check specifically for authentication failures in the error message
      if (error.message.includes('authentication') || error.message.includes('API key') || 
          error.message.includes('authorization') || error.message.includes('permissions')) {
        errorMessage = 'Authentication error: ' + error.message;
      }
    }
    
    throw new Error(`Failed to generate code with DeepSeek: ${errorMessage}`);
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
  // Base instructions for DeepSeek similar to DeepSite's approach
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
6. If creating a web application, use TailwindCSS where appropriate for styling.
7. For HTML files, ensure they are complete, valid documents with proper DOCTYPE, head, and body sections.

Return multiple code files that comprise a complete solution.`;

  return enhancedPrompt;
}

/**
 * Process the raw generated response into a structured format with individual files
 * Enhanced to better detect HTML content and extract it as a complete file
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
  
  // First check if there's a complete HTML document
  const htmlPattern = /(<!DOCTYPE html>[\s\S]*?<\/html>)/g;
  let htmlMatch = htmlPattern.exec(generatedText);
  
  if (htmlMatch && htmlMatch[0]) {
    // Found a complete HTML document, add it as index.html
    files.push({
      name: 'index.html',
      content: htmlMatch[0].trim(),
      language: 'html'
    });
    
    // Remove the HTML from the generated text to avoid duplicate content
    generatedText = generatedText.replace(htmlMatch[0], '');
  }
  
  // Now look for code blocks with filenames
  const filePattern = /```(?:(\w+)|(?:file|filename)[=: ]?['"]?([\w.-]+)['"]?)?\s*\n([\s\S]*?)```/g;
  
  let match;
  while ((match = filePattern.exec(generatedText)) !== null) {
    // Extract filename and content
    let language = match[1] || '';
    let filename = match[2] || '';
    const content = match[3] || '';
    
    // Skip empty content
    if (!content.trim()) continue;
    
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
    
    // Handle special case for HTML content - make sure it's complete
    if (language === 'html' && filename === 'index.html' && !content.includes('<!DOCTYPE html>')) {
      // If it seems like an incomplete HTML snippet, wrap it properly
      const completeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated App</title>
</head>
<body>
${content.trim()}
</body>
</html>`;
      
      files.push({
        name: filename,
        content: completeHtml,
        language: language
      });
    } else {
      // Regular file
      files.push({
        name: filename,
        content: content.trim(),
        language: language
      });
    }
  }
  
  // If no files were extracted but we have text, check for HTML content
  if (files.length === 0 && generatedText.trim()) {
    // Check if the response contains HTML tags but not properly formatted as code blocks
    if (generatedText.includes('<html') || generatedText.includes('<!DOCTYPE') || 
        (generatedText.includes('<body') && generatedText.includes('</body>'))) {
      
      // Try to extract HTML content
      const htmlContent = generatedText.match(/<html[\s\S]*?<\/html>/i) || 
                          generatedText.match(/<!DOCTYPE[\s\S]*?<\/html>/i);
      
      if (htmlContent) {
        files.push({
          name: 'index.html',
          content: htmlContent[0].trim(),
          language: 'html'
        });
      } else {
        // Fallback for partial HTML
        files.push({
          name: 'index.html',
          content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated App</title>
</head>
<body>
${generatedText.trim()}
</body>
</html>`,
          language: 'html'
        });
      }
    } else {
      // Not HTML, add as plain text
      files.push({
        name: 'response.txt',
        content: generatedText.trim(),
        language: 'text'
      });
    }
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
 * Improved to match DeepSite's implementation more closely
 * With fallback to OpenAI if DeepSeek access is limited
 */
export async function handleCodeGenerationRequest(req: Request, res: Response) {
  try {
    // Ensure req.body exists
    if (!req.body) {
      console.error('DeepSeek error: Request body is undefined');
      return res.status(400).json({ 
        ok: false,
        message: 'Request body is missing'
      });
    }
    
    console.log('DeepSeek received request body:', req.body);
    
    const { 
      prompt, 
      technology, 
      appType, 
      features,
      modelId,
      maxLength,
      provider = 'deepseek' // Default provider
    } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        ok: false,
        message: 'Prompt is required'
      });
    }

    // Set headers for JSON response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    
    console.log(`Received code generation request [${provider}]: ${prompt.substring(0, 100)}...`);
    
    try {
      // First attempt with DeepSeek
      try {
        // Check for DeepSeek API key
        const huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY || process.env.HUGGINGFACE_API_TOKEN;
        if (!huggingFaceApiKey) {
          throw new Error('Missing Hugging Face API credentials');
        }

        const result = await generateCodeWithDeepSeek({
          prompt,
          technology,
          appType,
          features,
          modelId: modelId || DEEPSEEK_MODELS.DEEPSEEK_CODER_33B,
          maxLength: maxLength || 4096
        });
        
        return res.json({
          ok: true,
          files: result.files || [],
          generated_text: result.generated_text,
          provider: 'deepseek'
        });
      } catch (deepseekError: any) {
        // Log the specific error for debugging
        console.log('Detailed DeepSeek error message:', deepseekError.message);
        
        // If we encounter a permissions error or any other DeepSeek error, try OpenAI as fallback
        if (deepseekError.message.includes('sufficient permissions') || 
            deepseekError.message.includes('exceeded your monthly included credits') ||
            deepseekError.message.includes('API key') ||
            deepseekError.message.includes('authentication') ||
            deepseekError.message.includes('permission') ||
            deepseekError.message.includes('unauthorized')) {
          console.log('DeepSeek error, trying OpenAI fallback:', deepseekError.message);
          
          // Check for OpenAI API key
          const openAiApiKey = process.env.OPENAI_API_KEY;
          if (!openAiApiKey) {
            throw new Error('Neither DeepSeek nor OpenAI API credentials are available');
          }

          // Import OpenAI on demand to avoid circular dependencies
          const openaiService = await import('./openai-service');
          
          // Use OpenAI for code generation
          const openAiResult = await openaiService.generateApplicationCode({
            prompt,
            technology,
            appType, 
            features
          });
          
          return res.json({
            ok: true,
            files: openAiResult.files || [],
            generated_text: openAiResult.generated_text || '',
            provider: 'openai'
          });
        }
        
        // If it's not a permissions error, re-throw
        throw deepseekError;
      }
    } catch (error: any) {
      console.error('Code generation error:', error);
      
      // Determine appropriate status code based on error type
      let statusCode = 500;
      if (error.response) {
        statusCode = error.response.status || 500;
      } else if (error.message.includes('timeout')) {
        statusCode = 504; // Gateway Timeout
      }
      
      return res.status(statusCode).json({ 
        ok: false,
        message: `Failed to generate code: ${error.message}`,
        error: error.message
      });
    }
  } catch (error: any) {
    console.error('Code generation request handler error:', error);
    
    return res.status(500).json({ 
      ok: false,
      message: `Code generation request failed: ${error.message}`,
      error: error.message
    });
  }
}
