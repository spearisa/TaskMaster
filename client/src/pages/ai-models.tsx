import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Search, Star, Download, Clock, Heart, ExternalLink, MessageSquare } from "lucide-react";
import ModelCard from "@/components/huggingface/model-card";
import ModelTabs from "@/components/huggingface/model-tabs";

interface HuggingFaceModel {
  id: string;
  modelId: string;
  author: string; 
  name: string;
  private: boolean;
  likes: number;
  downloads: number;
  tags: string[];
  pipeline_tag: string;
  lastModified: string;
  library_name?: string;
  mask_token?: string;
  widgetData?: object;
  _id: string;
  createdAt: string;
  downloads_last_month?: number;
  siblings?: {
    rfilename: string;
  }[];
}

export default function AIModelsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'trending' | 'downloads' | 'modified'>('trending');
  const [isSearching, setIsSearching] = useState(false);
  
  const MODEL_TYPES = [
    'text-generation',
    'text-classification',
    'token-classification',
    'question-answering',
    'summarization',
    'translation', 
    'image-classification',
    'image-segmentation',
    'object-detection',
    'image-to-text',
    'text-to-image',
    'speech-recognition',
    'text-to-speech',
    'tabular-classification',
    'tabular-regression',
    'zero-shot-classification',
    'feature-extraction'
  ];

  // Query for trending models
  const { 
    data: trendingData,
    isLoading: isTrendingLoading, 
    error: trendingError
  } = useQuery({
    queryKey: ['/api/huggingface/trending', category, sortBy],
    queryFn: () => {
      let url = `/api/huggingface/trending?limit=12&sort=${sortBy}`;
      if (category) {
        url += `&category=${category}`;
      }
      return fetch(url).then(res => res.json());
    },
    enabled: !isSearching
  });

  // Query for searched models
  const { 
    data: searchData,
    isLoading: isSearchLoading, 
    error: searchError,
    refetch: refetchSearch
  } = useQuery({
    queryKey: ['/api/huggingface/search', searchQuery, category],
    queryFn: () => {
      let url = `/api/huggingface/search?query=${encodeURIComponent(searchQuery)}&limit=12`;
      if (category) {
        url += `&category=${category}`;
      }
      return fetch(url).then(res => res.json());
    },
    enabled: isSearching && searchQuery.length > 2
  });

  // Query for categorized models
  const { 
    data: categoriesData,
    isLoading: isCategoriesLoading, 
    error: categoriesError
  } = useQuery({
    queryKey: ['/api/huggingface/trending-by-category'],
    queryFn: () => fetch('/api/huggingface/trending-by-category').then(res => res.json())
  });

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.length > 2) {
      setIsSearching(true);
      refetchSearch();
    }
  };

  // Clear search and go back to trending
  const handleClearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
  };

  const isLoading = isSearching ? isSearchLoading : isTrendingLoading;
  const error = isSearching ? searchError : trendingError;
  const models = isSearching ? searchData?.models : trendingData?.models;
  
  return (
    <div className="container max-w-7xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">AI Models Hub</h1>
        <p className="text-muted-foreground">
          Discover, explore and use the latest AI models for your projects
        </p>
      </div>
      
      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search models..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={searchQuery.length < 3}>Search</Button>
          {isSearching && (
            <Button variant="ghost" onClick={handleClearSearch}>Clear</Button>
          )}
        </form>
        
        <div className="flex gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={undefined}>All categories</SelectItem>
              {MODEL_TYPES.map(type => (
                <SelectItem key={type} value={type}>{type.replace(/-/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(val: 'trending' | 'downloads' | 'modified') => setSortBy(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by trending" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="downloads">Most downloads</SelectItem>
              <SelectItem value="modified">Recently updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Main content */}
      <Tabs defaultValue="trending" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="trending">Trending Models</TabsTrigger>
          <TabsTrigger value="categories">Browse by Category</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trending">
          {/* Status messages */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full mb-4" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {error && (
            <div className="rounded-lg border p-8 text-center">
              <p className="text-red-500 font-medium">Failed to load models. Please try again later.</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          )}
          
          {!isLoading && !error && models && models.length === 0 && (
            <div className="rounded-lg border p-8 text-center">
              <p className="font-medium">No models found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search criteria
              </p>
            </div>
          )}
          
          {/* Models grid */}
          {!isLoading && !error && models && models.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {models.map((model: HuggingFaceModel) => (
                <ModelCard key={model.id} model={model} />
              ))}
            </div>
          )}
          
          {isSearching && !isLoading && !error && searchData?.models?.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Showing {searchData.models.length} results for "{searchQuery}"
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="categories">
          {isCategoriesLoading ? (
            <div className="space-y-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-7 w-64" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array(4).fill(0).map((_, j) => (
                      <Skeleton key={j} className="h-40 w-full" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : categoriesError ? (
            <div className="rounded-lg border p-8 text-center">
              <p className="text-red-500 font-medium">Failed to load categories. Please try again later.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {categoriesData && Object.entries(categoriesData.categories).map(([category, models]: [string, any]) => (
                <div key={category} className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold capitalize">{category.replace(/-/g, ' ')}</h3>
                    <Link href={`/ai-models?category=${category}`}>
                      <Button variant="ghost" size="sm">View all</Button>
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {models.slice(0, 4).map((model: HuggingFaceModel) => (
                      <ModelCard key={model.id} model={model} compact />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}