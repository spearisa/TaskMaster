import { Request, Response, NextFunction } from "express";

/**
 * Middleware to require admin role for accessing protected routes
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  console.log("[Admin] Request to admin route:", req.originalUrl);
  console.log("[Admin] Authentication state:", req.isAuthenticated());
  
  if (!req.isAuthenticated()) {
    console.log("[Admin] Not authenticated, returning 401");
    return res.status(401).json({ message: "Authentication required" });
  }

  console.log("[Admin] User:", JSON.stringify(req.user, null, 2));
  
  if (!req.user?.isAdmin) {
    console.log("[Admin] User is not an admin, returning 403");
    return res.status(403).json({ message: "Admin role required" });
  }

  console.log("[Admin] Admin access granted");
  next();
}