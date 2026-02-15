// backend/src/config/prisma.ts
import { PrismaClient } from '@prisma/client';

// Khởi tạo Prisma Client (Singleton)
// Chỉ log lỗi ra console để giảm tải cho CPU (bỏ query log)
const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

export default prisma;