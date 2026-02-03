//backend/src/controllers/TaskController.ts
//this file handles task-related operations: get by date, save, delete
// and is using Express.js for routing and Prisma for database operations

import { Request, Response } from 'express';
import { prisma } from '../app';
import { CurfewService } from '../services/CurfewService';
import * as jwt from 'jsonwebtoken';

// function to get userId from JWT token
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
  // --- GET TASK BY DATE ---
getByDate: async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      const userId = getUserIdFromToken(req);
      
      // If no token, return empty array
      if (!userId) {
        return res.json([]);
      }

      // Date range query
      const searchDate = new Date(String(date));
      searchDate.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(searchDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const tasks = await prisma.task.findMany({
        where: {
          date: {
            gte: searchDate,
            lt: nextDay
          },
          userId: String(userId)  
        },
        orderBy: {
          startTime: 'asc'
        }
      });

      // Map data for frontend
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
  // --- SAVE TASK ---
  save: async (req: Request, res: Response) => {
    try {
      const { task_id, department, job_code, task_description, start_time, end_time, date } = req.body;
      
      const userId = getUserIdFromToken(req);
      if (!userId) return res.status(401).json({ error: 'Chưa đăng nhập (Token Invalid)' });

      const startDateTime = new Date(start_time);
      const endDateTime = new Date(end_time);
      const taskDate = new Date(date);
      taskDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

      // Validate
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          return res.status(400).json({ error: 'Định dạng thời gian không hợp lệ' });
      }

      if (endDateTime <= startDateTime) {
          return res.status(400).json({ error: 'Giờ kết thúc phải lớn hơn bắt đầu' });
      }

      const taskData = {
        department,
        jobCode: job_code,
        taskDescription: task_description,
        startTime: startDateTime,
        endTime: endDateTime,
        date: taskDate,  
        userId: String(userId)
      };

      // In TaskController.ts - save function
if (task_id) {
    // Verify ownership before updating
    const existingTask = await prisma.task.findUnique({
        where: { id: task_id }
    });
    
    if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
    }
    
    if (existingTask.userId !== String(userId)) {
        return res.status(403).json({ error: 'You can only edit your own tasks' });
    }
    
    await prisma.task.update({ 
        where: { id: task_id }, 
        data: taskData 
    });
} else {
    await prisma.task.create({ data: taskData });
}
      
      res.json({ message: 'Lưu thành công', success: true });
    } catch (error) {
      console.log("Lỗi lưu:", error);
      res.status(500).json({ error: 'Lỗi lưu task' });
    }
},

  // --- delete TASK ---
  // In TaskController.ts - delete function
delete: async (req: Request, res: Response) => {
    try {
      const { task_id } = req.body;
      const userId = getUserIdFromToken(req);
      
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      // Check task ownership before deleting
      const task = await prisma.task.findUnique({
        where: { id: task_id }
      });
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      if (task.userId !== String(userId)) {
        return res.status(403).json({ error: 'You can only delete your own tasks' });
      }
      
      await prisma.task.delete({ where: { id: task_id } });
      res.json({ message: 'Đã xóa task' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi xóa task' });
    }
}
};