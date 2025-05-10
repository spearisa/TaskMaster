// Simple script to validate API keys without running the full app
import axios from 'axios';

async function testApiKey(name, key, testEndpoint, options = {}) {
  console.log(`\nTesting ${name} API key: ${key ? key.substring(0, 4) + '...' + key.substring(key.length - 4) : 'NOT SET'}`);
  console.log(`Key length: ${key ? key.length : 0} characters`);
  
  if (!key) {
    console.log(`❌ ${name} API key is not set`);
    return false;
  }
  
  try {
    const headers = {
      'Authorization': options.authPrefix ? `${options.authPrefix} ${key}` : `Bearer ${key}`,
      'Content-Type': 'application/json'
    };
    
    console.log(`Making test request to: ${testEndpoint}`);
    console.log('Headers:', {
      'Authorization': headers.Authorization.replace(key, '[REDACTED]'),
      'Content-Type': headers['Content-Type']
    });
    
    const response = await axios.get(testEndpoint, {
      headers,
      validateStatus: () => true, // Accept any status to check for auth errors specifically
      timeout: 10000
    });
    
    console.log(`Response status: ${response.status}`);
    
    if (response.status === 200 || response.status === 201) {
      console.log(`✅ ${name} API key is valid`);
      return true;
    } else if (response.status === 401 || response.status === 403) {
      console.log(`❌ ${name} API key is invalid (Authentication error)`);
      console.log('Error details:', response.data);
      return false;
    } else {
      console.log(`⚠️ ${name} API key test returned status ${response.status}`);
      console.log('Response data:', response.data);
      return false;
    }
  } catch (error) {
    console.log(`❌ Error testing ${name} API key:`, error.message);
    return false;
  }
}

async function main() {
  console.log('API Key Validation Tool');
  console.log('=====================');
  
  // Test DeepSeek API Key
  const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  
  // Verify key format first
  if (deepseekApiKey) {
    if (!deepseekApiKey.startsWith('sk-')) {
      console.log('\n⚠️ WARNING: DeepSeek API key has incorrect format!');
      console.log('DeepSeek API keys should start with "sk-"');
      console.log(`Your key starts with: ${deepseekApiKey.substring(0, 4)}...`);
      console.log('This will likely cause authentication errors.');
    }
  }
  
  await testApiKey(
    'DeepSeek', 
    deepseekApiKey, 
    'https://api.deepseek.com/v1/models', // This endpoint may need to be updated based on their API docs
    { authPrefix: 'Bearer' } // Use Bearer prefix as required by DeepSeek API
  );
  
  // Try alternative endpoints if available
  if (deepseekApiKey) {
    console.log('\nTrying alternative DeepSeek endpoints to verify API key...');
    await testApiKey(
      'DeepSeek (Completions)', 
      deepseekApiKey, 
      'https://api.deepseek.com/v1/chat/completions',
      { authPrefix: 'Bearer' }
    );
  }
  
  // Test Hugging Face API Key/Token
  const hfApiKey = process.env.HUGGINGFACE_API_KEY;
  const hfApiToken = process.env.HUGGINGFACE_API_TOKEN;
  
  await testApiKey(
    'Hugging Face API Key', 
    hfApiKey, 
    'https://huggingface.co/api/models'
  );
  
  await testApiKey(
    'Hugging Face API Token', 
    hfApiToken, 
    'https://huggingface.co/api/models'
  );
  
  console.log('\nAPI Key validation complete. See above for results.');
}

main();