import { Request, Response, NextFunction } from "express";

/**
 * Middleware to require admin role for accessing protected routes
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }

  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: "Admin role required" });
  }

  next();
}