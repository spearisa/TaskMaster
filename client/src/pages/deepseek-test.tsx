import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// File type interface
interface GeneratedFile {
  name: string;
  content: string;
  language: string;
}

export default function DeepSeekTest() {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState('Create a simple calculator web app with HTML, CSS and JavaScript');
  const [isGenerating, setIsGenerating] = useState(false);
  const [responseData, setResponseData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  
  // The current file being viewed
  const [currentFile, setCurrentFile] = useState<GeneratedFile | null>(null);
  
  // Function to handle API test
  const handleTestApi = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Empty Prompt',
        description: 'Please enter a prompt to test the API.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    setResponseData(null);
    setFiles([]);
    setCurrentFile(null);
    
    try {
      console.log('Sending request to test DeepSeek API...');
      const response = await apiRequest('POST', '/api/ai/deepseek/generate', {
        prompt,
        technology: 'html',
        appType: 'website',
        features: ['responsive']
      });
      
      const data = await response.json();
      console.log('Response from DeepSeek API:', data);
      
      setResponseData(data);
      
      // Set files if available
      if (data.files && data.files.length > 0) {
        setFiles(data.files);
        setCurrentFile(data.files[0]);
      }
    } catch (apiError: any) {
      console.error('API request error:', apiError);
      setError(apiError.message || 'Unknown error occurred');
      toast({
        title: 'API Test Failed',
        description: apiError.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">DeepSeek API Test</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Test DeepSeek API</CardTitle>
          <CardDescription>
            Send a prompt to the DeepSeek API to test if it's working correctly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Prompt</label>
              <Textarea 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                className="h-32"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleTestApi}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing API...
              </>
            ) : 'Test DeepSeek API'}
          </Button>
        </CardFooter>
      </Card>
      
      {isGenerating && (
        <div className="my-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Generating code with DeepSeek API...</p>
          <p className="text-sm text-gray-500">This may take up to 30 seconds</p>
        </div>
      )}
      
      {error && (
        <Card className="mb-8 border-red-500">
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <pre className="text-red-500 whitespace-pre-wrap">{error}</pre>
          </CardContent>
        </Card>
      )}
      
      {responseData && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>API Response</CardTitle>
            <CardDescription>
              Raw response from the DeepSeek API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md overflow-auto max-h-60">
              <pre className="text-xs">{JSON.stringify(responseData, null, 2)}</pre>
            </div>
          </CardContent>
        </Card>
      )}
      
      {files.length > 0 && (
        <div className="space-y-6">
          <div className="bg-slate-100 dark:bg-slate-900 p-2 rounded-md">
            <div className="flex overflow-x-auto space-x-2 mb-2">
              {files.map((file, index) => (
                <button
                  key={index}
                  className={`px-3 py-1 text-sm rounded-md ${currentFile?.name === file.name 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                  onClick={() => setCurrentFile(file)}
                >
                  {file.name}
                </button>
              ))}
            </div>
            
            {currentFile && (
              <div className="relative">
                <pre className="p-4 rounded bg-slate-200 dark:bg-slate-800 overflow-auto max-h-96">
                  <code>{currentFile.content}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}