import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/admin.validator.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/profile', adminController.getProfile);
router.patch('/profile', validate(updateProfileSchema), adminController.updateProfile); // Rute Baru
router.get('/dashboard', adminController.getDashboard);

export default router;
