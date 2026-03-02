// backend/src/controllers/UserController.ts
// This file handles user management: create, read, update, delete users.
// and it ensures password hashing and role/department mapping.

import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

export const UserController = {
  //function to get all users
  getAll: async (req: Request, res: Response) => {
    try {
      const users = await UserService.getAll();
      res.json(users);
    } catch (error) {
      res.status(500).json([]);
    }
  },

  //function to  create a new user
  create: async (req: Request, res: Response) => {
    try {
      const { username, password, type, department, role, departmentId, departmentIds } = req.body;
      const userRole = role || type; 
      
      let deptIdsToConnect: string[] = [];
      if (departmentIds && Array.isArray(departmentIds)) {
          deptIdsToConnect = departmentIds;
      } else if (departmentId || department) {
          deptIdsToConnect = [departmentId || department];
      }

      const newUser = await UserService.create({ 
          username, 
          password, 
          role: userRole, 
          departmentIds: deptIdsToConnect 
      });
      res.json({ success: true, message: 'Tạo tài khoản thành công!', user: newUser });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || 'Lỗi tạo tài khoản' });
    }
  },

  //function to update an existing user
  update: async (req: Request, res: Response) => {
    try {
      await UserService.update(req.body.id, req.body);
      res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi cập nhật tài khoản' });
    }
  },

  //function to delete a user
  delete: async (req: Request, res: Response) => {
    try {
      await UserService.delete(req.body.id);
      res.json({ message: 'Đã xóa tài khoản' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi xóa tài khoản' });
    }
  }
};