import { Router } from 'express';
import healthRouter from './health.routes.js';
import adminRouter from './admin.routes.js';
import devicesRouter from './devices.routes.js';
import clientRouter from './client.routes.js';
import activityRouter from './activity.routes.js';

const router = Router();

router.use(healthRouter);
router.use('/admin', adminRouter);
router.use('/devices', devicesRouter);
router.use('/client', clientRouter);
router.use('/activity-logs', activityRouter);

export default router;
