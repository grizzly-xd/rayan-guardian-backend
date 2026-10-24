import { getFirestore } from '../config/firebase.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { nowIso } from '../utils/time.js';
import { Errors } from '../utils/errors.js';

export const getProfile = asyncHandler(async (req, res) => {
  const db = getFirestore();
  const snap = await db.collection('adminProfiles').doc(req.admin.uid).get();
  const data = snap.exists ? snap.data() : {};
  
  res.json({
    uid: req.admin.uid,
    email: req.admin.email,
    displayName: req.admin.displayName || data.displayName,
    role: req.admin.role,
    status: data.status || 'active',
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const db = getFirestore();
  const uid = req.admin.uid;
  const { displayName } = req.body;

  if (!displayName) {
    throw Errors.validation([{ path: ['displayName'], message: 'displayName is required' }]);
  }

  const now = nowIso();
  
  try {
    // 1. Update ke Firestore
    const profileRef = db.collection('adminProfiles').doc(uid);
    const snap = await profileRef.get();
    
    if (!snap.exists) {
      throw Errors.notFound('Profil admin tidak ditemukan');
    }

    await profileRef.update({
      displayName,
      updatedAt: now
    });

    // 2. (Opsional) Update Firebase Auth displayName agar sinkron
    // const { getAuth } = await import('../config/firebase.js');
    // await getAuth().updateUser(uid, { displayName });

    // 3. Kembalikan respons konsisten
    res.json({
      message: 'Profil berhasil diperbarui',
      profile: {
        uid,
        email: req.admin.email,
        displayName,
        role: req.admin.role,
        updatedAt: now
      }
    });
  } catch (err) {
    // Jangan klaim sukses jika gagal
    if (err.status) throw err;
    throw Errors.internal('Gagal memperbarui profil di database');
  }
});

export const getDashboard = asyncHandler(async (req, res) => {
  // ... (Kode dashboard tetap sama seperti sebelumnya)
  const db = getFirestore();
  const uid = req.admin.uid;

  const [devicesSnap, activeSessionsSnap, recentActivitySnap] = await Promise.all([
    db.collection('devices').where('ownerAdminUid', '==', uid).get(),
    db.collection('deviceSessions')
      .where('ownerAdminUid', '==', uid)
      .where('endedAt', '==', null)
      .get(),
    db.collection('activityLogs')
      .where('actorUid', '==', uid)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get()
  ]);

  const devices = devicesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const online = devices.filter((d) => d.connectionStatus === 'online').length;
  const offline = devices.length - online;

  res.json({
    totals: { devices: devices.length, online, offline, activeSessions: activeSessionsSnap.size },
    recentActivity: recentActivitySnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  });
});
