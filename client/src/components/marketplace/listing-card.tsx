import { Link } from "wouter";
import { Calendar, Code2, FileText, Heart, Star, User } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingBadge } from "./rating-badge";

interface AppListing {
  id: number;
  title: string;
  slug: string;
  description: string;
  price: number;
  status: string;
  category: string;
  subcategory?: string;
  thumbnailUrl?: string;
  sellerId: number;
  createdAt: string;
  updatedAt: string;
  establishedDate?: string;
  monthlyRevenue?: number;
  monthlyProfit?: number;
  monthlySales?: number;
  totalDownloads?: number;
  supportPeriod?: number;
  supportDetails?: string;
  repositoryUrl?: string;
  documentationUrl?: string;
  lastMaintained?: string;
  seller: {
    id: number;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
  };
  reviewCount?: number;
  averageRating?: number;
  codeQualityRating?: number;
  documentationRating?: number;
  supportRating?: number;
  valueRating?: number;
}

interface ListingCardProps {
  listing: AppListing;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export function ListingCard({ listing, isFavorite, onToggleFavorite }: ListingCardProps) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(listing.price);

  return (
    <Card className="h-full flex flex-col overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="p-0">
        <div className="relative aspect-video w-full bg-muted overflow-hidden">
          {listing.thumbnailUrl ? (
            <img 
              src={listing.thumbnailUrl} 
              alt={listing.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/30">
              <Code2 className="h-16 w-16 text-muted-foreground/50" />
            </div>
          )}
          
          <div className="absolute top-2 right-2 flex gap-2">
            <Badge variant="secondary" className="capitalize">
              {listing.category}
            </Badge>
            {listing.supportPeriod && (
              <Badge variant="outline" className="bg-background/80">
                {listing.supportPeriod}m support
              </Badge>
            )}
          </div>
          
          {onToggleFavorite && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="absolute top-2 left-2 bg-background/80 hover:bg-background"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite();
              }}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 flex-grow">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-xl line-clamp-1">
            <Link href={`/marketplace/${listing.id}/${listing.slug}`} className="hover:underline">
              {listing.title}
            </Link>
          </h3>
          <span className="font-bold text-lg">{formattedPrice}</span>
        </div>
        
        <div className="mb-3 flex items-center space-x-1 text-sm">
          <Avatar className="h-5 w-5 mr-1">
            <AvatarImage 
              src={listing.seller?.avatarUrl || ''} 
              alt={listing.seller?.displayName || listing.seller?.username} 
            />
            <AvatarFallback>
              <User className="h-3 w-3" />
            </AvatarFallback>
          </Avatar>
          
          <span>
            {listing.seller?.displayName || listing.seller?.username}
          </span>
          
          {listing.averageRating && listing.reviewCount && (
            <>
              <span className="text-muted-foreground">•</span>
              <RatingBadge 
                overallRating={listing.averageRating} 
                totalReviews={listing.reviewCount}
                variant="sm"
              />
            </>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {listing.description}
        </p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 border-t text-xs flex flex-wrap gap-y-1 gap-x-3 text-muted-foreground">
        {listing.lastMaintained && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Updated {new Date(listing.lastMaintained).toLocaleDateString()}</span>
          </div>
        )}
        
        {listing.repositoryUrl && (
          <div className="flex items-center gap-1">
            <Code2 className="h-3 w-3" />
            <span>Code repository</span>
          </div>
        )}
        
        {listing.documentationUrl && (
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>Documentation</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}