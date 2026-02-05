// backend/src/controllers/AuthController.ts
// this file handles authentication-related requests
// and includes a new function to check system status for setup mode
import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { verifyToken } from '../utils/jwt'; 

export const AuthController = {
  // function for user login
  login: async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);
      res.json({ success: true, message: 'Login successful', data: result });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message || 'Login failed' });
    }
  },

  //function to check if the system is in setup mode
  checkSystemStatus: async (req: Request, res: Response) => {
    try {
      const isSetupMode = await AuthService.isSetupMode();
      res.json({ isSetupMode });
    } catch (error) {
      res.status(500).json({ isSetupMode: false, error: 'DB Error' });
    }
  },

  // function for admin login with authorization check
  adminLogin: async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);
      
      if (result.user.role !== 'ADMIN_TOTAL' && result.user.role !== 'ADMIN_DEPT') {
          return res.status(403).json({ error: 'Bạn không có quyền truy cập trang này!' });
      }

      res.json({ success: true, message: 'Admin Login successful', data: result });
    } catch (error: any) {
      res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
  },

  //function to get user profile
  me: async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded: any = verifyToken(token);
        if (!decoded) return res.status(401).json({ error: 'Invalid token' });

        const userProfile = await AuthService.getProfile(decoded.id);
        res.json(userProfile);
    } catch (error: any) {
        res.status(404).json({ error: error.message || 'Server error' });
    }
  }
};