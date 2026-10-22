import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.body.token',
      'req.body.password',
      'req.body.privateKey'
    ],
    censor: '[REDACTED]'
  }
});
