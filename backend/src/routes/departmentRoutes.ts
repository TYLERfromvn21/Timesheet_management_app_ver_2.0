import { Router } from 'express';
import { DepartmentController } from '../controllers/DepartmentController';

const router = Router();

router.get('/', DepartmentController.getAll);
router.post('/add', DepartmentController.create);
router.post('/update', DepartmentController.update);
router.post('/delete', DepartmentController.delete);

export default router;