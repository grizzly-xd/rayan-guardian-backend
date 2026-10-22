import { getFirestore } from '../config/firebase.js';
import { nowIso } from '../utils/time.js';

export async function logActivity({ actorUid, deviceId, action, result }) {
  const db = getFirestore();
  await db.collection('activityLogs').add({
    actorUid: actorUid || null,
    deviceId: deviceId || null,
    action,
    result: result || 'success',
    timestamp: nowIso()
  });
}

export async function listActivity({ actorUid, limit = 50 }) {
  const db = getFirestore();
  let query = db.collection('activityLogs').orderBy('timestamp', 'desc').limit(limit);
  if (actorUid) {
    query = db.collection('activityLogs')
      .where('actorUid', '==', actorUid)
      .orderBy('timestamp', 'desc')
      .limit(limit);
  }
  const snap = await query.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
