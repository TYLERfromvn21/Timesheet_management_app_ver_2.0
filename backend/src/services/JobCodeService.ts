// backend/src/services/JobCodeService.ts
// This file manages job codes: retrieval by department, creation, and soft deletion.
// and it ensures that deleted jobs are not shown in dropdowns.
import { prisma } from '../app';

export const JobCodeService = {
  // function to get job codes by department
  getByDept: async (deptId: string) => {
    const jobs = await prisma.jobCode.findMany({
      where: { 
        department: String(deptId),
        isDeleted: false // use to filter out deleted jobs (soft delete:: mean not show in dropdowns but keep in DB)
      }
    });
    return jobs.map(j => ({
      id: j.id,
      department: j.department,
      job_code: j.jobCode,
      task_description: j.taskDescription
    }));
  },

  // function to  create a new job code
  create: async (data: { department: string, job_code: string, task_description: string }) => {
    return await prisma.jobCode.create({
      data: { 
        department: data.department, 
        jobCode: data.job_code,
        taskDescription: data.task_description
      }
    });
  },

  // function to soft delete a job code
  delete: async (id: string) => {
    // soft delete by setting isDeleted to true
    return await prisma.jobCode.update({
      where: { id },
      data: { isDeleted: true } 
    });
  }
};