import { Router } from 'express';
import { UserController } from '../controllers/UserController';

const router = Router();

router.post('/create', UserController.create);
router.get('/all', UserController.getAll);        // API lấy danh sách
router.post('/update', UserController.update);    // API sửa
router.post('/delete', UserController.delete);    // API xóa

export default router;