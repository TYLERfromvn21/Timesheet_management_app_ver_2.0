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
import declarationRoutes from './routes/declarationRoutes';

const app: Express = express();

app.set('trust proxy', 1);


// Middleware
if (process.env.NODE_ENV !== 'development') {
    app.use(helmet());
}


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
const apiLimiter = rateLimit({
	windowMs: 5 * 60 * 1000, 
	max: 3000, 
	standardHeaders: true, 
	legacyHeaders: false,
	message: 'Hệ thống đang quá tải, bạn đợi 5 phút rồi F5 lại'
});

app.use(apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);         
app.use('/api/departments', departmentRoutes); 
app.use('/api/users', userRoutes);        
app.use('/api/job-codes', jobCodeRoutes); 
app.use('/api/tasks', taskRoutes);      
app.use('/api/reports', reportRoutes);
app.use('/api/declarations', declarationRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Backend is awake!' });
});

// Get deadline date configuration
app.get('/api/config/deadline', (req, res) => {
    const deadlineDate = process.env.DEADLINE_DATE;
    res.status(200).json({ deadlineDate: deadlineDate || null });
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
