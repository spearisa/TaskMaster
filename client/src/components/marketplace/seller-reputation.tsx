import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, StarHalf, User } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";

interface RatingMetrics {
  totalReviews: number;
  averageRatings: {
    overall: number | null;
    codeQuality: number | null;
    documentation: number | null;
    support: number | null;
    value: number | null;
  };
  ratingDistribution: {
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  };
}

interface Review {
  id: number;
  listingId: number;
  reviewerId: number;
  overallRating: number;
  codeQualityRating: number | null;
  documentationRating: number | null;
  supportRating: number | null;
  valueRating: number | null;
  comment: string;
  createdAt: string;
  reviewer: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
  listing: {
    id: number;
    title: string;
    slug: string;
  } | null;
}

interface SellerRatingResponse {
  sellerId: number;
  metrics: RatingMetrics;
  recentReviews: Review[];
}

interface SellerReputationProps {
  sellerId: number;
}

export function SellerReputation({ sellerId }: SellerReputationProps) {
  const { data, isLoading, error } = useQuery<SellerRatingResponse>({
    queryKey: ['/api/marketplace/sellers', sellerId, 'reviews'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/marketplace/sellers/${sellerId}/reviews`);
      return response.json();
    },
    enabled: !!sellerId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading seller reputation data
      </div>
    );
  }

  if (!data || !data.metrics) {
    return (
      <div className="p-4 text-muted-foreground">
        No reviews available for this seller yet
      </div>
    );
  }

  const { metrics, recentReviews } = data;
  const overallRating = metrics.averageRatings.overall || 0;
  const totalReviewCount = metrics.totalReviews;
  
  // Calculate percentages for the rating distribution
  const calculatePercentage = (count: number): number => {
    return totalReviewCount > 0 ? (count / totalReviewCount) * 100 : 0;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span>Seller Rating</span>
              <Badge variant="outline" className="ml-3">
                {totalReviewCount} {totalReviewCount === 1 ? 'review' : 'reviews'}
              </Badge>
            </CardTitle>
            <CardDescription>Overall reputation metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <div className="text-3xl font-bold mr-3">{overallRating.toFixed(1)}</div>
              <div className="flex text-yellow-500">
                {[1, 2, 3, 4, 5].map((star) => {
                  const diff = overallRating - star + 1;
                  return (
                    <span key={star}>
                      {diff >= 1 ? (
                        <Star className="fill-current" />
                      ) : diff > 0 ? (
                        <StarHalf className="fill-current" />
                      ) : (
                        <Star />
                      )}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>5 stars</span>
                  <span>{metrics.ratingDistribution['5']} reviews</span>
                </div>
                <Progress value={calculatePercentage(metrics.ratingDistribution['5'])} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>4 stars</span>
                  <span>{metrics.ratingDistribution['4']} reviews</span>
                </div>
                <Progress value={calculatePercentage(metrics.ratingDistribution['4'])} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>3 stars</span>
                  <span>{metrics.ratingDistribution['3']} reviews</span>
                </div>
                <Progress value={calculatePercentage(metrics.ratingDistribution['3'])} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>2 stars</span>
                  <span>{metrics.ratingDistribution['2']} reviews</span>
                </div>
                <Progress value={calculatePercentage(metrics.ratingDistribution['2'])} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>1 star</span>
                  <span>{metrics.ratingDistribution['1']} reviews</span>
                </div>
                <Progress value={calculatePercentage(metrics.ratingDistribution['1'])} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detailed Ratings</CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Code Quality</span>
                  <div className="flex items-center">
                    <span className="mr-2 font-semibold">
                      {metrics.averageRatings.codeQuality?.toFixed(1) || 'N/A'}
                    </span>
                    {metrics.averageRatings.codeQuality && (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    )}
                  </div>
                </div>
                {metrics.averageRatings.codeQuality && (
                  <Progress 
                    value={(metrics.averageRatings.codeQuality / 5) * 100} 
                    className="h-2" 
                  />
                )}
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span>Documentation</span>
                  <div className="flex items-center">
                    <span className="mr-2 font-semibold">
                      {metrics.averageRatings.documentation?.toFixed(1) || 'N/A'}
                    </span>
                    {metrics.averageRatings.documentation && (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    )}
                  </div>
                </div>
                {metrics.averageRatings.documentation && (
                  <Progress 
                    value={(metrics.averageRatings.documentation / 5) * 100} 
                    className="h-2" 
                  />
                )}
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span>Support Quality</span>
                  <div className="flex items-center">
                    <span className="mr-2 font-semibold">
                      {metrics.averageRatings.support?.toFixed(1) || 'N/A'}
                    </span>
                    {metrics.averageRatings.support && (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    )}
                  </div>
                </div>
                {metrics.averageRatings.support && (
                  <Progress 
                    value={(metrics.averageRatings.support / 5) * 100} 
                    className="h-2" 
                  />
                )}
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span>Value for Money</span>
                  <div className="flex items-center">
                    <span className="mr-2 font-semibold">
                      {metrics.averageRatings.value?.toFixed(1) || 'N/A'}
                    </span>
                    {metrics.averageRatings.value && (
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                    )}
                  </div>
                </div>
                {metrics.averageRatings.value && (
                  <Progress 
                    value={(metrics.averageRatings.value / 5) * 100} 
                    className="h-2" 
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {recentReviews && recentReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
            <CardDescription>Latest feedback from buyers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentReviews.map((review) => (
                <div key={review.id} className="pb-4 border-b last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage 
                          src={review.reviewer?.avatarUrl || ''} 
                          alt={review.reviewer?.displayName || review.reviewer?.username || 'Anonymous'} 
                        />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {review.reviewer?.displayName || review.reviewer?.username || 'Anonymous'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex text-yellow-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`h-4 w-4 ${star <= review.overallRating ? 'fill-current' : ''}`} 
                        />
                      ))}
                    </div>
                  </div>
                  
                  {review.listing && (
                    <div className="text-sm mb-2">
                      <span className="text-muted-foreground">For:</span>{' '}
                      <span className="font-medium">{review.listing.title}</span>
                    </div>
                  )}
                  
                  <p className="text-sm mt-1">{review.comment}</p>
                  
                  {(review.codeQualityRating || review.documentationRating || review.supportRating || review.valueRating) && (
                    <div className="mt-3 pt-2 border-t grid grid-cols-2 gap-2 text-xs">
                      {review.codeQualityRating && (
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-1">Code Quality:</span>
                          <span className="font-medium">{review.codeQualityRating}/5</span>
                        </div>
                      )}
                      {review.documentationRating && (
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-1">Documentation:</span>
                          <span className="font-medium">{review.documentationRating}/5</span>
                        </div>
                      )}
                      {review.supportRating && (
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-1">Support:</span>
                          <span className="font-medium">{review.supportRating}/5</span>
                        </div>
                      )}
                      {review.valueRating && (
                        <div className="flex items-center">
                          <span className="text-muted-foreground mr-1">Value:</span>
                          <span className="font-medium">{review.valueRating}/5</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}