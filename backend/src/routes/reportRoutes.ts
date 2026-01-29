import { Router } from 'express';
import { ReportController } from '../controllers/ReportController';

const router = Router();

router.get('/user-report', ReportController.exportUserReport);
router.get('/job-report', ReportController.exportJobReport);

export default router;