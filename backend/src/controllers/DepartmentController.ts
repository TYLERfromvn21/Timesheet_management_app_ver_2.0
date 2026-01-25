import { Request, Response } from 'express';
import { prisma } from '../app';

export const DepartmentController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const depts = await prisma.department.findMany({
        orderBy: { name: 'asc' }
      });
      res.json(depts);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching departments' });
    }
  }
};