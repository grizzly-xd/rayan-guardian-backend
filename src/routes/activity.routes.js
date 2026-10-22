import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import * as activityController from '../controllers/activity.controller.js';

const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/', activityController.listActivityLogs);

export default router;
