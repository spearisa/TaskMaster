import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Calendar, 
  DollarSign, 
  Users, 
  BarChart, 
  Heart, 
  MessageSquare, 
  Globe, 
  ShoppingCart, 
  Clock, 
  Building,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Form schemas
const bidSchema = z.object({
  amount: z.coerce.number().min(1, { message: "Bid amount is required" }),
  proposal: z.string().min(10, { message: "Please provide details about your bid" }),
});

const questionSchema = z.object({
  question: z.string().min(5, { message: "Question is required" })
});

export default function MarketplaceListing() {
  const [_, params] = useRoute("/marketplace/listing/:id");
  const listingId = params?.id;
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);

  // Fetch listing details
  const { data: listing, isLoading, error } = useQuery({
    queryKey: [`/api/marketplace/listings/${listingId}`],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/listings/${listingId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch listing details");
      }
      return response.json();
    },
    enabled: !!listingId
  });

  // Fetch bids for this listing (if user is authenticated)
  const { data: bids } = useQuery({
    queryKey: [`/api/marketplace/listings/${listingId}/bids`],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/listings/${listingId}/bids`);
      if (!response.ok) {
        throw new Error("Failed to fetch bids");
      }
      return response.json();
    },
    enabled: !!listingId && !!user
  });

  // Fetch questions for this listing
  const { data: questions } = useQuery({
    queryKey: [`/api/marketplace/listings/${listingId}/questions`],
    queryFn: async () => {
      const response = await fetch(`/api/marketplace/listings/${listingId}/questions`);
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      return response.json();
    },
    enabled: !!listingId
  });

  // Bid form
  const bidForm = useForm<z.infer<typeof bidSchema>>({
    resolver: zodResolver(bidSchema),
    defaultValues: {
      amount: undefined,
      proposal: ""
    }
  });

  // Question form
  const questionForm = useForm<z.infer<typeof questionSchema>>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question: ""
    }
  });

  // Submit bid mutation
  const submitBidMutation = useMutation({
    mutationFn: async (values: z.infer<typeof bidSchema>) => {
      return apiRequest("POST", `/api/marketplace/listings/${listingId}/bids`, values);
    },
    onSuccess: () => {
      toast({
        title: "Bid submitted successfully",
        description: "The seller will be notified of your offer.",
      });
      setBidDialogOpen(false);
      bidForm.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/listings/${listingId}/bids`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit bid",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });

  // Submit question mutation
  const submitQuestionMutation = useMutation({
    mutationFn: async (values: z.infer<typeof questionSchema>) => {
      return apiRequest("POST", `/api/marketplace/listings/${listingId}/questions`, {
        question: values.question,
        isPublic: true
      });
    },
    onSuccess: () => {
      toast({
        title: "Question submitted",
        description: "Your question has been sent to the seller.",
      });
      setQuestionDialogOpen(false);
      questionForm.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/marketplace/listings/${listingId}/questions`] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit question",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });

  // Add to favorites mutation
  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/marketplace/listings/${listingId}/favorite`);
    },
    onSuccess: () => {
      toast({
        title: "Added to favorites",
        description: "This listing has been added to your saved apps.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add to favorites",
        description: error.message || "Please try again later",
        variant: "destructive"
      });
    }
  });

  // Handle bid submission
  const onBidSubmit = (values: z.infer<typeof bidSchema>) => {
    submitBidMutation.mutate(values);
  };

  // Handle question submission
  const onQuestionSubmit = (values: z.infer<typeof questionSchema>) => {
    submitQuestionMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-muted rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Listing Not Found</h2>
          <p className="text-muted-foreground mb-4">The app listing you're looking for doesn't exist or has been removed.</p>
          <Link href="/marketplace">
            <Button>Back to Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <Link href="/marketplace">
          <Button variant="ghost" size="sm">← Back to Marketplace</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <Card className="mb-8">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex gap-2 mb-2">
                    <Badge>{listing.category}</Badge>
                    <Badge variant="outline">{listing.monetization || "Mixed"}</Badge>
                  </div>
                  <CardTitle className="text-2xl">{listing.name}</CardTitle>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Asking Price</div>
                  <div className="text-2xl font-bold">${listing.price?.toLocaleString()}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                  <DollarSign className="h-5 w-5 text-muted-foreground mb-1" />
                  <div className="text-sm font-semibold">${listing.monthlyRevenue?.toLocaleString() || "N/A"}</div>
                  <div className="text-xs text-muted-foreground">Monthly Revenue</div>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground mb-1" />
                  <div className="text-sm font-semibold">
                    {listing.establishedDate 
                      ? new Date(listing.establishedDate).getFullYear() 
                      : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">Established</div>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                  <Users className="h-5 w-5 text-muted-foreground mb-1" />
                  <div className="text-sm font-semibold">{listing.monthlyUsers?.toLocaleString() || "N/A"}</div>
                  <div className="text-xs text-muted-foreground">Monthly Users</div>
                </div>
                <div className="flex flex-col items-center p-2 bg-muted rounded-lg">
                  <BarChart className="h-5 w-5 text-muted-foreground mb-1" />
                  <div className="text-sm font-semibold">
                    {listing.profitMargin 
                      ? `${listing.profitMargin}%` 
                      : "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">Profit Margin</div>
                </div>
              </div>

              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="financials">Financials</TabsTrigger>
                  <TabsTrigger value="questions">Q&A ({questions?.length || 0})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <div className="whitespace-pre-line">{listing.description}</div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Key Features</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      {(listing.features || []).map((feature: string, index: number) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Tech Stack</h3>
                    <div className="flex flex-wrap gap-2">
                      {(listing.techStack || []).map((tech: string, index: number) => (
                        <Badge key={index} variant="secondary">{tech}</Badge>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="financials" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Revenue Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="font-medium">Monthly Revenue</dt>
                            <dd>${listing.monthlyRevenue?.toLocaleString() || "N/A"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium">Annual Revenue</dt>
                            <dd>
                              ${listing.monthlyRevenue
                                ? (listing.monthlyRevenue * 12).toLocaleString()
                                : "N/A"}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium">Revenue Growth</dt>
                            <dd>
                              {listing.revenueGrowth
                                ? `${listing.revenueGrowth}%`
                                : "N/A"}
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Expense Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-2">
                          <div className="flex justify-between">
                            <dt className="font-medium">Monthly Expenses</dt>
                            <dd>${listing.monthlyExpenses?.toLocaleString() || "N/A"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium">Monthly Profit</dt>
                            <dd>
                              ${listing.monthlyRevenue && listing.monthlyExpenses
                                ? (listing.monthlyRevenue - listing.monthlyExpenses).toLocaleString()
                                : "N/A"}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="font-medium">Profit Margin</dt>
                            <dd>
                              {listing.profitMargin
                                ? `${listing.profitMargin}%`
                                : "N/A"}
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Valuation Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="font-medium">Asking Price</dt>
                          <dd>${listing.price?.toLocaleString() || "N/A"}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium">Multiple</dt>
                          <dd>
                            {listing.price && listing.monthlyRevenue
                              ? `${(listing.price / (listing.monthlyRevenue * 12)).toFixed(1)}x annual revenue`
                              : "N/A"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="font-medium">ROI</dt>
                          <dd>
                            {listing.price && listing.monthlyRevenue && listing.monthlyExpenses
                              ? `${(((listing.monthlyRevenue - listing.monthlyExpenses) * 12 / listing.price) * 100).toFixed(1)}%`
                              : "N/A"}
                          </dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="questions" className="space-y-4">
                  {questions && questions.length > 0 ? (
                    <div className="space-y-4">
                      {questions.map((q: any) => (
                        <Card key={q.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">Q: {q.question}</CardTitle>
                                <CardDescription className="text-xs">
                                  {new Date(q.createdAt).toLocaleDateString()}
                                </CardDescription>
                              </div>
                              {q.answeredAt && (
                                <Badge variant="outline" className="mt-1">Answered</Badge>
                              )}
                            </div>
                          </CardHeader>
                          {q.answer && (
                            <CardContent>
                              <div className="pl-4 border-l-2 border-primary">
                                <p className="text-sm font-medium mb-1">A: {q.answer}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(q.answeredAt).toLocaleDateString()}
                                </p>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-muted rounded-lg">
                      <p className="text-muted-foreground mb-4">No questions have been asked yet.</p>
                      {user && (
                        <Button onClick={() => setQuestionDialogOpen(true)}>Ask a Question</Button>
                      )}
                    </div>
                  )}
                  
                  {user && questions && questions.length > 0 && (
                    <div className="text-center mt-4">
                      <Button onClick={() => setQuestionDialogOpen(true)}>Ask Another Question</Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Take Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user ? (
                <>
                  {user.id !== listing.sellerId ? (
                    <>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => setBidDialogOpen(true)}
                      >
                        Make an Offer
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => addToFavoritesMutation.mutate()}
                          disabled={addToFavoritesMutation.isPending}
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setQuestionDialogOpen(true)}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Ask
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <p className="text-muted-foreground">This is your listing</p>
                      <Link href={`/marketplace/edit/${listing.id}`}>
                        <Button className="mt-2 w-full">Edit Listing</Button>
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground mb-3">Sign in to make offers or save this listing</p>
                  <Link href="/auth">
                    <Button className="w-full">Sign In</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Seller Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {listing.seller?.avatarUrl ? (
                  <img 
                    src={listing.seller.avatarUrl} 
                    alt={listing.seller.displayName || listing.seller.username} 
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground font-semibold">
                      {(listing.seller?.displayName || listing.seller?.username || "Seller")[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">
                    {listing.seller?.displayName || listing.seller?.username || "Seller"}
                  </h3>
                  <p className="text-sm text-muted-foreground">Member since {
                    listing.seller?.createdAt
                      ? new Date(listing.seller.createdAt).toLocaleDateString()
                      : "N/A"
                  }</p>
                </div>
              </div>
              
              {listing.seller?.bio && (
                <div>
                  <h4 className="text-sm font-medium mb-1">About the Seller</h4>
                  <p className="text-sm text-muted-foreground">{listing.seller.bio}</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Why Buy This App?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">
                    {listing.monthlyRevenue
                      ? `Generating $${listing.monthlyRevenue.toLocaleString()} in monthly revenue`
                      : "Established business with proven track record"}
                  </span>
                </li>
                {listing.profitMargin && (
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">
                      {`Healthy ${listing.profitMargin}% profit margin`}
                    </span>
                  </li>
                )}
                {listing.monthlyUsers && (
                  <li className="flex gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">
                      {`Active user base of ${listing.monthlyUsers.toLocaleString()} monthly users`}
                    </span>
                  </li>
                )}
                <li className="flex gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">
                    {listing.price && listing.monthlyRevenue
                      ? `ROI in ${Math.ceil(listing.price / ((listing.monthlyRevenue || 0) * (listing.profitMargin || 0) / 100))} months at current earnings`
                      : "Good potential for growth and expansion"}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bid Dialog */}
      <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
            <DialogDescription>
              Submit your bid for {listing.name}. The seller will be notified and can accept or respond with a counter-offer.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...bidForm}>
            <form onSubmit={bidForm.handleSubmit(onBidSubmit)} className="space-y-4">
              <FormField
                control={bidForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Offer Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Asking price: ${listing.price?.toLocaleString()}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={bidForm.control}
                name="proposal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message to Seller</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why you're interested and any questions you have..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setBidDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={submitBidMutation.isPending}
                >
                  {submitBidMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Offer
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Ask a Question</DialogTitle>
            <DialogDescription>
              Your question will be publicly visible and answered by the seller.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...questionForm}>
            <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)} className="space-y-4">
              <FormField
                control={questionForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Question</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What would you like to know about this app?"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={submitQuestionMutation.isPending}
                >
                  {submitQuestionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Submit Question
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}