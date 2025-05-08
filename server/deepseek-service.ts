import axios from 'axios';

const DEEPSEEK_API_URL = 'https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-V3-0324';

export async function handleCodeGenerationRequest(prompt: string) {
  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      { inputs: prompt },
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