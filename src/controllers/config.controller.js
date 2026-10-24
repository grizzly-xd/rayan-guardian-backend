export function getPublicConfig(req, res) {
  // Jangan pernah memasukkan FIREBASE_PRIVATE_KEY, dll di sini!
  res.json({
    config: {
      apiVersion: '1.1.0',
      environment: process.env.NODE_ENV || 'development',
      socketUrl: process.env.SOCKET_URL || null, // Opsional jika socket di host berbeda
      invitationTtlMinutes: Number(process.env.INVITATION_TTL_MINUTES || 15),
      heartbeatIntervalSeconds: Number(process.env.HEARTBEAT_INTERVAL_SECONDS || 30),
      offlineThresholdSeconds: Number(process.env.OFFLINE_THRESHOLD_SECONDS || 120)
    }
  });
}
