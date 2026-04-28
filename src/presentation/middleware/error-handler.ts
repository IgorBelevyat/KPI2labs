import { Request, Response, NextFunction } from 'express';
import { DomainError, NotFoundError, ConflictError, AuthorizationError } from '../../domain/errors/domain-error';

interface PrismaError extends Error {
  code: string;
}

function isPrismaError(err: unknown): err is PrismaError {
  return typeof err === 'object' && err !== null && 'code' in err && typeof (err as PrismaError).code === 'string';
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }

  if (err instanceof ConflictError) {
    res.status(409).json({ error: err.message });
    return;
  }

  if (err instanceof AuthorizationError) {
    res.status(403).json({ error: err.message });
    return;
  }

  if (err instanceof DomainError) {
    res.status(400).json({ error: err.message });
    return;
  }

  if (isPrismaError(err) && err.code === 'P2003') {
    res.status(409).json({ error: 'The record cannot be deleted: there are related records in the database.' });
    return;
  }

  if (isPrismaError(err) && err.code === 'P2002') {
    res.status(409).json({ error: 'A record with such data already exists.' });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}

