// filepath: backend/src/middleware/sanitization.ts
import xss from 'xss';
import validator from 'validator';

/**
 * Sanitization utilities for user inputs
 * Protects against XSS, SQL Injection, and other attacks
 */

// XSS options - allow safe HTML tags only
const xssOptions = {
  whiteList: {
    // Allow only safe formatting tags
    b: [],
    i: [],
    em: [],
    strong: [],
    br: [],
    p: [],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style'],
};

/**
 * Sanitize string input to prevent XSS attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;
  
  // Remove XSS
  let sanitized = xss(input, xssOptions);
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') return email;
  
  const normalized = validator.normalizeEmail(email) || email;
  return validator.isEmail(normalized) ? normalized : '';
}

/**
 * Sanitize URL
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') return url;
  
  // Ensure URL is safe
  if (!validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true })) {
    return '';
  }
  
  return url;
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {} as T;
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeString(value) as any;
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item => 
        typeof item === 'string' ? sanitizeString(item) : item
      ) as any;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key as keyof T] = sanitizeObject(value) as any;
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized;
}

/**
 * Express middleware to sanitize request body
 */
export function sanitizeBody(req: any, res: any, next: any) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  next();
}

/**
 * Express middleware to sanitize query params
 */
export function sanitizeQuery(req: any, res: any, next: any) {
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
}

/**
 * Validate and sanitize specific fields
 */
export const validators = {
  email: (email: string) => {
    const sanitized = sanitizeEmail(email);
    if (!sanitized) throw new Error('Invalid email format');
    return sanitized;
  },
  
  url: (url: string) => {
    const sanitized = sanitizeUrl(url);
    if (!sanitized) throw new Error('Invalid URL format');
    return sanitized;
  },
  
  alphanumeric: (str: string) => {
    if (!validator.isAlphanumeric(str, 'en-US', { ignore: ' -_' })) {
      throw new Error('Must contain only letters, numbers, spaces, hyphens, and underscores');
    }
    return sanitizeString(str);
  },
  
  length: (str: string, min: number, max: number) => {
    if (!validator.isLength(str, { min, max })) {
      throw new Error(`Must be between ${min} and ${max} characters`);
    }
    return sanitizeString(str);
  },
};
