import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Loader2, 
  Check, 
  X, 
  Clock, 
  MessageSquare, 
  DollarSign,
  ExternalLink
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function MarketplaceBids() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");

  // Fetch user's bids
  const { data: bids, isLoading, error } = useQuery({
    queryKey: ["/api/marketplace/bids"],
    queryFn: async () => {
      const response = await fetch("/api/marketplace/my-bids");
      if (!response.ok) {
        throw new Error("Failed to fetch bids");
      }
      return response.json();
    },
    enabled: !!user
  });

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "accepted":
        return "success";
      case "rejected":
        return "destructive";
      case "completed":
        return "default";
      default:
        return "secondary";
    }
  };

  // Get status badge icon
  const getStatusBadgeIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <Check className="h-3 w-3 mr-1" />;
      case "rejected":
        return <X className="h-3 w-3 mr-1" />;
      case "completed":
        return <Check className="h-3 w-3 mr-1" />;
      default:
        return <Clock className="h-3 w-3 mr-1" />;
    }
  };

  // Filter bids based on active tab
  const filteredBids = bids ? bids.filter((bid: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return bid.status === "pending";
    if (activeTab === "accepted") return bid.status === "accepted";
    if (activeTab === "rejected") return bid.status === "rejected";
    if (activeTab === "completed") return bid.status === "completed";
    return true;
  }) : [];

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>You must be signed in to view your bids</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center gap-4">
            <Link href="/auth">
              <Button>Sign In</Button>
            </Link>
            <Link href="/marketplace">
              <Button variant="outline">Back to Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link href="/marketplace">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-4">My Bids</h1>
      </div>

      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all">All Bids</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive mb-4">Error loading your bids. Please try again.</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filteredBids.length > 0 ? (
        <div className="space-y-4">
          {filteredBids.map((bid: any) => (
            <Card key={bid.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="flex-grow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex gap-2 mb-2">
                        <Badge variant="outline">{bid.listing.category}</Badge>
                        <Badge 
                          variant={getStatusBadgeVariant(bid.status)}
                          className="flex items-center"
                        >
                          {getStatusBadgeIcon(bid.status)}
                          <span className="capitalize">{bid.status}</span>
                        </Badge>
                      </div>
                      <h3 className="text-xl font-semibold mb-1">{bid.listing.name}</h3>
                      <p className="text-muted-foreground text-sm mb-3">{bid.listing.shortDescription}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-bold text-xl">{bid.amount.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Bid on {new Date(bid.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="my-4">
                    <h4 className="text-sm font-semibold mb-1">Your Proposal</h4>
                    <p className="text-sm text-muted-foreground">{bid.proposal}</p>
                  </div>
                  
                  {bid.sellerResponse && (
                    <div className="my-4 p-3 bg-muted rounded-md">
                      <h4 className="text-sm font-semibold mb-1">Seller Response</h4>
                      <p className="text-sm">{bid.sellerResponse}</p>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Link href={`/marketplace/listing/${bid.listingId}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <ExternalLink className="h-4 w-4" />
                        View Listing
                      </Button>
                    </Link>
                    
                    {bid.status === "accepted" && (
                      <Link href={`/marketplace/checkout/${bid.id}`}>
                        <Button size="sm" className="flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          Complete Purchase
                        </Button>
                      </Link>
                    )}
                    
                    {bid.status === "pending" && (
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        Send Message
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="md:w-64 bg-muted p-6">
                  <h4 className="font-semibold mb-2">Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Asking Price</span>
                      <span>${bid.listing.price?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Your Offer</span>
                      <span>${bid.amount.toLocaleString()}</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Difference</span>
                      <span>${(bid.listing.price - bid.amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Percentage</span>
                      <span>
                        {Math.round((bid.amount / bid.listing.price) * 100)}% of asking
                      </span>
                    </div>
                  </div>
                  
                  {bid.status === "accepted" && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-md">
                      <p className="text-xs font-medium">
                        Congratulations! The seller has accepted your offer. Complete your purchase to finalize the transaction.
                      </p>
                    </div>
                  )}
                  
                  {bid.status === "rejected" && bid.rejectionReason && (
                    <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                      <h5 className="text-xs font-medium mb-1">Rejection Reason:</h5>
                      <p className="text-xs">{bid.rejectionReason}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Bids Found</h2>
            <p className="text-muted-foreground mb-6">
              {activeTab === "all" 
                ? "You haven't made any offers on app listings yet."
                : `You don't have any ${activeTab} bids at the moment.`
              }
            </p>
            <Link href="/marketplace">
              <Button>Browse Marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}