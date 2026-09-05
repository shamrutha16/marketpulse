import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export class ApiError extends Error {
  constructor(public status: number, message: string, public code = 'ERROR') {
    super(message);
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found.' } });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'Invalid request.', details: err.flatten() },
    });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message } });
  }
  logger.error({ err, path: req.path }, 'Unhandled error');
  return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our end.' } });
}

export function asyncRoute<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
