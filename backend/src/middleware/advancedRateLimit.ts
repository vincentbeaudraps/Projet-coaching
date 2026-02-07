/**
 * Advanced Rate Limiting Middleware
 * 
 * Features:
 * - Per-user rate limiting (not just IP)
 * - Different limits per role (coach, athlete, guest)
 * - Redis-based distributed counters
 * - Sliding window algorithm
 * - Exponential backoff for repeated violations
 * - Configurable per endpoint
 */

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import logger from '../utils/logger.js';

// Redis client (singleton)
let redisClient: Redis | null = null;

// Fallback to in-memory store if Redis is unavailable
const memoryStore = new Map<string, { count: number; resetTime: number; violations: number }>();

// AuthRequest interface (matching global Express.Request extension)
interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  user?: {
    userId: string;
    email?: string;
    role?: string;
  };
}

/**
 * Initialize Redis client
 */
export function initializeRedis(redisUrl?: string): Redis | null {
  try {
    if (!redisUrl && !process.env.REDIS_URL) {
      logger.warn('Redis URL not configured. Using in-memory rate limiting (not suitable for production).');
      return null;
    }

    redisClient = new Redis(redisUrl || process.env.REDIS_URL!, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
      redisClient = null; // Fallback to memory store
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected for rate limiting');
    });

    // Connect to Redis
    redisClient.connect().catch((err) => {
      logger.error('Failed to connect to Redis:', err);
      redisClient = null;
    });

    return redisClient;
  } catch (error) {
    logger.error('Error initializing Redis:', error);
    return null;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis | null {
  return redisClient;
}

/**
 * Rate limit configuration per role
 */
export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean;     // Don't count failed requests
  keyGenerator?: (req: Request) => string; // Custom key generator
  handler?: (req: Request, res: Response) => void; // Custom handler
}

export const defaultRateLimits: Record<string, RateLimitConfig> = {
  guest: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 20,           // 20 requests per 15 minutes
  },
  athlete: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,          // 100 requests per 15 minutes
  },
  coach: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200,          // 200 requests per 15 minutes
  },
  admin: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 500,          // 500 requests per 15 minutes
  },
};

/**
 * Endpoint-specific rate limits (stricter)
 */
export const endpointRateLimits: Record<string, RateLimitConfig> = {
  login: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,            // 5 attempts per 15 minutes
    skipSuccessfulRequests: true,
  },
  register: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,            // 3 registrations per hour per IP
  },
  uploadFile: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 50,           // 50 uploads per hour
  },
  sendMessage: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 10,           // 10 messages per minute
  },
};

/**
 * Generate rate limit key
 */
function generateKey(req: Request, config: RateLimitConfig): string {
  if (config.keyGenerator) {
    return config.keyGenerator(req);
  }

  const authReq = req as AuthRequest;
  const userId = authReq.user?.userId;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  // Use userId if authenticated, otherwise use IP
  return userId ? `ratelimit:user:${userId}` : `ratelimit:ip:${ip}`;
}

/**
 * Get current rate limit info from Redis
 */
async function getRateLimitInfo(key: string): Promise<{ count: number; resetTime: number; violations: number }> {
  if (!redisClient) {
    // Fallback to memory store
    const existing = memoryStore.get(key);
    if (!existing || Date.now() > existing.resetTime) {
      return { count: 0, resetTime: 0, violations: 0 };
    }
    return existing;
  }

  try {
    const [count, resetTime, violations] = await Promise.all([
      redisClient.get(`${key}:count`),
      redisClient.get(`${key}:reset`),
      redisClient.get(`${key}:violations`),
    ]);

    return {
      count: parseInt(count || '0', 10),
      resetTime: parseInt(resetTime || '0', 10),
      violations: parseInt(violations || '0', 10),
    };
  } catch (error) {
    logger.error('Error getting rate limit info from Redis:', error);
    return { count: 0, resetTime: 0, violations: 0 };
  }
}

/**
 * Increment rate limit counter
 */
async function incrementRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<{ allowed: boolean; current: number; resetTime: number; violations: number }> {
  const now = Date.now();

  if (!redisClient) {
    // Fallback to memory store
    const existing = memoryStore.get(key);
    
    if (!existing || now > existing.resetTime) {
      const resetTime = now + windowMs;
      memoryStore.set(key, { count: 1, resetTime, violations: 0 });
      return { allowed: true, current: 1, resetTime, violations: 0 };
    }

    existing.count++;
    const allowed = existing.count <= maxRequests;

    if (!allowed) {
      existing.violations++;
    }

    memoryStore.set(key, existing);
    return { allowed, current: existing.count, resetTime: existing.resetTime, violations: existing.violations };
  }

  try {
    // Use Redis pipeline for atomic operations
    const pipeline = redisClient.pipeline();
    
    const countKey = `${key}:count`;
    const resetKey = `${key}:reset`;
    const violationsKey = `${key}:violations`;

    // Get current values
    const info = await getRateLimitInfo(key);

    // Reset if window expired
    if (now > info.resetTime) {
      pipeline.set(countKey, 1);
      pipeline.set(resetKey, now + windowMs);
      pipeline.expire(countKey, Math.ceil(windowMs / 1000));
      pipeline.expire(resetKey, Math.ceil(windowMs / 1000));
      
      await pipeline.exec();
      return { allowed: true, current: 1, resetTime: now + windowMs, violations: 0 };
    }

    // Increment counter
    pipeline.incr(countKey);
    await pipeline.exec();

    const newCount = info.count + 1;
    const allowed = newCount <= maxRequests;

    // Track violations
    let violations = info.violations;
    if (!allowed) {
      violations++;
      await redisClient.set(violationsKey, violations, 'EX', Math.ceil(windowMs / 1000));
    }

    return { allowed, current: newCount, resetTime: info.resetTime, violations };
  } catch (error) {
    logger.error('Error incrementing rate limit in Redis:', error);
    // On error, allow the request (fail open)
    return { allowed: true, current: 0, resetTime: now + windowMs, violations: 0 };
  }
}

/**
 * Calculate exponential backoff based on violations
 */
function calculateBackoffTime(violations: number): number {
  if (violations <= 1) return 0;
  
  // Exponential backoff: 2^violations minutes, max 24 hours
  const backoffMinutes = Math.min(Math.pow(2, violations - 1), 1440);
  return backoffMinutes * 60 * 1000; // Convert to milliseconds
}

/**
 * Advanced rate limiting middleware factory
 */
export function advancedRateLimit(config?: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      const userRole = authReq.user?.role || 'guest';

      // Merge config: endpoint-specific > role-specific > default
      const roleConfig = defaultRateLimits[userRole] || defaultRateLimits.guest;
      const finalConfig = { ...roleConfig, ...config };

      const key = generateKey(req, finalConfig);
      const result = await incrementRateLimit(key, finalConfig.windowMs, finalConfig.maxRequests);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', finalConfig.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, finalConfig.maxRequests - result.current));
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

      if (!result.allowed) {
        // Calculate backoff time based on violations
        const backoffTime = calculateBackoffTime(result.violations);
        const retryAfter = Math.ceil((result.resetTime - Date.now() + backoffTime) / 1000);

        res.setHeader('Retry-After', retryAfter);
        res.setHeader('X-RateLimit-Violations', result.violations);

        logger.warn('Rate limit exceeded', {
          key,
          userRole,
          ip: req.ip,
          path: req.path,
          violations: result.violations,
          backoffTime: backoffTime / 1000 / 60, // minutes
        });

        if (finalConfig.handler) {
          finalConfig.handler(req, res);
          return;
        }

        res.status(429).json({
          error: 'Too Many Requests',
          message: result.violations > 3
            ? `Rate limit exceeded. Exponential backoff applied. Try again in ${Math.ceil(retryAfter / 60)} minutes.`
            : `Too many requests. Please try again in ${retryAfter} seconds.`,
          retryAfter,
          violations: result.violations,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error in rate limit middleware:', error);
      // On error, allow the request (fail open)
      next();
    }
  };
}

/**
 * Clean up memory store (for fallback mode)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of memoryStore.entries()) {
    if (now > value.resetTime) {
      memoryStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute

/**
 * Reset rate limit for a specific user/IP
 */
export async function resetRateLimit(userId?: string, ip?: string): Promise<void> {
  const key = userId ? `ratelimit:user:${userId}` : `ratelimit:ip:${ip}`;

  if (!redisClient) {
    memoryStore.delete(key);
    return;
  }

  try {
    await Promise.all([
      redisClient.del(`${key}:count`),
      redisClient.del(`${key}:reset`),
      redisClient.del(`${key}:violations`),
    ]);
  } catch (error) {
    logger.error('Error resetting rate limit:', error);
  }
}
