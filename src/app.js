import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';
import { health } from './controllers/health.controller.js'; // Import health controller

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(pinoHttp({ logger }));

  // CORS Configuration
  const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(cors({
    origin(origin, cb) {
      // Allow non-browser clients (Postman, Railway internal, etc)
      if (!origin) return cb(null, true); 
      // Allow origins defined in .env
      if (allowedOrigins.includes(origin)) return cb(null, true);
      // Allow localhost for local development testing
      if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
        return cb(null, true);
      }
      return cb(new Error('CORS: origin not allowed'));
    },
    credentials: false
  }));

  app.use(express.json({ limit: '256kb' }));
  app.use(globalLimiter);

  // Root level health check (outside of /api)
  app.get('/health', health);

  app.use('/api', (req, _res, next) => {
    req.io = app.get('io') || null;
    next();
  });

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
