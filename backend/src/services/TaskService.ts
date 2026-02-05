// backend/src/services/TaskService.ts
// This file contains task-related services: save and delete tasks
import { prisma } from '../app';
import { CurfewService } from './CurfewService';

export const TaskService = {
  // function to save (create or update) a task
  getTasksByDate: async (dateStr: string, userId: string) => {
    // Normalize date to start of the day
    const searchDate = new Date(dateStr);
    searchDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(searchDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const tasks = await prisma.task.findMany({
      where: {
        date: { gte: searchDate, lt: nextDay },
        userId: userId
      },
      orderBy: { startTime: 'asc' }
    });

    return tasks.map(t => ({
      id: t.id,
      task_id: t.id,
      department: t.department,
      job_code: t.jobCode,
      task_description: t.taskDescription,
      start_time: t.startTime.toISOString(),
      end_time: t.endTime.toISOString(),
      date: t.date.toISOString()
    }));
  },

  //function to save (create or update) a task
  saveTask: async (data: any) => {
    // Check curfew restriction before allowing save
    if (CurfewService.isRestricted()) {
        throw new Error('Ngoài giờ khai báo!');
    }
    const startDateTime = new Date(data.startTime);
    const endDateTime = new Date(data.endTime);
    const taskDate = new Date(data.date);
    
    taskDate.setHours(12, 0, 0, 0); 

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error('Định dạng thời gian không hợp lệ');
    }
    if (endDateTime <= startDateTime) {
        throw new Error('Giờ kết thúc phải lớn hơn bắt đầu');
    }

    // use transaction for save operation
    return await prisma.$transaction(async (tx) => {
      
      const taskPayload = {
        department: data.department,
        jobCode: data.jobCode,
        taskDescription: data.taskDescription,
        startTime: startDateTime,
        endTime: endDateTime,
        date: taskDate,
        userId: data.userId
      };

      if (data.taskId) {
        //logic security: only allow updating own tasks
        const existingTask = await tx.task.findUnique({ where: { id: data.taskId } });
        
        if (!existingTask) throw new Error('Task not found');
        if (existingTask.userId !== data.userId) {
            throw new Error('Bạn chỉ được sửa task của chính mình!');
        }

        // Update
        return await tx.task.update({
          where: { id: data.taskId },
          data: taskPayload
        });
      } else {
        // Create
        return await tx.task.create({
          data: taskPayload
        });
      }
    });
  },

  // function to delete a task
  deleteTask: async (taskId: string, userId: string) => {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    
    if (!task) throw new Error('Task not found');
    if (task.userId !== userId) {
        throw new Error('Bạn chỉ được xóa task của chính mình!');
    }

    return await prisma.task.delete({ where: { id: taskId } });
  }
};