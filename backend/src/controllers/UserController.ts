// backend/src/controllers/UserController.ts
// This file handles user management: create, read, update, delete users.
// and it ensures password hashing and role/department mapping.

import { Request, Response } from 'express';
import { prisma } from '../app';
import * as bcrypt from 'bcryptjs';

export const UserController = {
  // Create a new user
  create: async (req: Request, res: Response) => {
    try {
      const { username, password, type, department, role, departmentId } = req.body;

      const userRole = role || type; // Hỗ trợ cả 2 tên biến
      const deptId = departmentId || department;

      // Check if username already exists
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // create user
      const newUser = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
          role: userRole === 'admin_dept' ? 'ADMIN_DEPT' : (userRole === 'admin_total' ? 'ADMIN_TOTAL' : 'USER'),
          departmentId: userRole === 'admin_total' ? undefined : deptId
        }
      });

      res.json({ success: true, message: 'Tạo tài khoản thành công!', user: newUser });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Lỗi server khi tạo tài khoản' });
    }
  },
  //function to get all users
  getAll: async (req: Request, res: Response) => {
    try {
      const users = await prisma.user.findMany({
        include: { department: true },
        orderBy: { username: 'asc' }
      });
      const mappedUsers = users.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role === 'ADMIN_TOTAL' ? 'admin_total' : (u.role === 'ADMIN_DEPT' ? 'admin_dept' : 'user'),
        department: u.department ? u.department.name : '-',
        departmentId: u.departmentId 
      }));
      res.json(mappedUsers);
    } catch (error) {
      res.status(500).json([]);
    }
  },

    //function to update a user
  update: async (req: Request, res: Response) => {
    try {
      const { id, username, password } = req.body;
      const updateData: any = { username };
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

  //function to delete a user
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