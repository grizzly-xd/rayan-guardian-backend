import { Server } from 'socket.io';
import { getAuth, getFirestore } from '../config/firebase.js';
import { hashToken } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

/**
 * Two authentication modes:
 *  - Admin socket: handshake.auth.firebaseToken  -> verifies ID token + adminProfile
 *  - Client socket: handshake.auth.sessionId + sessionToken -> verifies session
 *
 * Admin sockets join room `admin:<uid>`.
 * Client sockets join room `device:<deviceId>` (restricted to that device only).
 */
export function setupSocket(io) {
  io.use(async (socket, next) => {
    try {
      const { firebaseToken, sessionId, sessionToken } = socket.handshake.auth || {};

      if (firebaseToken) {
        const decoded = await getAuth().verifyIdToken(firebaseToken, true);
        const db = getFirestore();
        const profileSnap = await db.collection('adminProfiles').doc(decoded.uid).get();
        if (!profileSnap.exists) return next(new Error('No admin profile'));
        const profile = profileSnap.data();
        if (profile.status !== 'active') return next(new Error('Admin not active'));
        socket.data = { kind: 'admin', adminUid: decoded.uid, role: profile.role };
        return next();
      }

      if (sessionId && sessionToken) {
        const db = getFirestore();
        const snap = await db.collection('deviceSessions').doc(sessionId).get();
        if (!snap.exists) return next(new Error('Session not found'));
        const data = snap.data();
        if (data.endedAt) return next(new Error('Session ended'));
        if (data.tokenHash !== hashToken(sessionToken)) return next(new Error('Invalid session token'));
        socket.data = { kind: 'client', ownerAdminUid: data.ownerAdminUid, deviceId: data.deviceId };
        return next();
      }

      next(new Error('Authentication required'));
    } catch (err) {
      logger.warn({ err: err.message }, 'Socket auth failed');
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const { kind, adminUid, deviceId } = socket.data;

    if (kind === 'admin') {
      socket.join(`admin:${adminUid}`);
      logger.info({ adminUid }, 'admin socket connected');
    } else if (kind === 'client') {
      socket.join(`device:${deviceId}`);
      logger.info({ deviceId }, 'client socket connected');
    }

    socket.on('disconnect', () => {
      logger.info({ kind, adminUid, deviceId }, 'socket disconnected');
    });
  });

  return io;
}

export function createIo(httpServer) {
  const origin = process.env.FRONTEND_ORIGIN
    ? process.env.FRONTEND_ORIGIN.split(',').map((s) => s.trim())
    : false;
  const io = new Server(httpServer, {
    cors: { origin, methods: ['GET', 'POST'] },
    maxHttpBufferSize: 64 * 1024
  });
  return setupSocket(io);
}
