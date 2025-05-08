import React, { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Copy, Download, Code, 
  LoaderCircle, FileCode2, Eye,
  RefreshCw, Image, Plus, Settings,
  ExternalLink, Sparkles
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

// Technology options
const TECHNOLOGIES = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'angular', label: 'Angular' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'nextjs', label: 'Next.js' },
  { value: 'nodejs', label: 'Node.js' },
  { value: 'express', label: 'Express' },
  { value: 'fastapi', label: 'FastAPI' },
  { value: 'flask', label: 'Flask' },
  { value: 'django', label: 'Django' },
];

// App types
const APP_TYPES = [
  { value: 'web', label: 'Web Application' },
  { value: 'api', label: 'API / Backend' },
  { value: 'mobile', label: 'Mobile App' },
  { value: 'desktop', label: 'Desktop App' },
  { value: 'fullstack', label: 'Full Stack App' },
];

// Feature options
const FEATURES = [
  { id: 'auth', label: 'Authentication' },
  { id: 'database', label: 'Database Integration' },
  { id: 'api', label: 'REST API' },
  { id: 'responsive', label: 'Responsive Design' },
  { id: 'payments', label: 'Payment Processing' },
  { id: 'search', label: 'Search Functionality' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'analytics', label: 'Analytics' },
];

// File type interface
interface GeneratedFile {
  name: string;
  content: string;
  language: string;
}

export default function AppGenerator() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Form state
  const [prompt, setPrompt] = useState('');
  const [technology, setTechnology] = useState('react');
  const [appType, setAppType] = useState('web');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [activeFile, setActiveFile] = useState('');
  const [showDeepSiteReference, setShowDeepSiteReference] = useState(false);
  
  // Focus on prompt textarea on component mount
  useEffect(() => {
    if (promptTextareaRef.current) {
      promptTextareaRef.current.focus();
    }
  }, []);
  
  // Toggle feature selection
  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };
  
  // Copy file content to clipboard
  const copyFileContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: "File content copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };
  
  // Download a single file
  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Download all files as individual files
  const downloadAllFiles = () => {
    generatedFiles.forEach(file => {
      downloadFile(file.name, file.content);
    });
    
    toast({
      title: "Downloads started",
      description: `Downloading ${generatedFiles.length} files`,
    });
  };
  
  // Generate app code
  const generateApp = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please describe your application",
        variant: "destructive",
      });
      return;
    }
    
    // For demo purposes, since the API might not be working fully
    // We'll use mock data if authentication is not available
    if (!user && !isLoading) {
      toast({
        title: "Demo Mode",
        description: "Generating sample app (not connected to API)",
      });
      
      // Set loading state
      setIsGenerating(true);
      setGeneratedFiles([]);
      
      // Simulate API delay
      setTimeout(() => {
        // Mock data for demonstration
        const mockFiles = [
          {
            name: "my-app/public/index.html",
            content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>React App</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
            language: "html"
          },
          {
            name: "my-app/src/index.js",
            content: `import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);`,
            language: "javascript"
          },
          {
            name: "my-app/src/App.js",
            content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>${prompt || "My React App"}</h1>
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
      </header>
    </div>
  );
}

export default App;`,
            language: "javascript"
          },
          {
            name: "my-app/src/App.css",
            content: `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}`,
            language: "css"
          },
          {
            name: "my-app/package.json",
            content: `{
  "name": "my-app",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}`,
            language: "json"
          }
        ];
        
        setGeneratedFiles(mockFiles);
        setActiveFile(mockFiles[0].name);
        
        toast({
          title: "Code generation complete",
          description: `Generated ${mockFiles.length} files using DeepSeek (demo)`,
        });
        
        setIsGenerating(false);
      }, 2000);
      
      return;
    }
    
    // Normal API flow
    setIsGenerating(true);
    setGeneratedFiles([]);
    
    try {
      const response = await apiRequest("POST", "/api/ai/deepseek/generate", {
        prompt,
        technology,
        appType,
        features: selectedFeatures,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate code");
      }
      
      const data = await response.json();
      
      if (data.files && data.files.length > 0) {
        setGeneratedFiles(data.files);
        setActiveFile(data.files[0].name);
        
        toast({
          title: "Code generation complete",
          description: `Generated ${data.files.length} files using ${data.provider || 'AI'}`,
        });
      } else {
        throw new Error("No files were generated");
      }
    } catch (error) {
      console.error("Code generation error:", error);
      toast({
        title: "API Configuration Error",
        description: error instanceof Error ? error.message : "Failed to generate code",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Get currently active file
  const currentFile = generatedFiles.find(file => file.name === activeFile);
  
  // Function to render line numbers for code
  const renderLineNumbers = (code: string) => {
    const lines = code.split('\n');
    return (
      <div className="line-numbers pr-4 text-right select-none text-gray-500 mr-2 border-r border-gray-700">
        {lines.map((_, i) => (
          <div key={i + 1} className="leading-5 text-xs px-2 py-[1px]">
            {i + 1}
          </div>
        ))}
      </div>
    );
  };
  
  // Renders code with proper styling
  const renderCode = (code: string, language: string) => {
    const lines = code.split('\n');
    
    const getTokenClass = (token: string, lang: string) => {
      if (lang === 'html' || lang === 'jsx' || lang === 'tsx') {
        if (token.startsWith('<') && token.includes('>')) return 'text-blue-400';
        if (token.startsWith('import') || token.startsWith('export')) return 'text-purple-400'; 
        if (token.startsWith('function') || token.startsWith('const')) return 'text-purple-400';
      }
      
      if (token.startsWith('"') || token.startsWith("'")) return 'text-green-400';
      if (!isNaN(Number(token))) return 'text-yellow-400';
      if (token === 'return' || token === 'if' || token === 'else') return 'text-purple-400';
      
      return '';
    };
    
    return (
      <div className="code-content overflow-x-auto">
        {lines.map((line, i) => {
          // Simple syntax highlighting
          const tokens = line.split(/(\s+)/).filter(Boolean);
          return (
            <div key={i} className="leading-5 text-xs py-[1px] pl-2">
              {tokens.map((token, j) => (
                <span key={j} className={getTokenClass(token, language)}>
                  {token}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#121212]">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between p-3 bg-black text-white border-b border-neutral-800">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {/* DeepSeek logo */}
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
          <button className="flex items-center space-x-1 text-xs text-gray-300">
            <Code className="h-3.5 w-3.5" />
            <span>Docs</span>
          </button>
          <button className="flex items-center space-x-1 text-xs text-gray-300">
            <Settings className="h-3.5 w-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Input & Controls */}
        <div className="w-1/2 flex flex-col border-r border-neutral-800">
          {/* Tabs */}
          <Tabs defaultValue="prompt" className="w-full">
            <div className="border-b border-neutral-800 px-2">
              <TabsList className="bg-transparent border-b border-transparent h-auto p-0">
                <TabsTrigger 
                  value="prompt" 
                  className="px-3 py-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-pink-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-400 text-xs"
                >
                  Prompt
                </TabsTrigger>
                <TabsTrigger 
                  value="settings" 
                  className="px-3 py-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-pink-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-400 text-xs"
                >
                  Settings
                </TabsTrigger>
                <TabsTrigger 
                  value="advanced" 
                  className="px-3 py-2 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-pink-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:text-white text-gray-400 text-xs"
                >
                  Advanced
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="prompt" className="p-4 mt-0 border-none">
              <div className="flex flex-col space-y-4">
                <Textarea
                  ref={promptTextareaRef}
                  placeholder="Describe the application you want to create..."
                  className="flex-1 min-h-[200px] bg-[#1a1a1a] text-white border-neutral-700"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="p-4 mt-0 border-none">
              <div className="flex flex-col space-y-4">
                {/* Technology selection */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Technology</label>
                  <Select
                    value={technology}
                    onValueChange={setTechnology}
                    disabled={isGenerating}
                  >
                    <SelectTrigger className="bg-[#1a1a1a] border-neutral-700 text-white">
                      <SelectValue placeholder="Select a technology" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-neutral-700 text-white">
                      {TECHNOLOGIES.map((tech) => (
                        <SelectItem key={tech.value} value={tech.value}>
                          {tech.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* App type selection */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Application Type</label>
                  <Select
                    value={appType}
                    onValueChange={setAppType}
                    disabled={isGenerating}
                  >
                    <SelectTrigger className="bg-[#1a1a1a] border-neutral-700 text-white">
                      <SelectValue placeholder="Select an app type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-neutral-700 text-white">
                      {APP_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Feature checkboxes */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Features</label>
                  <div className="grid grid-cols-2 gap-2">
                    {FEATURES.map((feature) => (
                      <div
                        key={feature.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={feature.id}
                          checked={selectedFeatures.includes(feature.id)}
                          onCheckedChange={() => toggleFeature(feature.id)}
                          disabled={isGenerating}
                          className="data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
                        />
                        <label
                          htmlFor={feature.id}
                          className="text-xs text-gray-300 cursor-pointer"
                        >
                          {feature.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="p-4 mt-0 border-none">
              <div className="flex flex-col space-y-4">
                <div className="text-sm text-gray-300">
                  Advanced settings will be available in the future.
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Generate Button */}
          <div className="p-4 border-t border-neutral-800">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={generateApp} 
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Code className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? "Generating App..." : "Generate Application"}
            </Button>
          </div>
          
          {/* Code Panel - Only shown when files are generated */}
          {generatedFiles.length > 0 && (
            <div className="flex-1 bg-[#1a1a1a] flex flex-col overflow-hidden">
              <div className="flex items-center px-3 py-1 border-b border-neutral-800">
                <div className="text-sm text-white">
                  {activeFile}
                </div>
                <div className="ml-auto flex items-center space-x-2">
                  {currentFile && (
                    <>
                      <button
                        onClick={() => copyFileContent(currentFile.content)}
                        className="p-1 rounded hover:bg-[#333] text-gray-400 hover:text-white"
                        title="Copy file content"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => downloadFile(currentFile.name, currentFile.content)}
                        className="p-1 rounded hover:bg-[#333] text-gray-400 hover:text-white" 
                        title="Download file"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={downloadAllFiles}
                    className="p-1 rounded hover:bg-[#333] text-gray-400 hover:text-white"
                    title="Download all files"
                  >
                    <FileCode2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 p-2 overflow-auto">
                {currentFile ? (
                  <div className="flex font-mono text-white bg-[#252525] rounded-md overflow-hidden h-full">
                    {renderLineNumbers(currentFile.content)}
                    {renderCode(currentFile.content, currentFile.language)}
                  </div>
                ) : (
                  <div className="text-center p-4 text-gray-400">
                    Select a file to view its content
                  </div>
                )}
              </div>
              
              {/* File Tabs - Only shown when files are generated */}
              <div className="bg-[#252525] border-t border-neutral-800">
                <div className="p-2 text-sm text-gray-300 flex items-center space-x-2">
                  <FileCode2 className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {generatedFiles.map((file) => (
                        <button
                          key={file.name}
                          className={`w-full text-left px-2 py-1 text-xs rounded flex items-center space-x-2 ${
                            activeFile === file.name ? 'bg-[#333] text-white' : 'text-gray-400 hover:bg-[#2a2a2a]'
                          }`}
                          onClick={() => setActiveFile(file.name)}
                        >
                          <FileCode2 className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
                          <span className="truncate">{file.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel - Preview */}
        <div className="w-1/2 flex flex-col">
          {generatedFiles.length > 0 ? (
            <div className="flex-1 bg-[#1a1a1a] flex flex-col">
              {/* Preview Tab Navigation */}
              <div className="flex border-b border-neutral-800">
                <button className="px-3 py-1 text-xs font-medium border-b-2 border-pink-600 text-white">
                  App Preview
                </button>
                <button className="px-3 py-1 text-xs font-medium text-gray-400 hover:text-gray-300">
                  Files
                </button>
                <button className="px-3 py-1 text-xs font-medium text-gray-400 hover:text-gray-300">
                  Logs
                </button>
                <div className="ml-auto flex items-center space-x-2 mr-2">
                  <button 
                    onClick={() => setShowDeepSiteReference(!showDeepSiteReference)}
                    className="text-xs flex items-center space-x-1 text-gray-400 hover:text-gray-300"
                  >
                    <Eye className="h-3 w-3" />
                    <span>{showDeepSiteReference ? 'Hide' : 'Show'} Reference</span>
                  </button>
                </div>
              </div>

              {showDeepSiteReference ? (
                <iframe 
                  src="https://deepsite.deepseek.com/" 
                  className="w-full h-full border-none flex-1" 
                  title="DeepSite Reference"
                />
              ) : (
                <div className="flex flex-col flex-1">
                  {/* App Live Preview */}
                  <div className="flex-1 bg-white overflow-auto">
                    {/* Simulate app rendering based on generated files */}
                    {generatedFiles.some(f => f.name.includes('index.html') || f.name.includes('App.js') || f.name.includes('App.tsx')) ? (
                      <div className="w-full h-full">
                        <div className="flex flex-col items-center justify-center h-full text-black p-4">
                          <h1 className="text-xl font-bold mb-4">{prompt || "My Application"}</h1>
                          <div className="max-w-md w-full shadow-lg rounded-lg overflow-hidden border border-gray-200">
                            <div className="bg-gray-100 px-4 py-2 flex items-center border-b border-gray-200">
                              <div className="flex space-x-1">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              </div>
                              <div className="mx-auto text-xs text-gray-500">App Preview</div>
                            </div>
                            <div className="bg-white p-4">
                              {/* Dynamically generated content based on files */}
                              <div className="flex flex-col space-y-4">
                                <p className="text-gray-700">Your {technology || "application"} app for {prompt || "your needs"} is running.</p>
                                
                                {generatedFiles.some(f => f.name.includes('.css') || f.name.includes('.html')) && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-blue-100 rounded-md text-blue-800 text-center">
                                      Button 1
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-md text-green-800 text-center">
                                      Button 2
                                    </div>
                                  </div>
                                )}
                                
                                {generatedFiles.some(f => f.name.includes('App.js') || f.name.includes('App.tsx') || f.name.includes('index.js')) && (
                                  <div className="border border-gray-200 rounded-md p-3">
                                    <h3 className="font-medium text-gray-900 mb-2">Interactive Components</h3>
                                    <div className="flex items-center space-x-2 mb-2">
                                      <input type="checkbox" className="rounded" />
                                      <span className="text-sm">Task 1</span>
                                    </div>
                                    <div className="flex items-center space-x-2 mb-2">
                                      <input type="checkbox" className="rounded" defaultChecked />
                                      <span className="text-sm line-through">Task 2</span>
                                    </div>
                                    <button className="w-full mt-2 bg-blue-500 text-white py-1 px-3 rounded text-sm">
                                      Add New Task
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-8 flex space-x-4">
                            <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2">
                              <ExternalLink className="h-4 w-4" />
                              <span>Deploy to Space</span>
                            </button>
                            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center space-x-2">
                              <Download className="h-4 w-4" />
                              <span>Download All Files</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-gray-400 text-center">
                          <p className="mb-2">No preview available for the selected file.</p>
                          <p className="text-sm">Select a web or UI file to see a preview.</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Deployment Status Bar */}
                  <div className="p-2 bg-[#252525] border-t border-neutral-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-xs text-green-400">App running</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="bg-[#333] hover:bg-[#444] text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                          <RefreshCw className="h-3 w-3" />
                          <span>Restart</span>
                        </button>
                        <button className="bg-pink-600 hover:bg-pink-700 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                          <ExternalLink className="h-3 w-3" />
                          <span>Open in New Tab</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-[#1a1a1a] flex flex-col">
              <div className="flex items-center px-3 py-1 border-b border-neutral-800">
                <div className="text-gray-300 text-sm">Preview</div>
                <div className="ml-auto flex items-center space-x-2">
                  <button 
                    onClick={() => setShowDeepSiteReference(!showDeepSiteReference)}
                    className="text-xs flex items-center space-x-1 text-gray-400 hover:text-gray-300"
                  >
                    <Eye className="h-3 w-3" />
                    <span>{showDeepSiteReference ? 'Hide' : 'Show'} Reference</span>
                  </button>
                </div>
              </div>
              
              {showDeepSiteReference ? (
                <iframe 
                  src="https://deepsite.deepseek.com/" 
                  className="w-full h-full border-none flex-1" 
                  title="DeepSite Reference"
                />
              ) : (
                <div className="flex-1 p-4 overflow-auto">
                  <div className="text-gray-400 mb-4 text-center">
                    <Sparkles className="h-10 w-10 mx-auto mb-2 text-blue-500" />
                    <h3 className="text-lg font-semibold text-gray-300 mb-1">Preview Your App Here</h3>
                    <p className="max-w-md mx-auto text-sm">
                      Once you generate your app, you'll be able to preview it and see how it works right in this panel.
                    </p>
                  </div>
                  <div className="mt-8 border border-dashed border-gray-700 rounded-md p-4 mx-auto max-w-sm">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">How it works:</h4>
                    <ul className="text-xs text-gray-400 text-left list-disc pl-4 space-y-1">
                      <li>Describe your app on the left</li>
                      <li>Choose your technology and app type</li>
                      <li>Click "Generate App" button</li>
                      <li>Preview, modify and deploy your app</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Project info section if we have files */}
          {generatedFiles.length > 0 && !showDeepSiteReference && (
            <div className="p-4 overflow-auto border-t border-neutral-800 bg-[#1a1a1a]">
              <div className="space-y-4">
                <div className="bg-[#252525] rounded-md overflow-hidden border border-neutral-700">
                  <div className="border-b border-neutral-700 px-3 py-2 bg-[#212121] text-sm font-medium text-white">
                    Project Structure
                  </div>
                  <div className="p-3 font-mono text-xs text-white whitespace-pre">
                    {generatedFiles.map((file, i) => {
                      const parts = file.name.split('/');
                      let prefix = '';
                      
                      if (parts.length > 1) {
                        for (let j = 0; j < parts.length - 1; j++) {
                          prefix += '  ';
                        }
                        prefix += '└─ ';
                      } else {
                        prefix = '├─ ';
                      }
                      
                      return (
                        <div key={file.name} className="py-0.5">
                          {prefix}
                          <span className={activeFile === file.name ? 'text-blue-400' : 'text-gray-300'}>
                            {parts[parts.length - 1]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="bg-[#252525] rounded-md overflow-hidden border border-neutral-700">
                  <div className="border-b border-neutral-700 px-3 py-2 bg-[#212121] text-sm font-medium text-white">
                    Technology Stack
                  </div>
                  <div className="p-3 text-xs text-gray-300 space-y-2">
                    <div>
                      <span className="text-gray-500">Primary:</span> {technology}
                    </div>
                    <div>
                      <span className="text-gray-500">Application Type:</span> {appType}
                    </div>
                    {selectedFeatures.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-gray-500">Features:</span>
                        <ul className="list-disc pl-5 space-y-0.5">
                          {selectedFeatures.map((featureId) => (
                            <li key={featureId} className="text-xs text-gray-300">
                              {FEATURES.find((f) => f.id === featureId)?.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom input bar */}
      <div className="p-2 border-t border-neutral-800 flex items-center bg-black">
        <div className="flex-1 relative">
          <button className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500">
            <Settings className="h-4 w-4" />
          </button>
          <input 
            className="w-full bg-[#252525] border-none rounded-full py-2 pl-9 pr-9 text-sm text-white placeholder-gray-500 focus:ring-blue-500"
            placeholder="Ask AI anything..."
            disabled={isGenerating}
          />
          <button className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-pink-600 p-1">
            <Plus className="h-3.5 w-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}