import { useQuery } from "@tanstack/react-query";
import { Star, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
  updatedAt: string;
  reviewer: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
}

interface ListingReviewsProps {
  listingId: number;
}

export function ListingReviews({ listingId }: ListingReviewsProps) {
  const { data: reviews, isLoading, error } = useQuery<Review[]>({
    queryKey: ['/api/marketplace/listings', listingId, 'reviews'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/marketplace/listings/${listingId}/reviews`);
      return response.json();
    },
    enabled: !!listingId,
  });

  if (isLoading) {
    return <ListingReviewsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading reviews
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground border rounded-md">
        No reviews yet for this listing
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Reviews</CardTitle>
          <CardDescription>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'} for this listing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="pb-6 border-b last:border-b-0">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage 
                      src={review.reviewer?.avatarUrl || ''} 
                      alt={review.reviewer?.displayName || review.reviewer?.username || 'Anonymous'} 
                    />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
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
                      className={`h-5 w-5 ${star <= review.overallRating ? 'fill-current' : ''}`} 
                    />
                  ))}
                </div>
              </div>
              
              <p className="mb-3">{review.comment}</p>
              
              {(review.codeQualityRating || review.documentationRating || review.supportRating || review.valueRating) && (
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-sm border-t pt-3">
                  {review.codeQualityRating && (
                    <div>
                      <span className="text-muted-foreground">Code Quality: </span>
                      <span className="font-medium">{review.codeQualityRating}/5</span>
                    </div>
                  )}
                  {review.documentationRating && (
                    <div>
                      <span className="text-muted-foreground">Documentation: </span>
                      <span className="font-medium">{review.documentationRating}/5</span>
                    </div>
                  )}
                  {review.supportRating && (
                    <div>
                      <span className="text-muted-foreground">Support: </span>
                      <span className="font-medium">{review.supportRating}/5</span>
                    </div>
                  )}
                  {review.valueRating && (
                    <div>
                      <span className="text-muted-foreground">Value: </span>
                      <span className="font-medium">{review.valueRating}/5</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ListingReviewsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="pb-6 border-b last:border-b-0">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded-full mr-3" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
              
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-2/3" />
              
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 border-t pt-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}