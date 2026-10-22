import { getFirestore } from '../config/firebase.js';
import { nowIso } from '../utils/time.js';
import { Errors } from '../utils/errors.js';

const COLLECTION = 'devices';

export async function createDevice(ownerAdminUid, data) {
  const db = getFirestore();
  const now = nowIso();
  const payload = {
    ownerAdminUid,
    deviceName: data.deviceName,
    deviceType: data.deviceType,
    platform: data.platform || 'unknown',
    browser: data.browser || 'unknown',
    appVersion: data.appVersion || 'n/a',
    connectionStatus: 'online',
    lastSeenAt: now,
    consentStatus: data.consentStatus || 'granted',
    createdAt: now,
    updatedAt: now,
    revokedAt: null
  };
  const ref = await db.collection(COLLECTION).add(payload);
  return { id: ref.id, ...payload };
}

export async function listDevices(ownerAdminUid) {
  const db = getFirestore();
  const snap = await db.collection(COLLECTION)
    .where('ownerAdminUid', '==', ownerAdminUid)
    .orderBy('createdAt', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getDevice(ownerAdminUid, deviceId) {
  const db = getFirestore();
  const snap = await db.collection(COLLECTION).doc(deviceId).get();
  if (!snap.exists) throw Errors.notFound('Device not found');
  const data = snap.data();
  if (data.ownerAdminUid !== ownerAdminUid) throw Errors.notFound('Device not found');
  return { id: snap.id, ...data };
}

export async function updateDevice(ownerAdminUid, deviceId, updates) {
  await getDevice(ownerAdminUid, deviceId); // ownership check
  const db = getFirestore();
  const patch = { ...updates, updatedAt: nowIso() };
  await db.collection(COLLECTION).doc(deviceId).update(patch);
  return getDevice(ownerAdminUid, deviceId);
}

export async function revokeDevice(ownerAdminUid, deviceId) {
  await getDevice(ownerAdminUid, deviceId);
  const db = getFirestore();
  const now = nowIso();
  await db.collection(COLLECTION).doc(deviceId).update({
    revokedAt: now,
    connectionStatus: 'offline',
    consentStatus: 'revoked',
    updatedAt: now
  });
  // revoke all sessions for this device
  const sessions = await db.collection('deviceSessions')
    .where('deviceId', '==', deviceId).get();
  const batch = db.batch();
  sessions.docs.forEach((doc) => {
    batch.update(doc.ref, { endedAt: now });
  });
  await batch.commit();
  return getDevice(ownerAdminUid, deviceId);
}

export async function deleteDevice(ownerAdminUid, deviceId) {
  await revokeDevice(ownerAdminUid, deviceId);
  const db = getFirestore();
  await db.collection(COLLECTION).doc(deviceId).delete();
}

export async function markOfflineDevices(thresholdSeconds) {
  const db = getFirestore();
  const cutoff = new Date(Date.now() - thresholdSeconds * 1000).toISOString();
  const snap = await db.collection(COLLECTION)
    .where('connectionStatus', '==', 'online')
    .where('lastSeenAt', '<', cutoff)
    .get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach((doc) => {
    batch.update(doc.ref, {
      connectionStatus: 'offline',
      updatedAt: nowIso()
    });
  });
  await batch.commit();
  return snap.size;
}
