// backend/src/controllers/JobCodeController.ts
// this file is responsible for handling job code related operations
// including fetching job codes by department, creating new job codes, and deleting job codes.

import { Request, Response } from 'express';
import { JobCodeService } from '../services/JobCodeService';

export const JobCodeController = {
  //function to get job codes by department
  getByDept: async (req: Request, res: Response) => {
    try {
      const jobs = await JobCodeService.getByDept(req.params.dept as string);
      res.json(jobs);
    } catch (error) {
      res.json([]); 
    }
  },

  //function to create a new job code
  create: async (req: Request, res: Response) => {
    try {
      const newJob = await JobCodeService.create(req.body);
      res.json({ message: 'Tạo Job thành công', data: newJob });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi tạo Job (Mã trùng)' });
    }
  },

  //function to delete a job code
  delete: async (req: Request, res: Response) => {
    try {
      await JobCodeService.delete(req.body.job_id); 
      res.json({ message: 'Đã xóa Job' });
    } catch (error) {
      res.status(500).json({ error: 'Lỗi xóa Job' });
    }
  }
};