// filepath: backend/src/middleware/csrf.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Modern CSRF protection using Double Submit Cookie pattern
 * More secure than deprecated csurf package
 */

// Generate CSRF token
export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware to attach CSRF token to request
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip in development for localhost
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Get token from header
  const tokenFromHeader = req.header('X-CSRF-Token');
  
  // Get token from cookie
  const tokenFromCookie = req.cookies?.['csrf-token'];

  // Validate tokens match
  if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
    return res.status(403).json({ 
      error: 'Invalid CSRF token',
      message: 'Request blocked for security reasons'
    });
  }

  next();
}

// Middleware to set CSRF cookie
export function setCsrfCookie(req: Request, res: Response, next: NextFunction) {
  // Generate token if not exists
  if (!req.cookies?.['csrf-token']) {
    const token = generateCsrfToken();
    
    res.cookie('csrf-token', token, {
      httpOnly: false, // Must be readable by JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
    
    // Also send in response header for initial setup
    res.setHeader('X-CSRF-Token', token);
  }
  
  next();
}
