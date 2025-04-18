import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Trash2,
  Search,
  Plus,
  AlertTriangle,
  Check,
  X,
  Tag,
  FileText,
  Folder,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";

interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  status: 'draft' | 'published';
  tags: string[];
  categoryId: number | null;
  authorId: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  author: {
    username: string;
    displayName: string | null;
  };
  category: BlogCategory | null;
}

interface BlogComment {
  id: number;
  content: string;
  postId: number;
  userId: number;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    username: string;
    displayName: string | null;
  };
  post: {
    title: string;
    slug: string;
  };
}

export default function AdminBlogPage() {
  const [activeTab, setActiveTab] = useState("posts");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [selectedComment, setSelectedComment] = useState<number | null>(null);
  const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false);
  const [isAddPostDialogOpen, setIsAddPostDialogOpen] = useState(false);
  const [isEditPostDialogOpen, setIsEditPostDialogOpen] = useState(false);
  const [isDeletePostDialogOpen, setIsDeletePostDialogOpen] = useState(false);
  const [isDeleteCommentDialogOpen, setIsDeleteCommentDialogOpen] = useState(false);
  
  // Form states
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    slug: "",
    description: ""
  });
  
  const [postFormData, setPostFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    status: "draft",
    tags: [],
    categories: [] as string[]
  });
  
  const [newTag, setNewTag] = useState("");
  
  const { toast } = useToast();
  
  // ===== QUERIES =====
  
  // Get all categories
  const {
    data: categories,
    isLoading: isLoadingCategories
  } = useQuery({
    queryKey: ["/api/admin/blog/categories"],
    enabled: activeTab === "categories" || isAddPostDialogOpen || isEditPostDialogOpen
  });
  
  // Get all posts
  const {
    data: posts,
    isLoading: isLoadingPosts
  } = useQuery({
    queryKey: ["/api/admin/blog/posts"],
    enabled: activeTab === "posts"
  });
  
  // Get post details
  const {
    data: postDetail,
    isLoading: isLoadingPostDetail
  } = useQuery({
    queryKey: ["/api/admin/blog/posts", selectedPost],
    enabled: selectedPost !== null && isEditPostDialogOpen
  });
  
  // Get all comments
  const {
    data: comments,
    isLoading: isLoadingComments
  } = useQuery({
    queryKey: ["/api/admin/blog/comments"],
    enabled: activeTab === "comments"
  });
  
  // ===== MUTATIONS =====
  
  // Create category
  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/blog/categories", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create category");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Category created",
        description: "The category has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/categories"] });
      setIsAddCategoryDialogOpen(false);
      setCategoryFormData({ name: "", slug: "", description: "" });
    },
    onError: (error) => {
      toast({
        title: "Error creating category",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete category
  const deleteCategoryMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/admin/blog/categories/${selectedCategory}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete category");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Category deleted",
        description: "The category has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/categories"] });
      setIsDeleteCategoryDialogOpen(false);
      setSelectedCategory(null);
    },
    onError: (error) => {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Create post
  const createPostMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/admin/blog/posts", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create post");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post created",
        description: "The blog post has been created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      setIsAddPostDialogOpen(false);
      setPostFormData({
        title: "",
        slug: "",
        content: "",
        excerpt: "",
        featuredImage: "",
        status: "draft",
        tags: [],
        categories: []
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating post",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update post
  const updatePostMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/admin/blog/posts/${selectedPost}`, data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update post");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post updated",
        description: "The blog post has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      setIsEditPostDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error updating post",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete post
  const deletePostMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/admin/blog/posts/${selectedPost}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete post");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Post deleted",
        description: "The blog post has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/posts"] });
      setIsDeletePostDialogOpen(false);
      setSelectedPost(null);
    },
    onError: (error) => {
      toast({
        title: "Error deleting post",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update comment approval status
  const updateCommentApprovalMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: number, approved: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/blog/comments/${id}`, { approved });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update comment");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Comment updated",
        description: "The comment status has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/comments"] });
    },
    onError: (error) => {
      toast({
        title: "Error updating comment",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete comment
  const deleteCommentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/admin/blog/comments/${selectedComment}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete comment");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Comment deleted",
        description: "The comment has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog/comments"] });
      setIsDeleteCommentDialogOpen(false);
      setSelectedComment(null);
    },
    onError: (error) => {
      toast({
        title: "Error deleting comment",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // ===== HANDLERS =====
  
  // Handle creating a new category
  const handleCreateCategory = () => {
    // Create a URL-friendly slug if none provided
    let slug = categoryFormData.slug;
    if (!slug && categoryFormData.name) {
      slug = categoryFormData.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    createCategoryMutation.mutate({
      ...categoryFormData,
      slug
    });
  };
  
  // Handle deleting a category
  const handleDeleteCategory = (categoryId: number) => {
    setSelectedCategory(categoryId);
    setIsDeleteCategoryDialogOpen(true);
  };
  
  // Handle editing a post
  const handleEditPost = (postId: number) => {
    setSelectedPost(postId);
    setIsEditPostDialogOpen(true);
  };
  
  // Handle deleting a post
  const handleDeletePost = (postId: number) => {
    setSelectedPost(postId);
    setIsDeletePostDialogOpen(true);
  };
  
  // Handle adding a tag
  const handleAddTag = () => {
    if (newTag && !postFormData.tags.includes(newTag)) {
      setPostFormData({
        ...postFormData,
        tags: [...postFormData.tags, newTag]
      });
      setNewTag("");
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setPostFormData({
      ...postFormData,
      tags: postFormData.tags.filter(t => t !== tag)
    });
  };
  
  // Handle creating a new post
  const handleCreatePost = () => {
    // Create a URL-friendly slug if none provided
    let slug = postFormData.slug;
    if (!slug && postFormData.title) {
      slug = postFormData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    createPostMutation.mutate({
      ...postFormData,
      slug
    });
  };
  
  // Handle updating a post
  const handleUpdatePost = () => {
    // Create a URL-friendly slug if none provided
    let slug = postFormData.slug;
    if (!slug && postFormData.title) {
      slug = postFormData.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    updatePostMutation.mutate({
      ...postFormData,
      slug
    });
  };
  
  // Handle toggling comment approval
  const handleToggleCommentApproval = (id: number, currentStatus: boolean) => {
    updateCommentApprovalMutation.mutate({
      id,
      approved: !currentStatus
    });
  };
  
  // Handle deleting a comment
  const handleDeleteComment = (commentId: number) => {
    setSelectedComment(commentId);
    setIsDeleteCommentDialogOpen(true);
  };
  
  // ===== FILTERS =====
  
  // Filter posts based on search
  const filteredPosts = posts ? posts.filter((post: BlogPost) => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];
  
  // Filter comments based on search
  const filteredComments = comments ? comments.filter((comment: BlogComment) => 
    comment.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comment.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];
  
  // ===== EFFECTS =====
  
  // Set post form data when editing a post
  if (selectedPost && postDetail && isEditPostDialogOpen) {
    const currentPostData = {
      title: postDetail.title,
      slug: postDetail.slug,
      content: postDetail.content,
      excerpt: postDetail.excerpt || "",
      featuredImage: postDetail.featuredImage || "",
      status: postDetail.status,
      tags: postDetail.tags || [],
      categories: postDetail.categoryId ? [postDetail.categoryId.toString()] : []
    };
    
    // Only update form data if it's different
    if (JSON.stringify(currentPostData) !== JSON.stringify(postFormData)) {
      setPostFormData(currentPostData);
    }
  }
  
  // ===== LOADING STATES =====
  
  if ((activeTab === "categories" && isLoadingCategories) || 
      (activeTab === "posts" && isLoadingPosts) || 
      (activeTab === "comments" && isLoadingComments)) {
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
          <h1 className="text-3xl font-bold">Blog Management</h1>
          <p className="text-muted-foreground">
            Manage Appmo blog content including posts, categories, and comments
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full md:w-[500px]">
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>
          
          {/* ===== POSTS TAB ===== */}
          <TabsContent value="posts" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search posts..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button onClick={() => setIsAddPostDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Post
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.length > 0 ? (
                      filteredPosts.map((post: BlogPost) => (
                        <TableRow key={post.id}>
                          <TableCell>
                            <div className="font-medium">{post.title}</div>
                            <div className="text-xs text-muted-foreground">{post.slug}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={post.status === 'published' ? 'default' : 'outline'}>
                              {post.status === 'published' ? 'Published' : 'Draft'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {post.category ? post.category.name : '—'}
                          </TableCell>
                          <TableCell>
                            {post.author.displayName || post.author.username}
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              {post.status === 'published' && post.publishedAt
                                ? `Published: ${format(new Date(post.publishedAt), 'MMM d, yyyy')}`
                                : `Created: ${format(new Date(post.createdAt), 'MMM d, yyyy')}`
                              }
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Updated: {format(new Date(post.updatedAt), 'MMM d, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditPost(post.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          <div className="text-muted-foreground">No posts found</div>
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2"
                              onClick={() => setSearchQuery('')}
                            >
                              Clear search
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ===== CATEGORIES TAB ===== */}
          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAddCategoryDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Category
              </Button>
            </div>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories && categories.length > 0 ? (
                      categories.map((category: BlogCategory) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.slug}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {category.description || '—'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(category.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteCategory(category.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6">
                          <div className="text-muted-foreground">No categories found</div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ===== COMMENTS TAB ===== */}
          <TabsContent value="comments" className="space-y-4">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search comments..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Comment</TableHead>
                      <TableHead>Post</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComments && filteredComments.length > 0 ? (
                      filteredComments.map((comment: BlogComment) => (
                        <TableRow key={comment.id}>
                          <TableCell className="max-w-xs truncate">
                            {comment.content}
                          </TableCell>
                          <TableCell>
                            {comment.post.title}
                          </TableCell>
                          <TableCell>
                            {comment.user.displayName || comment.user.username}
                          </TableCell>
                          <TableCell>
                            {comment.approved ? (
                              <Badge variant="default" className="bg-green-600">Approved</Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleToggleCommentApproval(comment.id, comment.approved)}
                              >
                                {comment.approved ? (
                                  <X className="h-4 w-4 text-red-500" />
                                ) : (
                                  <Check className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6">
                          <div className="text-muted-foreground">No comments found</div>
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2"
                              onClick={() => setSearchQuery('')}
                            >
                              Clear search
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* ===== ADD CATEGORY DIALOG ===== */}
      <Dialog open={isAddCategoryDialogOpen} onOpenChange={setIsAddCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new category for organizing blog posts
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({
                  ...categoryFormData,
                  name: e.target.value
                })}
                placeholder="e.g. Productivity Tips"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL Path)</Label>
              <Input
                id="slug"
                value={categoryFormData.slug}
                onChange={(e) => setCategoryFormData({
                  ...categoryFormData,
                  slug: e.target.value
                })}
                placeholder="e.g. productivity-tips"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to generate automatically from name
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({
                  ...categoryFormData,
                  description: e.target.value
                })}
                placeholder="Brief description of this category"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={!categoryFormData.name || createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* ===== DELETE CATEGORY DIALOG ===== */}
      <AlertDialog
        open={isDeleteCategoryDialogOpen}
        onOpenChange={setIsDeleteCategoryDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Category Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
              Note: You can only delete categories that have no posts associated with them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteCategoryMutation.mutate()}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? "Deleting..." : "Delete Category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* ===== ADD POST DIALOG ===== */}
      <Dialog
        open={isAddPostDialogOpen}
        onOpenChange={setIsAddPostDialogOpen}
      >
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Create New Blog Post</DialogTitle>
            <DialogDescription>
              Add a new post to your blog
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 py-4 px-1">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={postFormData.title}
                  onChange={(e) => setPostFormData({
                    ...postFormData,
                    title: e.target.value
                  })}
                  placeholder="Post title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL Path)</Label>
                <Input
                  id="slug"
                  value={postFormData.slug}
                  onChange={(e) => setPostFormData({
                    ...postFormData,
                    slug: e.target.value
                  })}
                  placeholder="post-url-slug"
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to generate automatically from title
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={postFormData.content}
                  onChange={(e) => setPostFormData({
                    ...postFormData,
                    content: e.target.value
                  })}
                  placeholder="Post content"
                  rows={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                <Textarea
                  id="excerpt"
                  value={postFormData.excerpt}
                  onChange={(e) => setPostFormData({
                    ...postFormData,
                    excerpt: e.target.value
                  })}
                  placeholder="Brief summary of the post"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="featuredImage">Featured Image URL (Optional)</Label>
                <Input
                  id="featuredImage"
                  value={postFormData.featuredImage}
                  onChange={(e) => setPostFormData({
                    ...postFormData,
                    featuredImage: e.target.value
                  })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={postFormData.categories[0] || ""}
                  onValueChange={(value) => setPostFormData({
                    ...postFormData,
                    categories: value ? [value] : []
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Categories</SelectLabel>
                      {categories && categories.map((category: BlogCategory) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Publication Status</Label>
                <Select
                  value={postFormData.status}
                  onValueChange={(value) => setPostFormData({
                    ...postFormData,
                    status: value as 'draft' | 'published'
                  })}
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
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {postFormData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 rounded-full"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!newTag}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPostDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreatePost}
              disabled={!postFormData.title || !postFormData.content || createPostMutation.isPending}
            >
              {createPostMutation.isPending ? "Creating..." : "Create Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* ===== EDIT POST DIALOG ===== */}
      <Dialog
        open={isEditPostDialogOpen}
        onOpenChange={setIsEditPostDialogOpen}
      >
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
            <DialogDescription>
              Make changes to your blog post
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="space-y-4 py-4 px-1">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={postFormData.title}
                  onChange={(e) => setPostFormData({
                    ...postFormData,
                    title: e.target.value
                  })}
                  placeholder="Post title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL Path)</Label>
                <Input
                  id="slug"
                  value={postFormData.slug}
                  onChange={(e) => setPostFormData({
                    ...postFormData,
                    slug: e.target.value
                  })}
                  placeholder="post-url-slug"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={postFormData.content}
                  onChange={(e) => setPostFormData({
                    ...postFormData,
                    content: e.target.value
                  })}
                  placeholder="Post content"
                  rows={10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                <Textarea
                  id="excerpt"
                  value={postFormData.excerpt}
                  onChange={(e) => setPostFormData({
                    ...postFormData,
                    excerpt: e.target.value
                  })}
                  placeholder="Brief summary of the post"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="featuredImage">Featured Image URL (Optional)</Label>
                <Input
                  id="featuredImage"
                  value={postFormData.featuredImage}
                  onChange={(e) => setPostFormData({
                    ...postFormData,
                    featuredImage: e.target.value
                  })}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={postFormData.categories[0] || ""}
                  onValueChange={(value) => setPostFormData({
                    ...postFormData,
                    categories: value ? [value] : []
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Categories</SelectLabel>
                      {categories && categories.map((category: BlogCategory) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Publication Status</Label>
                <Select
                  value={postFormData.status}
                  onValueChange={(value) => setPostFormData({
                    ...postFormData,
                    status: value as 'draft' | 'published'
                  })}
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
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {postFormData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 rounded-full"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTag}
                    disabled={!newTag}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPostDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePost}
              disabled={!postFormData.title || !postFormData.content || updatePostMutation.isPending}
            >
              {updatePostMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* ===== DELETE POST DIALOG ===== */}
      <AlertDialog open={isDeletePostDialogOpen} onOpenChange={setIsDeletePostDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Post Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this blog post? This action cannot be undone.
              All comments associated with this post will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deletePostMutation.mutate()}
              disabled={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? "Deleting..." : "Delete Post"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* ===== DELETE COMMENT DIALOG ===== */}
      <AlertDialog open={isDeleteCommentDialogOpen} onOpenChange={setIsDeleteCommentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Comment Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteCommentMutation.mutate()}
              disabled={deleteCommentMutation.isPending}
            >
              {deleteCommentMutation.isPending ? "Deleting..." : "Delete Comment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}