import { Request, Response } from 'express';
import { prisma } from '../app';

export const JobCodeController = {
  getByDept: async (req: Request, res: Response) => {
    try {
      const { dept } = req.params;
      const jobs = await prisma.jobCode.findMany({
        // 👇 FIX: Thêm String() để ép kiểu, tránh lỗi TypeScript
        where: { department: String(dept) }
      });
      
      const mappedJobs = jobs.map(j => ({
        id: j.id,
        department: j.department,
        job_code: j.jobCode,
        task_description: j.taskDescription
      }));
      res.json(mappedJobs);
    } catch (error) {
      res.json([]); 
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { department, job_code, task_description } = req.body;
      
      const newJob = await prisma.jobCode.create({
        data: { 
          department, 
          jobCode: job_code,
          taskDescription: task_description
        }
      });
      res.json({ message: 'Tạo Job thành công', data: newJob });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi tạo Job' });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const { job_id } = req.body;
      await prisma.jobCode.delete({ where: { id: job_id } }); 
      res.json({ message: 'Đã xóa Job' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi xóa Job' });
    }
  }
};