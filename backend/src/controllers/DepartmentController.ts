// backend/src/controllers/DepartmentController.ts
// this file handles department-related requests
// and includes functions to get, create, update, and delete departments
import { Request, Response } from 'express';
import { prisma } from '../app';

// Controller for department-related operations
export const DepartmentController = {
  // function to get all departments
  getAll: async (req: Request, res: Response) => {
    try {
      const depts = await prisma.department.findMany({ orderBy: { name: 'asc' } });
      res.json(depts);
    } catch (error) {
      res.status(500).json({ message: 'Lỗi lấy danh sách phòng ban' });
    }
  },
  
  // function to create a new department
  create: async (req: Request, res: Response) => {
    try {
      const { name, code } = req.body;
      // auto-generate code if not provided
      const generatedCode = code || name.toUpperCase().replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const newDept = await prisma.department.create({
        data: { name, code: generatedCode }
      });
      res.json({ message: 'Thêm phòng ban thành công', data: newDept });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi tạo phòng ban (Tên hoặc Mã đã tồn tại)' });
    }
  },

  // function to update an existing department
  update: async (req: Request, res: Response) => {
    try {
      const { id, name } = req.body;
      await prisma.department.update({
        where: { id },
        data: { name }
      });
      res.json({ message: 'Cập nhật thành công' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi cập nhật' });
    }
  },

  // function to delete a department
  delete: async (req: Request, res: Response) => {
    try {
      const { id } = req.body;
      await prisma.department.delete({ where: { id } });
      res.json({ message: 'Đã xóa phòng ban' });
    } catch (error) {
      res.status(500).json({ error: 'Không thể xóa (Có thể đang có nhân viên thuộc phòng này)' });
    }
  }
};