// backend/tests/user.test.ts
// this file is used to test the user management API (create user, get all users, delete user) to make sure they work correctly and are protected by authentication
import request from 'supertest';
import app from '../src/app';

describe('User Management API Tests', () => {
    let adminToken = '';
    let createdUserId = '';
    
    // user object to be used in tests (with unique username to avoid conflicts)
    const testUser = {
        username: `test_user_${Date.now()}`, 
        password: 'password123',
        role: 'user', 
        departmentId: null 
    };

    // run before all tests to get an admin token for authentication
    beforeAll(async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'admin', // can replace with actual admin username in your DB
                password: '123'
            });
        
        adminToken = res.body.data.token;
        console.log('🔑 Đã lấy Token Admin để test');
    });

    // TEST 1: create a new user (requires authentication)
    it('POST /api/users/create - Admin tạo user mới thành công', async () => {
        const res = await request(app)
            .post('/api/users/create')
            .set('Authorization', `Bearer ${adminToken}`) 
            .send(testUser);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user).toHaveProperty('id');
        expect(res.body.user.username).toBe(testUser.username);

        // Lưu lại ID để tí nữa test xóa
        createdUserId = res.body.user.id;
    });

    // TEST 2: get all users (requires authentication)
    it('GET /api/users/all - Lấy danh sách user thành công', async () => {
        const res = await request(app)
            .get('/api/users/all')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true); 
        const found = res.body.find((u: any) => u.username === testUser.username);
        expect(found).toBeTruthy();
    });

    // TEST 3: delete the user we just created (requires authentication)
    it('POST /api/users/delete - Xóa user thành công', async () => {
        const res = await request(app)
            .post('/api/users/delete')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ id: createdUserId }); 

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('Đã xóa');
    });

    // TEST 4: try to access protected route without token (should be blocked)
    it('GET /api/users/all - Không có Token phải bị chặn (401/403)', async () => {
        const res = await request(app)
            .get('/api/users/all'); 
           
        expect(res.status).not.toBe(200); 
    });
});