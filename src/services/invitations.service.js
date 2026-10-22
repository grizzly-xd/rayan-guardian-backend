import { getFirestore } from '../config/firebase.js';
import { generateInvitationToken, hashToken } from '../utils/crypto.js';
import { minutesFromNow, nowIso, isExpired } from '../utils/time.js';
import { Errors } from '../utils/errors.js';

const COLLECTION = 'deviceInvitations';

export async function createInvitation({ ownerAdminUid, deviceType, ttlMinutes }) {
  const db = getFirestore();
  const token = generateInvitationToken();
  const doc = {
    ownerAdminUid,
    tokenHash: hashToken(token),
    deviceType,
    status: 'pending',
    expiresAt: minutesFromNow(ttlMinutes),
    usedAt: null,
    createdAt: nowIso()
  };
  const ref = await db.collection(COLLECTION).add(doc);
  // return raw token ONCE — never stored
  return { id: ref.id, token, expiresAt: doc.expiresAt, deviceType };
}

export async function getInvitationByToken(token) {
  const db = getFirestore();
  const hash = hashToken(token);
  const snap = await db.collection(COLLECTION).where('tokenHash', '==', hash).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function consumeInvitation(invitationId, updates = {}) {
  const db = getFirestore();
  const ref = db.collection(COLLECTION).doc(invitationId);
  await ref.update({ status: 'used', usedAt: nowIso(), ...updates });
}

export function assertInvitationUsable(inv) {
  if (!inv) throw Errors.notFound('Invitation not found');
  if (inv.status !== 'pending') throw Errors.conflict('Invitation already used or revoked');
  if (isExpired(inv.expiresAt)) throw Errors.conflict('Invitation expired');
}
