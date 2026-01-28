import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';

const router = Router();

router.get('/:date', TaskController.getByDate);
router.post('/save', TaskController.save);
router.post('/delete', TaskController.delete);

export default router;