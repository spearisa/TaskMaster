
import axios from 'axios';

const DEEPSEEK_API_URL = 'https://api-inference.huggingface.co/models/deepseek-ai/deepseek-coder-33b-instruct';

export async function handleCodeGenerationRequest(prompt: string) {
  try {
    if (!process.env.HUGGINGFACE_API_TOKEN) {
      throw new Error('HUGGINGFACE_API_TOKEN is not set');
    }

    const response = await axios.post(
      DEEPSEEK_API_URL,
      { 
        inputs: prompt,
        parameters: {
          max_new_tokens: 2048,
          temperature: 0.7,
          top_p: 0.95,
          do_sample: true
        }
      },
      {
        headers: { 
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
      }
    );

    return {
      success: true,
      result: response.data
    };
  } catch (error: any) {
    console.error('DeepSeek API Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error || error.message
    };
  }
}
