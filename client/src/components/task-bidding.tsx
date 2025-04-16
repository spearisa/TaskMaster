import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Loader2, DollarSign, Clock, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TaskWithStringDates } from "@shared/schema";

interface TaskBiddingProps {
  task: TaskWithStringDates;
  onBidPlaced?: () => void;
}

// Schema for the bid form
const bidFormSchema = z.object({
  amount: z.number().positive({ message: "Amount must be positive" }),
  estimatedTime: z.number().int().positive().optional(),
  proposal: z.string().min(10, { message: "Proposal must be at least 10 characters" }),
});

type BidFormValues = z.infer<typeof bidFormSchema>;

interface TaskBid {
  id: number;
  taskId: number;
  bidderId: number;
  amount: number;
  estimatedTime: number | null;
  proposal: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  createdAt: string | null;
  updatedAt: string | null;
  completedAt: string | null;
  stripePaymentIntentId: string | null;
  stripePaymentStatus: string | null;
  bidder?: {
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
  };
}

export function TaskBidding({ task, onBidPlaced }: TaskBiddingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const queryClient = useQueryClient();
  const isTaskOwner = user?.id === task.userId;

  // Query to fetch bids for the task
  const { data: bids = [], isLoading: bidsLoading } = useQuery<TaskBid[]>({
    queryKey: ['/api/tasks', task.id, 'bids'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tasks/${task.id}/bids`);
      return await response.json();
    },
    enabled: !!task.id
  });

  // Form handling
  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      amount: 0,
      estimatedTime: undefined,
      proposal: "",
    },
  });

  // Mutation to place a bid
  const placeBidMutation = useMutation({
    mutationFn: async (values: BidFormValues) => {
      const response = await apiRequest(
        "POST", 
        `/api/tasks/${task.id}/bids`,
        {
          ...values,
          bidderId: user?.id
        }
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid placed",
        description: "Your bid has been successfully placed",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', task.id, 'bids'] });
      if (onBidPlaced) onBidPlaced();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place bid",
        variant: "destructive",
      });
    }
  });

  // Mutation to accept a bid
  const acceptBidMutation = useMutation({
    mutationFn: async (bidId: number) => {
      const response = await apiRequest(
        "POST", 
        `/api/tasks/${task.id}/bids/${bidId}/accept`
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid accepted",
        description: "You'll be redirected to payment processing",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks', task.id, 'bids'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept bid",
        variant: "destructive",
      });
    }
  });

  const onSubmit = async (values: BidFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to place a bid",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    try {
      await placeBidMutation.mutateAsync(values);
    } catch (err) {
      // Error handling in mutation
    }
  };

  const handleAcceptBid = async (bidId: number) => {
    try {
      await acceptBidMutation.mutateAsync(bidId);
    } catch (err) {
      // Error handling in mutation
    }
  };

  // Filter bids by status
  const pendingBids = bids.filter(bid => bid.status === "pending");
  const acceptedBid = bids.find(bid => bid.status === "accepted");
  const completedBid = bids.find(bid => bid.status === "completed");

  // Don't show bidding form if:
  // 1. User is the task owner
  // 2. User has already placed a bid
  // 3. A bid has already been accepted
  // 4. The task is not accepting bids
  const userHasBid = bids.some(bid => bid.bidderId === user?.id);
  const showBidForm = !isTaskOwner && !userHasBid && !acceptedBid && task.acceptingBids;

  return (
    <div className="space-y-6">
      {/* Task Budget Info */}
      {task.budget && (
        <Card>
          <CardHeader className="bg-green-50 border-b border-green-100">
            <CardTitle className="flex items-center text-lg text-green-800">
              <DollarSign className="w-5 h-5 mr-2" />
              Task Budget
            </CardTitle>
            <CardDescription className="text-green-700">
              The creator has set a budget for this task
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-2xl font-bold text-green-700">${task.budget.toFixed(2)}</p>
                {task.biddingDeadline && (
                  <p className="text-sm text-gray-500 mt-1">
                    Bidding closes: {format(new Date(task.biddingDeadline), "MMM d, yyyy")}
                  </p>
                )}
              </div>
              <Badge 
                variant={task.acceptingBids ? "default" : "secondary"}
                className={task.acceptingBids ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}
              >
                {task.acceptingBids ? "Accepting Bids" : "Bidding Closed"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bid Placement Form */}
      {showBidForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-primary" />
              Place a Bid
            </CardTitle>
            <CardDescription>
              Offer your services to complete this task
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Your Bid ($)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                            <Input 
                              type="number" 
                              step="0.01"
                              min="0.01"
                              className="pl-10" 
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="estimatedTime"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Est. Time (minutes)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                            <Input 
                              type="number" 
                              min="1"
                              className="pl-10" 
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="proposal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Proposal</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe how you'll approach this task..." 
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Be specific about your qualifications and approach
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={placeBidMutation.isPending}
                >
                  {placeBidMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting Bid...
                    </>
                  ) : "Submit Bid"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Accepted/Current Bid */}
      {acceptedBid && (
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="border-b border-blue-100">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center text-blue-800">
                <Award className="w-5 h-5 mr-2" />
                Accepted Bid
              </CardTitle>
              <Badge className="bg-blue-200 text-blue-800 hover:bg-blue-300">In Progress</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 border-2 border-blue-200">
                <AvatarImage src={acceptedBid.bidder?.avatarUrl || ''} />
                <AvatarFallback className="bg-blue-100 text-blue-500">
                  {acceptedBid.bidder?.displayName?.[0] || acceptedBid.bidder?.username?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="font-medium">{acceptedBid.bidder?.displayName || acceptedBid.bidder?.username}</p>
                  <p className="font-bold text-blue-800">${acceptedBid.amount.toFixed(2)}</p>
                </div>
                {acceptedBid.estimatedTime && (
                  <p className="text-sm text-blue-700 mt-1">
                    <Clock className="inline-block w-4 h-4 mr-1" />
                    Est. {acceptedBid.estimatedTime} minutes
                  </p>
                )}
                <Separator className="my-3 bg-blue-200" />
                <p className="text-sm text-blue-800">{acceptedBid.proposal}</p>
                <div className="mt-3 text-xs text-blue-600">
                  {acceptedBid.createdAt && (
                    <p>Bid placed: {format(new Date(acceptedBid.createdAt), "MMM d, yyyy")}</p>
                  )}
                  <p>Payment status: {acceptedBid.stripePaymentStatus || "Pending"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Bids List (only shown to task owner) */}
      {isTaskOwner && pendingBids.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-primary" />
              Pending Bids ({pendingBids.length})
            </CardTitle>
            <CardDescription>
              Review and select the best bid for your task
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {pendingBids.map((bid) => (
                <div key={bid.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={bid.bidder?.avatarUrl || ''} />
                      <AvatarFallback>
                        {bid.bidder?.displayName?.[0] || bid.bidder?.username?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{bid.bidder?.displayName || bid.bidder?.username}</p>
                        <p className="font-bold text-green-700">${bid.amount.toFixed(2)}</p>
                      </div>
                      {bid.estimatedTime && (
                        <p className="text-sm text-gray-500 mt-1">
                          <Clock className="inline-block w-4 h-4 mr-1" />
                          Est. {bid.estimatedTime} minutes
                        </p>
                      )}
                      <p className="text-sm mt-2">{bid.proposal}</p>
                      {bid.createdAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          Bid placed: {format(new Date(bid.createdAt), "MMM d, yyyy")}
                        </p>
                      )}
                      <div className="mt-3">
                        <Button 
                          onClick={() => handleAcceptBid(bid.id)}
                          disabled={acceptBidMutation.isPending}
                          size="sm"
                        >
                          {acceptBidMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Processing...
                            </>
                          ) : "Accept Bid"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User's Placed Bid */}
      {!isTaskOwner && userHasBid && !acceptedBid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-primary" />
              Your Bid
            </CardTitle>
            <CardDescription>
              Waiting for the task creator to review
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {bids.filter(bid => bid.bidderId === user?.id).map((bid) => (
              <div key={bid.id} className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-start">
                  <p className="font-medium">Your bid amount</p>
                  <p className="font-bold text-green-700">${bid.amount.toFixed(2)}</p>
                </div>
                {bid.estimatedTime && (
                  <p className="text-sm text-gray-500 mt-1">
                    <Clock className="inline-block w-4 h-4 mr-1" />
                    Est. {bid.estimatedTime} minutes
                  </p>
                )}
                <Separator className="my-3" />
                <p className="text-sm">{bid.proposal}</p>
                {bid.createdAt && (
                  <p className="text-xs text-gray-500 mt-3">
                    Bid placed: {format(new Date(bid.createdAt), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No bids yet message */}
      {bids.length === 0 && !showBidForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2 text-primary" />
              No Bids Yet
            </CardTitle>
            <CardDescription>
              {isTaskOwner 
                ? "No one has placed a bid on your task yet"
                : "This task is not currently accepting bids"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isTaskOwner ? (
              <p className="text-sm text-gray-500">
                Check back later or adjust your task description to attract more bidders.
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                The task owner has either closed bidding or selected someone else's bid.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}