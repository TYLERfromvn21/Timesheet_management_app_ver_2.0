// backend/src/controllers/AuthController.ts
// this file handles authentication-related requests
// and includes a new function to check system status for setup mode
import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { prisma } from '../app';
import { verifyToken } from '../utils/jwt'; 

// Controller for authentication-related operations
export const AuthController = {
  //function for user login
  login: async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);
      res.json({ success: true, message: 'Login successful', data: result });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message || 'Login failed' });
    }
  },

  //function to  check if system is in setup mode
  checkSystemStatus: async (req: Request, res: Response) => {
    try {
      //count number of admin users in the database
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN_TOTAL' }
      });
      // if no admin users exist, system is in setup mode
      res.json({ isSetupMode: adminCount === 0 });
    } catch (error) {
      res.status(500).json({ isSetupMode: false, error: 'DB Error' });
    }
  },

  //function for admin login with role check
  adminLogin: async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);
      
      // check if user has admin role
      if (result.user.role !== 'ADMIN_TOTAL' && result.user.role !== 'ADMIN_DEPT') {
          return res.status(403).json({ error: 'Bạn không có quyền truy cập trang này!' });
      }

      res.json({ success: true, message: 'Admin Login successful', data: result });
    } catch (error: any) {
      res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
  },

  // function to get current user info based on token
  me: async (req: Request, res: Response) => {
    try {
        // take token from authorization header
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded: any = verifyToken(token);
        if (!decoded) return res.status(401).json({ error: 'Invalid token' });

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: { department: true } 
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // return user info with role and department ID
        res.json({
            username: user.username,
            role: user.role === 'ADMIN_TOTAL' ? 'admin_total' : (user.role === 'ADMIN_DEPT' ? 'admin_dept' : 'user'),
            department: user.departmentId // return department ID
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
  }
};