import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(pinoHttp({ logger }));

  const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // non-browser clients
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('CORS: origin not allowed'));
    },
    credentials: false
  }));

  app.use(express.json({ limit: '256kb' }));
  app.use(globalLimiter);

  app.use('/api', (req, _res, next) => {
    // expose io on request for controllers
    req.io = app.get('io') || null;
    next();
  });

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
