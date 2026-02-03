// backend/src/controllers/TaskController.ts
// This file contains task-related controllers
// and uses TaskService for complex operations
import { Request, Response } from 'express';
import { prisma } from '../app';
import { CurfewService } from '../services/CurfewService';
import { TaskService } from '../services/TaskService'; // Import Service
import * as jwt from 'jsonwebtoken';

// function to extract userId from JWT token
const getUserIdFromToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_2025_final_v4'); 
      return decoded.id || decoded.userId; 
    } catch (e) { return null; }
  }
  return null;
};

export const TaskController = {
  // function to get tasks by date
  getByDate: async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const userId = getUserIdFromToken(req);
      if (!userId) return res.json([]);

      const searchDate = new Date(String(date));
      searchDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const tasks = await prisma.task.findMany({
        where: {
          date: { gte: searchDate, lt: nextDay },
          userId: String(userId)  
        },
        orderBy: { startTime: 'asc' }
      });

      // Map data
      const mappedTasks = tasks.map(t => ({
        id: t.id,
        task_id: t.id,
        department: t.department,
        job_code: t.jobCode,
        task_description: t.taskDescription,
        start_time: t.startTime.toISOString(),
        end_time: t.endTime.toISOString(),
        date: t.date.toISOString()
      }));

      res.json(mappedTasks);
    } catch (error) {
      console.error("Lỗi lấy task:", error);
      res.status(500).json({ error: 'Lỗi server' });
    }
  },

  // function to save (create or update) a task
  save: async (req: Request, res: Response) => {
    try {
      const userId = getUserIdFromToken(req);
      if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập' });

      await TaskService.saveTask({
        taskId: req.body.task_id,
        department: req.body.department,
        jobCode: req.body.job_code,
        taskDescription: req.body.task_description,
        startTime: req.body.start_time,
        endTime: req.body.end_time,
        date: req.body.date,
        userId: String(userId)
      });

      res.json({ message: 'Lưu thành công', success: true });
    } catch (error: any) {
      console.log("Lỗi lưu:", error.message);
      res.status(400).json({ error: error.message || 'Lỗi lưu task' });
    }
  },

  // function to delete a task
  delete: async (req: Request, res: Response) => {
    try {
      const { task_id } = req.body;
      const userId = getUserIdFromToken(req);
      if (!userId) return res.status(401).json({ error: 'Unauthorized' });

      await TaskService.deleteTask(task_id, String(userId));
      
      res.json({ message: 'Đã xóa task' });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Lỗi xóa task' });
    }
  }
};