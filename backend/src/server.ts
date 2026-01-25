import app, { prisma } from './app';
import dotenv from 'dotenv';

// Load biến môi trường
dotenv.config();

const PORT = process.env.PORT || 3000;

// Khởi động Server
const server = app.listen(PORT, () => {
  console.log(`
  🚀 Server is running!
  📡 API URL: http://localhost:${PORT}
  ⭐️ Environment: ${process.env.NODE_ENV}
  `);
});

// Xử lý khi tắt Server (Ctrl + C) để ngắt kết nối DB an toàn
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});