import { Request, Response } from 'express';
import { prisma } from '../app';

export const TaskController = {
  getByDate: async (req: Request, res: Response) => {
    try {
      const { date } = req.params;
      
      const tasks = await prisma.task.findMany({
        where: {
          date: new Date(String(date))
        }
      });

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

      const taskData = {
        department,
        jobCode: job_code,
        taskDescription: task_description,
        startTime: new Date(start_time),
        endTime: new Date(end_time),
        date: new Date(date)
      };

      if (task_id) {
        await prisma.task.update({
          where: { id: task_id },
          data: taskData
        });
      } else {
        await prisma.task.create({
          data: taskData
        });
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
      await prisma.task.delete({ where: { id: task_id } });
      res.json({ message: 'Đã xóa task' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi xóa task' });
    }
  }
};