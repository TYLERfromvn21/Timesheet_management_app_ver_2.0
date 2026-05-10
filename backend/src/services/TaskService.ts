// backend/src/services/TaskService.ts
// This file contains task-related services: save and delete tasks
import prisma from '../config/prisma';
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

    // Adjust for Vietnam timezone (UTC+7) when returning times
    const vietnamOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds

    return tasks.map(t => {
      const localOffset = t.startTime.getTimezoneOffset() * 60 * 1000;
      const adjustedStart = new Date(t.startTime.getTime() - localOffset - vietnamOffset);
      const adjustedEnd = new Date(t.endTime.getTime() - localOffset - vietnamOffset);
      
      return {
        id: t.id,
        task_id: t.id,
        department: t.department,
        job_code: t.jobCode,
        task_description: t.taskDescription,
        start_time: adjustedStart.toISOString(),
        end_time: adjustedEnd.toISOString(),
        date: t.date.toISOString()
      };
    });
  },

  //function to save (create or update) a task
  saveTask: async (data: any) => {
    const startDateTime = new Date(data.startTime);
    const endDateTime = new Date(data.endTime);
    
    // Use the date from startTime for deadline checking, but keep original time
    const taskDate = new Date(startDateTime);
    
    // Adjust for Vietnam timezone (UTC+7) if needed
    const vietnamOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
    const localOffset = startDateTime.getTimezoneOffset() * 60 * 1000;
    const adjustedStart = new Date(startDateTime.getTime() + localOffset + vietnamOffset);
    const adjustedEnd = new Date(endDateTime.getTime() + localOffset + vietnamOffset);

    // Define cutoff date for supplementary entry (April 30, 2026)
    const cutoffDate = new Date('2026-04-30');
    cutoffDate.setHours(23, 59, 59, 999);

    // For supplementary entry (Jan-Apr 2026): skip curfew, only check deadline
    if (taskDate <= cutoffDate) {
        const deadlineDateStr = process.env.DEADLINE_DATE;
        if (deadlineDateStr) {
            const deadlineDate = new Date(deadlineDateStr);
            deadlineDate.setHours(23, 59, 59, 999);
            if (new Date() > deadlineDate) {
                throw new Error('Đã hết hạn nhập bổ sung timesheet!');
            }
        }
    } else {
        // For normal entry (May 2026 onwards): check curfew only
        if (CurfewService.isRestricted()) {
            throw new Error('Ngoài giờ khai báo!');
        }
    }

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