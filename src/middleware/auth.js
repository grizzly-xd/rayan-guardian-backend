import { getAuth } from '../config/firebase.js';
import { getFirestore } from '../config/firebase.js';
import { Errors } from '../utils/errors.js';

/**
 * Admin authentication: verify Firebase ID token and require an adminProfile.
 * Public client endpoints use their own session-token auth (see client.controller).
 */
export async function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw Errors.unauthorized('Missing Bearer token');
    }

    const decoded = await getAuth().verifyIdToken(token, true);
    const db = getFirestore();
    const profileSnap = await db.collection('adminProfiles').doc(decoded.uid).get();

    if (!profileSnap.exists) {
      throw Errors.forbidden('No admin profile for this account');
    }

    const profile = profileSnap.data();
    if (profile.status !== 'active') {
      throw Errors.forbidden('Admin account is not active');
    }

    req.admin = {
      uid: decoded.uid,
      email: decoded.email || profile.email,
      role: profile.role,
      displayName: profile.displayName
    };
    next();
  } catch (err) {
    if (err.status) return next(err);
    next(Errors.unauthorized('Invalid or expired token'));
  }
}
