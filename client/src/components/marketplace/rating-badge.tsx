import { Star } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RatingBadgeProps {
  overallRating: number | null;
  totalReviews: number;
  variant?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export function RatingBadge({
  overallRating,
  totalReviews,
  variant = "md",
  showCount = true,
  className = "",
}: RatingBadgeProps) {
  if (!overallRating || totalReviews === 0) {
    return (
      <span className={`text-xs text-muted-foreground ${className}`}>
        No reviews yet
      </span>
    );
  }

  // Set star size based on variant
  const sizeClass = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[variant];

  // Set text size based on variant
  const textClass = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[variant];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center ${className}`}>
            <div className="flex text-yellow-500 mr-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`${sizeClass} ${
                    star <= Math.round(overallRating) ? "fill-current" : ""
                  }`}
                />
              ))}
            </div>
            <span className={`font-medium ${textClass}`}>
              {overallRating.toFixed(1)}
            </span>
            {showCount && (
              <span className={`ml-1 text-muted-foreground ${textClass}`}>
                ({totalReviews})
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <div className="font-medium">{overallRating.toFixed(1)} out of 5</div>
            <div className="text-xs text-muted-foreground">
              Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface RatingDetailBadgeProps {
  label: string;
  rating: number | null;
  variant?: "sm" | "md" | "lg";
  className?: string;
}

export function RatingDetailBadge({
  label,
  rating,
  variant = "sm",
  className = "",
}: RatingDetailBadgeProps) {
  if (!rating) return null;

  // Set star size based on variant
  const sizeClass = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  }[variant];

  // Set text size based on variant
  const textClass = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }[variant];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex items-center ${className}`}>
            <span className={`text-muted-foreground mr-1.5 ${textClass}`}>{label}:</span>
            <span className={`font-medium mr-1 ${textClass}`}>{rating.toFixed(1)}</span>
            <Star className={`${sizeClass} text-yellow-500 fill-yellow-500`} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            {label} rated {rating.toFixed(1)} out of 5
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface SellerRatingBadgeProps {
  sellerId: number;
  initialRating?: number | null;
  initialReviewCount?: number;
  showDetails?: boolean;
  variant?: "sm" | "md" | "lg";
  className?: string;
}

export function SellerRatingBadge({
  sellerId,
  initialRating = null,
  initialReviewCount = 0,
  showDetails = false,
  variant = "md",
  className = "",
}: SellerRatingBadgeProps) {
  // This component is intended to be used in listings to show seller ratings
  // It can be pre-populated with initial data (for performance) but could also 
  // fetch data if needed in the future
  
  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      <RatingBadge 
        overallRating={initialRating} 
        totalReviews={initialReviewCount} 
        variant={variant}
      />
      
      {showDetails && initialRating && initialRating > 0 && (
        <>
          <span className="text-muted-foreground mx-1">•</span>
          <span className="text-xs text-green-600 font-medium">
            Trusted Seller
          </span>
        </>
      )}
    </div>
  );
}