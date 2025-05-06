import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, PlusCircle, DollarSign, Building, Calendar, Heart } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Marketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState<{ min?: number; max?: number }>({});
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  // Fetch marketplace listings
  const { data: listings, isLoading, error } = useQuery({
    queryKey: ["/api/marketplace/listings", searchTerm, priceFilter, categoryFilter],
    queryFn: async () => {
      let url = "/api/marketplace/listings";
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append("search", searchTerm);
      }
      
      if (priceFilter.min !== undefined) {
        params.append("price_min", priceFilter.min.toString());
      }
      
      if (priceFilter.max !== undefined) {
        params.append("price_max", priceFilter.max.toString());
      }
      
      if (categoryFilter) {
        params.append("category", categoryFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch listings");
      }
      return response.json();
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The query will automatically refetch due to the queryKey including searchTerm
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">App Marketplace</h1>
          <p className="text-muted-foreground mt-1">Buy and sell established online businesses</p>
        </div>
        
        {user && (
          <Link href="/marketplace/sell">
            <Button className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              <span>List Your App</span>
            </Button>
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        {/* Search and filters */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search apps..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow"
                  />
                  <Button type="submit" size="icon" variant="secondary">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Price Range</h3>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={priceFilter.min || ""}
                      onChange={(e) => setPriceFilter(prev => ({ ...prev, min: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full"
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={priceFilter.max || ""}
                      onChange={(e) => setPriceFilter(prev => ({ ...prev, max: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Categories</h3>
                  <div className="space-y-1">
                    {["SaaS", "Content", "E-commerce", "Mobile App", "Other"].map(category => (
                      <div key={category} className="flex items-center">
                        <Button 
                          variant={categoryFilter === category ? "default" : "ghost"} 
                          size="sm"
                          className="justify-start w-full"
                          onClick={() => setCategoryFilter(categoryFilter === category ? null : category)}
                        >
                          {category}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>My Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {user ? (
                <>
                  <Link href="/marketplace/my-listings">
                    <Button variant="ghost" className="w-full justify-start">My Listings</Button>
                  </Link>
                  <Link href="/marketplace/favorites">
                    <Button variant="ghost" className="w-full justify-start">Saved Apps</Button>
                  </Link>
                  <Link href="/marketplace/bids">
                    <Button variant="ghost" className="w-full justify-start">My Bids</Button>
                  </Link>
                </>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground mb-2">Sign in to save and manage listings</p>
                  <Link href="/auth">
                    <Button size="sm">Sign In</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Listings */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center p-8 bg-muted rounded-lg">
              <p className="text-destructive">Error loading listings. Please try again.</p>
            </div>
          ) : listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing: any) => (
                <Card key={listing.id} className="overflow-hidden flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <Badge variant={
                        listing.monetization === "subscription" ? "default" : 
                        listing.monetization === "one-time" ? "secondary" :
                        "outline"
                      }>
                        {listing.monetization === "subscription" ? "Subscription" : 
                         listing.monetization === "one-time" ? "One-time" : 
                         listing.monetization || "Mixed"}
                      </Badge>
                      <Badge variant="outline">{listing.category}</Badge>
                    </div>
                    <CardTitle className="text-xl mt-2 truncate">{listing.name}</CardTitle>
                    <CardDescription className="line-clamp-2 h-10">
                      {listing.shortDescription}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2 flex-grow">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">${listing.price.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>${listing.monthlyRevenue?.toLocaleString() || "N/A"}/mo</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(listing.establishedDate).getFullYear() || "N/A"}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between">
                    <Button variant="outline" size="sm" className="flex-1 mr-2">
                      <Heart className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Link href={`/marketplace/listing/${listing.id}`}>
                      <Button size="sm" className="flex-1">View Details</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center p-8 bg-muted rounded-lg">
              <p className="text-muted-foreground">No listings found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}