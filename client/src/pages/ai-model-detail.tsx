import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, Star, GitFork, Share2, Code, ExternalLink } from "lucide-react";
import ModelTabs from "@/components/huggingface/model-tabs";

export default function AIModelDetailPage() {
  const [location] = useLocation();
  const modelId = decodeURIComponent(location.split('/ai-models/')[1]);
  
  // Query for model details
  const { 
    data: model,
    isLoading, 
    error
  } = useQuery({
    queryKey: [`/api/huggingface/model/${modelId}`],
    queryFn: () => fetch(`/api/huggingface/model/${modelId}`).then(res => res.json()),
    enabled: !!modelId
  });

  // Format download count
  const formatDownloads = (downloads: number): string => {
    if (downloads >= 1000000) {
      return `${(downloads / 1000000).toFixed(1)}M`;
    } else if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(1)}K`;
    }
    return downloads.toString();
  };

  // Format display name
  const displayName = model?.name || modelId.split('/').pop() || "AI Model";
  const author = model?.author || modelId.split('/')[0] || "Author";
  
  return (
    <div className="container max-w-7xl mx-auto py-6">
      <Link href="/ai-models">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to models
        </Button>
      </Link>
      
      {isLoading ? (
        <div className="space-y-6">
          <div className="flex justify-between">
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-10 w-28" />
          </div>
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-medium mb-2 text-red-500">Error loading model details</h3>
            <p className="text-muted-foreground mb-6">
              We couldn't load the information for this model. It may not exist or there was a connection issue.
            </p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => window.location.reload()}>
                Try again
              </Button>
              <Button variant="outline" asChild>
                <a 
                  href={`https://huggingface.co/${modelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Hugging Face
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : model ? (
        <>
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-1">{displayName}</h1>
                <div className="flex items-center gap-2">
                  <span>by {author}</span>
                  <Badge 
                    variant="outline" 
                    className="capitalize"
                    style={{
                      backgroundColor: model.pipeline_tag === 'text-generation' ? 'rgba(25, 113, 194, 0.1)' : 
                                      model.pipeline_tag === 'image-to-text' ? 'rgba(64, 186, 128, 0.1)' : 
                                      model.pipeline_tag === 'text-to-image' ? 'rgba(244, 123, 32, 0.1)' : 
                                      'rgba(0, 0, 0, 0.05)'
                    }}
                  >
                    {model.pipeline_tag?.replace(/-/g, ' ') || 'Model'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <a 
                    href={`https://huggingface.co/${model.modelId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in Hugging Face
                  </a>
                </Button>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Use this model
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center">
                <Download className="h-4 w-4 mr-1.5" />
                <span className="font-medium mr-1">Downloads:</span>
                <span>{formatDownloads(model.downloads || 0)}</span>
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1.5 text-yellow-500" />
                <span className="font-medium mr-1">Likes:</span>
                <span>{model.likes || 0}</span>
              </div>
              <div className="flex items-center">
                <GitFork className="h-4 w-4 mr-1.5" />
                <span className="font-medium mr-1">Library:</span>
                <span>{model.library_name || 'Not specified'}</span>
              </div>
              <div className="flex items-center">
                <Code className="h-4 w-4 mr-1.5" />
                <span className="font-medium mr-1">Files:</span>
                <span>{model.siblings?.length || 0}</span>
              </div>
            </div>
          </div>
          
          <ModelTabs model={model} />
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <h3 className="text-xl font-medium mb-2">Model not found</h3>
            <p className="text-muted-foreground mb-6">
              The model you're looking for could not be found
            </p>
            <Button asChild>
              <Link href="/ai-models">
                Browse models
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}