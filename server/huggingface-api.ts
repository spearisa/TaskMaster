import fetch from 'node-fetch';

/**
 * Hugging Face API integration to fetch trending and popular models
 * API documentation: https://huggingface.co/docs/hub/api
 */

const HUGGINGFACE_API_URL = 'https://huggingface.co/api';

// Model types based on Hugging Face classifications
export const MODEL_TYPES = [
  'text-generation',
  'text-classification',
  'token-classification',
  'question-answering',
  'summarization',
  'translation', 
  'image-classification',
  'image-segmentation',
  'object-detection',
  'image-to-text',
  'text-to-image',
  'speech-recognition',
  'text-to-speech',
  'tabular-classification',
  'tabular-regression',
  'zero-shot-classification',
  'feature-extraction'
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
  limit: number = 10,
  pipelineTag?: string,
  sort: 'downloads' | 'trending' | 'modified' = 'trending',
  direction: 'asc' | 'desc' = 'desc'
): Promise<HuggingFaceModel[]> {
  try {
    let url = `${HUGGINGFACE_API_URL}/models?limit=${limit}&sort=${sort}&direction=${direction}`;
    
    if (pipelineTag) {
      url += `&filter=${pipelineTag}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as HuggingFaceModel[];
    return data;
  } catch (error) {
    console.error('Error fetching trending models from Hugging Face:', error);
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
  limit: number = 10,
  pipelineTag?: string
): Promise<HuggingFaceModel[]> {
  try {
    let url = `${HUGGINGFACE_API_URL}/models?search=${encodeURIComponent(query)}&limit=${limit}`;
    
    if (pipelineTag) {
      url += `&filter=${pipelineTag}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as HuggingFaceModel[];
    return data;
  } catch (error) {
    console.error('Error searching models from Hugging Face:', error);
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
    const response = await fetch(`${HUGGINGFACE_API_URL}/models/${modelId}`);
    
    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as HuggingFaceModel;
    return data;
  } catch (error) {
    console.error(`Error fetching details for model ${modelId}:`, error);
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
): Promise<Record<string, HuggingFaceModel[]>> {
  try {
    const categories: Record<string, HuggingFaceModel[]> = {};
    
    // Get a subset of relevant model types
    const selectedCategories = MODEL_TYPES.slice(0, 8);
    
    for (const category of selectedCategories) {
      const models = await getTrendingModels(limit, category);
      categories[category] = models;
    }
    
    return categories;
  } catch (error) {
    console.error('Error fetching trending models by category:', error);
    return {};
  }
}