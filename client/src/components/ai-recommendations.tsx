import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowUpRight, Star, Download, Check } from 'lucide-react';
import { apiRequest, getQueryFn } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';

// Types for API response
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
  url: string;
  category: string;
  useCases?: string[];
  pricingTiers?: PricingTier[];
}

interface AIRecommendationsResponse {
  task: any;
  recommendations: AIRecommendation[];
}

export function AIRecommendations({ taskId }: { taskId: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<AIRecommendation | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  // Fetch recommendations for this task
  const { data, isLoading, error } = useQuery<AIRecommendationsResponse>({
    queryKey: ['/api/ai-recommendations', taskId],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/ai-recommendations', { taskId });
      return await response.json();
    },
    enabled: !!taskId && !!user,
  });

  // Handle referral tracking when a user clicks on an AI tool
  const trackReferral = async (toolId: string) => {
    try {
      await apiRequest('POST', '/api/ai-referral/track', {
        toolId,
        taskId
      });
    } catch (err) {
      console.error('Failed to track referral:', err);
    }
  };

  // Open the AI tool's website with referral tracking
  const handleVisitSite = (app: AIRecommendation) => {
    trackReferral(app.id);
    window.open(app.url, '_blank');
  };

  // Handle when a user selects a pricing tier
  const handleSelectTier = (app: AIRecommendation, tierName: string) => {
    setSelectedApp(app);
    setSelectedTier(tierName);
    
    toast({
      title: `${tierName} plan selected`,
      description: `You've selected the ${tierName} plan for ${app.name}`,
    });
  };

  // Handle when a user signs up for a premium tier
  const handleSignup = async () => {
    if (!selectedApp || !selectedTier) return;
    
    try {
      // First track the click
      const referralResponse = await apiRequest('POST', '/api/ai-referral/track', {
        toolId: `${selectedApp.id}:${selectedTier}`,
        taskId
      });
      
      const referralData = await referralResponse.json();
      
      // Get the pricing tier info
      const selectedPricingTier = selectedApp.pricingTiers?.find(tier => tier.name === selectedTier);
      
      if (selectedPricingTier && selectedPricingTier.price > 0) {
        // If this is a paid tier, simulate tracking the conversion with commission
        // In a real implementation, this would be called by a webhook from the AI tool provider
        setTimeout(async () => {
          try {
            await apiRequest('POST', '/api/ai-referral/convert', {
              referralId: referralData.referral.id,
              commission: (selectedPricingTier.price * selectedPricingTier.referralCommission / 100).toFixed(2)
            });
            
            console.log('Conversion tracked successfully');
          } catch (err) {
            console.error('Failed to track conversion:', err);
          }
        }, 3000);
      }
      
      // Open the app website
      window.open(selectedApp.url, '_blank');
      
      toast({
        title: 'Redirecting to provider',
        description: `You're being redirected to sign up for ${selectedApp.name}`,
      });
    } catch (err) {
      console.error('Error in signup process:', err);
      toast({
        title: 'Error',
        description: 'There was an error processing your request. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="my-4 space-y-4">
        <h2 className="text-lg font-semibold">Recommended AI Tools</h2>
        <p className="text-sm text-muted-foreground">Finding the best AI tools to help with this task...</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-5 w-2/3 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter className="p-4 flex justify-between">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Unable to load AI tool recommendations. Please try again later.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data || !data.recommendations || data.recommendations.length === 0) {
    return (
      <div className="my-4">
        <Card>
          <CardHeader>
            <CardTitle>No Recommendations Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No AI tool recommendations are available for this task.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="my-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Recommended AI Tools</h2>
        <Badge variant="outline" className="gap-1">
          <Star className="h-3 w-3 fill-primary text-primary" />
          <span className="text-xs">Premium Tools</span>
        </Badge>
      </div>
      
      <p className="text-sm text-muted-foreground">
        These AI tools can help you complete this task more efficiently
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
              
              {app.pricingTiers && (
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Available Plans</span>
                    <span>Price</span>
                  </div>
                  {app.pricingTiers.map((tier) => (
                    <div key={tier.name} 
                         className={`flex justify-between items-center p-2 rounded-md text-xs
                                    ${selectedApp?.id === app.id && selectedTier === tier.name 
                                      ? 'bg-primary/10 border border-primary/20' 
                                      : 'bg-muted/40 hover:bg-muted/60 cursor-pointer'}`}
                         onClick={() => handleSelectTier(app, tier.name)}>
                      <div className="flex items-center gap-1">
                        {selectedApp?.id === app.id && selectedTier === tier.name && (
                          <Check className="h-3 w-3 text-primary" />
                        )}
                        <span>{tier.name}</span>
                      </div>
                      <div>
                        {tier.price === 0 ? 'Free' : `$${tier.price.toFixed(2)}`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {app.useCases && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {app.useCases.slice(0, 3).map((useCase) => (
                    <Badge key={useCase} variant="outline" className="text-xs">
                      {useCase}
                    </Badge>
                  ))}
                  {app.useCases.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{app.useCases.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="p-4 flex justify-between bg-muted/20">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs" 
                onClick={() => handleVisitSite(app)}>
                <ExternalLink className="h-3 w-3 mr-1" />
                Visit Site
              </Button>
              
              {selectedApp?.id === app.id && selectedTier && (
                <Button 
                  size="sm" 
                  className="text-xs gap-1" 
                  onClick={handleSignup}>
                  <ArrowUpRight className="h-3 w-3" />
                  Get {selectedTier}
                </Button>
              )}
              
              {(!selectedApp || selectedApp.id !== app.id) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-muted-foreground" 
                  onClick={() => setSelectedApp(app)}>
                  See Plans
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="bg-muted/30 rounded-lg p-4 mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">How Appmo's Recommendations Work</h3>
          <Download className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Appmo analyzes your task details to recommend the most suitable AI tools.
          Signing up through these links supports the development of Appmo.
        </p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs mb-1">
            <span>Task Analysis Relevance</span>
            <span>98%</span>
          </div>
          <Progress value={98} className="h-1" />
        </div>
      </div>
    </div>
  );
}