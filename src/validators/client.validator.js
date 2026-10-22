import { z } from 'zod';

export const heartbeatSchema = z.object({
  sessionToken: z.string().min(20),
  appVersion: z.string().max(60).optional(),
  connectionStatus: z.enum(['online', 'offline']).optional()
});

export const disconnectSchema = z.object({
  sessionToken: z.string().min(20),
  reason: z.string().max(200).optional()
});
