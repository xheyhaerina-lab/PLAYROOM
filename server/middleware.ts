import type { NextFunction, Request, Response } from 'express';
import { store } from './store.ts';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  authToken?: string;
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const userId = store.verifyToken(token);
  if (!userId) {
    res.status(401).json({ error: 'Invalid or expired session token' });
    return;
  }
  req.userId = userId;
  req.authToken = token;
  next();
}

export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = extractBearerToken(req);
  if (token) {
    const userId = store.verifyToken(token);
    if (userId) {
      req.userId = userId;
      req.authToken = token;
    }
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const user = store.users.get(req.userId);
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'moderator')) {
    res.status(403).json({ error: 'Administrator privileges required' });
    return;
  }
  next();
}

export function createRateLimiter(options: { windowMs: number; maxRequests: number }) {
  const hits = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip || 'local'}:${req.path}`;
    const now = Date.now();
    const cutoff = now - options.windowMs;
    const recent = (hits.get(key) || []).filter((ts) => ts > cutoff);
    if (recent.length >= options.maxRequests) {
      res.status(429).json({ error: 'Too many requests. Please wait a moment before trying again.' });
      return;
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
}
