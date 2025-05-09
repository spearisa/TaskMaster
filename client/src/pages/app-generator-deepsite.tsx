import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { 
  Copy, Download, Code, 
  LoaderCircle, FileCode2, 
  RefreshCw, Plus, Settings,
  ExternalLink, Maximize, MessageSquare
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

// File type interface
interface GeneratedFile {
  name: string;
  content: string;
  language: string;
}

export default function DeepSiteAppGenerator() {
  const { toast } = useToast();
  const { user } = useAuth();
  const askInputRef = useRef<HTMLInputElement>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement | null>(null);
  
  // State for the code content
  const [currentFileName, setCurrentFileName] = useState('index.html');
  const initialHtml = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta charset="utf-8">
  <title>My app</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      height: 100vh;
      font-family: Arial, sans-serif;
      text-align: center;
    }
    h1 {
      font-size: 50px;
    }
  </style>
</head>
<body>
  <div>
    <h1>I'm ready to work,</h1>
    <h1>Ask me anything.</h1>
  </div>
</body>
</html>`;
  const [fileContent, setFileContent] = useState(initialHtml);

  // State for file management
  const [files, setFiles] = useState<{[name: string]: string}>({
    'index.html': fileContent
  });
  
  // State for docker container 
  const [dockerStatus, setDockerStatus] = useState<{ 
    running: boolean;
    url?: string;
    message?: string;
    dockerCommand?: string;
  }>({
    running: false,
    message: 'DeepSite Docker not available',
    dockerCommand: `docker run -it -p 7860:7860 --platform=linux/amd64 \\
  -e OAUTH_CLIENT_ID="YOUR_VALUE_HERE" \\
  -e OAUTH_CLIENT_SECRET="YOUR_VALUE_HERE" \\
  -e DEFAULT_HF_TOKEN="YOUR_VALUE_HERE" \\
  -e APP_PORT="5173" \\
  -e REDIRECT_URI="https://enzostvs-deepsite.hf.space/auth/login" \\
  registry.hf.space/enzostvs-deepsite:latest`
  });

  // State for UI interactions
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewReady, setPreviewReady] = useState(true);
  
  // Effect to check docker status on mount
  useEffect(() => {
    const checkDockerStatus = async () => {
      try {
        // Check if DeepSite is running on localhost:7860
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        try {
          await fetch('http://localhost:7860/ping', { 
            method: 'GET',
            mode: 'no-cors',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          setDockerStatus({
            running: true,
            url: 'http://localhost:7860',
            message: 'DeepSite Docker running locally',
            dockerCommand: dockerStatus.dockerCommand
          });
          
          toast({
            title: "DeepSite Docker Running",
            description: "Original DeepSite container is accessible.",
          });
        } catch (error) {
          // Check with the backend
          try {
            const response = await fetch('/api/deepsite-status');
            const data = await response.json();
            setDockerStatus({
              running: data.running || false,
              message: data.message || 'DeepSite Docker not available',
              url: data.url,
              dockerCommand: data.dockerCommand
            });
          } catch (serverError) {
            console.error("Failed to check Docker status from server:", serverError);
            setDockerStatus({
              running: false,
              message: 'Error checking DeepSite status',
              dockerCommand: `docker run -it -p 7860:7860 --platform=linux/amd64 \\
  -e OAUTH_CLIENT_ID="YOUR_VALUE_HERE" \\
  -e OAUTH_CLIENT_SECRET="YOUR_VALUE_HERE" \\
  -e DEFAULT_HF_TOKEN="YOUR_VALUE_HERE" \\
  -e APP_PORT="5173" \\
  -e REDIRECT_URI="https://enzostvs-deepsite.hf.space/auth/login" \\
  registry.hf.space/enzostvs-deepsite:latest`
            });
          }
        }
      } catch (error) {
        console.error("Failed to check Docker status:", error);
      }
    };
    
    checkDockerStatus();
    
    // Focus on the code editor when mounted
    if (codeEditorRef.current) {
      codeEditorRef.current.focus();
    }
  }, [toast]);

  // Function to update file content
  const updateFile = (name: string, content: string) => {
    setFiles(prev => ({
      ...prev,
      [name]: content
    }));
    
    if (name === currentFileName) {
      setFileContent(content);
    }
  };

  // Function to select a file
  const selectFile = (name: string) => {
    setCurrentFileName(name);
    setFileContent(files[name] || '');
  };

  // Function to refresh preview
  const refreshPreview = () => {
    setIsRefreshing(true);
    setPreviewReady(false);
    
    // Short timeout to simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
      setPreviewReady(true);
    }, 500);
  };

  // Function to copy Docker command
  const copyDockerCommand = () => {
    const dockerCmd = dockerStatus.dockerCommand || `docker run -it -p 7860:7860 --platform=linux/amd64 \\
  -e OAUTH_CLIENT_ID="YOUR_VALUE_HERE" \\
  -e OAUTH_CLIENT_SECRET="YOUR_VALUE_HERE" \\
  -e DEFAULT_HF_TOKEN="YOUR_VALUE_HERE" \\
  -e APP_PORT="5173" \\
  -e REDIRECT_URI="https://enzostvs-deepsite.hf.space/auth/login" \\
  registry.hf.space/enzostvs-deepsite:latest`;
    
    navigator.clipboard.writeText(dockerCmd).then(() => {
      toast({
        title: "Docker Command Copied",
        description: "Run this command in a terminal to start DeepSite",
      });
    });
  };

  // Function to handle AI queries
  const handleAIQuery = async (query: string) => {
    if (!query.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // Call the backend to generate code using DeepSeek
      const enhancedPrompt = `Create a simple web application with HTML, CSS, and JavaScript based on this request: "${query}". 
      Please make it responsive and visually appealing. Provide complete HTML file with CSS and JavaScript embedded.`;
      
      console.log('Sending code generation request to DeepSeek...');
      
      let data;
      try {
        const response = await apiRequest('POST', '/api/ai/deepseek/generate', {
          prompt: enhancedPrompt,
          technology: 'html',
          appType: 'website',
          features: ['responsive']
        });
        
        if (!response.ok) {
          console.error('API error:', response.status, response.statusText);
          throw new Error(`Failed to generate code: ${response.status} ${response.statusText}`);
        }
        
        data = await response.json();
      } catch (apiError) {
        console.error('API request error:', apiError);
        throw apiError; // Re-throw to be caught by the outer try-catch
      }
      
      if (data.files && data.files.length > 0) {
        // Clear existing files
        setFiles({});
        
        // Add all generated files
        data.files.forEach((file: GeneratedFile) => {
          updateFile(file.name, file.content);
        });
        
        // Select the first file (usually index.html)
        const firstFile = data.files[0].name;
        selectFile(firstFile);
      } else if (data.generated_text) {
        // Extract code from raw text if no parsed files
        const htmlMatch = data.generated_text.match(/<html[^>]*>[\s\S]*<\/html>/i);
        
        if (htmlMatch) {
          const htmlContent = htmlMatch[0];
          updateFile('index.html', htmlContent);
          selectFile('index.html');
        } else {
          // Fallback if no HTML found
          updateFile('index.html', `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta charset="utf-8">
  <title>Generated App</title>
</head>
<body>
  <div>
    <h1>Generated Content</h1>
    <pre>${data.generated_text}</pre>
  </div>
</body>
</html>`);
          selectFile('index.html');
        }
      } else {
        throw new Error('No valid response from AI service');
      }
    } catch (error: unknown) {
      console.error('Error generating code:', error);
      
      let errorMessage = 'There was an error generating the code. Please try again.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Code Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // Fallback response
      const fallbackHtml = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta charset="utf-8">
  <title>AI Response</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
      margin: 0;
    }
    .container {
      text-align: center;
      padding: 20px;
      border-radius: 10px;
      background-color: white;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      max-width: 80%;
    }
    h1 {
      color: #333;
    }
    p {
      color: #666;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Response to: "${query}"</h1>
    <p>I couldn't generate a response through the AI service. This is a fallback template.</p>
    <p>Please check if the server is running properly and the API keys are set.</p>
  </div>
</body>
</html>`;
      
      updateFile('index.html', fallbackHtml);
      selectFile('index.html');
    } finally {
      setIsGenerating(false);
      refreshPreview();
      
      if (askInputRef.current) {
        askInputRef.current.value = '';
      }
    }
  };

  // Function to handle file content change
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setFileContent(newContent);
    updateFile(currentFileName, newContent);
  };

  // Function to open in DeepSite
  const openInDeepSite = () => {
    if (dockerStatus.running && dockerStatus.url) {
      window.open(dockerStatus.url, '_blank');
    } else {
      toast({
        title: "DeepSite not available",
        description: "Please start the Docker container first",
        variant: "destructive",
      });
    }
  };

  // Function to deploy to Space (simulation)
  const deployToSpace = () => {
    toast({
      title: "Deployment started",
      description: "Deploying to Hugging Face Space...",
    });
    
    setTimeout(() => {
      toast({
        title: "Deployment complete",
        description: "Your application has been deployed successfully!",
      });
    }, 3000);
  };

  // Helper function to render line numbers
  const renderLineNumbers = (code: string) => {
    const lines = code.split('\n');
    return lines.map((_, i) => (
      <div key={i} className="text-xs py-[1px] text-gray-500 pr-2 text-right select-none">
        {i + 1}
      </div>
    ));
  };

  // Function to determine syntax highlighting class
  const getSyntaxClass = (token: string, filename: string) => {
    if (filename.endsWith('.html') || filename.endsWith('.jsx') || filename.endsWith('.tsx')) {
      if (token.match(/^<\/?[a-z][\w-\.]*>/i)) return 'text-blue-400';
      if (token.includes('=')) return 'text-yellow-400';
      if (token.startsWith('<!--')) return 'text-gray-500';
    }
    
    if (filename.endsWith('.css')) {
      if (token.match(/^[a-z-]+:/)) return 'text-purple-400';
      if (token.match(/^[.#][a-z0-9_-]+/i)) return 'text-yellow-400';
    }
    
    if (filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.ts') || filename.endsWith('.tsx')) {
      if (token.match(/^(function|const|let|var|return|import|export|from|if|else|for|while)/)) 
        return 'text-purple-400';
      if (token.match(/^[0-9]+$/)) return 'text-yellow-400';
    }
    
    if (token.match(/".*?"|'.*?'/)) return 'text-green-400';
    
    return '';
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-neutral-800">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {/* DeepSeek Logo */}
            <div className="w-7 h-7 bg-white rounded-full p-1 flex items-center justify-center">
              <img 
                src="https://www.deepseek.com/_nuxt/deepseek-logo.52fcdf13.svg" 
                alt="DeepSeek Logo" 
                className="h-4 w-4"
              />
            </div>
            <span className="font-semibold text-white text-lg">DeepSite</span>
          </div>
          
          <div className="pl-4 flex items-center space-x-2">
            <button className="flex items-center space-x-1 bg-[#1a1a1a] hover:bg-[#252525] rounded-md px-2 py-1 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </button>
            <div className="text-xs text-gray-400">Imagine and Share in 1-Click</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center mr-2">
            <div className={`w-2 h-2 rounded-full mr-2 ${dockerStatus.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-gray-400">{dockerStatus.running ? 'Docker Running' : 'Docker Not Running'}</span>
          </div>
          
          <button 
            className="bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white rounded-md px-3 py-1 text-sm flex items-center"
            onClick={copyDockerCommand}
          >
            <Code className="h-3.5 w-3.5 mr-1" />
            <span>Copy Docker Command</span>
          </button>
          
          <button 
            className="bg-pink-600 hover:bg-pink-700 text-white rounded-md px-3 py-1 text-sm flex items-center"
            onClick={deployToSpace}
          >
            <span>Deploy to Space</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left side - Code Editor */}
        <div className="w-1/2 border-r border-neutral-800 flex flex-col overflow-hidden">
          <div className="border-b border-neutral-800 p-1 pl-3 bg-[#1a1a1a] flex items-center">
            <div className="text-sm text-gray-300 overflow-hidden overflow-ellipsis whitespace-nowrap">
              {currentFileName}
            </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden bg-[#1a1a1a]">
            {/* Line numbers */}
            <div className="py-1 bg-[#1a1a1a] border-r border-neutral-800 min-w-[40px]">
              {renderLineNumbers(fileContent)}
            </div>
            
            {/* Code editor */}
            <div className="flex-1 overflow-auto p-1">
              <textarea
                ref={codeEditorRef}
                value={fileContent}
                onChange={handleCodeChange}
                className="w-full h-full bg-transparent resize-none focus:outline-none text-gray-200 font-mono text-xs leading-5 p-0"
                spellCheck={false}
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Right side - Preview */}
        <div className="w-1/2 flex flex-col">
          <div className="border-b border-neutral-800 p-1 pl-3 flex items-center justify-between bg-[#1a1a1a]">
            <div className="text-sm text-gray-300">Preview</div>
            <div className="flex items-center">
              <button 
                className="ml-2 p-1 text-gray-400 hover:text-white"
                onClick={refreshPreview}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-white overflow-hidden">
            {previewReady ? (
              <iframe
                srcDoc={files['index.html'] || ''}
                title="Preview"
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <LoaderCircle className="h-8 w-8 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Chat Input */}
      <div className="p-2 border-t border-neutral-800 flex items-center">
        <div className="flex-1 relative">
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">
            <MessageSquare className="h-4 w-4" />
          </div>
          
          <input
            ref={askInputRef}
            className="w-full bg-[#252525] border-none rounded-full py-2 pl-9 pr-16 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Ask AI anything..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isGenerating) {
                handleAIQuery(e.currentTarget.value);
              }
            }}
            disabled={isGenerating}
          />
          
          <button
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            onClick={() => {
              if (askInputRef.current && !isGenerating) {
                handleAIQuery(askInputRef.current.value);
              }
            }}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <div className="bg-pink-600 rounded-full p-1">
                <Plus className="h-3 w-3 text-white" />
              </div>
            )}
          </button>
        </div>
        
        {/* Docker command button */}
        {!dockerStatus.running && (
          <button
            onClick={copyDockerCommand}
            className="ml-3 bg-blue-700 hover:bg-blue-600 text-white text-xs px-3 py-1.5 rounded-md flex items-center space-x-1"
          >
            <Copy className="h-3.5 w-3.5 mr-1" />
            <span>Copy Docker Command</span>
          </button>
        )}
        
        {/* Gallery button */}
        <button className="ml-3 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white text-xs px-3 py-1.5 rounded-md flex items-center">
          <span className="mr-1">🖼️</span>
          <span>DeepSite Gallery</span>
        </button>
        
        {/* Refresh Preview button */}
        <button
          onClick={refreshPreview}
          className="ml-3 bg-[#3d3d3d] hover:bg-[#4d4d4d] text-white text-xs px-3 py-1.5 rounded-md flex items-center"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          <span>Refresh Preview</span>
        </button>
      </div>
    </div>
  );
}