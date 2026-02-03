// backend/src/routes/reportRoutes.ts
// this file defines the routes for report related operations
// and maps them to the corresponding controller methods.
import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';

const router = Router();

// 1.route to export user report
// 2.route to export job report
router.get('/user-report', ReportController.exportUserReport);
router.get('/job-report', ReportController.exportJobReport);

export default router;