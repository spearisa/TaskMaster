import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import ModelCard from "@/components/huggingface/model-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Filter, Code, ArrowDownAZ, BrainCircuit, Image, MessageSquare } from "lucide-react";

// Define the model interface
interface HuggingFaceModel {
  id: string;
  modelId: string;
  author: string;
  name: string;
  likes: number;
  downloads: number;
  downloads_last_month?: number;
  tags: string[];
  pipeline_tag: string;
  lastModified: string;
}

// Define the category interface
interface Category {
  id: string;
  name: string;
  icon: React.ReactNode;
  count?: number;
}

export default function AIModelsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("downloads");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Handle search input changes with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Define categories
  const categories: Category[] = [
    { id: "all", name: "All Models", icon: <BrainCircuit size={16} /> },
    { id: "text-generation", name: "Text Generation", icon: <MessageSquare size={16} /> },
    { id: "text-to-image", name: "Text to Image", icon: <Image size={16} /> },
    { id: "image-to-text", name: "Image to Text", icon: <Code size={16} /> },
    // Add more categories as needed
  ];
  
  // Fetch trending models query
  const trendingQuery = useQuery({
    queryKey: ['/api/huggingface/trending', activeTab, sortOption],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.append('pipeline', activeTab);
      }
      params.append('sort', sortOption);
      
      const response = await fetch(`/api/huggingface/trending?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trending models');
      }
      return response.json();
    },
    enabled: debouncedQuery === '', // Only fetch trending when not searching
  });
  
  // Fetch search results query
  const searchResultsQuery = useQuery({
    queryKey: ['/api/huggingface/search', debouncedQuery, activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('query', debouncedQuery);
      if (activeTab !== 'all') {
        params.append('pipeline', activeTab);
      }
      
      const response = await fetch(`/api/huggingface/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }
      return response.json();
    },
    enabled: debouncedQuery !== '', // Only fetch search when query is not empty
  });
  
  // Determine which query to use based on search state
  const { data, isLoading, error } = debouncedQuery !== '' ? searchResultsQuery : trendingQuery;
  
  // Extract models from data
  const models: HuggingFaceModel[] = data?.models || [];
  
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">AI Models</h1>
        <p className="text-muted-foreground">
          Discover and explore state-of-the-art AI models for your projects
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search models..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Select value={sortOption} onValueChange={setSortOption}>
          <SelectTrigger className="w-[180px]">
            <ArrowDownAZ className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="downloads">Most Downloaded</SelectItem>
              <SelectItem value="trending">Trending</SelectItem>
              <SelectItem value="likes">Most Liked</SelectItem>
              <SelectItem value="modified">Recently Updated</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((category) => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="flex items-center gap-2"
            >
              {category.icon}
              <span>{category.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {categories.map((category) => (
          <TabsContent 
            key={category.id} 
            value={category.id}
            className="space-y-4"
          >
            {isLoading ? (
              <div className="flex justify-center items-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-lg">Loading models...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-100">
                <p className="text-red-800 mb-4">Failed to load models. Please try again later.</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (debouncedQuery !== '') {
                      queryClient.invalidateQueries({ queryKey: ['/api/huggingface/search'] });
                    } else {
                      queryClient.invalidateQueries({ queryKey: ['/api/huggingface/trending'] });
                    }
                  }}
                >
                  Retry
                </Button>
              </div>
            ) : models.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BrainCircuit className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No models found</h3>
                <p className="text-muted-foreground max-w-md mb-4">
                  {debouncedQuery 
                    ? `No models matching "${debouncedQuery}" were found. Try a different search term.` 
                    : 'No models available in this category at the moment.'}
                </p>
                {debouncedQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {models.map((model) => (
                    <ModelCard
                      key={model.modelId}
                      model={model}
                      variant="default"
                    />
                  ))}
                </div>
                {models.length > 0 && (
                  <div className="flex justify-center mt-6">
                    <Button variant="outline">
                      Load More
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}