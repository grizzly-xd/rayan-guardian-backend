import { z } from 'zod';

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(80).optional()
}).refine((v) => Object.keys(v).length > 0, { 
  message: 'Minimal satu field harus diisi untuk diperbarui' 
});
