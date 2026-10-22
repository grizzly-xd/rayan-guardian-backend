import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import * as adminController from '../controllers/admin.controller.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/profile', adminController.getProfile);
router.get('/dashboard', adminController.getDashboard);

export default router;
