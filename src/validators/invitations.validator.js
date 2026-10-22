import { z } from 'zod';

export const createInvitationSchema = z.object({
  deviceType: z.enum(['url', 'apk']),
  label: z.string().max(120).optional(),
  ttlMinutes: z.number().int().min(1).max(120).optional()
});

export const acceptInvitationSchema = z.object({
  deviceName: z.string().min(1).max(120),
  platform: z.string().max(60).optional(),
  browser: z.string().max(60).optional(),
  appVersion: z.string().max(60).optional(),
  consentVersion: z.string().min(1).max(60),
  consentScope: z.array(z.enum(['camera', 'screen', 'gallery', 'notifications', 'sms', 'contacts'])).nonempty()
});
