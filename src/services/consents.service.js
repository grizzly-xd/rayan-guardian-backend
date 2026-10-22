import { getFirestore } from '../config/firebase.js';
import { nowIso } from '../utils/time.js';
import { Errors } from '../utils/errors.js';

export async function recordConsent({ deviceId, sessionId, ownerAdminUid, consentScope, consentVersion, consentStatus }) {
  const db = getFirestore();
  const now = nowIso();
  const payload = {
    deviceId,
    sessionId: sessionId || null,
    ownerAdminUid,
    consentScope,
    consentStatus,
    consentVersion,
    grantedAt: consentStatus === 'granted' ? now : null,
    revokedAt: consentStatus === 'revoked' ? now : null
  };
  const ref = await db.collection('deviceConsents').add(payload);
  await db.collection('devices').doc(deviceId).update({
    consentStatus: consentStatus === 'granted' ? 'granted' : 'revoked',
    updatedAt: now
  });
  return { id: ref.id, ...payload };
}

export async function listConsents(ownerAdminUid, deviceId) {
  const db = getFirestore();
  const snap = await db.collection('deviceConsents')
    .where('deviceId', '==', deviceId)
    .where('ownerAdminUid', '==', ownerAdminUid)
    .orderBy('grantedAt', 'desc')
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function revokeConsents(ownerAdminUid, deviceId, scope) {
  const db = getFirestore();
  const snap = await db.collection('deviceConsents')
    .where('deviceId', '==', deviceId)
    .where('ownerAdminUid', '==', ownerAdminUid)
    .get();
  if (snap.empty) throw Errors.notFound('No consents to revoke');
  const now = nowIso();
  const batch = db.batch();
  let matched = 0;
  snap.docs.forEach((doc) => {
    const data = doc.data();
    const overlap = data.consentScope.filter((s) => scope.includes(s));
    if (overlap.length > 0) {
      batch.update(doc.ref, {
        consentStatus: 'revoked',
        revokedAt: now
      });
      matched += 1;
    }
  });
  if (matched === 0) throw Errors.notFound('No matching consents');
  await batch.commit();
  return { revokedCount: matched };
}
