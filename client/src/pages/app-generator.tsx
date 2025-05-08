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
  RefreshCw, Image, Plus, Settings
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
  const { user } = useAuth();
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
          <button className="bg-[#1a1a1a] hover:bg-[#252525] text-white rounded-md px-3 py-1 text-xs font-medium">
            Load Space
          </button>
          <button className="bg-pink-600 hover:bg-pink-700 text-white rounded-md px-3 py-1 text-xs font-medium">
            Deploy to Space
          </button>
        </div>
      </div>

      {/* Main Content - 2 Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Code Editor */}
        <div className="w-1/2 border-r border-neutral-800 flex flex-col">
          <div className="flex items-center px-3 py-1 border-b border-neutral-800">
            <div className="text-gray-300 text-sm">index.html</div>
            <div className="ml-auto text-xs text-gray-500">Powered by 
              <img 
                src="https://www.deepseek.com/_nuxt/deepseek-logo.52fcdf13.svg" 
                alt="DeepSeek" 
                className="inline-block ml-1 h-3 w-3"
              />
              DeepSeek
            </div>
          </div>
          
          <div className="flex-1 bg-[#1a1a1a] overflow-auto">
            <div className="flex text-sm font-mono">
              <div className="flex-1 py-1 text-white">
                {isGenerating ? (
                  <div className="flex items-center justify-center h-full">
                    <LoaderCircle className="h-5 w-5 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-gray-400">Generating application...</span>
                  </div>
                ) : currentFile ? (
                  <div className="flex">
                    {renderLineNumbers(currentFile.content)}
                    {renderCode(currentFile.content, currentFile.language)}
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="p-4 space-y-5">
                      {/* App Description */}
                      <div className="space-y-2">
                        <div className="font-semibold text-white">App Description</div>
                        <Textarea
                          ref={promptTextareaRef}
                          placeholder="develop an app"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="min-h-[80px] resize-none bg-[#252525] border-none text-white focus:ring-blue-500 placeholder:text-gray-500 text-sm"
                        />
                        <p className="text-xs text-gray-400">
                          Be specific about features, functionality, and design preferences.
                          Will use OpenAI GPT-4o as fallback if DeepSeek is unavailable.
                        </p>
                      </div>
                      
                      {/* Technology and App Type */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="font-semibold text-white">Technology</div>
                          <Select value={technology} onValueChange={setTechnology}>
                            <SelectTrigger className="bg-[#252525] border-none text-white focus:ring-blue-500">
                              <SelectValue placeholder="Select technology" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#252525] border-neutral-700 text-white">
                              {TECHNOLOGIES.map((tech) => (
                                <SelectItem key={tech.value} value={tech.value} className="hover:bg-[#333]">
                                  {tech.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="font-semibold text-white">App Type</div>
                          <Select value={appType} onValueChange={setAppType}>
                            <SelectTrigger className="bg-[#252525] border-none text-white focus:ring-blue-500">
                              <SelectValue placeholder="Select app type" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#252525] border-neutral-700 text-white">
                              {APP_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value} className="hover:bg-[#333]">
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Features */}
                      <div className="space-y-2">
                        <div className="font-semibold text-white">Features</div>
                        <div className="grid grid-cols-2 gap-2">
                          {FEATURES.map((feature) => (
                            <div key={feature.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={feature.id}
                                checked={selectedFeatures.includes(feature.id)}
                                onCheckedChange={() => toggleFeature(feature.id)}
                                className="data-[state=checked]:bg-blue-500 border-gray-600"
                              />
                              <label
                                htmlFor={feature.id}
                                className="text-sm text-gray-300 leading-none cursor-pointer"
                              >
                                {feature.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Generate Button */}
                      <div className="pt-2">
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* File Tabs - Only shown when files are generated */}
          {generatedFiles.length > 0 && (
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
                <div className="flex items-center space-x-1">
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
            </div>
          )}
        </div>
        
        {/* Right Panel - Preview */}
        <div className="w-1/2 flex flex-col">
          {generatedFiles.length > 0 ? (
            <div className="flex-1 bg-[#1a1a1a] flex flex-col">
              <div className="flex items-center px-3 py-1 border-b border-neutral-800">
                <div className="text-gray-300 text-sm">Preview</div>
                <div className="ml-auto flex items-center space-x-2">
                  <button className="p-1 rounded hover:bg-[#333] text-gray-400 hover:text-white" title="Refresh preview">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 p-4 overflow-auto">
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
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#1a1a1a] text-center p-4">
              <div className="text-gray-400 text-xl mb-2">I'm ready to work,</div>
              <div className="text-white text-4xl font-bold mb-6">Ask me anything.</div>
              
              <div className="w-24 h-24 relative mb-8">
                <div 
                  className="w-10 h-10 absolute bottom-8 left-0"
                  style={{
                    transform: 'rotate(30deg)',
                    borderLeft: '2px solid #6b7280',
                    borderBottom: '2px solid #6b7280',
                    borderBottomLeftRadius: '50px'
                  }}
                />
              </div>
              
              <div className="flex items-center space-x-2 mt-auto">
                <button className="bg-gray-200 text-black rounded-md px-3 py-1.5 text-sm font-medium flex items-center">
                  <Image className="h-4 w-4 mr-1.5" />
                  DeepSite Gallery
                </button>
                <button className="bg-[#252525] hover:bg-[#333] text-white rounded-md px-3 py-1.5 text-sm font-medium flex items-center">
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  Refresh Preview
                </button>
              </div>
            </div>
          )}
          
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
      </div>
    </div>
  );
}