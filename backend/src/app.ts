// backend/src/app.ts
//this file is the main entry point of the backend application
// and is responsible for setting up the Express server, configuring middleware, and defining routes for the API endpoints. It also initializes the Prisma client for database interactions and includes error handling mechanisms.
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import prisma from './config/prisma';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/authRoutes';
import departmentRoutes from './routes/departmentRoutes';
import userRoutes from './routes/userRoutes';
import jobCodeRoutes from './routes/jobCodeRoutes'; 
import taskRoutes from './routes/taskRoutes';       
import reportRoutes from './routes/reportRoutes';

const app: Express = express();

app.set('trust proxy', 1);
// check if anyone is trying to access the server without providing a valid API key
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, 
	max: 100, 
	standardHeaders: true, 
	legacyHeaders: false,
	message: 'Bạn gửi quá nhiều yêu cầu! Vui lòng thử lại sau 15 phút.'
});

// Middleware
app.use(helmet());
app.use(limiter);

app.use(cors({
    origin: [
        'http://localhost:5173',                 // Local development URL
        'https://tvac.vn',                        
        'https://www.tvac.vn',                    
        process.env.CORS_ORIGIN || ''             
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);         
app.use('/api/departments', departmentRoutes); 
app.use('/api/users', userRoutes);        
app.use('/api/job-codes', jobCodeRoutes); 
app.use('/api/tasks', taskRoutes);      
app.use('/api/reports', reportRoutes);

// Health check
// app.get('/api/health', async (req, res) => {
//     try {
//         await prisma.$queryRaw`SELECT 1`; 
//         res.status(200).json({ status: 'OK', database: 'Connected' });
//     } catch (error) {
//         res.status(500).json({ status: 'ERROR', database: 'Disconnected' });
//     }
// });
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend is awake!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', path: req.path });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Global error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

export default app;