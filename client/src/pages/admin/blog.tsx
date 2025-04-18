import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger 
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft, Search, Edit2, Trash2, Plus, FileText, CheckCircle, XCircle, BookOpen,
  Eye, Layout, Tag, Calendar, User, Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Blog post form component for create/edit
function BlogPostForm({ 
  post = null, 
  onSubmit, 
  onCancel,
  isSubmitting
}: { 
  post?: any; 
  onSubmit: (data: any) => void; 
  onCancel: () => void; 
  isSubmitting: boolean;
}) {
  const { data: categories } = useQuery({
    queryKey: ['/api/admin/blog/categories'],
  });
  
  const [formData, setFormData] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    content: post?.content || "",
    excerpt: post?.excerpt || "",
    featuredImage: post?.featuredImage || "",
    status: post?.status || "draft",
    tags: post?.tags?.join(", ") || "",
    categories: post?.categories || []
  });
  
  const handleChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const processedData = {
      ...formData,
      tags: formData.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
    };
    
    onSubmit(processedData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title" 
            value={formData.title} 
            onChange={(e) => handleChange("title", e.target.value)}
            required
          />
        </div>
        
        <div>
          <Label htmlFor="slug">Slug</Label>
          <Input 
            id="slug" 
            value={formData.slug} 
            onChange={(e) => handleChange("slug", e.target.value)}
            required
            placeholder="url-friendly-title"
          />
        </div>
        
        <div>
          <Label htmlFor="content">Content</Label>
          <Textarea 
            id="content" 
            value={formData.content}
            onChange={(e) => handleChange("content", e.target.value)}
            required
            className="min-h-[200px]"
          />
        </div>
        
        <div>
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea 
            id="excerpt" 
            value={formData.excerpt}
            onChange={(e) => handleChange("excerpt", e.target.value)}
            className="h-20"
            placeholder="Brief summary of the post (optional)"
          />
        </div>
        
        <div>
          <Label htmlFor="featuredImage">Featured Image URL</Label>
          <Input 
            id="featuredImage" 
            value={formData.featuredImage}
            onChange={(e) => handleChange("featuredImage", e.target.value)}
            placeholder="https://example.com/image.jpg (optional)"
          />
        </div>
        
        <div>
          <Label htmlFor="tags">Tags</Label>
          <Input 
            id="tags" 
            value={formData.tags}
            onChange={(e) => handleChange("tags", e.target.value)}
            placeholder="tag1, tag2, tag3 (comma separated)"
          />
        </div>
        
        <div>
          <Label htmlFor="categories">Categories</Label>
          <Select 
            value={formData.categories.length > 0 ? String(formData.categories[0]) : undefined} 
            onValueChange={(value) => handleChange("categories", [value])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((category: any) => (
                <SelectItem key={category.id} value={String(category.id)}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="status">Status</Label>
          <Select 
            value={formData.status} 
            onValueChange={(value) => handleChange("status", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : (post ? "Update Post" : "Create Post")}
        </Button>
      </div>
    </form>
  );
}

// Category management component
function CategoryManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<any>(null);
  const [newCategory, setNewCategory] = useState({
    name: "",
    slug: "",
    description: ""
  });
  
  const { data: categories, isLoading } = useQuery({
    queryKey: ['/api/admin/blog/categories'],
  });
  
  const createCategoryMutation = useMutation({
    mutationFn: async (data: typeof newCategory) => {
      const res = await apiRequest("POST", "/api/admin/blog/categories", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/categories'] });
      toast({
        title: "Category created",
        description: "New category has been created successfully."
      });
      setNewCategory({
        name: "",
        slug: "",
        description: ""
      });
      setIsAddingCategory(false);
    },
    onError: () => {
      toast({
        title: "Failed to create category",
        description: "There was an error creating the category.",
        variant: "destructive"
      });
    }
  });
  
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/blog/categories/${categoryId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/categories'] });
      toast({
        title: "Category deleted",
        description: "Category has been deleted successfully."
      });
      setCategoryToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete category",
        description: error.message || "There was an error deleting the category.",
        variant: "destructive"
      });
    }
  });
  
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    createCategoryMutation.mutate(newCategory);
  };
  
  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Categories</h2>
        <Button onClick={() => setIsAddingCategory(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : categories?.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No categories yet. Create your first category to organize your blog posts.
        </div>
      ) : (
        <div className="space-y-4">
          {categories?.map((category: any) => (
            <Card key={category.id}>
              <CardHeader className="py-4 px-6">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    <CardDescription>/{category.slug}</CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setCategoryToDelete(category)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              {category.description && (
                <CardContent className="py-0 px-6">
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
      
      {/* Add Category Dialog */}
      <Dialog open={isAddingCategory} onOpenChange={setIsAddingCategory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize your blog posts.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Name</Label>
              <Input 
                id="categoryName" 
                value={newCategory.name} 
                onChange={(e) => {
                  const name = e.target.value;
                  setNewCategory({
                    ...newCategory,
                    name,
                    slug: generateSlug(name)
                  });
                }}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="categorySlug">Slug</Label>
              <Input 
                id="categorySlug" 
                value={newCategory.slug} 
                onChange={(e) => setNewCategory({...newCategory, slug: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="categoryDescription">Description (optional)</Label>
              <Textarea 
                id="categoryDescription" 
                value={newCategory.description} 
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddingCategory(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCategoryMutation.isPending}>
                {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Category Confirmation */}
      <Dialog open={!!categoryToDelete} onOpenChange={(open) => !open && setCategoryToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category "{categoryToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryToDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteCategoryMutation.mutate(categoryToDelete.id)}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? "Deleting..." : "Delete Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Comment management component
function CommentManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commentToDelete, setCommentToDelete] = useState<any>(null);
  
  const { data: comments, isLoading } = useQuery({
    queryKey: ['/api/admin/blog/comments'],
  });
  
  const approveCommentMutation = useMutation({
    mutationFn: async ({ commentId, approved }: { commentId: number, approved: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/blog/comments/${commentId}`, { approved });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/comments'] });
      toast({
        title: "Comment updated",
        description: "Comment status has been updated."
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update comment status.",
        variant: "destructive"
      });
    }
  });
  
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/blog/comments/${commentId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/comments'] });
      toast({
        title: "Comment deleted",
        description: "Comment has been deleted successfully."
      });
      setCommentToDelete(null);
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete comment.",
        variant: "destructive"
      });
    }
  });
  
  const toggleApproveComment = (comment: any) => {
    approveCommentMutation.mutate({
      commentId: comment.id,
      approved: !comment.approved
    });
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Comments</h2>
      
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : comments?.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No comments yet.
        </div>
      ) : (
        <div className="space-y-4">
          {comments?.map((comment: any) => (
            <Card key={comment.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      {comment.user ? (
                        <>
                          <AvatarImage src={comment.user.avatarUrl || ""} alt={comment.user.displayName || comment.user.username} />
                          <AvatarFallback>{(comment.user.displayName || comment.user.username || "User").substring(0, 2).toUpperCase()}</AvatarFallback>
                        </>
                      ) : (
                        <>
                          <AvatarImage src="" alt={comment.authorName || "Guest"} />
                          <AvatarFallback>{(comment.authorName || "Guest").substring(0, 2).toUpperCase()}</AvatarFallback>
                        </>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {comment.user ? (comment.user.displayName || comment.user.username) : (comment.authorName || "Guest")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        on {new Date(comment.createdAt).toLocaleDateString()} at {new Date(comment.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={comment.approved ? "default" : "outline"}>
                      {comment.approved ? "Approved" : "Pending"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{comment.content}</p>
                {comment.post && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    On post: <span className="font-medium">{comment.post.title}</span>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-0">
                <Button 
                  variant={comment.approved ? "outline" : "default"} 
                  size="sm"
                  onClick={() => toggleApproveComment(comment)}
                  disabled={approveCommentMutation.isPending}
                >
                  {comment.approved ? (
                    <XCircle className="mr-1 h-4 w-4" />
                  ) : (
                    <CheckCircle className="mr-1 h-4 w-4" />
                  )}
                  {comment.approved ? "Unapprove" : "Approve"}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCommentToDelete(comment)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      {/* Delete Comment Confirmation */}
      <Dialog open={!!commentToDelete} onOpenChange={(open) => !open && setCommentToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommentToDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteCommentMutation.mutate(commentToDelete.id)}
              disabled={deleteCommentMutation.isPending}
            >
              {deleteCommentMutation.isPending ? "Deleting..." : "Delete Comment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminBlogPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [postToDelete, setPostToDelete] = useState<any>(null);
  const [isAddingPost, setIsAddingPost] = useState(false);
  const [isEditingPost, setIsEditingPost] = useState<any>(null);
  
  // Fetch blog posts
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['/api/admin/blog/posts'],
  });
  
  // Create blog post mutation
  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/admin/blog/posts", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/posts'] });
      toast({
        title: "Post created",
        description: "Blog post has been created successfully."
      });
      setIsAddingPost(false);
    },
    onError: () => {
      toast({
        title: "Creation failed",
        description: "Failed to create blog post.",
        variant: "destructive"
      });
    }
  });
  
  // Update blog post mutation
  const updatePostMutation = useMutation({
    mutationFn: async ({ postId, data }: { postId: number, data: any }) => {
      const res = await apiRequest("PUT", `/api/admin/blog/posts/${postId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/posts'] });
      toast({
        title: "Post updated",
        description: "Blog post has been updated successfully."
      });
      setIsEditingPost(null);
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update blog post.",
        variant: "destructive"
      });
    }
  });
  
  // Delete blog post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const res = await apiRequest("DELETE", `/api/admin/blog/posts/${postId}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/blog/posts'] });
      toast({
        title: "Post deleted",
        description: "Blog post has been deleted successfully."
      });
      setPostToDelete(null);
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete blog post.",
        variant: "destructive"
      });
    }
  });
  
  // Filter blog posts based on search query
  const filteredPosts = posts?.filter((post: any) => {
    const searchTerms = searchQuery.toLowerCase().split(' ');
    const postData = `${post.title} ${post.excerpt || ''} ${post.content || ''}`.toLowerCase();
    
    return searchTerms.every(term => postData.includes(term));
  }) || [];
  
  // Handle form submission for creating a blog post
  const handleCreatePost = (data: any) => {
    createPostMutation.mutate(data);
  };
  
  // Handle form submission for updating a blog post
  const handleUpdatePost = (data: any) => {
    if (isEditingPost) {
      updatePostMutation.mutate({
        postId: isEditingPost.id,
        data
      });
    }
  };
  
  // Delete a blog post
  const handleDeletePost = () => {
    if (postToDelete) {
      deletePostMutation.mutate(postToDelete.id);
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Blog Management</h1>
          <p className="text-sm text-muted-foreground">Manage blog posts, categories, and comments</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      <Tabs defaultValue="posts">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Blog Posts</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search posts..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button onClick={() => setIsAddingPost(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Post
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 py-2">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-56" />
                        <Skeleton className="h-4 w-72" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-md bg-red-50 p-4">
                  <h3 className="text-sm font-medium text-red-800">Error loading blog posts</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>Failed to load blog posts. Please try refreshing the page.</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Post</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPosts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            {searchQuery ? "No posts match your search" : "No blog posts found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPosts.map((post: any) => (
                          <TableRow key={post.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center">
                                  {post.featuredImage ? (
                                    <img 
                                      src={post.featuredImage} 
                                      alt={post.title}
                                      className="h-full w-full object-cover rounded"
                                    />
                                  ) : (
                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{post.title}</div>
                                  <div className="text-xs text-muted-foreground">/{post.slug}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={post.status === "published" ? "default" : "outline"}>
                                {post.status === "published" ? "Published" : "Draft"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={post.author?.avatarUrl || ""} alt={post.author?.displayName || post.author?.username || "Unknown"} />
                                  <AvatarFallback>{(post.author?.displayName || post.author?.username || "U").substring(0, 1).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{post.author?.displayName || post.author?.username || "Unknown"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {post.publishedAt ? 
                                new Date(post.publishedAt).toLocaleDateString() : 
                                new Date(post.createdAt).toLocaleDateString()
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsEditingPost(post)}>
                                  <Edit2 className="h-4 w-4" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setPostToDelete(post)}>
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
                {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} found
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="categories">
          <CategoryManagement />
        </TabsContent>
        
        <TabsContent value="comments">
          <CommentManagement />
        </TabsContent>
      </Tabs>
      
      {/* Create Post Dialog */}
      <Dialog open={isAddingPost} onOpenChange={(open) => !open && setIsAddingPost(false)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Blog Post</DialogTitle>
            <DialogDescription>
              Fill out the form below to create a new blog post.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            <div className="p-4">
              <BlogPostForm 
                onSubmit={handleCreatePost} 
                onCancel={() => setIsAddingPost(false)}
                isSubmitting={createPostMutation.isPending}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Edit Post Dialog */}
      <Dialog open={!!isEditingPost} onOpenChange={(open) => !open && setIsEditingPost(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
            <DialogDescription>
              Edit the blog post details below.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            <div className="p-4">
              {isEditingPost && (
                <BlogPostForm 
                  post={isEditingPost}
                  onSubmit={handleUpdatePost} 
                  onCancel={() => setIsEditingPost(null)}
                  isSubmitting={updatePostMutation.isPending}
                />
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Delete Post Confirmation */}
      <Dialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Blog Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the blog post "{postToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostToDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePost}
              disabled={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? "Deleting..." : "Delete Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}