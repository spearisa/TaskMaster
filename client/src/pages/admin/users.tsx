import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Edit,
  Trash2,
  User,
  Search,
  Shield,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

interface User {
  id: number;
  username: string;
  displayName: string | null;
  bio: string | null;
  isAdmin: boolean;
  createdAt: string;
  task_count?: number;
  completed_task_count?: number;
}

interface UserDetail {
  user: User;
  tasks: any[];
  messages: any[];
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userEditData, setUserEditData] = useState({
    displayName: "",
    bio: "",
    isAdmin: false
  });
  
  const { toast } = useToast();
  
  // Fetch all users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
  });
  
  // Fetch selected user details
  const { data: userDetail, isLoading: isLoadingUserDetail } = useQuery({
    queryKey: ["/api/admin/users", selectedUser],
    enabled: selectedUser !== null,
  });
  
  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${selectedUser}`, userData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "User updated",
        description: "The user has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users", selectedUser] });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/admin/users/${selectedUser}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete user");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "User deleted",
        description: "The user has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSelectedUser(null);
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error deleting user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle edit user
  const handleEditUser = (user: User) => {
    setSelectedUser(user.id);
    setUserEditData({
      displayName: user.displayName || "",
      bio: user.bio || "",
      isAdmin: user.isAdmin
    });
    setIsEditDialogOpen(true);
  };
  
  // Handle delete user
  const handleDeleteUser = (userId: number) => {
    setSelectedUser(userId);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle view user details
  const handleViewUserDetails = (userId: number) => {
    setSelectedUser(userId);
  };
  
  // Filter users based on search
  const filteredUsers = users ? users.filter((user: User) => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];
  
  if (isLoadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col space-y-4 md:space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage Appmo platform users and their permissions
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-4">
          {/* Users List */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: User) => (
                      <TableRow 
                        key={user.id}
                        className={selectedUser === user.id ? "bg-muted" : ""}
                      >
                        <TableCell 
                          className="cursor-pointer"
                          onClick={() => handleViewUserDetails(user.id)}
                        >
                          <div className="flex gap-1 items-center">
                            <div className="font-medium">{user.username}</div>
                            {user.displayName && (
                              <div className="text-xs text-muted-foreground">({user.displayName})</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.isAdmin ? 
                            <Badge variant="default" className="bg-amber-600">Admin</Badge> : 
                            <Badge variant="outline">User</Badge>
                          }
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.task_count || 0} 
                            <span className="text-xs text-muted-foreground ml-1">
                              ({user.completed_task_count || 0} completed)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="icon" 
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              disabled={user.id === 1} // Prevent deleting main admin
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
          
          {/* User Details */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>User Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedUser ? (
                isLoadingUserDetail ? (
                  <div className="flex items-center justify-center h-[450px]">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : userDetail ? (
                  <Tabs defaultValue="profile" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="profile">Profile</TabsTrigger>
                      <TabsTrigger value="tasks">Tasks ({userDetail.tasks.length})</TabsTrigger>
                      <TabsTrigger value="messages">Messages ({userDetail.messages.length})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="profile" className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-center mb-4">
                          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-10 w-10 text-primary" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Username</p>
                            <p>{userDetail.user.username}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Display Name</p>
                            <p>{userDetail.user.displayName || "—"}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Role</p>
                            <p className="flex items-center gap-1">
                              {userDetail.user.isAdmin ? (
                                <>
                                  <Shield className="h-4 w-4 text-amber-600" />
                                  <span>Administrator</span>
                                </>
                              ) : (
                                "Regular User"
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                            <p>{format(new Date(userDetail.user.createdAt), "PPP")}</p>
                          </div>
                        </div>
                        
                        <div className="pt-2">
                          <p className="text-sm font-medium text-muted-foreground">Bio</p>
                          <p className="text-sm">{userDetail.user.bio || "No bio provided"}</p>
                        </div>
                        
                        <div className="flex justify-end gap-2 pt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => handleEditUser(userDetail.user)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </Button>
                          <Button 
                            variant="destructive"
                            disabled={userDetail.user.id === 1} // Prevent deleting main admin
                            onClick={() => handleDeleteUser(userDetail.user.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="tasks">
                      <ScrollArea className="h-[350px]">
                        {userDetail.tasks.length > 0 ? (
                          <div className="space-y-4">
                            {userDetail.tasks.map((task: any) => (
                              <div key={task.id} className="border p-3 rounded-md">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium">{task.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {task.description?.substring(0, 100) || "No description"}
                                      {task.description && task.description.length > 100 ? "..." : ""}
                                    </p>
                                  </div>
                                  <Badge 
                                    variant={task.completed ? "default" : "outline"}
                                    className={task.completed ? "bg-green-500" : ""}
                                  >
                                    {task.completed ? "Completed" : "In Progress"}
                                  </Badge>
                                </div>
                                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                                  <span>Priority: {task.priority}</span>
                                  <span>Category: {task.category}</span>
                                  {task.dueDate && (
                                    <span>Due: {format(new Date(task.dueDate), "PPP")}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-[300px] text-center">
                            <p className="text-muted-foreground">No tasks found for this user</p>
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                    
                    <TabsContent value="messages">
                      <ScrollArea className="h-[350px]">
                        {userDetail.messages.length > 0 ? (
                          <div className="space-y-4">
                            {userDetail.messages.map((message: any) => (
                              <div key={message.id} className="border p-3 rounded-md">
                                <div className="flex justify-between items-start">
                                  <p className="text-sm">
                                    {message.content?.substring(0, 120) || "No content"}
                                    {message.content && message.content.length > 120 ? "..." : ""}
                                  </p>
                                </div>
                                <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                                  {message.senderId === userDetail.user.id ? (
                                    <span>Sent to user #{message.receiverId}</span>
                                  ) : (
                                    <span>Received from user #{message.senderId}</span>
                                  )}
                                  {message.createdAt && (
                                    <span>{format(new Date(message.createdAt), "PPP")}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-[300px] text-center">
                            <p className="text-muted-foreground">No messages found for this user</p>
                          </div>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[450px] text-center">
                    <p className="text-muted-foreground">Error loading user details</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-[450px] text-center p-4">
                  <User className="h-12 w-12 text-muted-foreground mb-4" strokeWidth={1} />
                  <p className="text-muted-foreground">Select a user from the list to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the user's profile information and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input 
                id="displayName" 
                value={userEditData.displayName} 
                onChange={(e) => setUserEditData({...userEditData, displayName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input 
                id="bio" 
                value={userEditData.bio} 
                onChange={(e) => setUserEditData({...userEditData, bio: e.target.value})}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="isAdmin" 
                checked={userEditData.isAdmin} 
                onChange={(e) => setUserEditData({...userEditData, isAdmin: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isAdmin" className="text-sm font-medium text-foreground">
                Administrator privileges
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => updateUserMutation.mutate(userEditData)}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm User Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account
              and remove all associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteUserMutation.mutate()}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}