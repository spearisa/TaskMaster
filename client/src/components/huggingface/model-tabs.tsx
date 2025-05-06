import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, Globe, Download, FileText, ArrowRight, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid grid-cols-4 mb-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="usage">Usage</TabsTrigger>
        <TabsTrigger value="discussions">Discussions</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About this model</CardTitle>
              </CardHeader>
              <CardContent>
                {readme ? (
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: readme }} />
                ) : (
                  <div className="text-muted-foreground">
                    <p>This model doesn't have a detailed description yet.</p>
                    <p className="mt-2">You can check the original model page on Hugging Face for more information.</p>
                    <a 
                      href={`https://huggingface.co/${model.modelId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline mt-4"
                    >
                      View on Hugging Face <ExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  </div>
                )}
                
                {model.tags && model.tags.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {model.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>How to use</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">With Transformers (Python)</h4>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                      <code className="text-xs md:text-sm">
{`from transformers import pipeline

# Load model directly
pipe = pipeline("${model.pipeline_tag || 'text-generation'}", model="${model.modelId}")

# Use the pipeline
result = pipe("${model.pipeline_tag === 'text-generation' ? 'Hello, I am a language model' : 
              model.pipeline_tag === 'image-classification' ? 'image.jpg' :
              model.pipeline_tag === 'translation' ? 'Hello, how are you?' :
              'Your input text here'}")
print(result)`}
                      </code>
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium mb-2">With JavaScript</h4>
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                      <code className="text-xs md:text-sm">
{`import { pipeline } from '@huggingface/inference';
const hf = new HfInference(process.env.HF_API_KEY);

async function run() {
  const result = await hf.${model.pipeline_tag || 'textGeneration'}({
    model: "${model.modelId}",
    inputs: "${model.pipeline_tag === 'text-generation' ? 'Hello, I am a language model' : 
             model.pipeline_tag === 'image-classification' ? 'image.jpg' :
             model.pipeline_tag === 'translation' ? 'Hello, how are you?' :
             'Your input text here'}"
  });
  console.log(result);
}

run();`}
                      </code>
                    </pre>
                  </div>
                </div>
                
                <Button variant="outline" className="mt-6">
                  <FileText className="mr-2 h-4 w-4" />
                  See more examples
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Model details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
                    <p className="capitalize">{model.pipeline_tag?.replace(/-/g, ' ') || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Downloads</h4>
                    <p>{model.downloads?.toLocaleString() || 0}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Monthly downloads</h4>
                    <p>{model.downloads_last_month?.toLocaleString() || 'Not available'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Likes</h4>
                    <p>{model.likes || 0}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Library</h4>
                    <p>{model.library_name || 'Not specified'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Last updated</h4>
                    <p>{formatDate(model.lastModified)} ({formatDistanceToNow(new Date(model.lastModified), { addSuffix: true })})</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Try on Appmo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Use this model directly in your Appmo tasks and projects.
                </p>
                <Button className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Add to my workspace
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="files">
        <Card>
          <CardHeader>
            <CardTitle>Repository files</CardTitle>
            <CardDescription>
              Browse the files included in this model
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center">
                  <Code className="h-4 w-4 mr-2" />
                  <span className="font-medium">Repository structure</span>
                </div>
                <Button variant="outline" size="sm">
                  <Globe className="h-4 w-4 mr-2" />
                  View on Hugging Face
                </Button>
              </div>
              <ScrollArea className="h-80">
                <div className="p-4 space-y-2">
                  {model.siblings && model.siblings.length > 0 ? (
                    model.siblings.map((file, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                        <span className="text-sm">{file.rfilename}</span>
                        <Button variant="ghost" size="sm">
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>File listing not available</p>
                      <p className="text-sm mt-2">Visit the model on Hugging Face to see all files</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="usage">
        <Card>
          <CardHeader>
            <CardTitle>Model usage examples</CardTitle>
            <CardDescription>
              Learn how to use this model in different frameworks and scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Framework integrations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">PyTorch</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">Use with PyTorch for direct integration</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" size="sm" className="w-full">
                        View PyTorch example <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">TensorFlow</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">Use with TensorFlow and Keras</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" size="sm" className="w-full">
                        View TensorFlow example <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">JavaScript</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">Use with Node.js or browser applications</p>
                    </CardContent>
                    <CardFooter>
                      <Button variant="ghost" size="sm" className="w-full">
                        View JavaScript example <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">API usage</h3>
                <Card>
                  <CardContent className="pt-6">
                    <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                      <code className="text-xs md:text-sm">
{`# API example using Python requests
import requests

API_URL = "https://api-inference.huggingface.co/models/${model.modelId}"
headers = {"Authorization": "Bearer YOUR_API_KEY"}

def query(payload):
    response = requests.post(API_URL, headers=headers, json=payload)
    return response.json()
    
output = query({
    "inputs": "${model.pipeline_tag === 'text-generation' ? 'Hello, I am a language model' : 
              model.pipeline_tag === 'image-classification' ? 'image.jpg' :
              model.pipeline_tag === 'translation' ? 'Hello, how are you?' :
              'Your input text here'}",
    ${model.pipeline_tag === 'text-generation' ? '"parameters": {"max_length": 50}' : ''}
})
print(output)`}
                      </code>
                    </pre>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="discussions">
        <Card>
          <CardHeader>
            <CardTitle>Community discussions</CardTitle>
            <CardDescription>
              View and participate in discussions about this model
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <h3 className="text-xl font-medium mb-2">Visit Hugging Face to see discussions</h3>
              <p className="text-muted-foreground mb-6">
                Community discussions are hosted on the Hugging Face platform
              </p>
              <Button asChild>
                <a 
                  href={`https://huggingface.co/${model.modelId}/discussions`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Go to discussions
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}