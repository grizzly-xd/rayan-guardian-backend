import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { clientLimiter } from '../middleware/rateLimit.js';
import { acceptInvitationSchema } from '../validators/invitations.validator.js';
import { heartbeatSchema, disconnectSchema } from '../validators/client.validator.js';
import * as clientController from '../controllers/client.controller.js';

const router = Router();
router.use(clientLimiter);

router.get('/invitations/:token', clientController.getInvitation);
router.post('/invitations/:token/accept', validate(acceptInvitationSchema), clientController.acceptInvitation);

router.post('/sessions/:sessionId/heartbeat', validate(heartbeatSchema), clientController.heartbeat);
router.post('/sessions/:sessionId/disconnect', validate(disconnectSchema), clientController.disconnect);

// APK update check (requires sessionToken in query)
router.get('/sessions/:sessionId/version', clientController.checkVersion);

export default router;
