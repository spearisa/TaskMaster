import { Request, Response } from 'express';

/**
 * DeepSeek AI service for generating application code and structures
 * Integrates with the DeepSeek-V3-0324 model via Hugging Face API
 */

// Models available for code generation
export const DEEPSEEK_MODELS = {
  DEFAULT: 'deepseek-ai/DeepSeek-V3-0324',
  ALTERNATIVE: 'deepseek-ai/DeepSeek-Coder-V2-Lite'
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
  const { 
    prompt, 
    technology = 'React', 
    appType = 'web application',
    features = [],
    modelId = DEEPSEEK_MODELS.DEFAULT, 
    maxLength = 4000 
  } = options;

  // Enhance the prompt with specific instructions for file generation
  const enhancedPrompt = createEnhancedPrompt(prompt, technology, appType, features);
  
  try {
    const response = await fetch(
      `https://api-inference.huggingface.co/models/${modelId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          inputs: enhancedPrompt,
          parameters: {
            max_new_tokens: maxLength,
            temperature: 0.7,
            top_p: 0.95,
            return_full_text: false
          }
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Error from Hugging Face API:', error);
      throw new Error(`Hugging Face API error: ${error.error || 'Unknown error'}`);
    }

    const result = await response.json();
    return processGeneratedCode(result);
  } catch (error) {
    console.error('Failed to generate code with DeepSeek:', error);
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
You are an expert developer skilled in creating ${technology} applications. I need you to generate code for a ${appType}.

${basePrompt}

${featuresText}

Please organize the response as follows:
1. First, provide a brief overview of the architecture and components.
2. Then, generate each file with the content wrapped in markdown code blocks.
3. For each file, specify the filename at the top of the code block.
4. Include all necessary dependencies and configuration files.

Focus on making the code production-ready, well-structured, and following best practices.
  `;
}

/**
 * Process the raw generated response into a structured format with individual files
 */
function processGeneratedCode(rawResponse: any): CodeGenerationResponse {
  // Handle different response formats from Hugging Face
  const generatedText = Array.isArray(rawResponse) 
    ? rawResponse[0]?.generated_text 
    : rawResponse.generated_text;
  
  if (!generatedText) {
    throw new Error('No generated text received from the model');
  }

  // Parse the generated text into separate files using regex
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
export async function handleCodeGenerationRequest(req: Request, res: Response) {
  try {
    const { prompt, technology, appType, features, modelId, maxLength } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    const result = await generateCodeWithDeepSeek({
      prompt,
      technology,
      appType,
      features,
      modelId,
      maxLength
    });
    
    res.json(result);
  } catch (error: any) {
    console.error('Code generation request failed:', error);
    res.status(500).json({ 
      error: 'Failed to generate code',
      message: error.message 
    });
  }
}