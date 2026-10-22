import { asyncHandler } from '../utils/asyncHandler.js';
import { Errors } from '../utils/errors.js';
import * as invitationsService from '../services/invitations.service.js';
import * as devicesService from '../services/devices.service.js';
import * as sessionsService from '../services/sessions.service.js';
import * as consentsService from '../services/consents.service.js';
import * as activityService from '../services/activity.service.js';
import { emitToAdminAndPersist } from '../services/realtime.service.js';

/**
 * IMPORTANT: These endpoints are PUBLIC relative to admin auth.
 * Access control is enforced via a single-use invitation token (URL flow)
 * or a device-bound session token (APK flow).
 */

export const getInvitation = asyncHandler(async (req, res) => {
  const inv = await invitationsService.getInvitationByToken(req.params.token);
  invitationsService.assertInvitationUsable(inv);
  res.json({
    invitation: {
      id: inv.id,
      deviceType: inv.deviceType,
      expiresAt: inv.expiresAt,
      status: inv.status
    }
  });
});

export const acceptInvitation = asyncHandler(async (req, res) => {
  const inv = await invitationsService.getInvitationByToken(req.params.token);
  invitationsService.assertInvitationUsable(inv);

  // Prevent client from choosing a different deviceType than the invitation
  const { deviceType } = inv;
  const device = await devicesService.createDevice(inv.ownerAdminUid, {
    deviceName: req.body.deviceName,
    deviceType,
    platform: req.body.platform,
    browser: req.body.browser,
    appVersion: req.body.appVersion,
    consentStatus: 'granted'
  });

  const session = await sessionsService.createSession({
    deviceId: device.id,
    ownerAdminUid: inv.ownerAdminUid,
    sessionType: deviceType === 'apk' ? 'apk' : 'url',
    consentVersion: req.body.consentVersion
  });

  await consentsService.recordConsent({
    deviceId: device.id,
    sessionId: session.id,
    ownerAdminUid: inv.ownerAdminUid,
    consentScope: req.body.consentScope,
    consentVersion: req.body.consentVersion,
    consentStatus: 'granted'
  });

  await invitationsService.consumeInvitation(inv.id);

  await activityService.logActivity({
    actorUid: inv.ownerAdminUid,
    deviceId: device.id,
    action: 'device.pair.accept',
    result: 'success'
  });

  emitToAdminAndPersist(req.io, inv.ownerAdminUid, 'device:status', {
    deviceId: device.id,
    status: 'online',
    at: new Date().toISOString()
  });

  res.status(201).json({
    device: {
      id: device.id,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      connectionStatus: device.connectionStatus
    },
    session: {
      id: session.id,
      sessionToken: session.sessionToken // client must store securely, never expose to admin URL
    }
  });
});

export const heartbeat = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { sessionToken, appVersion, connectionStatus } = req.body;
  const session = await sessionsService.heartbeat(sessionId, sessionToken, {
    appVersion: appVersion || undefined,
    connectionStatus: connectionStatus || undefined
  });
  emitToAdminAndPersist(req.io, session.ownerAdminUid, 'device:status', {
    deviceId: session.deviceId,
    status: 'online',
    at: session.lastHeartbeatAt
  });
  res.json({ ok: true, lastHeartbeatAt: session.lastHeartbeatAt });
});

export const disconnect = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { sessionToken, reason } = req.body;
  const session = await sessionsService.endSession(sessionId, sessionToken, reason);
  emitToAdminAndPersist(req.io, session.ownerAdminUid, 'device:status', {
    deviceId: session.deviceId,
    status: 'offline',
    at: session.endedAt
  });
  res.json({ ok: true, endedAt: session.endedAt });
});

// For APK clients to check for updates (no admin auth required; requires session token)
export const checkVersion = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { sessionToken } = req.query;
  if (!sessionToken) throw Errors.unauthorized('Missing sessionToken');
  await sessionsService.getSessionByToken(sessionId, sessionToken);
  res.json({
    latestVersion: process.env.APP_LATEST_VERSION || '1.0.0',
    minSupportedVersion: process.env.APP_MIN_VERSION || '1.0.0',
    updateUrl: process.env.APP_UPDATE_URL || null
  });
});
