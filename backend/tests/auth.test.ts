// backend/tests/auth.test.ts
// this file is used to test the authentication API (login route) to make sure it works correctly
import request from 'supertest';
import app from '../src/app'; 

describe('Auth API Integration Tests', () => {
    
    // Test 1: try to login with correct credentials
    it('POST /api/auth/login - Đăng nhập Admin thành công', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'admin',     
                password: '123'         
            });

        // Mong đợi kết quả:
        expect(res.status).toBe(200);            
        expect(res.body.success).toBe(true);     
        expect(res.body.data).toHaveProperty('token'); 
        
        console.log('Token nhận được:', res.body.data.token);
    });

    // Test 2: check if login with wrong password is blocked
    it('POST /api/auth/login - Đăng nhập sai pass bị chặn', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'admin',
                password: 'sai_password_lung_tung'
            });

        expect(res.status).toBe(401); // error 401 Unauthorized
    });
});