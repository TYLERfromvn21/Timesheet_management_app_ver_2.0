// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';

// Import các Routes (Đảm bảo bạn đã tạo các file này ở bước trước)
import authRoutes from './routes/authRoutes';
import departmentRoutes from './routes/departmentRoutes';
import userRoutes from './routes/userRoutes';
import jobCodeRoutes from './routes/jobCodeRoutes'; // <--- MỚI
import taskRoutes from './routes/taskRoutes';       // <--- MỚI

const app = express();
export const prisma = new PrismaClient();

app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// --- ĐĂNG KÝ ROUTES ---
app.use('/api/auth', authRoutes);         // Login, Check status, Admin Auth
app.use('/api/departments', departmentRoutes); // Lấy danh sách phòng ban
app.use('/api/users', userRoutes);        // Tạo user mới
app.use('/api/job-codes', jobCodeRoutes); // <--- MỚI
app.use('/api/tasks', taskRoutes);       // <--- MỚI

// Health Check
app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'OK', database: 'Connected' });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', error });
    }
});

export default app;