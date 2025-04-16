import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { 
  Card, CardContent, CardDescription, 
  CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Check, X, DollarSign, Clock, Calendar, 
  ExternalLink, Loader2, Award, AlertTriangle 
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { MobileLayout } from "@/components/layouts/mobile-layout";

// Types for bids
interface Bid {
  id: number;
  taskId: number;
  bidderId: number;
  amount: number;
  proposal: string;
  estimatedTime?: number | null;
  createdAt: string;
  updatedAt: string;
  status?: string;
  user?: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  task?: {
    id: number;
    title: string;
    description: string;
    dueDate: string | null;
    isPublic: boolean;
    userId: number;
    user?: {
      id: number;
      username: string;
      displayName: string;
      avatarUrl: string | null;
    };
  };
}

export default function MyBidsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"received" | "placed">("received");
  
  // Get bids received (on user's tasks)
  const { 
    data: receivedBids,
    isLoading: isLoadingReceived,
    error: receivedError
  } = useQuery<Bid[]>({
    queryKey: ['/api/bids/received'],
    enabled: !!user,
  });
  
  // Get bids placed by the user
  const { 
    data: placedBids,
    isLoading: isLoadingPlaced,
    error: placedError
  } = useQuery<Bid[]>({
    queryKey: ['/api/bids/placed'],
    enabled: !!user,
  });
  
  // Accept a bid
  const acceptBidMutation = useMutation({
    mutationFn: async ({ taskId, bidId }: { taskId: number, bidId: number }) => {
      const res = await apiRequest("POST", `/api/tasks/${taskId}/bids/${bidId}/accept`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid Accepted",
        description: "You've successfully accepted this bid.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/bids/received'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Accept Bid",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  });
  
  // Reject a bid
  const rejectBidMutation = useMutation({
    mutationFn: async ({ bidId }: { bidId: number }) => {
      const res = await apiRequest("POST", `/api/bids/${bidId}/reject`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bid Rejected",
        description: "You've declined this bid.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/bids/received'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Reject Bid",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  });
  
  // Helper to get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Handler for accepting a bid
  const handleAcceptBid = (taskId: number, bidId: number) => {
    acceptBidMutation.mutate({ taskId, bidId });
  };
  
  // Handler for rejecting a bid
  const handleRejectBid = (bidId: number) => {
    rejectBidMutation.mutate({ bidId });
  };
  
  // Display an error message for any API errors
  const ErrorMessage = ({ error }: { error: any }) => (
    <div className="p-4 text-center space-y-2">
      <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
      <p className="text-muted-foreground">
        {error?.message || "Failed to load bids. Please try again."}
      </p>
      <Button 
        variant="outline" 
        onClick={() => {
          queryClient.invalidateQueries({ queryKey: ['/api/bids/received'] });
          queryClient.invalidateQueries({ queryKey: ['/api/bids/placed'] });
        }}
      >
        Retry
      </Button>
    </div>
  );
  
  return (
    <MobileLayout showBackButton backButtonPath="/" pageTitle="My Bids">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <Tabs 
          value={activeTab} 
          onValueChange={(v) => setActiveTab(v as "received" | "placed")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="received" className="text-sm">
              Bids Received
              {receivedBids && receivedBids.length > 0 && (
                <Badge className="ml-2 bg-primary">{receivedBids.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="placed" className="text-sm">
              Bids Placed
              {placedBids && placedBids.length > 0 && (
                <Badge className="ml-2 bg-primary">{placedBids.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Bids Received Tab */}
          <TabsContent value="received" className="space-y-6">
            {isLoadingReceived ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : receivedError ? (
              <ErrorMessage error={receivedError} />
            ) : !receivedBids || receivedBids.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-center">
                    You haven't received any bids on your tasks yet.
                  </p>
                  <p className="text-sm text-muted-foreground/70 text-center mt-2">
                    To receive bids, create a public task and enable bidding in the task settings.
                  </p>
                  <Button variant="outline" className="mt-6" asChild>
                    <Link href="/">Go to My Tasks</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {receivedBids.map(bid => (
                  <Card key={bid.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base flex items-center">
                            <Link href={`/tasks/${bid.taskId}`} className="hover:underline flex items-center">
                              {bid.task?.title}
                              <ExternalLink className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
                            </Link>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Bid received {format(new Date(bid.createdAt), "PPP")}
                          </CardDescription>
                        </div>
                        <Badge className="bg-amber-500">
                          ${bid.amount.toFixed(2)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-9 w-9">
                          {bid.user?.avatarUrl ? (
                            <AvatarImage src={bid.user.avatarUrl} alt={bid.user?.displayName} />
                          ) : (
                            <AvatarFallback>
                              {getInitials(bid.user?.displayName || bid.user?.username || "User")}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium">
                            {bid.user?.displayName || bid.user?.username || "Unknown User"}
                          </div>
                          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {bid.proposal}
                          </div>
                          
                          {bid.estimatedTime && (
                            <div className="mt-3 flex items-center">
                              <Clock className="h-4 w-4 text-muted-foreground mr-1.5" />
                              <span className="text-sm text-muted-foreground">
                                Estimated time: {bid.estimatedTime} hour{bid.estimatedTime !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                    
                    <Separator />
                    
                    <CardFooter className="flex justify-between py-3">
                      {bid.status === 'accepted' ? (
                        <div className="w-full flex justify-center">
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800 flex items-center py-1.5 px-3">
                            <Award className="h-4 w-4 mr-1.5" />
                            Bid Accepted
                          </Badge>
                        </div>
                      ) : bid.status === 'rejected' ? (
                        <div className="w-full flex justify-center">
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800 flex items-center py-1.5 px-3">
                            <X className="h-4 w-4 mr-1.5" />
                            Bid Rejected
                          </Badge>
                        </div>
                      ) : (
                        <>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectBid(bid.id)}
                            disabled={rejectBidMutation.isPending}
                          >
                            <X className="h-4 w-4 mr-1.5" />
                            Decline
                          </Button>
                          <Button 
                            variant="default"
                            size="sm"
                            onClick={() => handleAcceptBid(bid.taskId, bid.id)}
                            disabled={acceptBidMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-1.5" />
                            Accept Bid
                          </Button>
                        </>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Bids Placed Tab */}
          <TabsContent value="placed" className="space-y-6">
            {isLoadingPlaced ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : placedError ? (
              <ErrorMessage error={placedError} />
            ) : !placedBids || placedBids.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-center">
                    You haven't placed any bids on tasks yet.
                  </p>
                  <p className="text-sm text-muted-foreground/70 text-center mt-2">
                    Browse public tasks to find opportunities for bidding.
                  </p>
                  <Button variant="outline" className="mt-6" asChild>
                    <Link href="/public-tasks">View Public Tasks</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {placedBids.map(bid => (
                  <Card key={bid.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base flex items-center">
                            <Link href={`/tasks/${bid.taskId}`} className="hover:underline flex items-center">
                              {bid.task?.title}
                              <ExternalLink className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
                            </Link>
                          </CardTitle>
                          <CardDescription className="mt-1 flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5" />
                            Bid placed {format(new Date(bid.createdAt), "PPP")}
                          </CardDescription>
                        </div>
                        <Badge className="bg-amber-500">
                          ${bid.amount.toFixed(2)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-4">
                      <div className="text-sm">
                        <div className="font-medium mb-1.5">Your proposal:</div>
                        <p className="text-muted-foreground">
                          {bid.proposal}
                        </p>
                        
                        {bid.estimatedTime && (
                          <div className="mt-3 flex items-center">
                            <Clock className="h-4 w-4 text-muted-foreground mr-1.5" />
                            <span className="text-sm text-muted-foreground">
                              Estimated time: {bid.estimatedTime} hour{bid.estimatedTime !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        
                        {bid.task?.user && (
                          <div className="mt-3 pt-3 border-t border-border flex items-center">
                            <div className="text-sm text-muted-foreground mr-2">Task owner:</div>
                            <div className="flex items-center">
                              <Avatar className="h-5 w-5 mr-1.5">
                                {bid.task.user.avatarUrl ? (
                                  <AvatarImage src={bid.task.user.avatarUrl} alt={bid.task.user.displayName} />
                                ) : (
                                  <AvatarFallback className="text-xs">
                                    {getInitials(bid.task.user.displayName || bid.task.user.username || "User")}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <span className="text-sm font-medium">
                                {bid.task.user.displayName || bid.task.user.username}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    
                    <CardFooter className="bg-muted/30 flex justify-center py-3">
                      {bid.status === 'accepted' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800 flex items-center py-1.5 px-3">
                          <Award className="h-4 w-4 mr-1.5" />
                          Your Bid Was Accepted!
                        </Badge>
                      ) : bid.status === 'rejected' ? (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800 flex items-center py-1.5 px-3">
                          <X className="h-4 w-4 mr-1.5" />
                          Bid Declined
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800 flex items-center py-1.5 px-3">
                          <Clock className="h-4 w-4 mr-1.5" />
                          Awaiting Response
                        </Badge>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}