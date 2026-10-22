import { asyncHandler } from '../utils/asyncHandler.js';
import * as devicesService from '../services/devices.service.js';
import * as invitationsService from '../services/invitations.service.js';
import * as activityService from '../services/activity.service.js';
import { emitToAdminAndPersist } from '../services/realtime.service.js';

export const listDevices = asyncHandler(async (req, res) => {
  const devices = await devicesService.listDevices(req.admin.uid);
  res.json({ devices });
});

export const createInvitation = asyncHandler(async (req, res) => {
  const ttl = req.body.ttlMinutes
    || Number(process.env.INVITATION_TTL_MINUTES || 15);
  const inv = await invitationsService.createInvitation({
    ownerAdminUid: req.admin.uid,
    deviceType: req.body.deviceType,
    ttlMinutes: ttl
  });

  await activityService.logActivity({
    actorUid: req.admin.uid,
    action: `invitation.create.${req.body.deviceType}`,
    result: 'success'
  });

  const base = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
  const url = `${base}/pair?token=${encodeURIComponent(inv.token)}&type=${req.body.deviceType}`;
  res.status(201).json({
    invitation: {
      id: inv.id,
      token: inv.token, // shown ONCE to admin
      deviceType: inv.deviceType,
      expiresAt: inv.expiresAt,
      pairUrl: url
    }
  });
});

export const getDevice = asyncHandler(async (req, res) => {
  const device = await devicesService.getDevice(req.admin.uid, req.params.id);
  res.json({ device });
});

export const updateDevice = asyncHandler(async (req, res) => {
  const device = await devicesService.updateDevice(req.admin.uid, req.params.id, req.body);
  emitToAdminAndPersist(req.io, req.admin.uid, 'device:updated', device);
  await activityService.logActivity({
    actorUid: req.admin.uid,
    deviceId: device.id,
    action: 'device.update',
    result: 'success'
  });
  res.json({ device });
});

export const deleteDevice = asyncHandler(async (req, res) => {
  await devicesService.deleteDevice(req.admin.uid, req.params.id);
  await activityService.logActivity({
    actorUid: req.admin.uid,
    deviceId: req.params.id,
    action: 'device.delete',
    result: 'success'
  });
  res.status(204).send();
});

export const revokeDevice = asyncHandler(async (req, res) => {
  const device = await devicesService.revokeDevice(req.admin.uid, req.params.id);
  emitToAdminAndPersist(req.io, req.admin.uid, 'session:revoked', {
    deviceId: device.id,
    revokedAt: device.revokedAt
  });
  await activityService.logActivity({
    actorUid: req.admin.uid,
    deviceId: device.id,
    action: 'device.revoke',
    result: 'success'
  });
  res.json({ device });
});
