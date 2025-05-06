import { useQuery } from "@tanstack/react-query";
import { Building, CheckCircle, Code2, FileText, MessageCircle, ThumbsUp, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { RatingBadge } from "./rating-badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SellerReputation {
  sellerId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  totalSales: number;
  totalListings: number;
  memberSince: string;
  averageRating: number | null;
  totalReviews: number;
  codeQualityRating: number | null;
  documentationRating: number | null;
  supportRating: number | null;
  valueRating: number | null;
  responseRate: number | null;
  averageResponseTime: number | null; // in hours
}

interface SellerReputationProps {
  sellerId: number;
}

export function SellerReputation({ sellerId }: SellerReputationProps) {
  const { data: reputation, isLoading, error } = useQuery<SellerReputation>({
    queryKey: ['/api/marketplace/sellers', sellerId, 'reputation'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/marketplace/sellers/${sellerId}/reputation`);
      return res.json();
    },
    enabled: !!sellerId,
  });

  if (isLoading) {
    return <SellerReputationSkeleton />;
  }

  if (error || !reputation) {
    return (
      <div className="p-4 text-red-500">
        Error loading seller reputation data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={reputation.avatarUrl || ''} alt={reputation.displayName || reputation.username} />
              <AvatarFallback>
                {(reputation.displayName || reputation.username || '?').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{reputation.displayName || reputation.username}</CardTitle>
              <CardDescription>
                Member since {new Date(reputation.memberSince).toLocaleDateString()}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {reputation.bio && (
            <div>
              <h3 className="text-sm font-medium mb-1">About the Seller</h3>
              <p className="text-sm text-muted-foreground">{reputation.bio}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
              <Building className="h-5 w-5 text-muted-foreground mb-1" />
              <div className="text-sm font-semibold">{reputation.totalListings}</div>
              <div className="text-xs text-muted-foreground text-center">Apps Listed</div>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
              <ThumbsUp className="h-5 w-5 text-muted-foreground mb-1" />
              <div className="text-sm font-semibold">{reputation.totalSales}</div>
              <div className="text-xs text-muted-foreground text-center">Successful Sales</div>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
              <MessageCircle className="h-5 w-5 text-muted-foreground mb-1" />
              <div className="text-sm font-semibold">
                {reputation.responseRate ? `${Math.round(reputation.responseRate * 100)}%` : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground text-center">Response Rate</div>
            </div>
            
            <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
              <Users className="h-5 w-5 text-muted-foreground mb-1" />
              <div className="text-sm font-semibold">
                {reputation.averageResponseTime 
                  ? `${Math.round(reputation.averageResponseTime)}h` 
                  : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground text-center">Avg. Response Time</div>
            </div>
          </div>
          
          {reputation.averageRating && reputation.totalReviews > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Seller Ratings ({reputation.totalReviews} reviews)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="mb-1 text-xs text-muted-foreground">Overall Rating</div>
                  <div className="flex items-center">
                    <RatingBadge
                      overallRating={reputation.averageRating}
                      showNumber={true}
                    />
                  </div>
                </div>
                
                {reputation.codeQualityRating && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="mb-1 flex items-center text-xs text-muted-foreground">
                      <Code2 className="h-3 w-3 mr-1" />
                      Code Quality
                    </div>
                    <div className="flex items-center">
                      <RatingBadge
                        overallRating={reputation.codeQualityRating}
                        showNumber={true}
                      />
                    </div>
                  </div>
                )}
                
                {reputation.documentationRating && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="mb-1 flex items-center text-xs text-muted-foreground">
                      <FileText className="h-3 w-3 mr-1" />
                      Documentation
                    </div>
                    <div className="flex items-center">
                      <RatingBadge
                        overallRating={reputation.documentationRating}
                        showNumber={true}
                      />
                    </div>
                  </div>
                )}
                
                {reputation.supportRating && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="mb-1 flex items-center text-xs text-muted-foreground">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Support Quality
                    </div>
                    <div className="flex items-center">
                      <RatingBadge
                        overallRating={reputation.supportRating}
                        showNumber={true}
                      />
                    </div>
                  </div>
                )}
                
                {reputation.valueRating && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="mb-1 flex items-center text-xs text-muted-foreground">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Value for Money
                    </div>
                    <div className="flex items-center">
                      <RatingBadge
                        overallRating={reputation.valueRating}
                        showNumber={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SellerReputationSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          
          <div>
            <Skeleton className="h-4 w-40 mb-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}