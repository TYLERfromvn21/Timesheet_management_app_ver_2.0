import { Request, Response } from 'express';
import { prisma } from '../app';
import { CurfewService } from '../services/CurfewService';
import { verifyToken } from '../utils/jwt'; // Đảm bảo bạn có file này hoặc dùng logic decode tương tự

export const TaskController = {
  getByDate: async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      // Lấy user từ token để chỉ hiện task của chính họ
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.json([]);
      
      const decoded: any = verifyToken(token); // Hàm verify JWT của bạn

      const tasks = await prisma.task.findMany({
        where: {
          date: new Date(String(date)),
          userId: decoded.id // Chỉ lấy task của user này
        }
      });

      // Map dữ liệu
      const mappedTasks = tasks.map(t => ({
        id: t.id,
        task_id: t.id,
        department: t.department,
        job_code: t.jobCode,
        task_description: t.taskDescription,
        start_time: t.startTime,
        end_time: t.endTime,
        date: t.date
      }));

      res.json(mappedTasks);
    } catch (error) {
      res.json([]);
    }
  },

  save: async (req: Request, res: Response) => {
    try {
      const { task_id, department, job_code, task_description, start_time, end_time, date } = req.body;
      
      // 1. Lấy thông tin User
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });
      const user: any = verifyToken(token); // user.role, user.id

      // 2. CHECK CURFEW (Nếu không phải Admin Tổng)
      if (user.role !== 'ADMIN_TOTAL') {
          if (CurfewService.isRestricted()) {
              return res.status(403).json({ error: 'Hệ thống khóa chức năng khai báo từ 23:00 đến 06:00 sáng!' });
          }
      }

      // 3. Validate Time
      if (new Date(end_time) <= new Date(start_time)) {
          return res.status(400).json({ error: 'Giờ kết thúc phải lớn hơn bắt đầu' });
      }

      const taskData = {
        department,
        jobCode: job_code,
        taskDescription: task_description,
        startTime: new Date(start_time),
        endTime: new Date(end_time),
        date: new Date(date),
        userId: user.id // 👇 LƯU USER ID
      };

      if (task_id) {
        // User chỉ được sửa task của chính mình (có thể thêm check userId ở where)
        await prisma.task.update({ where: { id: task_id }, data: taskData });
      } else {
        await prisma.task.create({ data: taskData });
      }
      res.json({ message: 'Lưu thành công' });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Lỗi lưu task' });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { task_id } = req.body;
      // Cần check quyền sở hữu task trước khi xóa nếu kỹ
      await prisma.task.delete({ where: { id: task_id } });
      res.json({ message: 'Đã xóa task' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi xóa task' });
    }
  }
};