// backend/src/routes/departmentRoutes.ts
// this file defines the routes for department-related operations
// and maps them to the corresponding controller methods
import { Router } from 'express';
import { DepartmentController } from '../controllers/DepartmentController';

const router = Router();

// 1. Route to get all departments
// 2. Route to add a new department
// 3. Route to update an existing department
// 4. Route to delete a department
router.get('/', DepartmentController.getAll);
router.post('/add', DepartmentController.create);
router.post('/update', DepartmentController.update);
router.post('/delete', DepartmentController.delete);

export default router;