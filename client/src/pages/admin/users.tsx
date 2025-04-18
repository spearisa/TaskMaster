import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger 
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Trash2, ArrowLeft, Search, UserCog, ShieldCheck, Shield, MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// User details component for the side panel
function UserDetails({ userId, onClose }: { userId: number; onClose: () => void }) {
  const { data: userData, isLoading, error } = useQuery({
    queryKey: [`/api/admin/users/${userId}`],
    enabled: !!userId
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    bio: "",
    isAdmin: false
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${userId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User updated",
        description: "User information has been updated successfully.",
      });
      setIsEditMode(false);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: "Failed to update user. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Enter edit mode
  const handleEdit = () => {
    if (userData?.user) {
      setEditForm({
        displayName: userData.user.displayName || "",
        bio: userData.user.bio || "",
        isAdmin: !!userData.user.isAdmin
      });
      setIsEditMode(true);
    }
  };

  // Save changes
  const handleSave = () => {
    updateUserMutation.mutate(editForm);
  };

  // If loading show skeleton
  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // Show error if there is one
  if (error || !userData) {
    return (
      <div className="p-6">
        <div className="rounded-md bg-red-50 p-4">
          <h3 className="text-sm font-medium text-red-800">Error loading user</h3>
          <div className="mt-2 text-sm text-red-700">
            <p>Failed to load user details. Please try again.</p>
          </div>
        </div>
        <Button onClick={onClose} className="mt-4 w-full">Close</Button>
      </div>
    );
  }

  const { user, tasks, messages } = userData;
  
  return (
    <div className="space-y-8 p-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.avatarUrl || ""} alt={user.displayName || user.username} />
            <AvatarFallback>{(user.displayName || user.username || "User").substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{user.displayName || user.username}</h3>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
            <div className="flex gap-2 mt-1">
              {user.isAdmin && <Badge variant="outline" className="bg-blue-50">Admin</Badge>}
              <Badge variant="outline">{tasks.length} Tasks</Badge>
              <Badge variant="outline">{messages.length} Messages</Badge>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {isEditMode ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input 
              id="displayName" 
              value={editForm.displayName} 
              onChange={(e) => setEditForm({...editForm, displayName: e.target.value})} 
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Input 
              id="bio" 
              value={editForm.bio} 
              onChange={(e) => setEditForm({...editForm, bio: e.target.value})} 
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="isAdmin" 
              checked={editForm.isAdmin} 
              onCheckedChange={(checked) => setEditForm({...editForm, isAdmin: checked})} 
            />
            <Label htmlFor="isAdmin">Admin Privileges</Label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsEditMode(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={updateUserMutation.isPending}>
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <h4 className="text-sm font-medium mb-2">Bio</h4>
            <p className="text-sm text-muted-foreground">{user.bio || "No bio provided"}</p>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Account Information</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Member since</div>
              <div>{new Date(user.createdAt).toLocaleDateString()}</div>
              <div className="text-muted-foreground">Admin status</div>
              <div>{user.isAdmin ? "Administrator" : "Regular user"}</div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Interests</h4>
            <div className="flex flex-wrap gap-1">
              {user.interests && user.interests.length > 0 ? 
                user.interests.map((interest: string, i: number) => (
                  <Badge key={i} variant="secondary">{interest}</Badge>
                )) : 
                <p className="text-sm text-muted-foreground">No interests listed</p>
              }
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Skills</h4>
            <div className="flex flex-wrap gap-1">
              {user.skills && user.skills.length > 0 ? 
                user.skills.map((skill: string, i: number) => (
                  <Badge key={i} variant="outline">{skill}</Badge>
                )) : 
                <p className="text-sm text-muted-foreground">No skills listed</p>
              }
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit} className="flex-1">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userToDelete, setUserToDelete] = useState<{id: number, username: string} | null>(null);
  
  // Fetch users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['/api/admin/users'],
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User deleted",
        description: "User has been deleted successfully.",
      });
      setUserToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Filter users based on search query
  const filteredUsers = users?.filter((user: any) => {
    const searchTerms = searchQuery.toLowerCase().split(' ');
    const userData = `${user.username} ${user.displayName || ''} ${user.bio || ''}`.toLowerCase();
    
    return searchTerms.every(term => userData.includes(term));
  }) || [];
  
  // Handle delete confirmation
  const confirmDelete = (user: {id: number, username: string}) => {
    setUserToDelete(user);
  };
  
  // Execute delete
  const handleDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };
  
  // View user details
  const viewUserDetails = (userId: number) => {
    setSelectedUserId(userId);
  };
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage all users of the Appmo platform</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-md bg-red-50 p-4">
              <h3 className="text-sm font-medium text-red-800">Error loading users</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>Failed to load user data. Please try refreshing the page.</p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No users match your search" : "No users found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatarUrl || ""} alt={user.displayName || user.username} />
                              <AvatarFallback>{(user.displayName || user.username || "User").substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.displayName || user.username}</div>
                              <div className="text-xs text-muted-foreground">@{user.username}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.isAdmin ? (
                            <Badge variant="secondary" className="flex items-center gap-1 bg-blue-50">
                              <ShieldCheck className="h-3 w-3" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="outline">User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Badge variant="outline">{user.taskCount} Total</Badge>
                            <Badge variant="outline" className="text-green-600">{user.completedTaskCount} Done</Badge>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => viewUserDetails(user.id)}>
                              <UserCog className="h-4 w-4" />
                              <span className="sr-only">View Details</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => confirmDelete(user)}
                              disabled={user.isAdmin && user.id === 1} // Prevent deleting the main admin
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
          </div>
        </CardFooter>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user "{userToDelete?.username}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUserToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUserMutation.isPending}>
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* User Details Sheet */}
      <Sheet open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>View and manage user information</SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-120px)] pr-4">
            {selectedUserId && <UserDetails userId={selectedUserId} onClose={() => setSelectedUserId(null)} />}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}