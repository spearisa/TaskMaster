import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, DollarSign, CalendarClock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

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
  const [receivedBids, setReceivedBids] = useState<Array<any>>([]); 
  const [placedBids, setPlacedBids] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [loadingAccept, setLoadingAccept] = useState<number | null>(null);
  const [loadingReject, setLoadingReject] = useState<number | null>(null);
  
  // Function to load bids based on the active tab
  const loadBids = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const endpoint = `/api/bids/${activeTab}`;
      console.log(`Fetching bids from ${endpoint}...`);
      
      // Use the apiRequest function from queryClient which properly handles credentials
      const response = await apiRequest('GET', endpoint, undefined, {
        credentials: 'include', // Explicitly include credentials
        redirectToAuthOnUnauthorized: false // Don't redirect on 401, we'll handle it
      });
      
      console.log(`Bid fetch response status:`, response.status, response.statusText);
      
      if (response.status === 401) {
        // Handle authentication error specifically
        console.log('Not authenticated, prompting user to log in');
        setError(new Error('You need to be logged in to view bids. Please log in and try again.'));
        setIsLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to load ${activeTab} bids: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Log the full response data
      console.log(`Raw response data for ${activeTab} bids:`, data);
      
      // Make sure we're handling the response correctly
      const bidsArray = Array.isArray(data) ? data : (data.bids || []);
      console.log(`Loaded ${bidsArray.length} ${activeTab} bids:`, bidsArray);
      
      // Check the structure of the first bid if available
      if (bidsArray.length > 0) {
        console.log(`First bid structure:`, bidsArray[0]);
      }
      
      if (activeTab === 'received') {
        setReceivedBids(bidsArray);
      } else {
        setPlacedBids(bidsArray);
      }
      
      // Log state update
      console.log(`Updated ${activeTab} bids state variable with ${bidsArray.length} bids`);
    } catch (err) {
      console.error(`Error loading ${activeTab} bids:`, err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load bids when component mounts or activeTab changes
  useEffect(() => {
    if (user) {
      loadBids();
    }
  }, [activeTab, user]);
  
  // Function to accept a bid with immediate UI feedback
  const handleAcceptBid = async (bidId: number) => {
    // Set loading state
    setLoadingAccept(bidId);
    
    // Optimistically update the UI
    setReceivedBids(prevBids => 
      prevBids.map(bid => 
        bid.id === bidId ? { ...bid, status: 'accepted' } : bid
      )
    );
    
    try {
      console.log(`Accepting bid ${bidId}...`);
      
      // Make the API call using apiRequest helper
      const response = await apiRequest('POST', `/api/bids/${bidId}/accept`, undefined, {
        credentials: 'include', // Explicitly include credentials
        redirectToAuthOnUnauthorized: false // Don't redirect on 401, we'll handle it
      });
      
      console.log(`Bid accept response status:`, response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to accept bid: ${response.status} ${response.statusText}`);
      }
      
      // Show success toast
      toast({
        title: "✅ Bid Accepted",
        description: "The bid has been accepted successfully. The bidder has been notified.",
        variant: "default",
      });
      
      // Reload bids to ensure we have the latest data
      setTimeout(() => loadBids(), 500);
      
    } catch (err) {
      console.error('Error accepting bid:', err);
      
      // On error, revert the optimistic update
      toast({
        title: "Failed to accept bid",
        description: err instanceof Error ? err.message : "An error occurred while accepting the bid.",
        variant: "destructive",
      });
      
      // Reload the bids to get the correct state
      loadBids();
    } finally {
      setLoadingAccept(null);
    }
  };
  
  // Function to reject a bid with immediate UI feedback
  const handleRejectBid = async (bidId: number) => {
    // Set loading state
    setLoadingReject(bidId);
    
    // Optimistically update the UI
    setReceivedBids(prevBids => 
      prevBids.map(bid => 
        bid.id === bidId ? { ...bid, status: 'rejected' } : bid
      )
    );
    
    try {
      console.log(`Rejecting bid ${bidId}...`);
      
      // Make the API call using apiRequest helper
      const response = await apiRequest('POST', `/api/bids/${bidId}/reject`, undefined, {
        credentials: 'include', // Explicitly include credentials
        redirectToAuthOnUnauthorized: false // Don't redirect on 401, we'll handle it
      });
      
      console.log(`Bid reject response status:`, response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to reject bid: ${response.status} ${response.statusText}`);
      }
      
      // Show success toast
      toast({
        title: "❌ Bid Rejected",
        description: "The bid has been rejected. The bidder has been notified.",
        variant: "default",
      });
      
      // Reload bids to ensure we have the latest data
      setTimeout(() => loadBids(), 500);
      
    } catch (err) {
      console.error('Error rejecting bid:', err);
      
      // On error, revert the optimistic update
      toast({
        title: "Failed to reject bid",
        description: err instanceof Error ? err.message : "An error occurred while rejecting the bid.",
        variant: "destructive",
      });
      
      // Reload the bids to get the correct state
      loadBids();
    } finally {
      setLoadingReject(null);
    }
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
  if (isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading bids...</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 p-4 rounded-lg mb-4 text-red-600 text-center">
          <p className="font-medium">Error loading bids</p>
          <p className="text-sm">{error.message || "An unexpected error occurred."}</p>
        </div>
        <Button onClick={loadBids}>
          Try Again
        </Button>
      </div>
    );
  }

  // Calculate bid statistics
  const getBidStats = () => {
    if (activeTab === 'received') {
      const accepted = receivedBids.filter(bid => bid.status === 'accepted').length;
      const rejected = receivedBids.filter(bid => bid.status === 'rejected').length;
      const pending = receivedBids.filter(bid => !bid.status || bid.status === 'pending').length;
      return { accepted, rejected, pending, total: receivedBids.length };
    } else {
      const accepted = placedBids.filter(bid => bid.status === 'accepted').length;
      const rejected = placedBids.filter(bid => bid.status === 'rejected').length;
      const pending = placedBids.filter(bid => !bid.status || bid.status === 'pending').length;
      return { accepted, rejected, pending, total: placedBids.length };
    }
  };

  const stats = getBidStats();
  const currentBids = activeTab === 'received' ? receivedBids : placedBids;

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
        
        {currentBids.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-2">
              {activeTab === 'received' 
                ? "You haven't received any bids yet."
                : "You haven't placed any bids yet."}
            </p>
            <p className="text-sm text-gray-500">
              {activeTab === 'received'
                ? "When you create tasks that accept bids, they'll appear here."
                : "Browse public tasks to find opportunities to bid on."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {currentBids.map((bid) => {
              // Use helper function to get card class
              const cardClass = getBidCardClass(bid.status);
              
              return (
              <Card key={bid.id} className={cardClass}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{bid.task?.title || 'Task Title Missing'}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">{bid.task?.description || 'No task description available.'}</CardDescription>
                    </div>
                    {renderBidStatus(bid.status || 'pending')}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 text-sm">
                        {activeTab === 'received' ? 'From:' : 'To:'}
                      </span>
                      <span className="font-medium">
                        {activeTab === 'received'
                          ? (bid.user?.displayName || bid.user?.username || 'Unknown User')
                          : (bid.task?.user?.displayName || bid.task?.user?.username || 'Unknown User')}
                      </span>
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
                
                {activeTab === 'received' && (!bid.status || bid.status === 'pending') && (
                  <CardFooter className="flex justify-between space-x-3 pt-0">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-red-200 hover:bg-red-50 hover:text-red-600" 
                      onClick={() => handleRejectBid(bid.id)}
                      disabled={loadingReject === bid.id || loadingAccept === bid.id}
                    >
                      {loadingReject === bid.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Reject
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => handleAcceptBid(bid.id)}
                      disabled={loadingAccept === bid.id || loadingReject === bid.id}
                    >
                      {loadingAccept === bid.id ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Accept
                    </Button>
                  </CardFooter>
                )}
                
                {(bid.status === 'accepted' || bid.status === 'rejected') && (
                  <CardFooter className="pt-0">
                    <div className="w-full flex items-center justify-center">
                      {bid.status === 'accepted' ? (
                        <span className="text-green-600 flex items-center py-2 font-medium">
                          <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                          Accepted
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center py-2 font-medium">
                          <XCircle className="h-5 w-5 mr-2 text-red-600" />
                          Rejected
                        </span>
                      )}
                    </div>
                  </CardFooter>
                )}
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}