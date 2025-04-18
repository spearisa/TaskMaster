import { Router } from "express";
import { requireAdmin } from "./admin-middleware";
import { db } from "./db";
import { users, tasks, directMessages, taskTemplates, taskBids, blogPosts, blogCategories, blogComments } from "@shared/schema";
import { eq, desc, and, or, sql, count } from "drizzle-orm";

const adminRouter = Router();

// Middleware to ensure only admins can access these routes
adminRouter.use(requireAdmin);

// Get dashboard stats
adminRouter.get("/stats", async (req, res) => {
  try {
    const userCount = await db.select({ count: count() }).from(users);
    const taskCount = await db.select({ count: count() }).from(tasks);
    const messageCount = await db.select({ count: count() }).from(directMessages);
    const templateCount = await db.select({ count: count() }).from(taskTemplates);
    const bidCount = await db.select({ count: count() }).from(taskBids);
    const publicTaskCount = await db.select({ count: count() }).from(tasks).where(eq(tasks.isPublic, true));
    const completedTaskCount = await db.select({ count: count() }).from(tasks).where(eq(tasks.completed, true));
    const blogPostCount = await db.select({ count: count() }).from(blogPosts);
    
    // Get counts by week
    const tasksByWeek = await db.execute(sql`
      SELECT DATE_TRUNC('week', created_at) as week, COUNT(*) 
      FROM tasks 
      GROUP BY week 
      ORDER BY week DESC 
      LIMIT 8
    `);
    
    const usersByWeek = await db.execute(sql`
      SELECT DATE_TRUNC('week', created_at) as week, COUNT(*) 
      FROM users 
      GROUP BY week 
      ORDER BY week DESC 
      LIMIT 8
    `);

    res.json({
      users: userCount[0].count,
      tasks: taskCount[0].count,
      messages: messageCount[0].count,
      templates: templateCount[0].count,
      bids: bidCount[0].count,
      publicTasks: publicTaskCount[0].count,
      completedTasks: completedTaskCount[0].count,
      blogPosts: blogPostCount[0].count,
      tasksByWeek,
      usersByWeek
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Error fetching admin stats" });
  }
});

// Get all users
adminRouter.get("/users", async (req, res) => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    
    // Add task counts for each user
    const usersWithCounts = await Promise.all(
      allUsers.map(async (user) => {
        const taskCount = await db.select({ count: count() }).from(tasks).where(eq(tasks.userId, user.id));
        const publicTaskCount = await db.select({ count: count() }).from(tasks).where(and(eq(tasks.userId, user.id), eq(tasks.isPublic, true)));
        const completedTaskCount = await db.select({ count: count() }).from(tasks).where(and(eq(tasks.userId, user.id), eq(tasks.completed, true)));
        
        return {
          ...user,
          taskCount: taskCount[0].count,
          publicTaskCount: publicTaskCount[0].count,
          completedTaskCount: completedTaskCount[0].count
        };
      })
    );
    
    res.json(usersWithCounts);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Error fetching users" });
  }
});

// Get specific user
adminRouter.get("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    
    if (!user.length) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Get user's tasks
    const userTasks = await db.select().from(tasks).where(eq(tasks.userId, userId));
    
    // Get user's sent messages
    const sentMessages = await db.select().from(directMessages).where(eq(directMessages.senderId, userId));
    
    res.json({
      user: user[0],
      tasks: userTasks,
      messages: sentMessages
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Error fetching user" });
  }
});

// Update user
adminRouter.patch("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { displayName, bio, isAdmin } = req.body;
    
    const updatedUser = await db.update(users)
      .set({ 
        displayName, 
        bio, 
        isAdmin: isAdmin === true 
      })
      .where(eq(users.id, userId))
      .returning();
    
    if (!updatedUser.length) {
      return res.status(404).json({ error: "User not found" });
    }
    
    res.json(updatedUser[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Error updating user" });
  }
});

// Delete user
adminRouter.delete("/users/:id", async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    // Don't allow deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }
    
    // First delete user's tasks
    await db.delete(tasks).where(eq(tasks.userId, userId));
    
    // Delete user's messages
    await db.delete(directMessages).where(or(
      eq(directMessages.senderId, userId),
      eq(directMessages.receiverId, userId)
    ));
    
    // Delete user's task templates
    await db.delete(taskTemplates).where(eq(taskTemplates.userId, userId));
    
    // Delete user's bids
    await db.delete(taskBids).where(eq(taskBids.bidderId, userId));
    
    // Delete blog posts and comments
    await db.delete(blogComments).where(eq(blogComments.userId, userId));
    
    // Get user's blog posts
    const userPosts = await db.select({ id: blogPosts.id }).from(blogPosts).where(eq(blogPosts.authorId, userId));
    const postIds = userPosts.map(post => post.id);
    
    // Delete comments on user's blog posts
    if (postIds.length > 0) {
      // Delete comments on these posts
      await db.delete(blogComments).where(sql`post_id IN ${postIds}`);
      
      // Delete post categories
      await db.delete(sql`blog_post_categories`).where(sql`post_id IN ${postIds}`);
      
      // Delete posts
      await db.delete(blogPosts).where(eq(blogPosts.authorId, userId));
    }
    
    // Now delete the user
    await db.delete(users).where(eq(users.id, userId));
    
    res.json({ success: true, message: "User and related data deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Error deleting user" });
  }
});

// Blog management
// Get all blog posts
adminRouter.get("/blog/posts", async (req, res) => {
  try {
    const allPosts = await db.select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      status: blogPosts.status,
      authorId: blogPosts.authorId,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      updatedAt: blogPosts.updatedAt,
      viewCount: blogPosts.viewCount,
      tags: blogPosts.tags
    })
    .from(blogPosts)
    .orderBy(desc(blogPosts.createdAt));
    
    // Add author information
    const postsWithAuthors = await Promise.all(
      allPosts.map(async (post) => {
        const author = await db.select({
          username: users.username,
          displayName: users.displayName
        })
        .from(users)
        .where(eq(users.id, post.authorId))
        .limit(1);
        
        const comments = await db.select({ count: count() })
          .from(blogComments)
          .where(eq(blogComments.postId, post.id));
        
        return {
          ...post,
          author: author[0] || null,
          commentCount: comments[0].count
        };
      })
    );
    
    res.json(postsWithAuthors);
  } catch (error) {
    console.error("Error fetching blog posts:", error);
    res.status(500).json({ error: "Error fetching blog posts" });
  }
});

// Get specific blog post
adminRouter.get("/blog/posts/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await db.select().from(blogPosts).where(eq(blogPosts.id, postId)).limit(1);
    
    if (!post.length) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    
    // Get post categories
    const categories = await db.execute(sql`
      SELECT bc.* FROM blog_categories bc
      JOIN blog_post_categories bpc ON bc.id = bpc.category_id
      WHERE bpc.post_id = ${postId}
    `);
    
    // Get post comments
    const comments = await db.select().from(blogComments).where(eq(blogComments.postId, postId));
    
    // Get author
    const author = await db.select().from(users).where(eq(users.id, post[0].authorId)).limit(1);
    
    res.json({
      post: post[0],
      categories,
      comments,
      author: author[0] || null
    });
  } catch (error) {
    console.error("Error fetching blog post:", error);
    res.status(500).json({ error: "Error fetching blog post" });
  }
});

// Create new blog post
adminRouter.post("/blog/posts", async (req, res) => {
  try {
    const { title, slug, content, excerpt, featuredImage, status, publishedAt, tags, categories } = req.body;
    
    // Create the post
    const newPost = await db.insert(blogPosts)
      .values({
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        authorId: req.user.id,
        status,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        tags
      })
      .returning();
    
    if (!newPost.length) {
      return res.status(500).json({ error: "Failed to create blog post" });
    }
    
    // Add categories if provided
    if (categories && categories.length > 0) {
      const postId = newPost[0].id;
      
      for (const categoryId of categories) {
        await db.execute(sql`
          INSERT INTO blog_post_categories (post_id, category_id)
          VALUES (${postId}, ${categoryId})
        `);
      }
    }
    
    res.status(201).json(newPost[0]);
  } catch (error) {
    console.error("Error creating blog post:", error);
    res.status(500).json({ error: "Error creating blog post" });
  }
});

// Update blog post
adminRouter.put("/blog/posts/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const { title, slug, content, excerpt, featuredImage, status, publishedAt, tags, categories } = req.body;
    
    // Update the post
    const updatedPost = await db.update(blogPosts)
      .set({
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        status,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        tags,
        updatedAt: new Date()
      })
      .where(eq(blogPosts.id, postId))
      .returning();
    
    if (!updatedPost.length) {
      return res.status(404).json({ error: "Blog post not found" });
    }
    
    // Update categories if provided
    if (categories) {
      // Remove existing categories
      await db.execute(sql`DELETE FROM blog_post_categories WHERE post_id = ${postId}`);
      
      // Add new categories
      for (const categoryId of categories) {
        await db.execute(sql`
          INSERT INTO blog_post_categories (post_id, category_id)
          VALUES (${postId}, ${categoryId})
        `);
      }
    }
    
    res.json(updatedPost[0]);
  } catch (error) {
    console.error("Error updating blog post:", error);
    res.status(500).json({ error: "Error updating blog post" });
  }
});

// Delete blog post
adminRouter.delete("/blog/posts/:id", async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    
    // Delete post categories
    await db.execute(sql`DELETE FROM blog_post_categories WHERE post_id = ${postId}`);
    
    // Delete post comments
    await db.delete(blogComments).where(eq(blogComments.postId, postId));
    
    // Delete the post
    await db.delete(blogPosts).where(eq(blogPosts.id, postId));
    
    res.json({ success: true, message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog post:", error);
    res.status(500).json({ error: "Error deleting blog post" });
  }
});

// Blog categories
// Get all categories
adminRouter.get("/blog/categories", async (req, res) => {
  try {
    const allCategories = await db.select().from(blogCategories).orderBy(blogCategories.name);
    res.json(allCategories);
  } catch (error) {
    console.error("Error fetching blog categories:", error);
    res.status(500).json({ error: "Error fetching blog categories" });
  }
});

// Create category
adminRouter.post("/blog/categories", async (req, res) => {
  try {
    const { name, slug, description, parentId } = req.body;
    
    const newCategory = await db.insert(blogCategories)
      .values({
        name,
        slug,
        description,
        parentId
      })
      .returning();
    
    res.status(201).json(newCategory[0]);
  } catch (error) {
    console.error("Error creating blog category:", error);
    res.status(500).json({ error: "Error creating blog category" });
  }
});

// Update category
adminRouter.put("/blog/categories/:id", async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    const { name, slug, description, parentId } = req.body;
    
    const updatedCategory = await db.update(blogCategories)
      .set({
        name,
        slug,
        description,
        parentId
      })
      .where(eq(blogCategories.id, categoryId))
      .returning();
    
    if (!updatedCategory.length) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    res.json(updatedCategory[0]);
  } catch (error) {
    console.error("Error updating blog category:", error);
    res.status(500).json({ error: "Error updating blog category" });
  }
});

// Delete category
adminRouter.delete("/blog/categories/:id", async (req, res) => {
  try {
    const categoryId = parseInt(req.params.id);
    
    // Check if category has posts
    const postsWithCategory = await db.execute(sql`
      SELECT COUNT(*) FROM blog_post_categories WHERE category_id = ${categoryId}
    `);
    
    if (postsWithCategory.length > 0 && parseInt(postsWithCategory[0].count) > 0) {
      return res.status(400).json({ 
        error: "Cannot delete category with posts. Remove posts from this category first." 
      });
    }
    
    // Check if category has children
    const childCategories = await db.select().from(blogCategories).where(eq(blogCategories.parentId, categoryId));
    
    if (childCategories.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete category with child categories. Delete child categories first." 
      });
    }
    
    // Delete category
    await db.delete(blogCategories).where(eq(blogCategories.id, categoryId));
    
    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog category:", error);
    res.status(500).json({ error: "Error deleting blog category" });
  }
});

// Blog comments (moderation)
adminRouter.get("/blog/comments", async (req, res) => {
  try {
    const allComments = await db.select().from(blogComments).orderBy(desc(blogComments.createdAt));
    
    // Add post and user information
    const commentsWithDetails = await Promise.all(
      allComments.map(async (comment) => {
        const post = await db.select({
          title: blogPosts.title,
          slug: blogPosts.slug
        })
        .from(blogPosts)
        .where(eq(blogPosts.id, comment.postId))
        .limit(1);
        
        let userInfo = null;
        
        if (comment.userId) {
          const user = await db.select({
            username: users.username,
            displayName: users.displayName
          })
          .from(users)
          .where(eq(users.id, comment.userId))
          .limit(1);
          
          userInfo = user[0] || null;
        }
        
        return {
          ...comment,
          post: post[0] || null,
          user: userInfo
        };
      })
    );
    
    res.json(commentsWithDetails);
  } catch (error) {
    console.error("Error fetching blog comments:", error);
    res.status(500).json({ error: "Error fetching blog comments" });
  }
});

// Approve/reject comment
adminRouter.patch("/blog/comments/:id", async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const { approved } = req.body;
    
    const updatedComment = await db.update(blogComments)
      .set({
        approved: approved === true,
        updatedAt: new Date()
      })
      .where(eq(blogComments.id, commentId))
      .returning();
    
    if (!updatedComment.length) {
      return res.status(404).json({ error: "Comment not found" });
    }
    
    res.json(updatedComment[0]);
  } catch (error) {
    console.error("Error updating blog comment:", error);
    res.status(500).json({ error: "Error updating blog comment" });
  }
});

// Delete comment
adminRouter.delete("/blog/comments/:id", async (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    
    // First delete any child comments
    await db.delete(blogComments).where(eq(blogComments.parentId, commentId));
    
    // Then delete the comment
    await db.delete(blogComments).where(eq(blogComments.id, commentId));
    
    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog comment:", error);
    res.status(500).json({ error: "Error deleting blog comment" });
  }
});

export { adminRouter };