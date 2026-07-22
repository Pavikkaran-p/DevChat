import type { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

interface ErrorResponseBody {
  status: "error";
  message: string;
  stack?: string;
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      status: "error",
      message: err.message,
    };
    if (process.env["NODE_ENV"] !== "production") {
      body["stack"] = err.stack;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  // Log unexpected errors
  console.error("[UnhandledError]", err);

  const body: Record<string, unknown> = {
    status: "error",
    message: "Internal server error",
  };
  if (process.env["NODE_ENV"] !== "production") {
    body["stack"] = err.stack;
  }

  res.status(500).json(body);
}

/**
 * Wraps an async route handler so thrown errors are forwarded to Express
 * error-handling middleware instead of causing unhandled rejections.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
