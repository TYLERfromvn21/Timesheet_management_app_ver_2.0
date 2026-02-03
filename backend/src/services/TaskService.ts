// backend/src/services/TaskService.ts
// This file contains task-related services: save and delete tasks
import { prisma } from '../app';

export const TaskService = {
  // function to save (create or update) a task
  saveTask: async (data: any) => {
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
        // --- LOGIC security check for update ---
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