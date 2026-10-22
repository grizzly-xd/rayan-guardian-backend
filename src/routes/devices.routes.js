import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { validate } from '../middleware/validate.js';
import { inviteLimiter } from '../middleware/rateLimit.js';
import { createInvitationSchema } from '../validators/invitations.validator.js';
import { updateDeviceSchema, consentSchema, revokeConsentSchema } from '../validators/devices.validator.js';
import * as devicesController from '../controllers/devices.controller.js';
import * as consentsController from '../controllers/consents.controller.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/', devicesController.listDevices);
router.post('/invitations', inviteLimiter, validate(createInvitationSchema), devicesController.createInvitation);
router.get('/:id', devicesController.getDevice);
router.patch('/:id', validate(updateDeviceSchema), devicesController.updateDevice);
router.delete('/:id', devicesController.deleteDevice);
router.post('/:id/revoke', devicesController.revokeDevice);

// Feature permissions
router.get('/:id/permissions', consentsController.getPermissions);
router.post('/:id/consents', validate(consentSchema), consentsController.recordConsent);
router.post('/:id/consents/revoke', validate(revokeConsentSchema), consentsController.revokeConsent);

export default router;
