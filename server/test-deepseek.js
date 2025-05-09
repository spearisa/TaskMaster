import { generateCodeWithDeepSeek } from './deepseek-service.js';

async function testDeepSeekApi() {
  console.log('Testing DeepSeek API...');
  
  // Check environment variables
  console.log('\nEnvironment Variables:');
  console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? 'Set (length: ' + process.env.DEEPSEEK_API_KEY.length + ')' : 'Not set');
  console.log('HUGGINGFACE_API_TOKEN:', process.env.HUGGINGFACE_API_TOKEN ? 'Set (length: ' + process.env.HUGGINGFACE_API_TOKEN.length + ')' : 'Not set');
  console.log('HUGGINGFACE_API_KEY:', process.env.HUGGINGFACE_API_KEY ? 'Set (length: ' + process.env.HUGGINGFACE_API_KEY.length + ')' : 'Not set');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'Not set');
  
  try {
    console.log('\nMaking request to DeepSeek API...');
    
    const result = await generateCodeWithDeepSeek({
      prompt: 'Create a simple "Hello World" web page with basic styling.',
      technology: 'html',
      appType: 'website',
      features: ['responsive']
    });
    
    console.log('\nSuccessfully received response from DeepSeek API!');
    console.log('Generated text length:', result.generated_text?.length || 0);
    console.log('Number of files generated:', result.files?.length || 0);
    
    if (result.files && result.files.length > 0) {
      console.log('\nGenerated Files:');
      result.files.forEach((file, index) => {
        console.log(`File ${index + 1}: ${file.name} (${file.language}) - ${file.content.length} bytes`);
      });
    }
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('\nTest failed with error:', error.message);
    console.error('\nFull error details:', error);
  }
}

// Run the test
testDeepSeekApi();