import { useState } from 'react';
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
import { Copy, Download, Code, LoaderCircle, FileCode2, Eye } from 'lucide-react';
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
  
  return (
    <div className="container max-w-6xl mx-auto pt-2 pb-6">
      <div className="flex items-center space-x-2 mb-2">
        <div className="text-3xl font-bold">AI App Generator</div>
        <div className="text-sm text-muted-foreground ml-2">webview</div>
      </div>
      
      <p className="text-muted-foreground mb-6">
        Generate complete application code using DeepSeek AI. Describe your app and let DeepSeek build it for you.
      </p>
      
      {/* DeepSite Reference iframe */}
      {showDeepSiteReference && (
        <div className="mb-6 border rounded-md overflow-hidden">
          <div className="bg-black text-white py-2 px-4 flex items-center">
            <div className="rounded-full bg-white p-1 mr-2">
              <img 
                src="https://huggingface.co/datasets/huggingface/brand-assets/resolve/main/hf-logo.svg" 
                alt="HuggingFace Logo" 
                className="h-4 w-4"
              />
            </div>
            <div className="text-sm font-medium">DeepSite Reference Implementation</div>
          </div>
          <iframe 
            src="https://huggingface-projects-deepsite.hf.space/" 
            width="100%" 
            height="700px" 
            style={{ border: "none" }}
            allow="clipboard-write; fullscreen"
            title="DeepSite Reference Implementation"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          />
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="border rounded-md overflow-hidden">
          <div className="p-4 border-b">
            <div className="font-medium text-lg">App Requirements</div>
            <div className="text-sm text-muted-foreground mt-1">
              Describe the application you want to build and configure its settings. 
              Powered by DeepSeek AI model with OpenAI GPT-4o fallback.
            </div>
          </div>
          <div className="p-4 space-y-5">
            {/* App Description */}
            <div className="space-y-2">
              <div className="font-medium">App Description</div>
              <Textarea
                placeholder="develop an app"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about features, functionality, and design preferences.
                Will use OpenAI GPT-4o as fallback if DeepSeek is unavailable.
              </p>
            </div>
            
            {/* Technology and App Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="font-medium">Technology</div>
                <Select value={technology} onValueChange={setTechnology}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select technology" />
                  </SelectTrigger>
                  <SelectContent>
                    {TECHNOLOGIES.map((tech) => (
                      <SelectItem key={tech.value} value={tech.value}>
                        {tech.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <div className="font-medium">App Type</div>
                <Select value={appType} onValueChange={setAppType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select app type" />
                  </SelectTrigger>
                  <SelectContent>
                    {APP_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Features */}
            <div className="space-y-2">
              <div className="font-medium">Features</div>
              <div className="grid grid-cols-2 gap-2">
                {FEATURES.map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={feature.id}
                      checked={selectedFeatures.includes(feature.id)}
                      onCheckedChange={() => toggleFeature(feature.id)}
                    />
                    <label
                      htmlFor={feature.id}
                      className="text-sm leading-none cursor-pointer"
                    >
                      {feature.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="pt-2 space-y-3">
              <Button 
                className="w-full" 
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
              
              <Button 
                variant="outline" 
                type="button"
                className="w-full"
                onClick={() => setShowDeepSiteReference(prev => !prev)}
              >
                <Eye className="mr-2 h-4 w-4" />
                {showDeepSiteReference ? "Hide DeepSite Reference" : "Show DeepSite Reference"}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Output Section */}
        <div className="border rounded-md overflow-hidden">
          <div className="p-4 border-b">
            <div className="font-medium text-lg">Generated Code</div>
            <div className="text-sm text-muted-foreground mt-1">
              {generatedFiles.length > 0 
                ? `Generated ${generatedFiles.length} files for your application` 
                : "Your generated code will appear here"}
            </div>
          </div>
          
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <LoaderCircle className="h-12 w-12 animate-spin mb-4 text-primary" />
              <div className="text-lg font-medium">Generating Your Application</div>
              <p className="text-sm text-muted-foreground mt-2">
                This may take a minute or two depending on the complexity...
              </p>
            </div>
          ) : generatedFiles.length > 0 ? (
            <Tabs defaultValue="files" className="w-full">
              <TabsList className="w-full rounded-none border-b px-4">
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="files" className="px-4 py-3">
                <div className="border rounded-md mb-4">
                  <div className="p-2 bg-muted flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileCode2 className="h-4 w-4" />
                      <span className="text-sm font-medium">File Explorer</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={downloadAllFiles}
                      title="Download all files"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-border">
                    {generatedFiles.map((file) => (
                      <button
                        key={file.name}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center space-x-2 hover:bg-muted ${
                          activeFile === file.name ? 'bg-muted' : ''
                        }`}
                        onClick={() => setActiveFile(file.name)}
                      >
                        <FileCode2 className="h-4 w-4 flex-shrink-0 opacity-70" />
                        <span className="truncate">{file.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {currentFile && (
                  <div className="border rounded-md overflow-hidden">
                    <div className="p-2 bg-muted flex items-center justify-between">
                      <span className="text-sm truncate font-medium">{currentFile.name}</span>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => copyFileContent(currentFile.content)}
                          title="Copy code"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => downloadFile(currentFile.name, currentFile.content)}
                          title="Download file"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <pre className="p-4 text-sm overflow-auto max-h-96 bg-black text-white">
                      <code>{currentFile.content}</code>
                    </pre>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="overview" className="p-4">
                <div className="text-sm">
                  <div className="font-medium text-base mb-2">Project Structure</div>
                  <p className="mb-3">
                    This {technology} {appType} includes the following files:
                  </p>
                  
                  {/* Tree visualization of project */}
                  {currentFile && currentFile.name.includes('/') && (
                    <div className="p-3 bg-black text-white rounded-md mb-4 font-mono text-sm">
                      {generatedFiles
                        .filter(file => file.name.startsWith('my-app'))
                        .map((file, i) => {
                          // Extract path components for tree visualization
                          const parts = file.name.split('/');
                          const indent = Array(parts.length - 1).fill('  ').join('');
                          const isLast = i === generatedFiles.length - 1;
                          
                          return (
                            <div key={file.name} className="whitespace-pre">
                              {i === 0 ? '├─ ' : indent + (isLast ? '└─ ' : '├─ ')}
                              {parts[parts.length - 1]}
                            </div>
                          );
                      })}
                    </div>
                  )}
                  
                  <div className="font-medium text-base mt-4 mb-2">Technology Stack</div>
                  <ul className="list-disc pl-5 space-y-1 mb-4">
                    <li>Primary: {technology}</li>
                    <li>Application Type: {appType}</li>
                    {selectedFeatures.length > 0 && (
                      <li>
                        Features:
                        <ul className="list-disc pl-5 mt-1">
                          {selectedFeatures.map((featureId) => (
                            <li key={featureId}>
                              {FEATURES.find((f) => f.id === featureId)?.label}
                            </li>
                          ))}
                        </ul>
                      </li>
                    )}
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <FileCode2 className="h-12 w-12 mb-4 opacity-30" />
              <p>Enter your app requirements and click "Generate Application"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}