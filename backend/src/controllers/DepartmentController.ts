// backend/src/controllers/DepartmentController.ts
// this file handles department-related requests
// and includes functions to get, create, update, and delete departments

import { Request, Response } from 'express';
import { DepartmentService } from '../services/DepartmentService';

export const DepartmentController = {
  // function to get all departments
  getAll: async (req: Request, res: Response) => {
    try {
      const depts = await DepartmentService.getAll();
      res.json(depts);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server' });
    }
  },
  
  // function to create a new department
  create: async (req: Request, res: Response) => {
    try {
      const { name, code } = req.body;
      const newDept = await DepartmentService.create(name, code);
      res.json({ message: 'Thêm thành công', data: newDept });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi tạo (Tên hoặc Mã đã tồn tại)' });
    }
  },

  // function to update an existing department
  update: async (req: Request, res: Response) => {
    try {
      await DepartmentService.update(req.body.id, req.body.name);
      res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi cập nhật' });
    }
  },

  // function to delete a department
  delete: async (req: Request, res: Response) => {
    try {
      await DepartmentService.delete(req.body.id);
      res.json({ message: 'Đã xóa' });
    } catch (error) {
      res.status(500).json({ error: 'Không thể xóa (Có ràng buộc dữ liệu)' });
    }
  }
};