// backend/src/routes/authRoutes.ts
// this file defines the authentication-related routes
// and maps them to the corresponding controller methods
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import rateLimit from 'express-rate-limit'; 

const router: Router = Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, 
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
});

// 1. route for user login 
// 2. route for checking system status
// 3. route for admin login 
// 4. route for getting current user info
router.post('/login', loginLimiter, AuthController.login);
router.get('/check-system-status', AuthController.checkSystemStatus);

router.post('/admin-login', loginLimiter, AuthController.adminLogin); 
router.get('/me', AuthController.me);                  

export default router;