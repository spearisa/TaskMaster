import fetch from 'node-fetch';

/**
 * Hugging Face API integration to fetch trending and popular models
 * API documentation: https://huggingface.co/docs/hub/api
 */

const HUGGINGFACE_API_URL = 'https://huggingface.co/api';

// Define common model pipeline types
export const MODEL_TYPES = [
  'text-generation',
  'text-to-image', 
  'image-to-text',
  'image-classification',
  'text-classification',
  'token-classification',
  'translation',
  'summarization',
  'question-answering',
  'fill-mask',
  'conversational',
  'feature-extraction',
  'zero-shot-classification',
  'text-to-speech',
  'sentence-similarity'
];

export interface HuggingFaceModel {
  id: string;
  modelId: string;
  author: string;
  name: string;
  private: boolean;
  likes: number;
  downloads: number;
  tags: string[];
  pipeline_tag: string;
  lastModified: string;
  library_name?: string;
  mask_token?: string;
  widgetData?: {
    [key: string]: any;
  };
  _id: string;
  createdAt: string;
  downloads_last_month?: number;
  siblings?: {
    rfilename: string;
  }[];
}

interface HuggingFaceSearchResponse {
  models: HuggingFaceModel[];
}

/**
 * Gets trending models from Hugging Face based on specified parameters
 * 
 * @param limit Number of models to retrieve
 * @param pipelineTag Filter by specific model pipeline/task
 * @param sort Sort method (downloads, trending, modified)
 * @param direction Sort direction (asc or desc)
 * @returns Array of HuggingFace models
 */
export async function getTrendingModels(
  limit: number = 20,
  pipelineTag?: string,
  sort: 'downloads' | 'trending' | 'likes' | 'modified' = 'downloads',
  direction: 'asc' | 'desc' = 'desc'
): Promise<HuggingFaceModel[]> {
  try {
    // Build query parameters
    let url = `${HUGGINGFACE_API_URL}/models?limit=${limit}&sort=${sort}&direction=${direction}`;

    // Add pipeline tag filter if provided
    if (pipelineTag && pipelineTag !== 'all') {
      url += `&filter=${pipelineTag}`;
    }

    // Fetch data from Hugging Face API
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    // Parse response
    const data = await response.json() as HuggingFaceModel[];

    // Transform to include modelId for easier reference
    return data.map(model => ({
      ...model,
      modelId: `${model.author}/${model.id}` // Format: username/modelname
    }));
  } catch (error) {
    console.error('Error fetching trending models:', error);
    return [];
  }
}

/**
 * Searches Hugging Face models based on query and parameters
 * 
 * @param query Search query
 * @param limit Number of models to retrieve
 * @param pipelineTag Filter by specific model pipeline/task 
 * @returns Matching models
 */
export async function searchModels(
  query: string,
  limit: number = 20,
  pipelineTag?: string
): Promise<HuggingFaceModel[]> {
  try {
    // Build query parameters
    let url = `${HUGGINGFACE_API_URL}/models?search=${encodeURIComponent(query)}&limit=${limit}`;

    // Add pipeline tag filter if provided
    if (pipelineTag && pipelineTag !== 'all') {
      url += `&filter=${pipelineTag}`;
    }

    // Fetch data from Hugging Face API
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    // Parse response
    const data = await response.json() as HuggingFaceModel[];

    // Transform to include modelId for easier reference
    return data.map(model => ({
      ...model,
      modelId: `${model.author}/${model.id}` // Format: username/modelname
    }));
  } catch (error) {
    console.error('Error searching models:', error);
    return [];
  }
}

/**
 * Gets detailed information about a specific Hugging Face model
 * 
 * @param modelId The model ID (author/model-name format)
 * @returns Detailed model information
 */
export async function getModelDetails(modelId: string): Promise<HuggingFaceModel | null> {
  try {
    // Split model ID into author and model name
    const [author, modelName] = modelId.split('/');

    // Fetch model details from Hugging Face API
    const response = await fetch(`${HUGGINGFACE_API_URL}/models/${modelId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    // Parse response
    const data = await response.json();

    // Add modelId field for consistency
    return {
      ...data,
      modelId
    };
  } catch (error) {
    console.error(`Error fetching model details for ${modelId}:`, error);
    return null;
  }
}

/**
 * Gets README content for a specific Hugging Face model
 * 
 * @param modelId The model ID (author/model-name format)
 * @returns README content or null if not found
 */
export async function getModelReadme(modelId: string): Promise<{ content: string } | null> {
  try {
    // Make API request to get README
    const response = await fetch(`${HUGGINGFACE_API_URL}/models/${modelId}/readme`, {
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`
      }
    });

    if (!response.ok) {
      return null; // Not all models have README files
    }

    // Parse response
    const data = await response.json() as { content: string };
    return data;
  } catch (error) {
    console.error(`Error fetching README for ${modelId}:`, error);
    return null;
  }
}

/**
 * Groups trending models by category
 * 
 * @param limit Number of models per category 
 * @returns Object with models grouped by pipeline tag
 */
export async function getTrendingModelsByCategory(
  limit: number = 5
): Promise<{ [category: string]: HuggingFaceModel[] }> {
  try {
    const result: { [category: string]: HuggingFaceModel[] } = {};

    // Get models for each pipeline type
    for (const type of MODEL_TYPES) {
      const models = await getTrendingModels(limit, type);
      if (models.length > 0) {
        result[type] = models;
      }
    }

    return result;
  } catch (error) {
    console.error('Error fetching trending models by category:', error);
    return {};
  }
}