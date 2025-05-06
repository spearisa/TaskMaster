import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RatingBadgeProps {
  overallRating: number;
  totalReviews?: number;
  showNumber?: boolean;
  variant?: 'default' | 'sm';
}

export function RatingBadge({ 
  overallRating, 
  totalReviews, 
  showNumber = false,
  variant = 'default' 
}: RatingBadgeProps) {
  const isSmall = variant === 'sm';
  const starSize = isSmall ? 'h-3 w-3' : 'h-4 w-4';
  
  return (
    <div className="flex items-center">
      <div className="flex text-yellow-500">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`${starSize} ${star <= Math.round(overallRating) ? 'fill-current' : ''}`} 
          />
        ))}
      </div>
      
      {showNumber && (
        <span className="ml-1 text-sm font-medium">
          {overallRating.toFixed(1)}
        </span>
      )}
      
      {totalReviews !== undefined && (
        <span className={`text-muted-foreground ${isSmall ? 'text-xs ml-1' : 'text-sm ml-2'}`}>
          ({totalReviews})
        </span>
      )}
    </div>
  );
}

interface RatingDetailBadgeProps {
  label: string;
  rating: number;
}

export function RatingDetailBadge({ label, rating }: RatingDetailBadgeProps) {
  return (
    <Badge variant="outline" className="flex items-center gap-1 font-normal">
      <span className="text-xs text-muted-foreground">{label}:</span>
      <span className="font-medium">{rating.toFixed(1)}</span>
      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
    </Badge>
  );
}

interface SellerRatingBadgeProps {
  ratings: {
    overall: number;
    codeQuality?: number;
    documentation?: number;
    support?: number;
    value?: number;
  };
  totalReviews: number;
}

export function SellerRatingBadge({ ratings, totalReviews }: SellerRatingBadgeProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <RatingBadge overallRating={ratings.overall} totalReviews={totalReviews} showNumber={true} />
      </div>
      
      <div className="flex flex-wrap gap-2">
        {ratings.codeQuality && (
          <RatingDetailBadge label="Code" rating={ratings.codeQuality} />
        )}
        
        {ratings.documentation && (
          <RatingDetailBadge label="Docs" rating={ratings.documentation} />
        )}
        
        {ratings.support && (
          <RatingDetailBadge label="Support" rating={ratings.support} />
        )}
        
        {ratings.value && (
          <RatingDetailBadge label="Value" rating={ratings.value} />
        )}
      </div>
    </div>
  );
}