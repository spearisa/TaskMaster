import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, Loader2, ExternalLink, DollarSign, Calendar, Trash2 } from "lucide-react";
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

export default function MarketplaceFavorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listingToRemove, setListingToRemove] = useState<number | null>(null);

  // Fetch user's favorite listings
  const { data: favorites, isLoading, error } = useQuery({
    queryKey: ["/api/marketplace/favorites"],
    queryFn: async () => {
      const response = await fetch("/api/marketplace/favorites");
      if (!response.ok) {
        throw new Error("Failed to fetch favorites");
      }
      return response.json();
    },
    enabled: !!user
  });

  // Remove from favorites mutation
  const removeFromFavoritesMutation = useMutation({
    mutationFn: async (listingId: number) => {
      return apiRequest("DELETE", `/api/marketplace/listings/${listingId}/favorite`);
    },
    onSuccess: () => {
      toast({
        title: "Removed from favorites",
        description: "The listing has been removed from your saved apps.",
      });
      
      // Invalidate favorites query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/favorites"] });
      setListingToRemove(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove from favorites",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
      setListingToRemove(null);
    }
  });

  // Handle removing a listing from favorites
  const handleRemoveFromFavorites = (listingId: number) => {
    removeFromFavoritesMutation.mutate(listingId);
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>You must be signed in to view your favorites</CardDescription>
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
      <div className="flex items-center mb-8">
        <Link href="/marketplace">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-4">Saved Apps</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-destructive mb-4">Error loading your favorites. Please try again.</p>
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/marketplace/favorites"] })}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : favorites && favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((favorite: any) => (
            <Card key={favorite.id} className="overflow-hidden flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <Badge variant={
                    favorite.listing.monetization === "subscription" ? "default" : 
                    favorite.listing.monetization === "one-time" ? "secondary" :
                    "outline"
                  }>
                    {favorite.listing.monetization === "subscription" ? "Subscription" : 
                     favorite.listing.monetization === "one-time" ? "One-time" : 
                     favorite.listing.monetization || "Mixed"}
                  </Badge>
                  <Badge variant="outline">{favorite.listing.category}</Badge>
                </div>
                <CardTitle className="text-xl mt-2 truncate">{favorite.listing.name}</CardTitle>
                <CardDescription className="line-clamp-2 h-10">
                  {favorite.listing.shortDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2 flex-grow">
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">${favorite.listing.price?.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {favorite.listing.establishedDate
                        ? new Date(favorite.listing.establishedDate).getFullYear()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 col-span-2 text-xs text-muted-foreground">
                    <span>Saved on {new Date(favorite.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <AlertDialog open={listingToRemove === favorite.listingId} onOpenChange={(open) => {
                  if (!open) setListingToRemove(null);
                }}>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 mr-2"
                      onClick={() => setListingToRemove(favorite.listingId)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove from Favorites</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove this app from your saved list?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleRemoveFromFavorites(favorite.listingId)}
                        disabled={removeFromFavoritesMutation.isPending}
                      >
                        {removeFromFavoritesMutation.isPending && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Link href={`/marketplace/listing/${favorite.listingId}`}>
                  <Button size="sm" className="flex-1">View Details</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">No Saved Apps</h2>
            <p className="text-muted-foreground mb-6">
              You haven't saved any apps to your favorites yet. Browse the marketplace and save apps that interest you.
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