import { Router } from 'express';
import {
  trackVisit,
  trackHeartbeat,
  getOverview,
  getLiveLogs,
  clearLogs,
  exportCsv,
} from './analytics.controller.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';

// Public router for client portfolio beacon
export const publicAnalyticsRouter = Router();
publicAnalyticsRouter.post('/track', trackVisit);
publicAnalyticsRouter.post('/heartbeat', trackHeartbeat);

// Protected router for Admin CMS
export const adminAnalyticsRouter = Router();
adminAnalyticsRouter.use(requireAuth);
adminAnalyticsRouter.get('/overview', getOverview);
adminAnalyticsRouter.get('/live', getLiveLogs);
adminAnalyticsRouter.get('/export', exportCsv);
adminAnalyticsRouter.delete('/clear', requireRole('owner'), clearLogs);

export default {
  public: publicAnalyticsRouter,
  admin: adminAnalyticsRouter,
};
