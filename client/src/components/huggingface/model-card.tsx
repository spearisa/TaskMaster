import { Link } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  Star, 
  Calendar, 
  ArrowUpRight, 
  MessageSquare 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModelCardProps {
  model: {
    id: string;
    modelId: string;
    author: string;
    name: string;
    likes: number;
    downloads: number;
    downloads_last_month?: number;
    tags: string[];
    pipeline_tag: string;
    lastModified: string;
  };
  variant?: "default" | "compact";
}

export default function ModelCard({ model, variant = "default" }: ModelCardProps) {
  // Format numbers for better display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Format date for better display
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return '1 day ago';
    } else if (diffDays < 30) {
      return `${diffDays} days ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    }
  };

  // Process model name/title for better display
  const displayName = model.name || model.modelId.split('/').pop();
  const authorName = model.author || model.modelId.split('/')[0];
  
  // Generate background color based on pipeline tag
  const getPipelineColor = (tag: string): string => {
    const colorMap: Record<string, string> = {
      'text-generation': 'bg-blue-50 text-blue-700 border-blue-200',
      'text-to-image': 'bg-orange-50 text-orange-700 border-orange-200',
      'image-to-text': 'bg-green-50 text-green-700 border-green-200',
      'image-classification': 'bg-purple-50 text-purple-700 border-purple-200',
      'token-classification': 'bg-pink-50 text-pink-700 border-pink-200',
      'text-classification': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'translation': 'bg-sky-50 text-sky-700 border-sky-200',
      'summarization': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'question-answering': 'bg-amber-50 text-amber-700 border-amber-200',
      'fill-mask': 'bg-slate-50 text-slate-700 border-slate-200',
      'conversational': 'bg-lime-50 text-lime-700 border-lime-200',
      'feature-extraction': 'bg-teal-50 text-teal-700 border-teal-200',
      'zero-shot-classification': 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
      'text-to-speech': 'bg-rose-50 text-rose-700 border-rose-200',
      'sentence-similarity': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    };
    
    return colorMap[tag] || 'bg-gray-50 text-gray-700 border-gray-200';
  };
  
  const pipelineColor = getPipelineColor(model.pipeline_tag);
  const formattedPipelineTag = model.pipeline_tag.replace(/-/g, ' ');
  
  if (variant === "compact") {
    return (
      <Link href={`/ai-models/${encodeURIComponent(model.modelId)}`}>
        <Card className="h-full cursor-pointer hover:shadow-md transition-shadow overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="line-clamp-1 text-base">{displayName}</CardTitle>
                <CardDescription className="line-clamp-1">by {authorName}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <Badge variant="outline" className={cn("capitalize mb-3", pipelineColor)}>
              {formattedPipelineTag}
            </Badge>
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Download className="mr-1 h-3 w-3" />
                <span>{formatNumber(model.downloads)}</span>
              </div>
              <div className="flex items-center">
                <Star className="mr-1 h-3 w-3 text-yellow-500" />
                <span>{formatNumber(model.likes)}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1 h-3 w-3" />
                <span>{formatDate(model.lastModified)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }
  
  return (
    <Link href={`/ai-models/${encodeURIComponent(model.modelId)}`}>
      <Card className="h-full cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="line-clamp-1">{displayName}</CardTitle>
              <CardDescription className="line-clamp-1">by {authorName}</CardDescription>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className={cn("capitalize mb-4", pipelineColor)}>
            {formattedPipelineTag}
          </Badge>
          
          {model.tags && model.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {model.tags.slice(0, 3).map((tag) => (
                <Badge variant="secondary" key={tag} className="bg-gray-100 text-gray-800 hover:bg-gray-200">
                  {tag}
                </Badge>
              ))}
              {model.tags.length > 3 && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                  +{model.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Download className="mr-1 h-4 w-4" />
                <span>{formatNumber(model.downloads)}</span>
              </div>
              <div className="flex items-center">
                <Star className="mr-1 h-4 w-4 text-yellow-500" />
                <span>{formatNumber(model.likes)}</span>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              <span>{formatDate(model.lastModified)}</span>
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}