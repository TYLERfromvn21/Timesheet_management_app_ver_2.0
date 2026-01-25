import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

router.post('/login', AuthController.login);
router.get('/check-system-status', AuthController.checkSystemStatus);

router.post('/admin-login', AuthController.adminLogin); // Cho trang AdminAuth
router.get('/me', AuthController.me);                   // Cho trang AdminCreate (user-info)

export default router;