import { z } from 'zod';

export const updateDeviceSchema = z.object({
  deviceName: z.string().min(1).max(120).optional(),
  consentStatus: z.enum(['granted', 'revoked', 'pending']).optional()
}).refine((v) => Object.keys(v).length > 0, { message: 'No fields to update' });

export const consentSchema = z.object({
  consentScope: z.array(z.enum(['camera', 'screen', 'gallery', 'notifications', 'sms', 'contacts'])).nonempty(),
  consentVersion: z.string().min(1).max(60),
  sessionId: z.string().min(1).max(128).optional()
});

export const revokeConsentSchema = z.object({
  scope: z.array(z.enum(['camera', 'screen', 'gallery', 'notifications', 'sms', 'contacts'])).nonempty()
});
