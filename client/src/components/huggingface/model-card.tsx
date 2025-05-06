import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Star, Clock, ExternalLink, ArrowRight } from "lucide-react";
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

interface ModelCardProps {
  model: HuggingFaceModel;
  compact?: boolean;
}

export default function ModelCard({ model, compact = false }: ModelCardProps) {
  // Format display name
  const displayName = model.name || model.modelId.split('/').pop() || "Unnamed Model";
  const author = model.author || model.modelId.split('/')[0] || "Unknown Author";
  
  // Format date
  const lastModified = new Date(model.lastModified);
  const lastModifiedFormatted = formatDistanceToNow(lastModified, { addSuffix: true });
  
  // Format download count
  const formatDownloads = (downloads: number): string => {
    if (downloads >= 1000000) {
      return `${(downloads / 1000000).toFixed(1)}M`;
    } else if (downloads >= 1000) {
      return `${(downloads / 1000).toFixed(1)}K`;
    }
    return downloads.toString();
  };

  // Handle external link click
  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (compact) {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <Link href={`/ai-models/${model.modelId}`}>
          <a className="block h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base truncate">{displayName}</CardTitle>
              <CardDescription className="truncate">by {author}</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="capitalize">
                  {model.pipeline_tag?.replace(/-/g, ' ') || 'Model'}
                </Badge>
                <span className="text-xs text-muted-foreground">{lastModifiedFormatted}</span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center text-sm">
                  <Download className="h-3.5 w-3.5 mr-1" />
                  <span>{formatDownloads(model.downloads || 0)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Star className="h-3.5 w-3.5 mr-1 text-yellow-500" />
                  <span>{model.likes || 0}</span>
                </div>
              </div>
            </CardContent>
          </a>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <Link href={`/ai-models/${model.modelId}`}>
        <a className="block h-full">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="pr-4">{displayName}</CardTitle>
                <CardDescription className="mt-1">by {author}</CardDescription>
              </div>
              <Badge 
                variant="outline" 
                className="capitalize text-xs" 
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
          </CardHeader>
          <CardContent>
            {model.tags && model.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {model.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {model.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{model.tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex justify-between items-center mt-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <Download className="h-4 w-4 mr-1" />
                  <span>{formatDownloads(model.downloads || 0)}</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-yellow-500" />
                  <span>{model.likes || 0}</span>
                </div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                <span>{lastModifiedFormatted}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0 flex justify-between">
            <Button variant="ghost" size="sm" className="pl-0">
              View details <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <a 
              href={`https://huggingface.co/${model.modelId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={handleExternalLink}
              className="text-sm flex items-center text-muted-foreground hover:text-primary"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Source
            </a>
          </CardFooter>
        </a>
      </Link>
    </Card>
  );
}