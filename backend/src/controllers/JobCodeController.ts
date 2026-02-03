// backend/src/controllers/JobCodeController.ts
// this file is responsible for handling job code related operations
// including fetching job codes by department, creating new job codes, and deleting job codes.
import { Request, Response } from 'express';
import { prisma } from '../app';

export const JobCodeController = {
  // function to get job codes by department
  getByDept: async (req: Request, res: Response) => {
    try {
      const { dept } = req.params;
      const jobs = await prisma.jobCode.findMany({
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

  // function to create a new job code
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

  // function to delete a job code
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