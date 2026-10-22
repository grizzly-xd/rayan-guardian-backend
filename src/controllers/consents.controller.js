import { asyncHandler } from '../utils/asyncHandler.js';
import * as devicesService from '../services/devices.service.js';
import * as consentsService from '../services/consents.service.js';
import * as activityService from '../services/activity.service.js';
import { emitToAdminAndPersist } from '../services/realtime.service.js';

export const getPermissions = asyncHandler(async (req, res) => {
  const device = await devicesService.getDevice(req.admin.uid, req.params.id);
  const consents = await consentsService.listConsents(req.admin.uid, device.id);
  res.json({
    deviceId: device.id,
    consentStatus: device.consentStatus,
    consents
  });
});

export const recordConsent = asyncHandler(async (req, res) => {
  const device = await devicesService.getDevice(req.admin.uid, req.params.id);
  const consent = await consentsService.recordConsent({
    deviceId: device.id,
    sessionId: req.body.sessionId || null,
    ownerAdminUid: req.admin.uid,
    consentScope: req.body.consentScope,
    consentVersion: req.body.consentVersion,
    consentStatus: 'granted'
  });
  emitToAdminAndPersist(req.io, req.admin.uid, 'device:updated', {
    deviceId: device.id,
    consentStatus: 'granted'
  });
  await activityService.logActivity({
    actorUid: req.admin.uid,
    deviceId: device.id,
    action: 'consent.grant',
    result: 'success'
  });
  res.status(201).json({ consent });
});

export const revokeConsent = asyncHandler(async (req, res) => {
  const device = await devicesService.getDevice(req.admin.uid, req.params.id);
  const result = await consentsService.revokeConsents(req.admin.uid, device.id, req.body.scope);
  emitToAdminAndPersist(req.io, req.admin.uid, 'device:updated', {
    deviceId: device.id,
    consentStatus: 'revoked',
    revokedScopes: req.body.scope
  });
  await activityService.logActivity({
    actorUid: req.admin.uid,
    deviceId: device.id,
    action: 'consent.revoke',
    result: 'success'
  });
  res.json(result);
});
