import { asyncHandler } from '../utils/asyncHandler.js';
import * as activityService from '../services/activity.service.js';

export const listActivityLogs = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const logs = await activityService.listActivity({
    actorUid: req.admin.uid,
    limit
  });
  res.json({ logs });
});
