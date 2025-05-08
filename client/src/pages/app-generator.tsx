import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy, Download, Code, LoaderCircle, FileCode2, Server, Package, Layers, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  { id: 'darkmode', label: 'Dark Mode' },
  { id: 'i18n', label: 'Internationalization' },
  { id: 'testing', label: 'Testing Setup' },
];

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
  const [generatedText, setGeneratedText] = useState('');
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  
  // Reference iframe toggle
  const [showDeepSiteReference, setShowDeepSiteReference] = useState(false);
  
  // Handle feature selection
  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };
  
  // Generate app code using DeepSeek
  const generateApp = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Input Required",
        description: "Please provide a description of the app you want to generate.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    setGeneratedText('');
    setGeneratedFiles([]);
    setActiveFile(null);
    
    try {
      console.log("Preparing DeepSeek code generation request...");
      
      // Create request payload that matches DeepSite's format
      const requestData = {
        prompt,
        technology,
        appType,
        features: selectedFeatures,
        modelId: 'deepseek-ai/deepseek-coder-33b-instruct',
        maxLength: 4096,
        provider: 'deepseek' // Explicitly identify the provider
      };
      
      console.log("Sending request with:", {
        technology: requestData.technology,
        appType: requestData.appType,
        features: requestData.features,
        prompt: requestData.prompt.substring(0, 100) + "..."
      });
      
      try {
        // Use improved DeepSeek endpoint with better error handling
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minute timeout
        
        const response = await apiRequest('POST', '/api/ai/deepseek/generate', requestData, {
          timeout: 180000, // 3 minute timeout
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Response received successfully
        console.log("DeepSeek API response status:", response.status);
        
        if (!response.ok) {
          let errorMessage = 'Failed to generate app';
          
          try {
            const error = await response.json();
            console.error("API error details:", error);
            errorMessage = error.message || errorMessage;
          } catch (parseError) {
            console.error("Could not parse error response:", parseError);
            
            // Check for specific status codes for better error messages
            if (response.status === 502 || response.status === 504) {
              errorMessage = "Server timeout error. The AI model is taking too long to generate code. Try a simpler app description or fewer features.";
            } else if (response.status === 503) {
              errorMessage = "Service temporarily unavailable. Please try again in a moment.";
            } else if (response.status === 429) {
              errorMessage = "Rate limit exceeded. Please try again later.";
            } else if (response.status === 401 || response.status === 403) {
              errorMessage = "API authentication error. Please check API credentials.";
            }
          }
          
          throw new Error(errorMessage);
        }
        
        // Parse the JSON response
        const data = await response.json();
        
        // Check for the new format with "ok" field
        if (!data.ok && data.message) {
          throw new Error(data.message);
        }
        
        console.log("Received response from DeepSeek API:", {
          textLength: data.generated_text ? data.generated_text.length : 0,
          filesCount: data.files ? data.files.length : 0
        });
        
        // Store the complete text response
        setGeneratedText(data.generated_text || "");
        
        // Process the files if available
        if (data.files && data.files.length > 0) {
          console.log("Processing generated files:", data.files.length);
          
          // Sort files to show index.html and main files first
          const sortedFiles = [...data.files].sort((a, b) => {
            // Put index.html first
            if (a.name === 'index.html') return -1;
            if (b.name === 'index.html') return 1;
            
            // Then main files
            if (a.name.includes('main.') && !b.name.includes('main.')) return -1;
            if (b.name.includes('main.') && !a.name.includes('main.')) return 1;
            
            // Then alphabetically
            return a.name.localeCompare(b.name);
          });
          
          setGeneratedFiles(sortedFiles);
          setActiveFile(sortedFiles[0].name);
          
          toast({
            title: "App Generated Successfully",
            description: `Generated ${sortedFiles.length} files for your ${technology} application.`,
          });
        } else {
          // No files found in the response
          console.warn("No files found in the API response");
          
          if (data.generated_text) {
            // Attempt to extract code blocks from text if no files were provided
            const extractedFiles = extractFilesFromText(data.generated_text);
            
            if (extractedFiles.length > 0) {
              setGeneratedFiles(extractedFiles);
              setActiveFile(extractedFiles[0].name);
              
              toast({
                title: "App Generated Successfully",
                description: `Extracted ${extractedFiles.length} files from the generated code.`,
              });
            } else {
              // Create a single file with the raw response
              const fallbackFile = {
                name: 'complete_response.txt',
                content: data.generated_text,
                language: 'text'
              };
              setGeneratedFiles([fallbackFile]);
              setActiveFile(fallbackFile.name);
              
              toast({
                title: "Generation Partially Successful",
                description: "Content was generated but no code files were properly formatted. Try adjusting your prompt."
              });
            }
          } else {
            toast({
              title: "Generation Failed",
              description: "No content was returned from the API. Try again with a different prompt.",
              variant: "destructive"
            });
          }
        }
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out after 3 minutes. Try a simpler app description or fewer features.');
        } else {
          throw fetchError;
        }
      }
    } catch (error: any) {
      console.error("App generation error:", error);
      
      // Provide more helpful error messages for specific errors
      let errorMessage = error.message || "There was a problem generating your application.";
      let errorTitle = "Generation Failed";
      
      // Check for network-related errors
      if (!navigator.onLine) {
        errorMessage = "You appear to be offline. Please check your internet connection.";
      } else if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
        errorTitle = "Generation Timeout";
        errorMessage = "The request timed out. The AI model is taking too long to respond. Try a simpler app description or fewer features.";
      } else if (errorMessage.includes('API key') || errorMessage.includes('credentials')) {
        errorTitle = "API Configuration Error";
        errorMessage = "There is an issue with the API configuration. Please contact the administrator.";
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Helper function to extract files from raw text if needed
  const extractFilesFromText = (text: string): GeneratedFile[] => {
    const files: GeneratedFile[] = [];
    const filePattern = /```(?:(\w+)|(?:file|filename)[=: ]?['"]?([\w.-]+)['"]?)?\s*\n([\s\S]*?)```/g;
    
    let match;
    while ((match = filePattern.exec(text)) !== null) {
      // Extract filename and content
      let language = match[1] || '';
      let filename = match[2] || '';
      const content = match[3] || '';
      
      // Skip empty content
      if (!content.trim()) continue;
      
      // If no filename is provided, infer it from the language
      if (!filename && language) {
        const extension = getExtensionFromLanguage(language);
        filename = `file${files.length + 1}.${extension}`;
      } else if (!filename) {
        // Fallback filename
        filename = `file-${files.length + 1}.txt`;
      }
      
      // If language wasn't specified, try to infer from the filename
      if (!language) {
        const extension = filename.split('.').pop() || '';
        language = extension;
      }
      
      files.push({
        name: filename,
        content: content.trim(),
        language: language
      });
    }
    
    return files;
  };
  
  // Helper to get file extension from language
  const getExtensionFromLanguage = (language: string): string => {
    const extensions: Record<string, string> = {
      'javascript': 'js', 'js': 'js',
      'typescript': 'ts', 'ts': 'ts',
      'jsx': 'jsx', 'tsx': 'tsx',
      'python': 'py', 'py': 'py',
      'html': 'html', 'css': 'css',
      'json': 'json',
      'java': 'java',
      'c': 'c', 'cpp': 'cpp',
      'csharp': 'cs', 'cs': 'cs',
      'go': 'go',
      'rust': 'rs',
      'php': 'php'
    };
    
    return extensions[language.toLowerCase()] || 'txt';
  };
  
  // Copy file content to clipboard
  const copyFileContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to Clipboard",
      description: "File content has been copied to your clipboard."
    });
  };
  
  // Download current file
  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Download all files as zip
  const downloadAllFiles = () => {
    toast({
      title: "Feature Coming Soon",
      description: "The ability to download all files as a ZIP will be available soon."
    });
  };
  
  // Get currently active file
  const currentFile = generatedFiles.find(file => file.name === activeFile);
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI App Generator</h1>
        <p className="text-muted-foreground">
          Generate complete application code using DeepSeek AI. Describe your app and let DeepSeek build it for you.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>App Requirements</CardTitle>
            <CardDescription>
              Describe the application you want to build and configure its settings. 
              Powered by DeepSeek AI model.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">App Description</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the application you want to build in detail..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-32"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about features, functionality, and design preferences.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="technology">Technology</Label>
                <Select value={technology} onValueChange={setTechnology}>
                  <SelectTrigger id="technology">
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
                <Label htmlFor="app-type">App Type</Label>
                <Select value={appType} onValueChange={setAppType}>
                  <SelectTrigger id="app-type">
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
            
            <div className="space-y-2">
              <Label>Features</Label>
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
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {feature.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              className="w-full" 
              onClick={generateApp} 
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Generating App...
                </>
              ) : (
                <>
                  <Code className="mr-2 h-4 w-4" />
                  Generate Application
                </>
              )}
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
          </CardFooter>
        </Card>
        
        {/* Output Section */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Code</CardTitle>
            <CardDescription>
              {generatedFiles.length > 0 
                ? `Generated ${generatedFiles.length} files for your application` 
                : "Your generated code will appear here"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {generatedFiles.length > 0 ? (
              <Tabs defaultValue="files" className="w-full">
                <TabsList className="w-full rounded-none border-b px-6">
                  <TabsTrigger value="files">Files</TabsTrigger>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                </TabsList>
                <TabsContent value="files" className="space-y-4 p-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="rounded-md border">
                      <div className="bg-muted p-2 flex items-center justify-between">
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
                      <div className="max-h-60 overflow-y-auto">
                        {generatedFiles.map((file) => (
                          <button
                            key={file.name}
                            className={`w-full text-left px-3 py-2 text-sm flex items-center space-x-2 ${
                              activeFile === file.name ? 'bg-accent' : 'hover:bg-accent/50'
                            }`}
                            onClick={() => setActiveFile(file.name)}
                          >
                            <FileCode2 className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {currentFile && (
                      <div className="rounded-md border overflow-hidden">
                        <div className="bg-muted p-2 flex items-center justify-between">
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
                  </div>
                </TabsContent>
                <TabsContent value="overview" className="p-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <h3>Project Structure Overview</h3>
                    <p>
                      This {technology} {appType} includes the following files and components:
                    </p>
                    
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="structure">
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <Layers className="h-4 w-4 mr-2" />
                            <span>Project Structure</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="space-y-1 pl-6 list-disc">
                            {generatedFiles.map((file) => (
                              <li key={file.name} className="text-sm">
                                {file.name}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="technology">
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-2" />
                            <span>Technology Stack</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p>
                            Main technology: <strong>{TECHNOLOGIES.find(t => t.value === technology)?.label}</strong>
                          </p>
                          <p>
                            Application type: <strong>{APP_TYPES.find(t => t.value === appType)?.label}</strong>
                          </p>
                          {selectedFeatures.length > 0 && (
                            <>
                              <p className="font-semibold mt-2">Features:</p>
                              <ul className="space-y-1 pl-6 list-disc">
                                {selectedFeatures.map((featureId) => (
                                  <li key={featureId}>
                                    {FEATURES.find(f => f.id === featureId)?.label}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                      
                      <AccordionItem value="instructions">
                        <AccordionTrigger>
                          <div className="flex items-center">
                            <Server className="h-4 w-4 mr-2" />
                            <span>Deployment Instructions</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p>
                            To deploy this application:
                          </p>
                          <ol className="space-y-1 pl-6 list-decimal">
                            <li>Clone the repository or download all generated files</li>
                            <li>Install dependencies with <code>npm install</code> or <code>yarn</code></li>
                            <li>Start the development server with <code>npm start</code> or <code>yarn start</code></li>
                            <li>Build for production with <code>npm run build</code> or <code>yarn build</code></li>
                          </ol>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                {isGenerating ? (
                  <div className="space-y-4">
                    <LoaderCircle className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <div>
                      <p className="text-lg font-medium">Generating Your Application</p>
                      <p className="text-sm text-muted-foreground">
                        This may take a minute or two depending on the complexity...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Code className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-lg font-medium">No Code Generated Yet</p>
                      <p className="text-sm text-muted-foreground">
                        Fill in the form and click "Generate Application" to create your app
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}