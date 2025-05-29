import axios from 'axios';
import { Request, Response } from 'express';

// DeepSeek API endpoint (now using direct DeepSeek API instead of through Hugging Face)
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

export const DEEPSEEK_MODELS = {
  DEEPSEEK_CODER_33B: 'deepseek-coder-33b-instruct',
  DEEPSEEK_V3: 'deepseek-chat',
  DEEPSEEK_V3_PLUS: 'deepseek-v3-plus'
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
    // Try different authentication tokens in priority order
    let apiKey = null;
    let useDeepSeekAPI = false;
    
    // Try DeepSeek API first
    if (process.env.DEEPSEEK_API_KEY) {
      apiKey = process.env.DEEPSEEK_API_KEY;
      useDeepSeekAPI = true;
      
      // Validate DeepSeek key format
      if (!apiKey.startsWith('sk-')) {
        console.warn(`⚠️ Warning: DeepSeek API key has invalid format. Expected key starting with "sk-", got key starting with "${apiKey.substring(0, 3)}..."`);
        console.warn('This may cause authentication errors with the DeepSeek API.');
      }
      
      console.log(`Using DEEPSEEK_API_KEY for authentication: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)} (length: ${apiKey.length})`);
    } 
    // Then try Hugging Face API Token
    else if (process.env.HUGGINGFACE_API_TOKEN) {
      apiKey = process.env.HUGGINGFACE_API_TOKEN;
      console.log(`Using HUGGINGFACE_API_TOKEN for authentication (length: ${apiKey.length})`);
    }
    // Finally try Hugging Face API Key
    else if (process.env.HUGGINGFACE_API_KEY) {
      apiKey = process.env.HUGGINGFACE_API_KEY;
      console.log(`Using HUGGINGFACE_API_KEY for authentication (length: ${apiKey.length})`);
    }
    
    if (!apiKey) {
      throw new Error('No API authentication token is available. Please set DEEPSEEK_API_KEY or HUGGINGFACE_API_TOKEN environment variable.');
    }
    
    console.log(`Using API token for DeepSeek: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)} (length: ${apiKey.length})`);
    
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
    
    // Setup request parameters for DeepSeek API format
    const requestBody = { 
      model: modelId,
      messages: [
        {
          role: "user",
          content: enhancedPrompt
        }
      ],
      temperature: 0.7,
      top_p: 0.95,
      max_tokens: options.maxLength || 4096,
      stream: false
    };
    
    // No need to construct the URL dynamically - we're using the DeepSeek API directly
    const apiUrl = DEEPSEEK_API_URL;
    console.log(`Making request to DeepSeek API: ${apiUrl}`);
    
    // Log the headers we're using (without the actual API key)
    console.log('Making request with headers:', {
      'Authorization': 'Bearer [REDACTED]',
      'Content-Type': 'application/json'
    });
    
    // Make the API request
    console.log(`Full API URL being called: ${apiUrl}`);
    console.log(`Request payload size: ${JSON.stringify(requestBody).length} characters`);
    
    let responseData: any;
    
    try {
      console.log(`Making API request to: ${apiUrl} with ${apiKey ? 'valid' : 'missing'} API key`);
      
      // Prepare headers with appropriate authentication
      const headers = { 
        'Authorization': `Bearer ${apiKey}`, // DeepSeek expects 'Bearer sk-...'
        'Content-Type': 'application/json'
      };
      
      // Log the API request details (without exposing full key)
      console.log('Making API request with the following details:');
      console.log('- URL:', apiUrl);
      console.log('- Model:', modelId);
      console.log('- Headers:', {
        'Authorization': headers.Authorization.replace(apiKey, '[REDACTED]'),
        'Content-Type': headers['Content-Type']
      });
      console.log('- Payload size:', JSON.stringify(requestBody).length, 'characters');
      
      // Make the API request
      const response = await axios.post(
        apiUrl,
        requestBody,
        {
          headers,
          timeout: 180000, // 3 minute timeout
          validateStatus: function (status) {
            // Consider all status codes as successful to handle them manually below
            return true;
          }
        }
      );
      
      console.log(`API response received with status: ${response.status}`);
      
      // Handle different error status codes with specific messages
      if (response.status >= 400) {
        if (response.status === 401) {
          console.error('Authentication error (401):', response.data);
          throw new Error(`Authentication failed with DeepSeek API. Please check your API key (should start with 'sk-'). Details: ${JSON.stringify(response.data)}`);
        } else if (response.status === 403) {
          console.error('Authorization error (403):', response.data);
          throw new Error(`DeepSeek API access forbidden. Your API key may not have access to this model. Details: ${JSON.stringify(response.data)}`);
        } else if (response.status === 429) {
          console.error('Rate limit error (429):', response.data);
          throw new Error(`DeepSeek API rate limit exceeded. Please try again later. Details: ${JSON.stringify(response.data)}`);
        } else {
          console.error(`API error: ${response.status}`, response.data);
          throw new Error(`DeepSeek API Error: Status ${response.status} - ${JSON.stringify(response.data)}`);
        }
      }
      
      if (!response.data) {
        throw new Error('Empty response from DeepSeek API');
      }
      
      responseData = response.data;
      
      // Log response data for debugging
      console.log('Received response from DeepSeek API:', 
        typeof responseData === 'object' 
          ? `Response ID: ${responseData.id || 'none'}, model: ${responseData.model || 'none'}` 
          : `Response type: ${typeof responseData}`
      );
      
      // Check if the response has the expected format
      if (!responseData.choices || !responseData.choices[0] || !responseData.choices[0].message) {
        console.error('Unexpected response format from DeepSeek API:', responseData);
        throw new Error('Unexpected response format from DeepSeek API');
      }
      
      // Extract the message content from the DeepSeek chat response
      const generatedText = responseData.choices[0].message.content;
      console.log(`Extracted content from DeepSeek chat response (${generatedText.length} chars)`);
      
      // Process the response to extract code files
      const result = processGeneratedCode(generatedText);
      console.log(`Processed ${result.files?.length || 0} files from DeepSeek response`);
      
      return result;
      
    } catch (error: any) {
      console.error('API request error:', error.message);
      throw error;
    }
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
    // Skip authentication check for DeepSite app generator to match the original UI
    // This allows users to generate apps without logging in

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
      provider = 'deepseek' // Default provider ('deepseek', 'openai', 'auto')
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
      // First check if we should use OpenAI instead of DeepSeek
      const hasOpenAiKey = !!process.env.OPENAI_API_KEY;
      
      // Check DeepSeek and Hugging Face auth status
      const hasDeepSeekKey = !!process.env.DEEPSEEK_API_KEY;
      const hasHuggingFaceToken = !!process.env.HUGGINGFACE_API_TOKEN;
      const hasHuggingFaceKey = !!process.env.HUGGINGFACE_API_KEY;
      
      console.log('API authentication status:', {
        hasOpenAiKey,
        hasDeepSeekAPIKey: hasDeepSeekKey, 
        hasHuggingFaceToken: hasHuggingFaceToken, 
        hasHuggingFaceKey: hasHuggingFaceKey
      });
      
      // We only use DeepSeek and HuggingFace APIs per user request
      console.log('Using only DeepSeek/HuggingFace APIs as requested');
      
      // Try using DeepSeek if we got here
      try {
        if (!hasDeepSeekKey && !hasHuggingFaceToken && !hasHuggingFaceKey) {
          console.error('ERROR: No API credentials available for DeepSeek or Hugging Face');
          throw new Error('Missing API credentials for code generation');
        }
        
        // Log which API credentials we're using
        if (hasDeepSeekKey) {
          console.log('Using DEEPSEEK_API_KEY for authentication');
          console.log(`Key length: ${process.env.DEEPSEEK_API_KEY?.length || 0}, prefix: ${process.env.DEEPSEEK_API_KEY?.substring(0, 4) || 'none'}`);
        } else if (hasHuggingFaceToken) {
          console.log('Using HUGGINGFACE_API_TOKEN for authentication');
          console.log(`Token length: ${process.env.HUGGINGFACE_API_TOKEN?.length || 0}, prefix: ${process.env.HUGGINGFACE_API_TOKEN?.substring(0, 4) || 'none'}`);
        } else {
          console.log('Using HUGGINGFACE_API_KEY for authentication');
          console.log(`Key length: ${process.env.HUGGINGFACE_API_KEY?.length || 0}, prefix: ${process.env.HUGGINGFACE_API_KEY?.substring(0, 4) || 'none'}`);
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
        
        // No fallback to OpenAI as requested
        console.log('DeepSeek error occurred, but not using OpenAI fallback per user request:', deepseekError.message);
        
        // Check if this is an authentication error related to the API key format
        if (deepseekError.message.includes('Auth') || 
            deepseekError.message.includes('auth') || 
            deepseekError.message.includes('401') ||
            deepseekError.message.includes('credentials')) {
            
          return res.status(401).json({
            ok: false,
            errorType: 'invalid_api_key',
            message: 'DeepSeek API key authentication failed. The API key format appears to be incorrect.',
            details: {
              expectedFormat: 'Bearer sk-...',
              apiKeyInfo: {
                deepseekKeyLength: process.env.DEEPSEEK_API_KEY?.length || 0,
                deepseekKeyPrefix: process.env.DEEPSEEK_API_KEY?.substring(0, 3) || 'none',
                correctFormat: process.env.DEEPSEEK_API_KEY?.startsWith('sk-') || false
              },
              originalError: deepseekError.message
            }
          });
        }
        
        // If it's not a handled error type, re-throw
        throw deepseekError;
      }
    } catch (error: any) {
      console.error('Code generation error:', error);
      
      // Determine appropriate status code and error type
      let statusCode = 500;
      let errorType = 'unknown';
      let userMessage = `Failed to generate code: ${error.message}`;
      
      if (error.response) {
        statusCode = error.response.status || 500;
        
        // Map status codes to error types
        if (statusCode === 401 || statusCode === 403) {
          errorType = 'authentication';
          userMessage = 'DeepSeek API authentication failed. Please check your API key.';
        } else if (statusCode === 429) {
          errorType = 'rate_limit';
          userMessage = 'DeepSeek API rate limit exceeded. Please try again later.';
        }
      } else if (error.message.includes('timeout')) {
        statusCode = 504; // Gateway Timeout
        errorType = 'timeout';
        userMessage = 'DeepSeek API request timed out. The service may be experiencing high demand.';
      } else if (error.message.includes('API key') || error.message.includes('credentials') || error.message.includes('Authentication')) {
        statusCode = 401;
        errorType = 'invalid_api_key';
        userMessage = 'Invalid DeepSeek API key. The key should start with "sk-".';
      }
      
      // Log key information without exposing the full key
      const keyInfo = {
        deepseekKeyPresent: !!process.env.DEEPSEEK_API_KEY,
        deepseekKeyLength: process.env.DEEPSEEK_API_KEY?.length || 0,
        deepseekKeyFormat: process.env.DEEPSEEK_API_KEY?.startsWith('sk-') ? 'valid' : 'invalid',
        huggingfaceTokenPresent: !!process.env.HUGGINGFACE_API_TOKEN,
        huggingfaceKeyPresent: !!process.env.HUGGINGFACE_API_KEY
      };
      
      console.log('API Key Information:', keyInfo);
      
      return res.status(statusCode).json({ 
        ok: false,
        errorType,
        message: userMessage,
        error: error.message,
        keyInfo
      });
    }
  } catch (error: any) {
    console.error('Code generation request handler error:', error);
    
    // Format the error response
    let errorMessage = `Code generation request failed: ${error.message}`;
    let errorType = 'unknown';
    let statusCode = 500;
    
    // Categorize common errors
    if (error.message.includes('API key') || 
        error.message.includes('auth') || 
        error.message.includes('credentials') ||
        error.message.includes('401')) {
      errorType = 'invalid_api_key';
      errorMessage = 'Invalid DeepSeek API key. Please check your API credentials.';
      statusCode = 401;
    }
    
    // Add API key information to help troubleshoot
    const keyInfo = {
      deepseekKeyPresent: !!process.env.DEEPSEEK_API_KEY,
      deepseekKeyLength: process.env.DEEPSEEK_API_KEY?.length || 0,
      deepseekKeyFormat: process.env.DEEPSEEK_API_KEY?.startsWith('sk-') ? 'valid' : 'invalid',
      huggingfaceTokenPresent: !!process.env.HUGGINGFACE_API_TOKEN,
      huggingfaceKeyPresent: !!process.env.HUGGINGFACE_API_KEY
    };
    
    // Log the diagnostic information
    console.log('DeepSeek Service Error Diagnostics:', {
      errorType,
      keyInfo,
      originalError: error.message
    });
    
    return res.status(statusCode).json({ 
      ok: false,
      errorType,
      message: errorMessage,
      error: error.message,
      apiStatus: {
        deepseekAvailable: keyInfo.deepseekKeyPresent && keyInfo.deepseekKeyFormat === 'valid',
        huggingfaceAvailable: keyInfo.huggingfaceTokenPresent || keyInfo.huggingfaceKeyPresent
      }
    });
  }
}