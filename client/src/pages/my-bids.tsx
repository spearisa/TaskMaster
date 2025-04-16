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

// Helper function to get card class based on bid status
const getBidCardClass = (status: string | undefined) => {
  if (status === 'accepted') {
    return 'overflow-hidden border-green-200 bg-green-50/30 shadow-[0_0_15px_rgba(0,150,0,0.15)]';
  } else if (status === 'rejected') {
    return 'overflow-hidden border-red-200 bg-red-50/30 shadow-[0_0_15px_rgba(150,0,0,0.15)]';
  } else {
    return 'overflow-hidden';
  }
};

export default function MyBidsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("received");

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
    onSuccess: () => {
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
          <span className="text-yellow-600 bg-yellow-100 px-3 py-1.5 rounded-full text-xs font-medium flex items-center shadow-sm border border-yellow-200">
            <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full mr-1.5 animate-pulse"></span>
            Pending
          </span>
        );
      case 'accepted':
        return (
          <span className="text-green-600 bg-green-100 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center shadow-sm border border-green-200">
            <CheckCircle className="w-4 h-4 mr-1.5" strokeWidth={2.5} />
            ACCEPTED
          </span>
        );
      case 'rejected':
        return (
          <span className="text-red-600 bg-red-100 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center shadow-sm border border-red-200">
            <XCircle className="w-4 h-4 mr-1.5" strokeWidth={2.5} />
            REJECTED
          </span>
        );
      case 'completed':
        return (
          <span className="text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center shadow-sm border border-blue-200">
            <span className="w-4 h-4 mr-1.5 flex items-center justify-center">✓</span>
            COMPLETED
          </span>
        );
      default:
        return (
          <span className="text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full text-xs font-medium flex items-center shadow-sm border border-gray-200">
            <span className="w-2.5 h-2.5 bg-gray-400 rounded-full mr-1.5"></span>
            Unknown
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
    if (activeTab === 'received' && receivedBids) {
      const accepted = receivedBids.filter(bid => bid.status === 'accepted').length;
      const rejected = receivedBids.filter(bid => bid.status === 'rejected').length;
      const pending = receivedBids.filter(bid => !bid.status || bid.status === 'pending').length;
      return { accepted, rejected, pending, total: receivedBids.length };
    } else if (activeTab === 'placed' && placedBids) {
      const accepted = placedBids.filter(bid => bid.status === 'accepted').length;
      const rejected = placedBids.filter(bid => bid.status === 'rejected').length;
      const pending = placedBids.filter(bid => !bid.status || bid.status === 'pending').length;
      return { accepted, rejected, pending, total: placedBids.length };
    }
    return { accepted: 0, rejected: 0, pending: 0, total: 0 };
  };

  const stats = getBidStats();

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">My Bids</h1>
      
      {/* Bid statistics summary */}
      {stats.total > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-white border border-gray-100 shadow-sm">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <h3 className="text-lg font-medium text-gray-700">
              {activeTab === 'received' ? 'Bid Summary (Received)' : 'Bid Summary (Placed)'}
            </h3>
            <div className="flex flex-wrap gap-4">
              <div className="px-4 py-2 bg-green-50 rounded-lg border border-green-100">
                <div className="text-sm text-gray-600">Accepted</div>
                <div className="font-bold text-green-600 text-xl">{stats.accepted}</div>
              </div>
              <div className="px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-100">
                <div className="text-sm text-gray-600">Pending</div>
                <div className="font-bold text-yellow-600 text-xl">{stats.pending}</div>
              </div>
              <div className="px-4 py-2 bg-red-50 rounded-lg border border-red-100">
                <div className="text-sm text-gray-600">Rejected</div>
                <div className="font-bold text-red-600 text-xl">{stats.rejected}</div>
              </div>
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-sm text-gray-600">Total</div>
                <div className="font-bold text-gray-700 text-xl">{stats.total}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <Tabs defaultValue="received" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="received">Bids I've Received</TabsTrigger>
          <TabsTrigger value="placed">Bids I've Placed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="received">
          {!receivedBids || receivedBids.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-2">You haven't received any bids yet.</p>
              <p className="text-sm text-gray-500">When you create tasks that accept bids, they'll appear here.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {receivedBids.map((bid) => {
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
          )}
        </TabsContent>
        
        <TabsContent value="placed">
          {!placedBids || placedBids.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-2">You haven't placed any bids yet.</p>
              <p className="text-sm text-gray-500">Browse public tasks to find opportunities to bid on.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {placedBids.map((bid) => {
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}