import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  DollarSign, CalendarIcon, Clock, ArrowUpCircle, CheckCircle, XCircle, UserIcon 
} from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { TaskWithStringDates } from "@shared/schema";

// Load Stripe outside of component to avoid recreating on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Schema for placing a bid
const bidFormSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive").min(1, "Minimum bid is $1"),
  description: z.string().min(10, "Description must be at least 10 characters")
});

type BidFormValues = z.infer<typeof bidFormSchema>;

// Schema for enabling bidding on a task
const bidSettingsSchema = z.object({
  acceptingBids: z.boolean(),
  budget: z.coerce.number().positive("Budget must be positive").optional(),
  biddingDeadline: z.date().optional()
});

type BidSettingsValues = z.infer<typeof bidSettingsSchema>;

// Props interface
interface TaskBiddingProps {
  task: TaskWithStringDates;
  onBidPlaced?: () => void;
}

// Bid interface
interface Bid {
  id: number;
  taskId: number;
  userId: number;
  amount: number;
  description: string;
  status: 'pending' | 'accepted' | 'rejected' | 'paid';
  paymentIntentId?: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

// The CheckoutForm component used for payment
function CheckoutForm({ onSuccess }: { onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setIsProcessing(false);
    } else {
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully!",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement className="mb-6" />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full"
      >
        {isProcessing ? "Processing..." : "Pay Now"}
      </Button>
    </form>
  );
}

// Payment component that wraps the Stripe Elements
function PaymentWrapper({ 
  clientSecret, 
  onSuccess 
}: { 
  clientSecret: string, 
  onSuccess: () => void 
}) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm onSuccess={onSuccess} />
    </Elements>
  );
}

// Main TaskBidding component
export function TaskBidding({ task, onBidPlaced }: TaskBiddingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  // Form for placing a bid
  const bidForm = useForm<BidFormValues>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      amount: 0,
      description: "",
    },
  });
  
  // Form for bid settings (for task owner)
  const settingsForm = useForm<BidSettingsValues>({
    resolver: zodResolver(bidSettingsSchema),
    defaultValues: {
      acceptingBids: task.acceptingBids || false,
      budget: task.budget || undefined,
      biddingDeadline: task.biddingDeadline ? new Date(task.biddingDeadline) : undefined,
    },
  });
  
  // Get all bids for this task
  const fetchBids = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const response = await apiRequest(
        "GET", 
        `/api/tasks/${task.id}/bids`
      );
      
      if (response.ok) {
        const data = await response.json();
        setBids(data);
      } else {
        console.error("Failed to fetch bids");
      }
    } catch (error) {
      console.error("Error fetching bids:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Place a bid on the task
  const onPlaceBid = async (values: BidFormValues) => {
    if (!user) return;
    
    setIsPlacingBid(true);
    try {
      const response = await apiRequest(
        "POST", 
        `/api/tasks/${task.id}/bid`, 
        values
      );
      
      if (response.ok) {
        toast({
          title: "Bid Placed",
          description: "Your bid has been successfully placed.",
        });
        
        bidForm.reset();
        fetchBids();
        
        if (onBidPlaced) {
          onBidPlaced();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Place Bid",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingBid(false);
    }
  };
  
  // Update bid settings
  const onUpdateSettings = async (values: BidSettingsValues) => {
    if (!user || task.userId !== user.id) return;
    
    setIsUpdatingSettings(true);
    try {
      const response = await apiRequest(
        "PUT", 
        `/api/tasks/${task.id}`, 
        values
      );
      
      if (response.ok) {
        toast({
          title: "Settings Updated",
          description: "Bid settings have been updated successfully.",
        });
        
        if (onBidPlaced) {
          onBidPlaced();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Update Settings",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingSettings(false);
    }
  };
  
  // Accept a bid
  const onAcceptBid = async (bidId: number) => {
    if (!user || task.userId !== user.id) return;
    
    try {
      const response = await apiRequest(
        "POST", 
        `/api/tasks/${task.id}/bids/${bidId}/accept`
      );
      
      if (response.ok) {
        toast({
          title: "Bid Accepted",
          description: "You've accepted the bid. You can now make payment.",
        });
        
        fetchBids();
        if (onBidPlaced) {
          onBidPlaced();
        }
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Accept Bid",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };
  
  // Create payment intent
  const onCreatePayment = async () => {
    if (!user || task.userId !== user.id || !task.winningBidId) return;
    
    try {
      const response = await apiRequest(
        "POST", 
        `/api/tasks/${task.id}/create-payment-intent`
      );
      
      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } else {
        const error = await response.json();
        toast({
          title: "Failed to Create Payment",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };
  
  // Effect to load bids on component mount
  useState(() => {
    if (user) {
      fetchBids();
    }
  });
  
  // Prepare UI based on user role
  const isTaskOwner = user?.id === task.userId;
  const userHasBid = bids.some(bid => bid.userId === user?.id);
  const winningBid = bids.find(bid => bid.id === task.winningBidId);
  
  // Check if bidding is still open
  const biddingOpen = task.acceptingBids && 
    (!task.biddingDeadline || new Date(task.biddingDeadline) > new Date());
  
  return (
    <div className="space-y-6">
      {/* Bid information section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-primary" />
            Task Bidding
          </CardTitle>
          <CardDescription>
            {task.acceptingBids 
              ? "This task is open for bids. Submit your offer to complete this task." 
              : "This task is not currently accepting bids."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {task.budget && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Budget:</span>
                <span className="font-bold">${task.budget}</span>
              </div>
            )}
            
            {task.biddingDeadline && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Deadline for bids:</span>
                <span className="font-medium">
                  {format(new Date(task.biddingDeadline), "PPP")}
                </span>
              </div>
            )}
            
            {task.winningBidId && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-medium text-green-700 dark:text-green-400 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Winning Bid Selected
                </h4>
                {winningBid && (
                  <div className="mt-2 flex justify-between items-center">
                    <div className="flex items-center">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={winningBid.user?.avatarUrl || ""} />
                        <AvatarFallback>{winningBid.user?.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span>{winningBid.user?.displayName || winningBid.user?.username}</span>
                    </div>
                    <span className="font-bold">${winningBid.amount}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Different views based on user role */}
      {isTaskOwner ? (
        <Tabs defaultValue="bids">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="bids">View Bids</TabsTrigger>
            <TabsTrigger value="settings">Bid Settings</TabsTrigger>
          </TabsList>
          
          {/* Task owner: View and manage bids */}
          <TabsContent value="bids">
            <Card>
              <CardHeader>
                <CardTitle>Bids Received</CardTitle>
                <CardDescription>
                  {bids.length === 0 
                    ? "No bids received yet" 
                    : `${bids.length} bid${bids.length !== 1 ? 's' : ''} received`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-4">Loading bids...</div>
                ) : bids.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No bids have been placed on this task yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bids.map((bid) => (
                      <Card key={bid.id} className={cn(
                        "overflow-hidden",
                        bid.id === task.winningBidId && "border-green-500"
                      )}>
                        {bid.id === task.winningBidId && (
                          <div className="bg-green-500 text-white text-xs py-1 text-center font-medium">
                            WINNING BID
                          </div>
                        )}
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={bid.user?.avatarUrl || ""} />
                                <AvatarFallback>{bid.user?.username.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{bid.user?.displayName || bid.user?.username}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(bid.createdAt), "PPp")}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">${bid.amount}</div>
                              <Badge variant={
                                bid.status === 'accepted' ? "success" : 
                                bid.status === 'rejected' ? "destructive" : 
                                "outline"
                              }>
                                {bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="mt-3 text-sm">
                            {bid.description}
                          </div>
                          
                          {bid.status === 'pending' && (
                            <div className="mt-4 flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onAcceptBid(bid.id)}
                              >
                                Accept Bid
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
              {task.winningBidId && (
                <CardFooter className="flex-col">
                  <Separator className="mb-4" />
                  <div className="w-full">
                    {clientSecret ? (
                      <PaymentWrapper 
                        clientSecret={clientSecret} 
                        onSuccess={() => {
                          setClientSecret(null);
                          if (onBidPlaced) onBidPlaced();
                        }} 
                      />
                    ) : (
                      <Button 
                        className="w-full" 
                        onClick={onCreatePayment}
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Pay for Task
                      </Button>
                    )}
                  </div>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          {/* Task owner: Manage bid settings */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Bid Settings</CardTitle>
                <CardDescription>
                  Configure bidding options for this task
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...settingsForm}>
                  <form onSubmit={settingsForm.handleSubmit(onUpdateSettings)} className="space-y-6">
                    <FormField
                      control={settingsForm.control}
                      name="acceptingBids"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Accept Bids
                            </FormLabel>
                            <FormDescription>
                              Allow users to place bids on this task
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget (optional)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                              <Input
                                placeholder="0.00"
                                type="number"
                                step="0.01"
                                className="pl-10"
                                {...field}
                                value={field.value || ''}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Set a budget to help bidders understand your price range
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={settingsForm.control}
                      name="biddingDeadline"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Bidding Deadline (optional)</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                  date < new Date()
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormDescription>
                            Set a deadline for receiving bids on this task
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={isUpdatingSettings}
                    >
                      {isUpdatingSettings ? "Updating..." : "Update Bid Settings"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        /* Non-owner view: Place bid */
        <Card>
          <CardHeader>
            <CardTitle>Place a Bid</CardTitle>
            <CardDescription>
              {biddingOpen 
                ? "Offer your services to complete this task" 
                : "This task is not currently accepting bids"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userHasBid ? (
              <div className="text-center">
                <p className="mb-4">You have already placed a bid on this task.</p>
                <Button 
                  variant="outline" 
                  onClick={fetchBids}
                >
                  Refresh Bids
                </Button>
              </div>
            ) : !biddingOpen ? (
              <div className="text-center py-4 text-muted-foreground">
                {task.winningBidId 
                  ? "A winning bid has already been selected for this task." 
                  : "This task is not currently accepting bids."}
              </div>
            ) : (
              <Form {...bidForm}>
                <form onSubmit={bidForm.handleSubmit(onPlaceBid)} className="space-y-6">
                  <FormField
                    control={bidForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bid Amount ($)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="0.00"
                              type="number"
                              step="0.01"
                              className="pl-10"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Enter the amount you want to bid for this task
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={bidForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain why you're the right person for this task and any details about your bid"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isPlacingBid}
                  >
                    {isPlacingBid ? "Placing Bid..." : "Place Bid"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}