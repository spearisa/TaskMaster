import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskBidWithStringDates, TaskWithStringDates } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, DollarSign, CalendarClock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function MyBidsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("received");

  // Query for bids received on my tasks
  const {
    data: receivedBids,
    isLoading: isLoadingReceived,
    error: receivedError
  } = useQuery<{bids: Array<TaskBidWithStringDates & {task: TaskWithStringDates, bidder: {username: string, displayName: string}}>}>({
    queryKey: ['/api/bids/received'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/bids/received');
      const data = await res.json();
      console.log("Received bids API response:", data);
      return data;
    },
    enabled: !!user && activeTab === "received"
  });

  // Query for bids I've placed on others' tasks
  const {
    data: placedBids,
    isLoading: isLoadingPlaced,
    error: placedError
  } = useQuery<{bids: Array<TaskBidWithStringDates & {task: TaskWithStringDates, owner: {username: string, displayName: string}}>}>({
    queryKey: ['/api/bids/placed'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/bids/placed');
      const data = await res.json();
      console.log("Placed bids API response:", data);
      return data;
    },
    enabled: !!user && activeTab === "placed"
  });

  // Mutation to accept a bid
  const acceptBidMutation = useMutation({
    mutationFn: async (bidId: number) => {
      const res = await apiRequest('POST', `/api/bids/${bidId}/accept`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid accepted",
        description: "The bid has been accepted successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bids/received'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to accept bid",
        description: error.message || "An error occurred while accepting the bid.",
        variant: "destructive",
      });
    }
  });

  // Mutation to reject a bid
  const rejectBidMutation = useMutation({
    mutationFn: async (bidId: number) => {
      const res = await apiRequest('POST', `/api/bids/${bidId}/reject`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid rejected",
        description: "The bid has been rejected.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bids/received'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject bid",
        description: error.message || "An error occurred while rejecting the bid.",
        variant: "destructive",
      });
    }
  });

  // Handle accept bid
  const handleAcceptBid = (bidId: number) => {
    acceptBidMutation.mutate(bidId);
  };

  // Handle reject bid
  const handleRejectBid = (bidId: number) => {
    rejectBidMutation.mutate(bidId);
  };

  // Render bid status badge
  const renderBidStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="text-yellow-500 bg-yellow-100 px-2 py-1 rounded-full text-xs font-medium">Pending</span>;
      case 'accepted':
        return <span className="text-green-500 bg-green-100 px-2 py-1 rounded-full text-xs font-medium">Accepted</span>;
      case 'rejected':
        return <span className="text-red-500 bg-red-100 px-2 py-1 rounded-full text-xs font-medium">Rejected</span>;
      case 'completed':
        return <span className="text-blue-500 bg-blue-100 px-2 py-1 rounded-full text-xs font-medium">Completed</span>;
      default:
        return <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded-full text-xs font-medium">Unknown</span>;
    }
  };

  // Render loading state
  if ((isLoadingReceived && activeTab === "received") || (isLoadingPlaced && activeTab === "placed")) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading bids...</p>
      </div>
    );
  }

  // Render error state
  if ((receivedError && activeTab === "received") || (placedError && activeTab === "placed")) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 p-4 rounded-lg mb-4 text-red-600 text-center">
          <p className="font-medium">Error loading bids</p>
          <p className="text-sm">{(receivedError as Error)?.message || (placedError as Error)?.message || "An unexpected error occurred."}</p>
        </div>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/bids/${activeTab}`] })}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">My Bids</h1>
      
      <Tabs defaultValue="received" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="received">Bids I've Received</TabsTrigger>
          <TabsTrigger value="placed">Bids I've Placed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="received">
          {receivedBids?.bids?.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-2">You haven't received any bids yet.</p>
              <p className="text-sm text-gray-500">When you create tasks that accept bids, they'll appear here.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {receivedBids?.bids?.map((bid) => (
                <Card key={bid.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{bid.task.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">{bid.task.description}</CardDescription>
                      </div>
                      {renderBidStatus(bid.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">From:</span>
                        <span className="font-medium">{bid.bidder.displayName || bid.bidder.username}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Bid Amount:</span>
                        <span className="font-bold text-primary flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formatCurrency(bid.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Estimated Time:</span>
                        <span className="flex items-center">
                          <CalendarClock className="h-4 w-4 mr-1 text-gray-500" />
                          {bid.estimatedTime ? `${bid.estimatedTime} hours` : 'Not specified'}
                        </span>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100">
                        <h4 className="text-sm font-medium mb-2">Proposal:</h4>
                        <p className="text-sm text-gray-700">{bid.proposal}</p>
                      </div>
                    </div>
                  </CardContent>
                  
                  {bid.status === 'pending' && (
                    <CardFooter className="flex justify-between space-x-3 pt-0">
                      <Button 
                        variant="outline" 
                        className="flex-1 border-red-200 hover:bg-red-50 hover:text-red-600" 
                        onClick={() => handleRejectBid(bid.id)}
                        disabled={rejectBidMutation.isPending}
                      >
                        {rejectBidMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Reject
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => handleAcceptBid(bid.id)}
                        disabled={acceptBidMutation.isPending}
                      >
                        {acceptBidMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Accept
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="placed">
          {placedBids?.bids?.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-2">You haven't placed any bids yet.</p>
              <p className="text-sm text-gray-500">Browse public tasks to find opportunities to bid on.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {placedBids?.bids?.map((bid) => (
                <Card key={bid.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{bid.task.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">{bid.task.description}</CardDescription>
                      </div>
                      {renderBidStatus(bid.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Task Owner:</span>
                        <span className="font-medium">{bid.owner.displayName || bid.owner.username}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Your Bid:</span>
                        <span className="font-bold text-primary flex items-center">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {formatCurrency(bid.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Your Estimate:</span>
                        <span className="flex items-center">
                          <CalendarClock className="h-4 w-4 mr-1 text-gray-500" />
                          {bid.estimatedTime ? `${bid.estimatedTime} hours` : 'Not specified'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Submitted:</span>
                        <span className="text-sm text-gray-600">{formatDate(bid.createdAt)}</span>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100">
                        <h4 className="text-sm font-medium mb-2">Your Proposal:</h4>
                        <p className="text-sm text-gray-700">{bid.proposal}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}