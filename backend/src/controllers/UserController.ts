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
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        include: { department: true },
        orderBy: { username: 'asc' }
      });
      // Map dữ liệu trả về cho gọn
      const mappedUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role === 'ADMIN_TOTAL' ? 'admin_total' : (u.role === 'ADMIN_DEPT' ? 'admin_dept' : 'user'),
        department: u.department ? u.department.name : '-',
        departmentId: u.departmentId // Để lọc
      }));
      res.json(mappedUsers);
    } catch (error) {
      res.status(500).json([]);
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { id, username, password } = req.body;
      const updateData: any = { username };
      
      // Chỉ update password nếu có nhập
      if (password && password.trim() !== '') {
        updateData.password = await bcrypt.hash(password, 10);
      }

      await prisma.user.update({
        where: { id },
        data: updateData
      });
      res.json({ message: 'Cập nhật tài khoản thành công' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi cập nhật tài khoản' });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      await prisma.user.delete({ where: { id } });
      res.json({ message: 'Đã xóa tài khoản' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi xóa tài khoản' });
    }
  }
};