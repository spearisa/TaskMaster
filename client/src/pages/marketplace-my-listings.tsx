import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Loader2, 
  PlusCircle, 
  Edit, 
  Trash2, 
  MessageSquare, 
  Eye, 
  EyeOff,
  DollarSign,
  Users,
  Calendar
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MarketplaceMyListings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listingToDelete, setListingToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch user's listings
  const { data: listings, isLoading, error } = useQuery({
    queryKey: ["/api/marketplace/my-listings"],
    queryFn: async () => {
      const response = await fetch("/api/marketplace/listings?seller_id=" + user?.id);
      if (!response.ok) {
        throw new Error("Failed to fetch listings");
      }
      return response.json();
    },
    enabled: !!user
  });

  // Delete listing mutation
  const deleteListingMutation = useMutation({
    mutationFn: async (listingId: number) => {
      return apiRequest("DELETE", `/api/marketplace/listings/${listingId}`);
    },
    onSuccess: () => {
      toast({
        title: "Listing deleted",
        description: "Your app listing has been removed from the marketplace.",
      });
      
      // Invalidate listings query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/my-listings"] });
      setListingToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete listing",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
      setListingToDelete(null);
    }
  });

  // Update listing status mutation
  const updateListingStatusMutation = useMutation({
    mutationFn: async ({ listingId, status }: { listingId: number, status: string }) => {
      return apiRequest("PUT", `/api/marketplace/listings/${listingId}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Listing updated",
        description: "Your app listing status has been updated.",
      });
      
      // Invalidate listings query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/my-listings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update listing",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });

  // Handle deleting a listing
  const handleDeleteListing = (listingId: number) => {
    deleteListingMutation.mutate(listingId);
  };

  // Handle publishing/unpublishing a listing
  const handleUpdateStatus = (listingId: number, status: string) => {
    updateListingStatusMutation.mutate({ listingId, status });
  };

  // Filter listings based on active tab
  const filteredListings = listings ? listings.filter((listing: any) => {
    if (activeTab === "all") return true;
    if (activeTab === "published") return listing.status === "published";
    if (activeTab === "draft") return listing.status === "draft";
    return true;
  }) : [];

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>You must be signed in to view your listings</CardDescription>
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link href="/marketplace">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Marketplace
            </Button>
          </Link>
          <h1 className="text-2xl font-bold ml-4">My Listings</h1>
        </div>
        
        <Link href="/marketplace/sell">
          <Button className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>Create New Listing</span>
          </Button>
        </Link>
      </div>

      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all">All Listings</TabsTrigger>
          <TabsTrigger value="published">Published</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive mb-4">Error loading your listings. Please try again.</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/marketplace/my-listings"] })}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filteredListings.length > 0 ? (
        <div className="space-y-4">
          {filteredListings.map((listing: any) => (
            <Card key={listing.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="flex-grow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex gap-2 mb-2">
                        <Badge variant={listing.status === "published" ? "default" : "outline"}>
                          {listing.status === "published" ? "Published" : "Draft"}
                        </Badge>
                        <Badge variant="secondary">{listing.category}</Badge>
                        <Badge variant="outline">{listing.monetization || "Mixed"}</Badge>
                      </div>
                      <h3 className="text-xl font-semibold mb-1">{listing.name}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{listing.shortDescription}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">${listing.price?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(listing.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Revenue</span>
                      </div>
                      <p>${listing.monthlyRevenue?.toLocaleString() || "N/A"}/mo</p>
                    </div>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Users</span>
                      </div>
                      <p>{listing.monthlyUsers?.toLocaleString() || "N/A"}</p>
                    </div>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Established</span>
                      </div>
                      <p>
                        {listing.establishedDate
                          ? new Date(listing.establishedDate).getFullYear()
                          : "N/A"}
                      </p>
                    </div>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Questions</span>
                      </div>
                      <p>{listing.questionsCount || 0}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/marketplace/listing/${listing.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    
                    <Link href={`/marketplace/edit/${listing.id}`}>
                      <Button variant="outline" size="sm" className="flex items-center gap-1">
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                    </Link>
                    
                    {listing.status === "published" ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => handleUpdateStatus(listing.id, "draft")}
                        disabled={updateListingStatusMutation.isPending}
                      >
                        <EyeOff className="h-4 w-4" />
                        Unpublish
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => handleUpdateStatus(listing.id, "published")}
                        disabled={updateListingStatusMutation.isPending}
                      >
                        <Eye className="h-4 w-4" />
                        Publish
                      </Button>
                    )}
                    
                    <AlertDialog open={listingToDelete === listing.id} onOpenChange={(open) => {
                      if (!open) setListingToDelete(null);
                    }}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1 text-destructive border-destructive hover:bg-destructive/10"
                          onClick={() => setListingToDelete(listing.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Listing</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this listing? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteListing(listing.id)}
                            disabled={deleteListingMutation.isPending}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            {deleteListingMutation.isPending && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <div className="md:w-64 bg-muted p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold mb-2">Stats</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Views</span>
                        <span>{listing.viewCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Favorites</span>
                        <span>{listing.favoriteCount || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Offers</span>
                        <span>{listing.bidCount || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  {listing.bidCount > 0 && (
                    <Link href={`/marketplace/listing/${listing.id}/bids`}>
                      <Button variant="default" className="w-full mt-4">
                        View Offers
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <PlusCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Listings Found</h2>
            <p className="text-muted-foreground mb-6">
              {activeTab === "all" 
                ? "You haven't created any app listings yet."
                : activeTab === "published"
                  ? "You don't have any published listings. Publish a draft or create a new listing."
                  : "You don't have any draft listings. Create a new listing to get started."
              }
            </p>
            <Link href="/marketplace/sell">
              <Button>Create New Listing</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}