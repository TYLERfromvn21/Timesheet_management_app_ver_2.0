// backend/src/routes/jobCodeRoutes.ts
// this file defines the routes for job code related operations
// and maps them to the corresponding controller methods.
import { Router } from 'express';
import { JobCodeController } from '../controllers/JobCodeController';

const router: Router = Router();
// Define routes and map them to controller methods
// 1. Route to get job codes by department
// 2. Route to save a new job code
// 3. Route to delete a job code

router.get('/:dept', JobCodeController.getByDept);
router.post('/save', JobCodeController.create);
router.post('/delete', JobCodeController.delete);

export default router;