import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ModelTabs } from "@/components/huggingface/index";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  Loader2, 
  Star, 
  Download, 
  Share2, 
  ExternalLink,
  BookmarkPlus
} from "lucide-react";

export default function AIModelDetailPage() {
  // Get model ID from URL params
  const params = useParams<{ id: string }>();
  const modelId = decodeURIComponent(params.id || "");
  
  // Fetch model details
  const { data: model, isLoading, error } = useQuery({
    queryKey: [`/api/huggingface/models/${modelId}`],
    queryFn: async () => {
      const response = await fetch(`/api/huggingface/models/${modelId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch model details');
      }
      return response.json();
    },
  });
  
  // Fetch model readme
  const { data: readme, isLoading: readmeLoading } = useQuery({
    queryKey: [`/api/huggingface/models/${modelId}/readme`],
    queryFn: async () => {
      const response = await fetch(`/api/huggingface/models/${modelId}/readme`);
      if (!response.ok) {
        return ""; // Not all models have a readme
      }
      return response.json();
    },
    retry: false,
    enabled: !!model, // Only fetch readme if model exists
  });
  
  // Format numbers for better display
  const formatNumber = (num?: number): string => {
    if (!num) return "0";
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  return (
    <div className="container py-6 space-y-6">
      {/* Back button */}
      <div>
        <Button variant="ghost" asChild>
          <Link href="/ai-models">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Models
          </Link>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-6 w-1/3" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-12 bg-red-50 rounded-lg border border-red-100">
          <h2 className="text-xl font-bold text-red-800 mb-2">Failed to load model details</h2>
          <p className="text-red-700 mb-6 text-center">
            We couldn't fetch information for this model. It might not exist or there may be connectivity issues.
          </p>
          <Button asChild>
            <Link href="/ai-models">
              Back to AI Models
            </Link>
          </Button>
        </div>
      ) : model ? (
        <>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-2 items-start justify-between">
                <h1 className="text-3xl font-bold tracking-tight break-words max-w-3xl">
                  {model.name || modelId.split('/').pop()}
                </h1>
                
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="gap-2">
                    <BookmarkPlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Save</span>
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Share2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Share</span>
                  </Button>
                  <Button variant="default" className="gap-2">
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>
              
              <div className="text-muted-foreground">
                by <span className="font-medium">{model.author}</span> •{" "}
                {model.pipeline_tag && (
                  <Badge variant="outline" className="capitalize ml-1">
                    {model.pipeline_tag.replace(/-/g, ' ')}
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <Download className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">
                    {formatNumber(model.downloads)} downloads
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">
                    {formatNumber(model.likes)} likes
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <ExternalLink className="h-4 w-4 text-blue-500" />
                  <a 
                    href={`https://huggingface.co/${modelId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View on Hugging Face
                  </a>
                </div>
              </div>
            </div>
            
            {/* Model metadata and interactive elements */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-accent/30 p-4 rounded-lg">
              <div className="space-y-1">
                <span className="text-sm font-medium">License</span>
                <p className="font-medium">{model.license || "Not specified"}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium">Last updated</span>
                <p className="font-medium">
                  {new Date(model.lastModified).toLocaleDateString()}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-sm font-medium">Monthly downloads</span>
                <p className="font-medium">
                  {formatNumber(model.downloads_last_month)}
                </p>
              </div>
            </div>
            
            {/* Detailed tabs */}
            {readmeLoading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <ModelTabs model={model} readme={readme?.content} />
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}