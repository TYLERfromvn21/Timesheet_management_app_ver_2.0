// backend/src/services/TaskService.ts
// This file contains task-related services: save and delete tasks
import prisma from '../config/prisma';
import { CurfewService } from './CurfewService';
import { DeclarationService } from './DeclarationService';

const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

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

    return tasks.map(t => {
      return {
        id: t.id,
        task_id: t.id,
        department: t.department,
        job_code: t.jobCode,
        task_description: t.taskDescription,
        start_time: t.startTime.toISOString(),
        end_time: t.endTime.toISOString(),
        date: t.date.toISOString()
      };
    });
  },

  //function to save (create or update) a task
  saveTask: async (data: any) => {
    const startDateTime = new Date(data.startTime);
    const endDateTime = new Date(data.endTime);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new Error('Định dạng thời gian không hợp lệ');
    }
    if (endDateTime <= startDateTime) {
        throw new Error('Giờ kết thúc phải lớn hơn bắt đầu');
    }

    const taskDate = data.date ? new Date(data.date) : new Date(startDateTime);
    const adjustedStart = startDateTime;
    const adjustedEnd = endDateTime;

    // use transaction for save operation
    return await prisma.$transaction(async (tx) => {
      
      const taskPayload = {
        department: data.department,
        jobCode: data.jobCode,
        taskDescription: data.taskDescription,
        startTime: adjustedStart,
        endTime: adjustedEnd,
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

        const access = await DeclarationService.canEditDate(existingTask.date);
        if (!access.allowed) {
          throw new Error('Khai báo ngày cũ đang bị khóa');
        }
        if (!access.bypassCurfew && CurfewService.isRestricted()) {
          throw new Error('Ngoài giờ khai báo!');
        }

        // Update
        return await tx.task.update({
          where: { id: data.taskId },
          data: taskPayload
        });
      } else {
        const access = await DeclarationService.canEditDate(taskDate);
        if (!access.allowed) {
          throw new Error('Khai báo ngày cũ đang bị khóa');
        }
        if (!access.bypassCurfew && CurfewService.isRestricted()) {
          throw new Error('Ngoài giờ khai báo!');
        }

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

    const access = await DeclarationService.canEditDate(task.date);
    if (!access.allowed) {
      throw new Error('Khai báo ngày cũ đang bị khóa');
    }

    return await prisma.task.delete({ where: { id: taskId } });
  }
};
