import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Form schema
const listingSchema = z.object({
  name: z.string().min(3, { message: "App name must be at least 3 characters" }),
  shortDescription: z.string().max(120, { message: "Short description must be less than 120 characters" }),
  description: z.string().min(50, { message: "Description must be at least 50 characters" }),
  category: z.string().min(1, { message: "Please select a category" }),
  price: z.coerce.number().min(1, { message: "Price is required" }),
  monetization: z.string().min(1, { message: "Please select a monetization model" }),
  monthlyRevenue: z.coerce.number().optional(),
  monthlyExpenses: z.coerce.number().optional(),
  profitMargin: z.coerce.number().optional(),
  monthlyUsers: z.coerce.number().optional(),
  techStack: z.string().optional(),
  features: z.string().optional(),
  establishedDate: z.string().optional(),
  websiteUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal('')),
  repoUrl: z.string().url({ message: "Please enter a valid repository URL" }).optional().or(z.literal('')),
  status: z.enum(["draft", "published"]),
});

export default function MarketplaceSell() {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      name: "",
      shortDescription: "",
      description: "",
      category: "",
      price: undefined,
      monetization: "",
      monthlyRevenue: undefined,
      monthlyExpenses: undefined,
      profitMargin: undefined,
      monthlyUsers: undefined,
      techStack: "",
      features: "",
      establishedDate: "",
      websiteUrl: "",
      repoUrl: "",
      status: "draft",
    }
  });

  // Create mutation for submitting the listing
  const createListingMutation = useMutation({
    mutationFn: async (values: z.infer<typeof listingSchema>) => {
      // Process the tech stack and features to be arrays
      const techStackArray = values.techStack ? values.techStack.split(',').map(item => item.trim()) : [];
      const featuresArray = values.features ? values.features.split('\n').filter(item => item.trim().length > 0) : [];
      
      // Build the request payload
      const payload = {
        ...values,
        techStack: techStackArray,
        features: featuresArray,
        establishedDate: values.establishedDate ? new Date(values.establishedDate).toISOString() : null,
      };
      
      return apiRequest("POST", "/api/marketplace/listings", payload);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Listing created successfully",
        description: data.status === "published" 
          ? "Your app is now live on the marketplace." 
          : "Your app has been saved as a draft.",
      });
      
      // Invalidate the listings query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/listings"] });
      
      // Navigate to the listing page
      setLocation(`/marketplace/listing/${data.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create listing",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
      setIsSubmitting(false);
    }
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof listingSchema>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a listing",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    createListingMutation.mutate(values);
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>You must be signed in to create a listing</CardDescription>
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
      <div className="mb-6">
        <Link href="/marketplace">
          <Button variant="ghost" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">List Your App for Sale</CardTitle>
              <CardDescription>
                Provide accurate information to attract serious buyers. All fields marked with * are required.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">Basic Information</h2>
                    
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>App Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="My Amazing App" {...field} />
                          </FormControl>
                          <FormDescription>
                            The name of your application or website
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="shortDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Short Description *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="A brief summary of your app (max 120 characters)" 
                              maxLength={120}
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            A concise tagline that appears in search results
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="SaaS">SaaS</SelectItem>
                                <SelectItem value="E-commerce">E-commerce</SelectItem>
                                <SelectItem value="Content">Content/Media</SelectItem>
                                <SelectItem value="Mobile App">Mobile App</SelectItem>
                                <SelectItem value="Marketplace">Marketplace</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="monetization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monetization Model *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select monetization model" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="subscription">Subscription</SelectItem>
                                <SelectItem value="one-time">One-time Purchase</SelectItem>
                                <SelectItem value="ads">Advertising</SelectItem>
                                <SelectItem value="freemium">Freemium</SelectItem>
                                <SelectItem value="mixed">Mixed/Multiple</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide a detailed description of your app, its purpose, target audience, and unique value proposition..." 
                              className="min-h-[200px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Detailed information about your app. Minimum 50 characters.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="features"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Key Features</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="List key features of your app, one per line..." 
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            List one feature per line. These will be displayed as bullet points.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="techStack"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tech Stack</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="React, Node.js, PostgreSQL, etc."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Comma-separated list of technologies used
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="websiteUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://yourapp.com"
                              type="url"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Live URL where potential buyers can see your app (if available)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="repoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code Repository URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://github.com/username/repository"
                              type="url"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Link to GitHub, GitLab or other code repository for technical evaluation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator />
                    
                    <h2 className="text-xl font-semibold">Financial Details</h2>
                    
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Asking Price ($) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="5000"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The amount you're asking for your application
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="monthlyRevenue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Revenue ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="1000"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="monthlyExpenses"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Expenses ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="200"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="profitMargin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Profit Margin (%)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="80"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="monthlyUsers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Monthly Active Users</FormLabel>
                            <FormControl>
                              <Input 
                                type="number"
                                placeholder="1000"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="establishedDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Established Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            When the app was initially launched
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Separator />
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Listing Status *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Save as Draft</SelectItem>
                              <SelectItem value="published">Publish Now</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Draft listings are only visible to you until you publish them
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-4">
                    <Link href="/marketplace">
                      <Button variant="outline" type="button">Cancel</Button>
                    </Link>
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Listing
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Listing Tips</CardTitle>
              <CardDescription>Maximize your chances of a successful sale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm mb-1">Be Transparent</h3>
                <p className="text-sm text-muted-foreground">
                  Honest descriptions and accurate metrics build trust with potential buyers.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm mb-1">Highlight Growth Potential</h3>
                <p className="text-sm text-muted-foreground">
                  Explain opportunities for expansion that the new owner could capitalize on.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm mb-1">Include Detailed Metrics</h3>
                <p className="text-sm text-muted-foreground">
                  Provide specific data about revenue, traffic, and user engagement where possible.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm mb-1">Set a Realistic Price</h3>
                <p className="text-sm text-muted-foreground">
                  Apps typically sell for 2-4x annual profit. Price accordingly for faster sales.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-sm mb-1">Be Responsive</h3>
                <p className="text-sm text-muted-foreground">
                  Answer questions quickly and thoroughly to maintain buyer interest.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>What Happens Next?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <Badge className="mt-1">1</Badge>
                <p className="text-sm">
                  <span className="font-medium">Your listing goes live</span> and appears in the marketplace (if published)
                </p>
              </div>
              
              <div className="flex items-start gap-2">
                <Badge className="mt-1">2</Badge>
                <p className="text-sm">
                  <span className="font-medium">Interested buyers</span> can make offers or ask questions about your app
                </p>
              </div>
              
              <div className="flex items-start gap-2">
                <Badge className="mt-1">3</Badge>
                <p className="text-sm">
                  <span className="font-medium">You'll be notified</span> when you receive offers or questions
                </p>
              </div>
              
              <div className="flex items-start gap-2">
                <Badge className="mt-1">4</Badge>
                <p className="text-sm">
                  <span className="font-medium">When you accept an offer</span>, we'll help facilitate the transaction securely
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}