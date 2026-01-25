import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { prisma } from '../app';
import { verifyToken } from '../utils/jwt'; // Nhớ import hàm này

export const AuthController = {
  login: async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);
      res.json({ success: true, message: 'Login successful', data: result });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message || 'Login failed' });
    }
  },

  // --- HÀM MỚI: Check System Status ---
  checkSystemStatus: async (req: Request, res: Response) => {
    try {
      // Đếm số lượng Admin Tổng trong hệ thống
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN_TOTAL' }
      });
      // Nếu chưa có ai -> Mode Setup (isSetupMode = true)
      res.json({ isSetupMode: adminCount === 0 });
    } catch (error) {
      res.status(500).json({ isSetupMode: false, error: 'DB Error' });
    }
  },

  adminLogin: async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      const result = await AuthService.login(username, password);
      
      // Kiểm tra xem có phải Admin không (Logic riêng của trang này)
      if (result.user.role !== 'ADMIN_TOTAL' && result.user.role !== 'ADMIN_DEPT') {
          return res.status(403).json({ error: 'Bạn không có quyền truy cập trang này!' });
      }

      res.json({ success: true, message: 'Admin Login successful', data: result });
    } catch (error: any) {
      res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    }
  },

  // 2. API lấy thông tin người dùng hiện tại (Thay cho /user-info cũ)
  me: async (req: Request, res: Response) => {
    try {
        // Lấy token từ header Authorization: "Bearer <token>"
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded: any = verifyToken(token);
        if (!decoded) return res.status(401).json({ error: 'Invalid token' });

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: { department: true } // Lấy cả tên phòng ban nếu cần
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Trả về định dạng khớp với logic cũ để frontend dễ xử lý
        res.json({
            username: user.username,
            role: user.role === 'ADMIN_TOTAL' ? 'admin_total' : (user.role === 'ADMIN_DEPT' ? 'admin_dept' : 'user'),
            department: user.departmentId // Trả về ID phòng ban
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
  }
};