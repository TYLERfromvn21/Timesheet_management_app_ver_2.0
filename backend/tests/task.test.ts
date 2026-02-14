// backend/tests/task.test.ts
// this file is used to test the task management API (create task, get tasks by date, delete task) to make sure they work correctly and are protected by authentication

import request from 'supertest';
import app from '../src/app';

describe('Task (Timesheet) API Tests', () => {
    let userToken = '';
    let createdTaskId = ''; 
    const today = new Date().toISOString().split('T')[0];


    const testTask = {
        task_description: `Auto Test Jest ${Date.now()}`,
        start_time: `${today}T08:00:00.000Z`, 
        end_time:   `${today}T12:00:00.000Z`, 
        date: today,
        department: '1', 
        job_code: '1',   
        task_id: null
    };

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'admin', 
                password: '123'
            });
        
        userToken = res.body.data.token;
        console.log('🔑 Đã lấy Token User');
    });

    // TEST 1: create a new task (requires authentication)
    it('POST /api/tasks/save - Tạo timesheet thành công', async () => {
        const res = await request(app)
            .post('/api/tasks/save')
            .set('Authorization', `Bearer ${userToken}`)
            .send(testTask);

        if (res.status !== 200) {
            console.error('Lỗi tạo task:', res.body);
        }

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // TEST 2: take the list of tasks for today and find the ID of the task we just created (to use in the delete test later)
    it('GET /api/tasks/:date - Lấy danh sách và tìm ID task vừa tạo', async () => {
        const res = await request(app)
            .get(`/api/tasks/${today}`)
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);

        const foundTask = res.body.find((t: any) => t.task_description === testTask.task_description);
        
        expect(foundTask).toBeTruthy();
        
        // TaskService.getTasksByDate returns task_id
        if (foundTask) {
            createdTaskId = foundTask.task_id; 
            console.log('🆔 ID Task tìm thấy:', createdTaskId);
        }
    });

    // TEST 3: Validation for start_time and end_time (end_time must be greater than start_time)
    it('POST /api/tasks/save - Giờ kết thúc nhỏ hơn bắt đầu phải báo lỗi', async () => {
        const badTask = { 
            ...testTask, 
            start_time: `${today}T10:00:00.000Z`,
            end_time:   `${today}T09:00:00.000Z` 
        };

        const res = await request(app)
            .post('/api/tasks/save')
            .set('Authorization', `Bearer ${userToken}`)
            .send(badTask);

        expect(res.status).toBe(400); 
        expect(res.body.error).toContain('lớn hơn'); 
    });

    // TEST 4: delete the task we just created (requires authentication)
    it('POST /api/tasks/delete - Xóa task thành công', async () => {
        if (!createdTaskId) {
            console.warn('⚠️ Không tìm thấy ID task, bỏ qua test xóa');
            return;
        }

        const res = await request(app)
            .post('/api/tasks/delete')
            .set('Authorization', `Bearer ${userToken}`)
            .send({ task_id: createdTaskId });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('Đã xóa');
    });
});