import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Search, PlusCircle, DollarSign, Building, Calendar, Heart, Star, Users,
  Briefcase, BarChart, Code, Grid, Filter, Tags, Sliders, ChevronDown, ChevronRight, Check
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Marketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [priceFilter, setPriceFilter] = useState<{ min?: number; max?: number }>({});
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [monetizationFilter, setMonetizationFilter] = useState<string | null>(null);
  const [revenueFilter, setRevenueFilter] = useState<{ min?: number; max?: number }>({});

  // Fetch marketplace listings
  const { data: listings, isLoading, error } = useQuery({
    queryKey: ["/api/marketplace/listings", searchTerm, priceFilter, categoryFilter, sortBy, monetizationFilter, revenueFilter],
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
      
      if (sortBy) {
        params.append("sort", sortBy);
      }
      
      if (monetizationFilter) {
        params.append("monetization", monetizationFilter);
      }
      
      if (revenueFilter.min !== undefined) {
        params.append("revenue_min", revenueFilter.min.toString());
      }
      
      if (revenueFilter.max !== undefined) {
        params.append("revenue_max", revenueFilter.max.toString());
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

  const handleClearFilters = () => {
    setSearchTerm("");
    setPriceFilter({});
    setCategoryFilter(null);
    setMonetizationFilter(null);
    setRevenueFilter({});
    setSortBy("newest");
  };

  // Extract statistics if we have listings
  const stats = listings && listings.length > 0 
    ? {
        count: listings.length,
        avgPrice: listings.reduce((acc: number, curr: any) => acc + parseFloat(curr.price), 0) / listings.length,
        avgRevenue: listings
          .filter((l: any) => l.monthlyRevenue)
          .reduce((acc: number, curr: any) => acc + parseFloat(curr.monthlyRevenue), 0) / 
          listings.filter((l: any) => l.monthlyRevenue).length || 0
      }
    : null;

  // Categories with count
  const categories = listings && listings.length > 0
    ? listings.reduce((acc: Record<string, number>, curr: any) => {
        const category = curr.category || "Other";
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {})
    : {};

  return (
    <div className="container mx-auto py-8">
      {/* Header with statistics */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">App Marketplace</h1>
            <p className="text-muted-foreground mt-1">Buy and sell established online businesses</p>
          </div>
          
          {user && (
            <Link href="/marketplace/sell">
              <Button className="flex items-center gap-2 mt-4 md:mt-0">
                <PlusCircle className="h-4 w-4" />
                <span>List Your App</span>
              </Button>
            </Link>
          )}
        </div>
        
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-background/60 backdrop-blur-sm border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Grid className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Total Listings</p>
                    <p className="text-xl font-bold">{stats.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-background/60 backdrop-blur-sm border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Average Price</p>
                    <p className="text-xl font-bold">${Math.round(stats.avgPrice).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-background/60 backdrop-blur-sm border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Avg. Monthly Revenue</p>
                    <p className="text-xl font-bold">${Math.round(stats.avgRevenue).toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-background/60 backdrop-blur-sm border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Top Category</p>
                    <p className="text-xl font-bold">
                      {Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Search bar */}
      <div className="bg-card rounded-lg shadow-sm mb-8">
        <div className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow">
              <label htmlFor="search" className="text-sm font-medium block mb-2">Search Listings</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Search by name, description or technology..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full md:w-1/4">
              <label htmlFor="sort" className="text-sm font-medium block mb-2">Sort By</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="revenue_desc">Highest Revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" type="button" className="flex gap-2 items-center">
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                    <Badge className="ml-1 bg-primary/20 text-primary hover:bg-primary/30">
                      {[
                        categoryFilter, 
                        monetizationFilter, 
                        priceFilter.min || priceFilter.max,
                        revenueFilter.min || revenueFilter.max
                      ].filter(Boolean).length}
                    </Badge>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filters</h4>
                      <Button 
                        onClick={handleClearFilters} 
                        variant="ghost" 
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear all
                      </Button>
                    </div>
                  </div>
                  
                  <Accordion type="multiple" defaultValue={["category", "price"]}>
                    <AccordionItem value="category" className="border-b">
                      <AccordionTrigger className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span>Category</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3 pt-1">
                        <div className="space-y-1">
                          {["SaaS", "Content", "E-commerce", "Mobile App", "Marketplace", "Other"].map(category => (
                            <div key={category} className="flex items-center">
                              <Button 
                                type="button"
                                variant={categoryFilter === category ? "secondary" : "ghost"} 
                                size="sm"
                                className="justify-start w-full h-8 px-2"
                                onClick={() => setCategoryFilter(categoryFilter === category ? null : category)}
                              >
                                {categoryFilter === category && <Check className="mr-2 h-3 w-3" />}
                                {category}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="monetization" className="border-b">
                      <AccordionTrigger className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tags className="h-4 w-4" />
                          <span>Monetization Model</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3 pt-1">
                        <div className="space-y-1">
                          {["subscription", "one-time", "ads", "freemium", "mixed"].map(model => (
                            <div key={model} className="flex items-center">
                              <Button 
                                type="button"
                                variant={monetizationFilter === model ? "secondary" : "ghost"} 
                                size="sm"
                                className="justify-start w-full h-8 px-2 capitalize"
                                onClick={() => setMonetizationFilter(monetizationFilter === model ? null : model)}
                              >
                                {monetizationFilter === model && <Check className="mr-2 h-3 w-3" />}
                                {model}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="price" className="border-b">
                      <AccordionTrigger className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Price Range</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Min Price</label>
                            <Input
                              type="number"
                              placeholder="Min"
                              value={priceFilter.min || ""}
                              onChange={(e) => setPriceFilter(prev => ({ 
                                ...prev, 
                                min: e.target.value ? Number(e.target.value) : undefined 
                              }))}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Max Price</label>
                            <Input
                              type="number"
                              placeholder="Max"
                              value={priceFilter.max || ""}
                              onChange={(e) => setPriceFilter(prev => ({ 
                                ...prev, 
                                max: e.target.value ? Number(e.target.value) : undefined 
                              }))}
                              className="h-8"
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="revenue" className="border-b">
                      <AccordionTrigger className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <BarChart className="h-4 w-4" />
                          <span>Monthly Revenue</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Min Revenue</label>
                            <Input
                              type="number"
                              placeholder="Min"
                              value={revenueFilter.min || ""}
                              onChange={(e) => setRevenueFilter(prev => ({ 
                                ...prev, 
                                min: e.target.value ? Number(e.target.value) : undefined 
                              }))}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Max Revenue</label>
                            <Input
                              type="number"
                              placeholder="Max"
                              value={revenueFilter.max || ""}
                              onChange={(e) => setRevenueFilter(prev => ({ 
                                ...prev, 
                                max: e.target.value ? Number(e.target.value) : undefined 
                              }))}
                              className="h-8"
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  
                  <div className="p-4 flex justify-end">
                    <Button type="button" onClick={() => document.body.click()}>Apply Filters</Button>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button type="submit">
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
        {/* Left sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg flex items-center">
                <Sliders className="h-4 w-4 mr-2" />
                Quick Filters
              </CardTitle>
            </CardHeader>
            
            <CardContent className="px-3 pb-3">
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={categoryFilter === "SaaS" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setCategoryFilter(categoryFilter === "SaaS" ? null : "SaaS")}
                  className="rounded-full"
                >
                  SaaS
                </Button>
                <Button 
                  variant={categoryFilter === "E-commerce" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setCategoryFilter(categoryFilter === "E-commerce" ? null : "E-commerce")}
                  className="rounded-full"
                >
                  E-commerce
                </Button>
                <Button 
                  variant={categoryFilter === "Mobile App" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setCategoryFilter(categoryFilter === "Mobile App" ? null : "Mobile App")}
                  className="rounded-full"
                >
                  Mobile
                </Button>
                <Button 
                  variant={priceFilter.max === 5000 ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setPriceFilter(prev => prev.max === 5000 ? {} : { max: 5000 })}
                  className="rounded-full"
                >
                  Under $5K
                </Button>
                <Button 
                  variant={revenueFilter.min === 1000 ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setRevenueFilter(prev => prev.min === 1000 ? {} : { min: 1000 })}
                  className="rounded-full"
                >
                  $1K+/mo
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">My Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-1">
              {user ? (
                <>
                  <Link href="/marketplace/my-listings">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Briefcase className="h-4 w-4 mr-2" />
                      My Listings
                    </Button>
                  </Link>
                  <Link href="/marketplace/favorites">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Heart className="h-4 w-4 mr-2" />
                      Saved Apps
                    </Button>
                  </Link>
                  <Link href="/marketplace/bids">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <DollarSign className="h-4 w-4 mr-2" />
                      My Bids
                    </Button>
                  </Link>
                </>
              ) : (
                <div className="rounded-lg border border-dashed p-4 text-center">
                  <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">Sign in to save and manage listings</p>
                  <Link href="/auth">
                    <Button size="sm" className="w-full">Sign In</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Featured seller */}
          <Card className="bg-gradient-to-b from-primary/5 to-background">
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Featured Seller</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="font-bold text-primary">DU</span>
                </div>
                <div>
                  <p className="font-medium">Demo User</p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    <span>5.0</span>
                    <span className="text-xs">(12 reviews)</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Successful tech entrepreneur with 3+ established businesses sold.
              </p>
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>Apps Sold:</span>
                <span className="font-medium">6</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Avg Sale Price:</span>
                <span className="font-medium">$8,500</span>
              </div>
              <Separator className="my-3" />
              <Button variant="secondary" size="sm" className="w-full">
                View Profile
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Listings */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-60 bg-muted/30 rounded-lg">
              <Loader2 className="h-10 w-10 animate-spin text-primary/60 mb-4" />
              <p className="text-muted-foreground">Loading marketplace listings...</p>
            </div>
          ) : error ? (
            <div className="text-center p-8 bg-destructive/5 border border-destructive/20 rounded-lg">
              <p className="text-destructive mb-2">Error loading listings</p>
              <p className="text-sm text-muted-foreground mb-4">There was a problem fetching the app marketplace listings.</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          ) : listings && listings.length > 0 ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{listings.length}</span> results
                  {categoryFilter && (
                    <> in <span className="font-medium text-foreground">{categoryFilter}</span></>
                  )}
                </p>
                
                {(
                  categoryFilter || 
                  monetizationFilter || 
                  priceFilter.min || 
                  priceFilter.max || 
                  revenueFilter.min || 
                  revenueFilter.max
                ) && (
                  <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-8 text-xs">
                    Clear all filters
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {listings.map((listing: any) => (
                  <Card key={listing.id} className="overflow-hidden flex flex-col transition-all duration-200 hover:shadow-md hover:border-primary/30 group">
                    {listing.featuredImage && (
                      <div className="relative h-40 overflow-hidden">
                        <img 
                          src={listing.featuredImage} 
                          alt={listing.title} 
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        {listing.category && (
                          <Badge className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm">
                            {listing.category}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    <CardHeader className={`pb-2 ${!listing.featuredImage ? 'pt-4' : 'pt-3'}`}>
                      <div className="flex justify-between items-start">
                        <Badge variant={
                          listing.monetization === "subscription" ? "default" : 
                          listing.monetization === "one-time" ? "secondary" :
                          "outline"
                        } className="capitalize">
                          {listing.monetization || "Mixed"}
                        </Badge>
                        
                        {listing.status === "published" && (
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                            Active
                          </Badge>
                        )}
                      </div>
                      
                      <Link href={`/marketplace/listing/${listing.id}`}>
                        <CardTitle className="text-xl mt-2 hover:text-primary cursor-pointer truncate">
                          {listing.title}
                        </CardTitle>
                      </Link>
                      
                      <CardDescription className="line-clamp-2 h-10 mt-1">
                        {listing.shortDescription || listing.description.substring(0, 120)}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="pb-2 flex-grow">
                      <div className="grid grid-cols-2 gap-y-2 text-sm mb-3">
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">${parseFloat(listing.price).toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>${listing.monthlyRevenue ? parseFloat(listing.monthlyRevenue).toLocaleString() : "0"}/mo</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{listing.establishedDate ? new Date(listing.establishedDate).getFullYear() : "New"}</span>
                        </div>
                        
                        {listing.technologies && listing.technologies.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Code className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate" title={listing.technologies.join(', ')}>
                              {listing.technologies[0]}
                              {listing.technologies.length > 1 ? ` +${listing.technologies.length - 1}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {listing.seller && (
                        <div className="flex items-center gap-2 border-t pt-2 mt-1">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {listing.seller.displayName?.[0] || listing.seller.username?.[0] || 'U'}
                          </div>
                          <span className="text-xs truncate">
                            {listing.seller.displayName || listing.seller.username}
                          </span>
                          
                          {listing.averageRating && (
                            <div className="flex items-center ml-auto">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              <span className="text-xs ml-1">{listing.averageRating.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                    
                    <CardFooter className="pt-2 flex justify-between">
                      <Button variant="outline" size="sm" className="flex-1 mr-2">
                        <Heart className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      
                      <Link href={`/marketplace/listing/${listing.id}`}>
                        <Button size="sm" className="flex-1">
                          View Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-60 bg-muted/30 border border-dashed rounded-lg p-8">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground/60" />
              </div>
              <h3 className="text-lg font-medium mb-1">No listings found</h3>
              <p className="text-muted-foreground text-center mb-4">
                We couldn't find any apps matching your search criteria.
              </p>
              <Button variant="outline" onClick={handleClearFilters}>Clear Filters</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}