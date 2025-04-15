import { apiRequest } from "./queryClient";

// Interface for Chat request/response
export interface ChatRequest {
  prompt: string;
  model?: 'openai' | 'anthropic';
}

export interface ChatResponse {
  content: string;
  model: string;
}

// Interface for Image generation request/response
export interface ImageRequest {
  prompt: string;
}

export interface ImageResponse {
  url: string;
  revisedPrompt?: string;
}

// Interface for Code generation request/response
export interface CodeRequest {
  prompt: string;
  language: string;
}

export interface CodeResponse {
  code: string;
  language: string;
}

/**
 * AI Service for interacting with AI endpoints
 */
export const AiService = {
  /**
   * Generate text response using AI chat models
   */
  async generateChat(request: ChatRequest): Promise<ChatResponse> {
    const response = await apiRequest('POST', '/api/ai/chat', request);
    return await response.json();
  },

  /**
   * Generate an image from a text prompt
   */
  async generateImage(request: ImageRequest): Promise<ImageResponse> {
    const response = await apiRequest('POST', '/api/ai/image', request);
    return await response.json();
  },

  /**
   * Generate code in the specified language from a text prompt
   */
  async generateCode(request: CodeRequest): Promise<CodeResponse> {
    const response = await apiRequest('POST', '/api/ai/code', request);
    return await response.json();
  }
};