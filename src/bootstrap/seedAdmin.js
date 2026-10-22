import { initFirebase, getAuth, getFirestore } from '../config/firebase.js';
import { logger } from '../utils/logger.js';
import { nowIso } from '../utils/time.js';

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const displayName = process.env.SEED_ADMIN_NAME || 'Owner Admin';

  if (!email || !password) {
    console.error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, and optionally SEED_ADMIN_NAME');
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('SEED_ADMIN_PASSWORD must be at least 12 characters');
    process.exit(1);
  }

  initFirebase();
  const auth = getAuth();
  const db = getFirestore();

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
    user = await auth.createUser({ email, password, displayName });
  }

  const now = nowIso();
  await db.collection('adminProfiles').doc(user.uid).set({
    uid: user.uid,
    email,
    displayName,
    role: 'owner',
    status: 'active',
    createdAt: now,
    updatedAt: now
  }, { merge: true });

  logger.info({ uid: user.uid, email }, 'admin seeded');
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
