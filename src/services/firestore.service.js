import { getFirestore } from '../config/firebase.js';
import { nowIso } from '../utils/time.js';

/**
 * Generic Firestore helpers shared by domain services.
 * Keeps batching and timestamp conventions consistent.
 */

export function db() {
  return getFirestore();
}

export function serverTimestamp() {
  return nowIso();
}

export async function getDocOrNull(collection, id) {
  const snap = await db().collection(collection).doc(id).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

export async function setDocMerge(collection, id, data) {
  await db().collection(collection).doc(id).set(
    { ...data, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function addDoc(collection, data) {
  const ref = await db().collection(collection).add({
    ...data,
    createdAt: data.createdAt || serverTimestamp()
  });
  return ref.id;
}

export async function queryByField(collection, field, value, { orderBy, direction = 'desc', limit } = {}) {
  let q = db().collection(collection).where(field, '==', value);
  if (orderBy) q = q.orderBy(orderBy, direction);
  if (limit) q = q.limit(limit);
  const snap = await q.get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function batchUpdate(refs) {
  const batch = db().batch();
  refs.forEach(({ ref, data }) => batch.update(ref, data));
  await batch.commit();
}

export async function batchDelete(refs) {
  const batch = db().batch();
  refs.forEach((ref) => batch.delete(ref));
  await batch.commit();
}
