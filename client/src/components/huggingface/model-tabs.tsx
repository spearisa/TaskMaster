import { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  FileCode,
  Info,
  Link as LinkIcon,
  Download,
  MessageSquare
} from "lucide-react";
import Markdown from 'react-markdown';

interface HuggingFaceModel {
  id: string;
  modelId: string;
  author: string;
  name: string;
  private: boolean;
  likes: number;
  downloads: number;
  tags: string[];
  pipeline_tag: string;
  lastModified: string;
  library_name?: string;
  mask_token?: string;
  widgetData?: object;
  _id: string;
  createdAt: string;
  downloads_last_month?: number;
  siblings?: {
    rfilename: string;
  }[];
}

interface ModelTabsProps {
  model: HuggingFaceModel;
  readme?: string;
}

export default function ModelTabs({ model, readme = "" }: ModelTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Format file sizes
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  
  // Mock files for demo purposes since we don't have actual file info
  const modelFiles = model.siblings?.map((sibling, index) => ({
    name: sibling.rfilename,
    size: Math.random() * 500000000, // Random size between 0 and 500MB
    lastModified: new Date(model.lastModified).toISOString(),
    type: sibling.rfilename.endsWith('.bin') ? 'model' : 
          sibling.rfilename.endsWith('.json') ? 'config' :
          sibling.rfilename.endsWith('.txt') ? 'vocabulary' :
          sibling.rfilename.endsWith('.py') ? 'script' : 'other'
  })) || [];
  
  // Generate fake usage code examples
  const generatePythonUsage = () => {
    const isPipeline = model.pipeline_tag && model.pipeline_tag !== 'other';
    const isTextModel = model.pipeline_tag?.includes('text');
    
    if (isPipeline) {
      return `from transformers import pipeline

# Load model directly
${model.pipeline_tag} = pipeline("${model.pipeline_tag}", model="${model.modelId}")

${isTextModel ? `# Example usage
result = ${model.pipeline_tag}("Text to process with ${model.name}")\nprint(result)` : '# Process your data\nresult = ' + model.pipeline_tag + '(your_data)\nprint(result)'}`;
    } else {
      return `from transformers import AutoTokenizer, AutoModel

# Load model & tokenizer
tokenizer = AutoTokenizer.from_pretrained("${model.modelId}")
model = AutoModel.from_pretrained("${model.modelId}")

# Example usage
inputs = tokenizer("Hello, how are you?", return_tensors="pt")
outputs = model(**inputs)`;
    }
  };
  
  const generateJavaScriptUsage = () => {
    return `import { pipeline } from '@huggingface/transformers';

// Load the model
const ${model.pipeline_tag?.replace(/-/g, '')} = await pipeline('${model.pipeline_tag}', '${model.modelId}');

// Example usage
const result = await ${model.pipeline_tag?.replace(/-/g, '')}('Your input text here');
console.log(result);`;
  };
  
  return (
    <Tabs 
      defaultValue="overview" 
      className="space-y-4" 
      value={activeTab} 
      onValueChange={setActiveTab}
    >
      <TabsList className="grid grid-cols-4 mb-8">
        <TabsTrigger value="overview" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>Overview</span>
        </TabsTrigger>
        <TabsTrigger value="files" className="flex items-center gap-2">
          <FileCode className="h-4 w-4" />
          <span>Files</span>
        </TabsTrigger>
        <TabsTrigger value="usage" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>Usage</span>
        </TabsTrigger>
        <TabsTrigger value="discussions" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <span>Discussions</span>
        </TabsTrigger>
      </TabsList>
      
      {/* Overview Tab */}
      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>About this model</CardTitle>
            <CardDescription>
              Technical specifications and features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {readme ? (
              <div className="prose max-w-none">
                <Markdown>{readme}</Markdown>
              </div>
            ) : (
              <div className="prose max-w-none">
                <h3>{model.name}</h3>
                <p>This is a {model.pipeline_tag?.replace(/-/g, ' ')} model created by {model.author}.</p>
                {model.tags && model.tags.length > 0 && (
                  <div>
                    <h4>Tags</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {model.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">Pipeline</h4>
                <p className="font-medium">{model.pipeline_tag?.replace(/-/g, ' ') || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">Library</h4>
                <p className="font-medium">{model.library_name || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">Downloads</h4>
                <p className="font-medium">{model.downloads?.toLocaleString() || 0}</p>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground">Last updated</h4>
                <p className="font-medium">
                  {new Date(model.lastModified).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
      
      {/* Files Tab */}
      <TabsContent value="files" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Model Files</CardTitle>
            <CardDescription>
              Files and resources associated with this model
            </CardDescription>
          </CardHeader>
          <CardContent>
            {modelFiles.length > 0 ? (
              <div className="rounded-md border">
                <div className="grid grid-cols-12 p-3 text-sm font-medium text-muted-foreground bg-muted/50">
                  <div className="col-span-6">Filename</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-2">Last Updated</div>
                </div>
                <Separator />
                {modelFiles.map((file, index) => (
                  <div key={index}>
                    <div className="grid grid-cols-12 p-3 text-sm">
                      <div className="col-span-6 font-medium flex items-center">
                        <FileCode className="h-4 w-4 mr-2 text-blue-500" />
                        {file.name}
                      </div>
                      <div className="col-span-2 text-muted-foreground capitalize">
                        {file.type}
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {formatFileSize(file.size)}
                      </div>
                      <div className="col-span-2 text-muted-foreground">
                        {new Date(file.lastModified).toLocaleDateString()}
                      </div>
                    </div>
                    {index < modelFiles.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <FileCode className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No files available</h3>
                <p className="text-sm text-muted-foreground">
                  This model does not have any files or they cannot be accessed.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full sm:w-auto" variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download All Files
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
      
      {/* Usage Tab */}
      <TabsContent value="usage" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>How to use this model</CardTitle>
            <CardDescription>
              Examples and code snippets to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Python</h3>
              <div className="relative">
                <pre className="p-4 rounded-md bg-gray-900 text-gray-50 overflow-x-auto font-mono text-sm">
                  <code>{generatePythonUsage()}</code>
                </pre>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    navigator.clipboard.writeText(generatePythonUsage());
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">JavaScript</h3>
              <div className="relative">
                <pre className="p-4 rounded-md bg-gray-900 text-gray-50 overflow-x-auto font-mono text-sm">
                  <code>{generateJavaScriptUsage()}</code>
                </pre>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    navigator.clipboard.writeText(generateJavaScriptUsage());
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            
            <div className="rounded-md border p-4 bg-muted/50">
              <h3 className="text-lg font-medium mb-2">Installation</h3>
              <p className="mb-4">First, install the required dependencies:</p>
              <div className="relative">
                <pre className="p-4 rounded-md bg-gray-900 text-gray-50 overflow-x-auto font-mono text-sm">
                  <code>pip install transformers</code>
                </pre>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    navigator.clipboard.writeText("pip install transformers");
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <a 
                href={`https://huggingface.co/${model.modelId}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-blue-600 hover:underline"
              >
                View full documentation on Hugging Face
              </a>
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
      
      {/* Discussions Tab */}
      <TabsContent value="discussions" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Community Discussions</CardTitle>
            <CardDescription>
              Conversations and questions about this model
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No discussions yet</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-4">
                Be the first to start a discussion about this model. Ask questions, share feedback, or discuss use cases.
              </p>
              <Button>
                <MessageSquare className="mr-2 h-4 w-4" />
                Start a discussion
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" />
              <a 
                href={`https://huggingface.co/${model.modelId}/discussions`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-sm text-blue-600 hover:underline"
              >
                View all discussions on Hugging Face
              </a>
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}