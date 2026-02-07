import { Request, Response, NextFunction } from 'express';

// Custom error classes
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

// Async handler wrapper - élimine les try-catch répétitifs
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware de gestion d'erreurs global
export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Si c'est une erreur personnalisée
  if (err instanceof AppError) {
    console.error(`[${err.statusCode}] ${err.message}`, {
      path: req.path,
      method: req.method,
      userId: (req as any).userId
    });

    return res.status(err.statusCode).json({
      message: err.message,
      status: err.statusCode
    });
  }

  // Erreurs PostgreSQL
  if ((err as any).code) {
    const pgError = err as any;
    console.error('PostgreSQL Error:', {
      code: pgError.code,
      detail: pgError.detail,
      table: pgError.table,
      constraint: pgError.constraint
    });

    // Violation de clé étrangère
    if (pgError.code === '23503') {
      return res.status(400).json({
        message: 'Invalid reference - related resource not found',
        detail: pgError.detail
      });
    }

    // Violation de contrainte unique
    if (pgError.code === '23505') {
      return res.status(409).json({
        message: 'Resource already exists',
        detail: pgError.detail
      });
    }

    // Violation de contrainte NOT NULL
    if (pgError.code === '23502') {
      return res.status(400).json({
        message: 'Required field missing',
        column: pgError.column
      });
    }
  }

  // Erreur générique
  console.error('Unhandled Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
};

// Helper pour vérifier si une ressource existe
export const findOrFail = <T>(
  rows: T[],
  errorMessage: string = 'Resource not found'
): T => {
  if (rows.length === 0) {
    throw new NotFoundError(errorMessage);
  }
  return rows[0];
};
