import { getFirestore } from '../config/firebase.js';
import { nowIso } from '../utils/time.js';

/**
 * Emits a Socket.IO event to an admin's room and mirrors it into an
 * internal Firestore collection so other instances can poll if Redis
 * adapter is not configured.
 */
export function emitToAdmin(io, adminUid, event, payload) {
  if (!io) return;
  io.to(`admin:${adminUid}`).emit(event, payload);
}

export async function emitToAdminAndPersist(io, adminUid, event, payload) {
  emitToAdmin(io, adminUid, event, payload);
  try {
    const db = getFirestore();
    await db.collection('realtimeEvents').add({
      adminUid,
      event,
      payload,
      createdAt: nowIso()
    });
  } catch {
    // non-fatal
  }
}
