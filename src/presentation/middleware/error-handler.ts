import { Request, Response, NextFunction } from 'express';
import { DomainError, NotFoundError, ConflictError, AuthorizationError } from '../../domain/errors/domain-error';

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

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
