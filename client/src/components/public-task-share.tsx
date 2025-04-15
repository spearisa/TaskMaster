import React, { useState } from 'react';
import { Clipboard, Check, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TaskWithStringDates } from '@shared/schema';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PublicTaskShareProps {
  task: TaskWithStringDates;
  className?: string;
}

export function PublicTaskShare({ task, className }: PublicTaskShareProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Only allow sharing if the task is public
  if (!task.isPublic) {
    return null;
  }

  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/shared-task/${task.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setCopied(true);
        toast({
          title: 'Link copied!',
          description: 'The public task link has been copied to your clipboard.',
        });
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((error) => {
        console.error('Failed to copy link:', error);
        toast({
          title: 'Failed to copy link',
          description: 'Please try again or copy the link manually.',
          variant: 'destructive',
        });
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("flex items-center gap-1", className)}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Share className="h-4 w-4" />
          <span className="sr-only md:not-sr-only md:inline-block">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-gray-600">
            Share this task with anyone using this public link:
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-2 bg-gray-50 rounded-md text-sm truncate">
              {shareUrl}
            </div>
            <Button 
              size="sm" 
              variant="outline" 
              className={cn(
                "flex items-center gap-1 transition-colors",
                copied ? "text-green-600 border-green-200 bg-green-50" : ""
              )}
              onClick={copyToClipboard}
            >
              {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Anyone with this link can view this task, even if they don't have an account.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}