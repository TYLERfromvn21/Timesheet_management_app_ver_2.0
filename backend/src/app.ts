import express, { Express } from 'express'; // 1. Import thêm type Express
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';

// 2. SỬA ĐƯỜNG DẪN IMPORT (Trỏ thẳng vào file, bỏ v1)
import authRoutes from './routes/authRoutes';
import departmentRoutes from './routes/departmentRoutes';
import userRoutes from './routes/userRoutes';
import jobCodeRoutes from './routes/jobCodeRoutes'; 
import taskRoutes from './routes/taskRoutes';       
import reportRoutes from './routes/reportRoutes';

// 3. FIX LỖI "The inferred type of app...": Khai báo rõ kiểu : Express
const app: Express = express();

export const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);         
app.use('/api/departments', departmentRoutes); 
app.use('/api/users', userRoutes);        
app.use('/api/job-codes', jobCodeRoutes); 
app.use('/api/tasks', taskRoutes);      
app.use('/api/reports', reportRoutes);

app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'OK', database: 'Connected' });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', error });
    }
});

export default app;