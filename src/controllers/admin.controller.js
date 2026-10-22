import { getFirestore } from '../config/firebase.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const db = getFirestore();
  const snap = await db.collection('adminProfiles').doc(req.admin.uid).get();
  const data = snap.exists ? snap.data() : {};
  res.json({
    uid: req.admin.uid,
    email: req.admin.email,
    displayName: req.admin.displayName,
    role: req.admin.role,
    status: data.status || 'active',
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null
  });
});

export const getDashboard = asyncHandler(async (req, res) => {
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
    totals: {
      devices: devices.length,
      online,
      offline,
      activeSessions: activeSessionsSnap.size
    },
    recentActivity: recentActivitySnap.docs.map((d) => ({ id: d.id, ...d.data() }))
  });
});
