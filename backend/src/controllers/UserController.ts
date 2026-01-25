import { Request, Response } from 'express';
import { prisma } from '../app';
import * as bcrypt from 'bcryptjs';

export const UserController = {
  create: async (req: Request, res: Response) => {
    try {
      const { username, password, type, department, role, departmentId } = req.body;

      // Map dữ liệu từ form cũ (type/department) sang chuẩn mới (role/departmentId) nếu cần
      // Vì React mình sẽ gửi chuẩn role/departmentId luôn nên dùng trực tiếp:
      const userRole = role || type; // Hỗ trợ cả 2 tên biến
      const deptId = departmentId || department;

      // Kiểm tra trùng username
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });
      }

      // Mã hóa mật khẩu
      const hashedPassword = await bcrypt.hash(password, 10);

      // Tạo user
      const newUser = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: userRole === 'admin_dept' ? 'ADMIN_DEPT' : (userRole === 'admin_total' ? 'ADMIN_TOTAL' : 'USER'),
          // Admin tổng không cần phòng ban, còn lại bắt buộc nếu logic yêu cầu
          departmentId: userRole === 'admin_total' ? undefined : deptId
        }
      });

      res.json({ success: true, message: 'Tạo tài khoản thành công!', user: newUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server khi tạo tài khoản' });
    }
  }
};