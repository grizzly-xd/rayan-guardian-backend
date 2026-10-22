export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const Errors = {
  unauthorized: (msg = 'Authentication required') =>
    new AppError(401, 'UNAUTHORIZED', msg),
  forbidden: (msg = 'Forbidden') => new AppError(403, 'FORBIDDEN', msg),
  notFound: (msg = 'Resource not found') => new AppError(404, 'NOT_FOUND', msg),
  validation: (details) =>
    new AppError(400, 'VALIDATION_ERROR', 'Invalid request', details),
  conflict: (msg = 'Conflict') => new AppError(409, 'CONFLICT', msg),
  rateLimited: () => new AppError(429, 'RATE_LIMITED', 'Too many requests'),
  internal: (msg = 'Internal server error') =>
    new AppError(500, 'INTERNAL', msg)
};
