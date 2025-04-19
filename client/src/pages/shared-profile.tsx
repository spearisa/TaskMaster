import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { UserProfile } from "@shared/schema";
import { MobileLayout } from "@/components/layouts/mobile-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, Globe, Link as LinkIcon, Instagram, Twitter, 
  Facebook, Github, Linkedin as LinkedIn, ArrowLeft, Share2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define TaskStatistics interface
interface TaskStatistics {
  completedCount: number;
  pendingCount: number;
  totalCount: number;
  completionRate: number;
}

export default function SharedProfilePage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const userId = parseInt(id as string);
  
  // Share profile functionality
  const [copied, setCopied] = useState(false);
  
  const shareProfile = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error('Could not copy URL: ', err);
      }
    );
  };
  
  // Fetch user profile
  const { 
    data: profile, 
    isLoading, 
    error, 
    isError 
  } = useQuery<UserProfile>({
    queryKey: [`/api/profile/${userId}`],
    enabled: !isNaN(userId),
    retry: 1
  });
  
  // Fetch task statistics - use the profile data to display statistics instead
  // of making another API call since we're getting 400 errors
  const stats = profile ? {
    completedCount: profile.completedTaskCount || 0,
    totalCount: profile.totalTaskCount || 0,
    pendingCount: (profile.totalTaskCount || 0) - (profile.completedTaskCount || 0),
    completionRate: profile.totalTaskCount > 0 
      ? (profile.completedTaskCount / profile.totalTaskCount) * 100 
      : 0
  } : null;
  
  const statsLoading = isLoading;
  
  // Handle back navigation
  const goBack = () => {
    navigate(-1);
  };
  
  if (isNaN(userId)) {
    return (
      <MobileLayout pageTitle="User Profile">
        <Alert variant="destructive">
          <AlertTitle>Invalid Profile</AlertTitle>
          <AlertDescription>
            The profile ID is invalid. Please check the URL and try again.
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </MobileLayout>
    );
  }
  
  if (isError) {
    return (
      <MobileLayout pageTitle="User Profile">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error 
              ? error.message 
              : "This profile doesn't exist or is not public"}
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </MobileLayout>
    );
  }
  
  return (
    <MobileLayout pageTitle="User Profile">
      <div className="space-y-4">
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button variant="outline" size="sm" onClick={goBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="ghost" size="sm" onClick={shareProfile}>
            <Share2 className="mr-2 h-4 w-4" />
            {copied ? "Copied!" : "Share Profile"}
          </Button>
        </div>
        
        {/* Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </>
            ) : (
              <>
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {profile?.displayName?.charAt(0) || profile?.username?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{profile?.displayName}</CardTitle>
                  <CardDescription>
                    @{profile?.username}
                  </CardDescription>
                </div>
              </>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            ) : (
              <>
                {/* Bio */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Bio</h3>
                  <p className="text-sm">{profile?.bio || "No bio provided"}</p>
                </div>
                
                {/* Interests & Skills */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Interests</h3>
                    <div className="flex flex-wrap gap-1">
                      {profile?.interests && profile.interests.length > 0 ? 
                        profile.interests.map((interest, i) => (
                          <Badge key={i} variant="secondary">{interest}</Badge>
                        )) : 
                        <span className="text-sm text-gray-400">None specified</span>
                      }
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Skills</h3>
                    <div className="flex flex-wrap gap-1">
                      {profile?.skills && profile.skills.length > 0 ? 
                        profile.skills.map((skill, i) => (
                          <Badge key={i} variant="secondary">{skill}</Badge>
                        )) : 
                        <span className="text-sm text-gray-400">None specified</span>
                      }
                    </div>
                  </div>
                </div>
                
                {/* Location & Website */}
                <div className="space-y-2 mb-4">
                  {profile?.location && (
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-gray-500" />
                      <span className="text-sm">{profile.location}</span>
                    </div>
                  )}
                  
                  {profile?.website && (
                    <div className="flex items-center">
                      <LinkIcon className="h-4 w-4 mr-2 text-gray-500" />
                      <a 
                        href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Social Links */}
                {profile?.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Social Media</h3>
                    <div className="flex space-x-2">
                      {profile.socialLinks.twitter && (
                        <a 
                          href={`https://twitter.com/${profile.socialLinks.twitter}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-primary"
                        >
                          <Twitter className="h-5 w-5" />
                        </a>
                      )}
                      {profile.socialLinks.linkedin && (
                        <a 
                          href={`https://linkedin.com/in/${profile.socialLinks.linkedin}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-primary"
                        >
                          <LinkedIn className="h-5 w-5" />
                        </a>
                      )}
                      {profile.socialLinks.github && (
                        <a 
                          href={`https://github.com/${profile.socialLinks.github}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-primary"
                        >
                          <Github className="h-5 w-5" />
                        </a>
                      )}
                      {profile.socialLinks.instagram && (
                        <a 
                          href={`https://instagram.com/${profile.socialLinks.instagram}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-primary"
                        >
                          <Instagram className="h-5 w-5" />
                        </a>
                      )}
                      {profile.socialLinks.facebook && (
                        <a 
                          href={`https://facebook.com/${profile.socialLinks.facebook}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-gray-500 hover:text-primary"
                        >
                          <Facebook className="h-5 w-5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Stats */}
                <Separator className="my-4" />
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xl font-bold">
                      {statsLoading 
                        ? <Skeleton className="h-6 w-8 mx-auto" />
                        : stats?.completedCount || profile?.completedTaskCount || 0}
                    </p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      {statsLoading 
                        ? <Skeleton className="h-6 w-8 mx-auto" />
                        : stats?.totalCount || profile?.totalTaskCount || 0}
                    </p>
                    <p className="text-xs text-gray-500">Total Tasks</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold">
                      {statsLoading 
                        ? <Skeleton className="h-6 w-8 mx-auto" />
                        : stats?.completionRate 
                          ? `${Math.round(stats.completionRate)}%` 
                          : (profile && profile.totalTaskCount > 0 
                            ? `${Math.round((profile.completedTaskCount / profile.totalTaskCount) * 100)}%`
                            : '0%')}
                    </p>
                    <p className="text-xs text-gray-500">Completion</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  );
}