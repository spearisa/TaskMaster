import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";

// Define interfaces for the AI recommendation data
interface PricingTier {
  name: string;
  price: number;
  features: string[];
  referralCommission: number;
}

interface AIRecommendation {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  pricingTiers?: PricingTier[];
}

interface AIRecommendationsResponse {
  task: any;
  recommendations: AIRecommendation[];
}

export function PublicAIRecommendations({ taskId }: { taskId: number }) {
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  
  // Fetch recommendations for this task
  const { data, isLoading, error } = useQuery<AIRecommendationsResponse>({
    queryKey: ['/api/ai-recommendations', taskId],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/ai-recommendations', { taskId });
      return await response.json();
    },
    enabled: !!taskId,
    retry: 1, // Only retry once to avoid too many requests
  });
  
  // Toggle expanded state for pricing details
  const toggleExpand = (appId: string) => {
    if (expandedApp === appId) {
      setExpandedApp(null);
    } else {
      setExpandedApp(appId);
    }
  };

  // Track app click for analytics (anonymous tracking is fine for public tasks)
  const trackAppClick = async (appId: string) => {
    try {
      // Optional: track click for analytics even for anonymous users
      await apiRequest('POST', '/api/ai-referral/track', {
        toolId: appId,
        taskId
      }).catch(() => {}); // Ignore errors for anonymous tracking
    } catch (err) {
      console.error('Failed to track referral:', err);
    }
  };

  // Open the AI tool's website
  const handleVisitSite = (app: AIRecommendation) => {
    trackAppClick(app.id);
    window.open(app.url, '_blank');
  };

  // If we're loading, show skeleton UI
  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-11/12 mb-1" />
                <Skeleton className="h-4 w-3/4" />
                <div className="mt-3">
                  <Skeleton className="h-8 w-full mt-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // If there's an error or no recommendations, don't show anything
  if (error || !data || !data.recommendations || data.recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Recommended AI Tools</h2>
        <Badge variant="outline" className="gap-1">
          <Star className="h-3 w-3 fill-primary text-primary" />
          <span className="text-xs">AI Selected</span>
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground">
        These AI tools can help complete this task more efficiently
      </p>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.recommendations.map((app) => (
          <Card key={app.id} className="overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{app.name}</CardTitle>
                <Badge variant="secondary" className="text-xs">{app.category}</Badge>
              </div>
              <CardDescription className="line-clamp-1 text-xs">{app.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <p className="text-sm mb-2 line-clamp-2">{app.description}</p>
              
              {app.pricingTiers && app.pricingTiers.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Available Plans</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 p-0"
                      onClick={() => toggleExpand(app.id)}
                    >
                      {expandedApp === app.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {expandedApp === app.id && (
                    <div className="bg-muted rounded-md p-2 text-xs space-y-2">
                      {app.pricingTiers.map((tier, i) => (
                        <div key={i}>
                          {i > 0 && <Separator className="my-2" />}
                          <div className="font-medium">{tier.name}</div>
                          <div className="text-primary font-medium">${tier.price}/mo</div>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            {tier.features.map((feature, j) => (
                              <li key={j} className="text-muted-foreground text-[11px] ml-2">{feature}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <Button 
                className="w-full mt-3 gap-1"
                size="sm"
                onClick={() => handleVisitSite(app)}
              >
                Visit Website
                <ExternalLink className="h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}