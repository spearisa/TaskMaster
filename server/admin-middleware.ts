import { Request, Response, NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Unauthorized: Not logged in" });
  }

  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: "Forbidden: Admin access required" });
  }

  next();
}