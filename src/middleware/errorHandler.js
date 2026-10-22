import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` }
  });
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    if (err.status >= 500) logger.error({ err }, err.message);
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details }
    });
  }
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: { code: 'INTERNAL', message: 'Internal server error' }
  });
}
