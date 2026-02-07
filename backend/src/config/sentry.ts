/**
 * Sentry Error Monitoring Configuration
 * 
 * Features:
 * - Real-time error tracking
 * - Performance monitoring
 * - Request breadcrumbs
 * - User context tracking
 * - Release tracking
 * - Environment separation (dev/staging/production)
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Express, Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Initialize Sentry
 */
export function initializeSentry(app: Express): void {
  const sentryDsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  if (!sentryDsn) {
    logger.warn('SENTRY_DSN not configured. Error monitoring disabled.');
    return;
  }

  try {
    Sentry.init({
      dsn: sentryDsn,
      environment,
      
      // Release tracking
      release: process.env.SENTRY_RELEASE || `coaching-app@${process.env.npm_package_version || '1.0.0'}`,
      
      // Performance monitoring
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
      
      // Profiling
      profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
      integrations: [
        nodeProfilingIntegration(),
      ],

      // Filter sensitive data
      beforeSend(event, hint) {
        // Remove sensitive data from breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
            if (breadcrumb.data) {
              // Remove sensitive fields
              delete breadcrumb.data.password;
              delete breadcrumb.data.token;
              delete breadcrumb.data.refreshToken;
              delete breadcrumb.data.authorization;
            }
            return breadcrumb;
          });
        }

        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }

        // Remove sensitive query params
        if (event.request?.query_string) {
          const params = new URLSearchParams(event.request.query_string);
          params.delete('token');
          params.delete('password');
          event.request.query_string = params.toString();
        }

        return event;
      },

      // Ignore certain errors
      ignoreErrors: [
        'UnauthorizedError',
        'JsonWebTokenError',
        'TokenExpiredError',
        'NotBeforeError',
        'ValidationError',
        /CSRF/i,
      ],

      // Don't capture in test environment
      enabled: environment !== 'test',
    });

    logger.info('Sentry error monitoring initialized', {
      environment,
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    });
  } catch (error) {
    logger.error('Failed to initialize Sentry:', error);
  }
}

/**
 * Sentry request handler middleware
 * Must be the first middleware
 */
export function sentryRequestHandler(req: Request, res: Response, next: NextFunction) {
  // Sentry v8+ uses setupExpressErrorHandler instead of middleware
  next();
}

/**
 * Sentry tracing middleware
 * Should be after request handler
 */
export function sentryTracingHandler(req: Request, res: Response, next: NextFunction) {
  // Tracing is now handled automatically by Sentry.init
  next();
}

/**
 * Sentry error handler middleware
 * Must be before any other error middleware
 */
export function sentryErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Send all errors to Sentry except these status codes
  const statusCode = err.statusCode || err.status;
  
  // Don't send client errors (400-499) except authentication errors
  if (statusCode && statusCode >= 400 && statusCode < 500) {
    if (statusCode === 401 || statusCode === 403) {
      Sentry.captureException(err);
    }
  } else {
    Sentry.captureException(err);
  }
  
  next(err);
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(userId: string, email?: string, role?: string): void {
  Sentry.setUser({
    id: userId,
    email,
    role,
  });
}

/**
 * Clear user context from Sentry
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb to Sentry
 */
export function addSentryBreadcrumb(
  message: string,
  category: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info'): void {
  Sentry.captureMessage(message, level);
}

/**
 * Create a transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({ name, op }, (span) => span);
}

/**
 * Middleware to track user context in Sentry
 */
export function sentryUserContextMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as any;
  
  if (authReq.user) {
    setSentryUser(authReq.user.userId, authReq.user.email, authReq.user.role);
  }
  
  // Clear user context after response
  res.on('finish', () => {
    clearSentryUser();
  });
  
  next();
}

/**
 * Middleware to add request breadcrumbs
 */
export function sentryBreadcrumbMiddleware(req: Request, res: Response, next: NextFunction): void {
  addSentryBreadcrumb(
    `${req.method} ${req.path}`,
    'http',
    'info',
    {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    }
  );
  
  next();
}

export default Sentry;
