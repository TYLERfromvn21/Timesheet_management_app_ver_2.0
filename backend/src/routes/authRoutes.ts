// backend/src/routes/authRoutes.ts
// this file defines the authentication-related routes
// and maps them to the corresponding controller methods
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

// 1. route for user login
// 2. route for checking system status
// 3. route for admin login
// 4. route for getting current user info
router.post('/login', AuthController.login);
router.get('/check-system-status', AuthController.checkSystemStatus);

router.post('/admin-login', AuthController.adminLogin); 
router.get('/me', AuthController.me);                  

export default router;