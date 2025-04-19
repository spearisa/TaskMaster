import { useState } from "react";
import { Share2, Copy, Check, Link2 } from "lucide-react";
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

interface ProfileShareProps {
  userId: number;
  username: string;
}

export function ProfileShare({ userId, username }: ProfileShareProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Generate profile link
  const getProfileUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/profile/${userId}`;
  };
  
  // Copy to clipboard function
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getProfileUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
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
          <DialogTitle>Share Profile</DialogTitle>
          <DialogDescription>
            Share your profile with others so they can see your interests, skills, and accomplishments.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <Badge variant={copied ? "success" : "secondary"}>
              {copied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
              <span className="ml-1">{copied ? "Copied!" : "Profile Link"}</span>
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Input 
              readOnly 
              className="flex-1" 
              value={getProfileUrl()} 
            />
            <Button size="sm" onClick={copyToClipboard}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Anyone with this link can view your public profile information.
            {!copied ? " Click the button to copy the link." : " Link copied to clipboard!"}
          </p>
        </div>
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}