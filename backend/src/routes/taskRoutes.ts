// backend/src/routes/taskRoutes.ts
// This file defines the routes for task-related operations.
// and connects them to the corresponding controller methods.
import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';

const router = Router();

// 1. route to get tasks by date
// 2. route to save a task
// 3. route to delete a task
router.get('/:date', TaskController.getByDate);
router.post('/save', TaskController.save);
router.post('/delete', TaskController.delete);

export default router;