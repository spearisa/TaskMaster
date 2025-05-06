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
import { 
  Loader2, ArrowLeft, Calendar, DollarSign, Clock, Percent,
  Users, Code, Server, FileCode, Image, Link as LinkIcon, 
  Info, Upload, LucideIcon, BadgeCheck, ShieldCheck, 
  HelpCircle, Tags, Building, Check, Star, 
  MessageSquare, Flag, Shield, Zap, 
  Bookmark, ChevronRight, Laptop, Store
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

// Form schema
const listingSchema = z.object({
  name: z.string().min(3, { message: "App name must be at least 3 characters" }),
  shortDescription: z.string().max(120, { message: "Short description must be less than 120 characters" }),
  description: z.string().min(50, { message: "Description must be at least 50 characters" }),
  category: z.string().min(1, { message: "Please select a category" }),
  subcategory: z.string().optional(),
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
  documentationUrl: z.string().url({ message: "Please enter a valid documentation URL" }).optional().or(z.literal('')),
  supportPeriod: z.coerce.number().optional(),
  supportDetails: z.string().optional(),
  featuredImage: z.string().optional(),
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
      subcategory: "",
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
      documentationUrl: "",
      supportPeriod: undefined,
      supportDetails: "",
      featuredImage: "",
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
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/3">
          <Card className="bg-card shadow-sm mb-8">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <div className="flex items-center gap-3">
                <div className="bg-primary/15 p-2 rounded-full">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">List Your App for Sale</CardTitle>
                  <CardDescription>
                    Provide accurate information to attract serious buyers
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
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
                  
                  <div className="mt-8 bg-muted/40 border border-muted p-6 rounded-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div>
                        <h3 className="font-medium text-base">Ready to list your app?</h3>
                        <p className="text-muted-foreground text-sm">You can save as a draft or publish immediately</p>
                      </div>
                      
                      <div className="flex gap-3 flex-wrap justify-center">
                        <Link href="/marketplace">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isSubmitting}
                            className="px-5"
                          >
                            Cancel
                          </Button>
                        </Link>
                        
                        <Button
                          type="submit"
                          variant="secondary"
                          onClick={() => form.setValue("status", "draft")}
                          disabled={isSubmitting}
                          className="px-5"
                        >
                          <Code className="mr-2 h-4 w-4" />
                          Save as Draft
                        </Button>
                        
                        <Button
                          type="submit"
                          onClick={() => form.setValue("status", "published")}
                          disabled={isSubmitting}
                          className="px-5"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Publish Listing
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-1/3">
          <div className="space-y-6 sticky top-6">
            <Card className="bg-card shadow-sm">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  Tips for Sellers
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-5 text-sm">
                <div>
                  <h3 className="font-semibold flex items-center mb-2">
                    <DollarSign className="h-4 w-4 text-green-600 mr-2" />
                    Maximize Your Value
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Buyers pay more for apps with verified revenue, clean code, and comprehensive documentation.
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold flex items-center mb-2">
                    <Image className="h-4 w-4 text-blue-600 mr-2" />
                    Add Visual Content
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Screenshots and demo videos can increase your listing visibility by 70% and attract more serious buyers.
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold flex items-center mb-2">
                    <ShieldCheck className="h-4 w-4 text-amber-600 mr-2" />
                    Build Trust
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Provide code access, documentation links, and support details to establish credibility with potential buyers.
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold flex items-center mb-2">
                    <Clock className="h-4 w-4 text-purple-600 mr-2" />
                    Response Time Matters
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Sellers who respond to inquiries within 24 hours are 3x more likely to close a sale.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-card shadow-sm">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ChevronRight className="h-5 w-5 text-primary" />
                  What Happens Next
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="bg-primary/10 flex items-center justify-center rounded-full w-7 h-7 flex-shrink-0 mt-0.5">
                      <span className="text-sm font-medium text-primary">1</span>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Your listing goes live</h3>
                      <p className="text-sm text-muted-foreground">
                        Your app will be visible to all potential buyers on the marketplace
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="bg-primary/10 flex items-center justify-center rounded-full w-7 h-7 flex-shrink-0 mt-0.5">
                      <span className="text-sm font-medium text-primary">2</span>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Buyers show interest</h3>
                      <p className="text-sm text-muted-foreground">
                        Interested buyers will contact you with questions and offers
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="bg-primary/10 flex items-center justify-center rounded-full w-7 h-7 flex-shrink-0 mt-0.5">
                      <span className="text-sm font-medium text-primary">3</span>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Negotiate and accept</h3>
                      <p className="text-sm text-muted-foreground">
                        When you find the right offer, you can accept and move to closing
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="bg-primary/10 flex items-center justify-center rounded-full w-7 h-7 flex-shrink-0 mt-0.5">
                      <span className="text-sm font-medium text-primary">4</span>
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Secure transaction</h3>
                      <p className="text-sm text-muted-foreground">
                        We'll help facilitate a safe transfer of ownership and payment
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-background shadow-sm">
              <CardContent className="pt-5">
                <div className="text-center mb-2">
                  <BadgeCheck className="h-10 w-10 text-primary mx-auto mb-2" />
                  <h3 className="font-medium text-lg mb-1">Seller Verification</h3>
                  <p className="text-sm text-muted-foreground mb-5">
                    Verified sellers receive 2x more inquiries
                  </p>
                </div>
                
                <div className="bg-card rounded-lg border p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Complete Profile</span>
                    </div>
                    <Check className="h-4 w-4 bg-primary text-primary-foreground rounded-full p-0.5" />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Verified Email</span>
                    </div>
                    <Check className="h-4 w-4 bg-primary text-primary-foreground rounded-full p-0.5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">ID Verification</span>
                    </div>
                    <div className="h-4 w-4 border rounded-full" />
                  </div>
                </div>
                
                <Button variant="outline" className="w-full">
                  Upgrade to Verified Seller
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}