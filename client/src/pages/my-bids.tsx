import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskBidWithStringDates, TaskWithStringDates } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, DollarSign, CalendarClock, Clock } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

// Helper function to get card class based on bid status
const getBidCardClass = (status: string | undefined) => {
  if (status === 'accepted') {
    return 'overflow-hidden border-green-500 border-l-4 shadow-md';
  } else if (status === 'rejected') {
    return 'overflow-hidden border-red-500 border-l-4 shadow-md';
  } else {
    return 'overflow-hidden border-gray-200 shadow-md';
  }
};

export default function MyBidsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("received");
  const [receivedBidsState, setReceivedBidsState] = useState<Array<any>>([]); 
  const [placedBidsState, setPlacedBidsState] = useState<Array<any>>([]);

  // Query for bids received on my tasks
  const {
    data: receivedBids,
    isLoading: isLoadingReceived,
    error: receivedError
  } = useQuery<Array<TaskBidWithStringDates & {task: any, user: {username: string, displayName: string}}>>({
    queryKey: ['/api/bids/received'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/bids/received');
      const data = await res.json();
      console.log("Received bids API response:", data);
      // Update the local state when we get new data
      setReceivedBidsState(data);
      return data;
    },
    enabled: !!user && activeTab === "received"
  });

  // Query for bids I've placed on others' tasks
  const {
    data: placedBids,
    isLoading: isLoadingPlaced,
    error: placedError
  } = useQuery<Array<TaskBidWithStringDates & {task: any & {user: {username: string, displayName: string}}}>>({
    queryKey: ['/api/bids/placed'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/bids/placed');
      const data = await res.json();
      console.log("Placed bids API response:", data);
      // Update the local state when we get new data
      setPlacedBidsState(data);
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
    onSuccess: (data) => {
      // Update UI immediately for better user experience
      setReceivedBidsState((prevBids) => 
        prevBids?.map(bid => 
          bid.id === data.id ? { ...bid, status: 'accepted' } : bid
        )
      );
      
      toast({
        title: "✅ Bid Accepted",
        description: "The bid has been accepted successfully. The bidder has been notified.",
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
    onSuccess: (data) => {
      // Update UI immediately for better user experience
      setReceivedBidsState((prevBids) => 
        prevBids?.map(bid => 
          bid.id === data.id ? { ...bid, status: 'rejected' } : bid
        )
      );
      
      toast({
        title: "❌ Bid Rejected",
        description: "The bid has been rejected. The bidder has been notified.",
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

  // Render bid status badge with improved visual indicators
  const renderBidStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="text-yellow-800 bg-yellow-100 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1.5 animate-pulse"></span>
            Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="text-green-800 bg-green-100 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-700" />
            Accepted
          </span>
        );
      case 'rejected':
        return (
          <span className="text-red-800 bg-red-100 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <XCircle className="w-3.5 h-3.5 mr-1 text-red-700" />
            Rejected
          </span>
        );
      case 'completed':
        return (
          <span className="text-blue-800 bg-blue-100 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <CheckCircle className="w-3.5 h-3.5 mr-1 text-blue-700" />
            Completed
          </span>
        );
      default:
        return (
          <span className="text-yellow-800 bg-yellow-100 px-3 py-1 rounded-full text-xs font-medium flex items-center">
            <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1.5"></span>
            Pending
          </span>
        );
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

  // Calculate bid statistics
  const getBidStats = () => {
    if (activeTab === 'received' && receivedBidsState) {
      const accepted = receivedBidsState.filter(bid => bid.status === 'accepted').length;
      const rejected = receivedBidsState.filter(bid => bid.status === 'rejected').length;
      const pending = receivedBidsState.filter(bid => !bid.status || bid.status === 'pending').length;
      return { accepted, rejected, pending, total: receivedBidsState.length };
    } else if (activeTab === 'placed' && placedBidsState) {
      const accepted = placedBidsState.filter(bid => bid.status === 'accepted').length;
      const rejected = placedBidsState.filter(bid => bid.status === 'rejected').length;
      const pending = placedBidsState.filter(bid => !bid.status || bid.status === 'pending').length;
      return { accepted, rejected, pending, total: placedBidsState.length };
    }
    return { accepted: 0, rejected: 0, pending: 0, total: 0 };
  };

  const stats = getBidStats();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">My Bids</h1>
      
      {/* Bid statistics summary */}
      {stats.total > 0 && (
        <div className="mb-6">
          <div className="mb-2 text-gray-700">
            {activeTab === 'received' ? 'Bid Summary (Received)' : 'Bid Summary (Placed)'}
          </div>
          <div className="flex items-center">
            <div className="flex-1 flex">
              <div className="rounded-l-md bg-green-50 px-4 py-3 text-center border border-r-0 flex-1">
                <div className="text-gray-800">Accepted</div>
                <div className="font-bold text-green-600 text-2xl">{stats.accepted}</div>
              </div>
              <div className="bg-yellow-50 px-4 py-3 text-center border border-r-0 flex-1">
                <div className="text-gray-800">Pending</div>
                <div className="font-bold text-yellow-600 text-2xl">{stats.pending}</div>
              </div>
              <div className="bg-red-50 px-4 py-3 text-center border border-r-0 flex-1">
                <div className="text-gray-800">Rejected</div>
                <div className="font-bold text-red-600 text-2xl">{stats.rejected}</div>
              </div>
              <div className="rounded-r-md bg-gray-50 px-4 py-3 text-center border flex-1">
                <div className="text-gray-800">Total</div>
                <div className="font-bold text-gray-800 text-2xl">{stats.total}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="w-full">
        <div className="mb-6 border-b flex gap-4">
          <button 
            onClick={() => setActiveTab("received")}
            className={`py-2 px-4 font-medium ${activeTab === "received" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
          >
            Bids I've Received
          </button>
          <button 
            onClick={() => setActiveTab("placed")}
            className={`py-2 px-4 font-medium ${activeTab === "placed" ? "border-b-2 border-primary text-primary" : "text-gray-500"}`}
          >
            Bids I've Placed
          </button>
        </div>
        
        {activeTab === "received" && (
          !receivedBidsState || receivedBidsState.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-2">You haven't received any bids yet.</p>
              <p className="text-sm text-gray-500">When you create tasks that accept bids, they'll appear here.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {receivedBidsState.map((bid) => {
                // Use helper function to get card class
                const cardClass = getBidCardClass(bid.status);
                
                return (
                <Card key={bid.id} className={cardClass}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{bid.task.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">{bid.task.description}</CardDescription>
                      </div>
                      {renderBidStatus(bid.status || 'pending')}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">From:</span>
                        <span className="font-medium">{bid.user.displayName || bid.user.username}</span>
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
                      
                      {bid.status && (
                        <div className={`
                          p-2 rounded-md text-center font-medium text-sm
                          ${bid.status === 'accepted' ? 'bg-green-50 text-green-700 border border-green-200' : 
                            bid.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 
                            'bg-gray-50 text-gray-700 border border-gray-200'}
                        `}>
                          {bid.status === 'accepted' && 'This bid has been accepted!'}
                          {bid.status === 'rejected' && 'This bid has been rejected.'}
                          {bid.status !== 'accepted' && bid.status !== 'rejected' && `Bid status: ${bid.status}`}
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-gray-100">
                        <h4 className="text-sm font-medium mb-2">Proposal:</h4>
                        <p className="text-sm text-gray-700">{bid.proposal}</p>
                      </div>
                    </div>
                  </CardContent>
                  
                  {(!bid.status || bid.status === 'pending') && (
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
                );
              })}
            </div>
          )
        )}
        
        {activeTab === "placed" && (
          !placedBidsState || placedBidsState.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-2">You haven't placed any bids yet.</p>
              <p className="text-sm text-gray-500">Browse public tasks to find opportunities to bid on.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {placedBidsState.map((bid) => {
                // Use helper function to get card class
                const cardClass = getBidCardClass(bid.status);
                
                return (
                <Card key={bid.id} className={cardClass}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{bid.task.title}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">{bid.task.description}</CardDescription>
                      </div>
                      {renderBidStatus(bid.status || 'pending')}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Task Owner:</span>
                        <span className="font-medium">{bid.task.user?.displayName || bid.task.user?.username}</span>
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
                      
                      {bid.status && (
                        <div className={`
                          p-2 rounded-md text-center font-medium text-sm
                          ${bid.status === 'accepted' ? 'bg-green-50 text-green-700 border border-green-200' : 
                            bid.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 
                            'bg-gray-50 text-gray-700 border border-gray-200'}
                        `}>
                          {bid.status === 'accepted' && 'Your bid has been accepted!'}
                          {bid.status === 'rejected' && 'Your bid has been rejected.'}
                          {bid.status !== 'accepted' && bid.status !== 'rejected' && `Bid status: ${bid.status}`}
                        </div>
                      )}
                      
                      <div className="pt-3 border-t border-gray-100">
                        <h4 className="text-sm font-medium mb-2">Your Proposal:</h4>
                        <p className="text-sm text-gray-700">{bid.proposal}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}