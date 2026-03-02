// backend/src/services/JobCodeService.ts
// This file manages job codes: retrieval by department, creation, and soft deletion.
// and it ensures that deleted jobs are not shown in dropdowns.
import prisma from '../config/prisma';

export const JobCodeService = {
  // function to get job codes by department
  getByDept: async (deptIdsString: string) => {
    // Split the comma-separated string into an array of department IDs, 
    // trimming whitespace and filtering out empty strings
    const deptsArray = deptIdsString.split(',').map(id => id.trim()).filter(id => id !== '');

    const jobs = await prisma.jobCode.findMany({
      where: { 
        department: { in: deptsArray }, 
        isDeleted: false // soft delete
      }
    });
    
    return jobs.map(j => ({
      id: j.id,
      department: j.department,
      job_code: j.jobCode,
      task_description: j.taskDescription
    }));
  },

  // function to create a new job code
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