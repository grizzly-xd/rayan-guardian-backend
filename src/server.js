import http from 'node:http';
import { initFirebase } from './config/firebase.js';
import { createApp } from './app.js';
import { createIo } from './socket/index.js';
import { logger } from './utils/logger.js';
import { markOfflineDevices } from './services/devices.service.js';

const PORT = Number(process.env.PORT || 3000);
const OFFLINE_THRESHOLD_SECONDS = Number(process.env.OFFLINE_THRESHOLD_SECONDS || 120);

async function main() {
  initFirebase();

  const app = createApp();
  const server = http.createServer(app);
  const io = createIo(server);
  app.set('io', io);

  // Background: periodically mark stale devices offline
  const intervalMs = Math.max(OFFLINE_THRESHOLD_SECONDS * 1000 / 2, 30_000);
  setInterval(() => {
    markOfflineDevices(OFFLINE_THRESHOLD_SECONDS)
      .then((n) => { if (n > 0) logger.info({ count: n }, 'devices marked offline'); })
      .catch((err) => logger.error({ err }, 'offline sweep failed'));
  }, intervalMs).unref();

  server.listen(PORT, () => {
    logger.info({ port: PORT }, 'rayan-guardian-backend listening');
  });

  const shutdown = () => {
    logger.info('shutting down');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.error({ err }, 'fatal start error');
  process.exit(1);
});
