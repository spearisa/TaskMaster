import { useState } from "react";
import { Share2, Copy, Check, Link2, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileShareProps {
  userId: number;
  username: string;
  displayName?: string;
}

interface ShareLinkResponse {
  profileId: number;
  displayName: string;
  username: string;
  isPublic: boolean;
  directLink: string;
  friendlyLink: string;
  shareMessage: string;
}

export function ProfileShare({ userId, username, displayName }: ProfileShareProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("direct");
  
  // Fetch profile link data from the API
  const { data: shareData, isLoading, error } = useQuery<ShareLinkResponse>({
    queryKey: ["/api/profile/share"],
    queryFn: () => fetch("/api/profile/share").then(res => {
      if (!res.ok) {
        throw new Error("Failed to generate share link");
      }
      return res.json();
    }),
    enabled: open, // Only fetch when dialog is open
  });
  
  // Generate profile link (fallback if API fails)
  const getProfileUrl = () => {
    if (shareData) {
      return `${window.location.origin}${activeTab === "direct" ? shareData.directLink : shareData.friendlyLink}`;
    }
    
    const baseUrl = window.location.origin;
    return `${baseUrl}/profile/${userId}`;
  };
  
  // Generate sharable message
  const getShareMessage = () => {
    if (shareData?.shareMessage) {
      return shareData.shareMessage;
    }
    return `Check out ${displayName || username}'s profile on Appmo!`;
  };
  
  // Copy to clipboard function
  const copyToClipboard = async (text?: string) => {
    try {
      const textToCopy = text || getProfileUrl();
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Profile link copied to clipboard",
        variant: "success",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };
  
  // Open in new window
  const openInNewWindow = () => {
    window.open(getProfileUrl(), '_blank');
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share Profile</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Profile</DialogTitle>
          <DialogDescription>
            Share your profile with others so they can see your interests, skills, and accomplishments.
          </DialogDescription>
        </DialogHeader>
        
        {error ? (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="p-4 text-sm text-center">
              <p>There was an error generating your share link.</p>
              <p>Make sure your profile is set to public in your profile settings.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col space-y-4">
            {/* Link Type Tabs */}
            <Tabs defaultValue="direct" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="direct">Direct Link</TabsTrigger>
                <TabsTrigger value="friendly">Friendly Link</TabsTrigger>
              </TabsList>
              <TabsContent value="direct" className="mt-2">
                <div className="text-xs text-muted-foreground mb-2">
                  Simple link for easy sharing
                </div>
              </TabsContent>
              <TabsContent value="friendly" className="mt-2">
                <div className="text-xs text-muted-foreground mb-2">
                  Link with your username included
                </div>
              </TabsContent>
            </Tabs>
            
            {/* Link Display */}
            <div className="flex items-center space-x-2">
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input 
                  readOnly 
                  className="flex-1" 
                  value={getProfileUrl()} 
                />
              )}
              <Button size="sm" onClick={() => copyToClipboard()} disabled={isLoading}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Preformatted Message */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Share Message</h4>
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="relative bg-muted p-3 rounded-md text-sm text-muted-foreground">
                  <p>{getShareMessage()}</p>
                  <p className="mt-1 text-xs">
                    <Link2 className="inline h-3 w-3 mr-1" />{getProfileUrl()}
                  </p>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute top-1 right-1 h-6 w-6 p-0" 
                    onClick={() => copyToClipboard(getShareMessage() + "\n" + getProfileUrl())}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground">
              Anyone with this link can view your public profile information.
            </p>
          </div>
        )}
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openInNewWindow}
            disabled={isLoading || !!error}
            className="flex-1"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => copyToClipboard(getProfileUrl())}
            disabled={isLoading || !!error}
            className="flex-1"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}