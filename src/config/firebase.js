import admin from 'firebase-admin';

function normalizePrivateKey(key) {
  if (!key) return undefined;
  return key.replace(/\\n/g, '\n');
}

let initialized = false;

export function initFirebase() {
  if (initialized) return admin;
  const {
    FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY
  } = process.env;

  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error('Missing Firebase admin credentials in environment');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(FIREBASE_PRIVATE_KEY)
    })
  });
  initialized = true;
  return admin;
}

export function getAuth() {
  return initFirebase().auth();
}
export function getFirestore() {
  return initFirebase().firestore();
}
export function getAdmin() {
  return initFirebase();
}
