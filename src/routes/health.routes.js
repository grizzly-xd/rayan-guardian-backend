import { Router } from 'express';
import { health } from '../controllers/health.controller.js';

const router = Router();
// Tetap dipertahankan untuk kompatibilitas frontend lama
router.get('/health', health); 
export default router;
