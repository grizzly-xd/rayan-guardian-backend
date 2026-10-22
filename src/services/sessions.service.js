import { getFirestore } from '../config/firebase.js';
import { generateSessionToken, hashToken } from '../utils/crypto.js';
import { nowIso } from '../utils/time.js';
import { Errors } from '../utils/errors.js';

const COLLECTION = 'deviceSessions';

export async function createSession({ deviceId, ownerAdminUid, sessionType, consentVersion }) {
  const db = getFirestore();
  const sessionToken = generateSessionToken();
  const now = nowIso();
  const payload = {
    deviceId,
    ownerAdminUid,
    sessionType,
    startedAt: now,
    lastHeartbeatAt: now,
    endedAt: null,
    consentVersion,
    tokenHash: hashToken(sessionToken)
  };
  const ref = await db.collection(COLLECTION).add(payload);
  return { id: ref.id, sessionToken };
}

export async function getSessionByToken(sessionId, sessionToken) {
  const db = getFirestore();
  const snap = await db.collection(COLLECTION).doc(sessionId).get();
  if (!snap.exists) throw Errors.notFound('Session not found');
  const data = snap.data();
  if (data.tokenHash !== hashToken(sessionToken)) throw Errors.unauthorized('Invalid session token');
  if (data.endedAt) throw Errors.conflict('Session already ended');
  return { id: snap.id, ...data };
}

export async function heartbeat(sessionId, sessionToken, extra = {}) {
  const session = await getSessionByToken(sessionId, sessionToken);
  const db = getFirestore();
  const now = nowIso();
  await db.collection(COLLECTION).doc(sessionId).update({
    lastHeartbeatAt: now,
    ...extra
  });
  await db.collection('devices').doc(session.deviceId).update({
    lastSeenAt: now,
    connectionStatus: 'online',
    updatedAt: now
  });
  return { ...session, lastHeartbeatAt: now };
}

export async function endSession(sessionId, sessionToken, reason) {
  const session = await getSessionByToken(sessionId, sessionToken);
  const db = getFirestore();
  const now = nowIso();
  await db.collection(COLLECTION).doc(sessionId).update({ endedAt: now, reason: reason || null });
  await db.collection('devices').doc(session.deviceId).update({
    connectionStatus: 'offline',
    updatedAt: now
  });
  return { ...session, endedAt: now };
}
