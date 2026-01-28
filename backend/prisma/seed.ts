// backend/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Start seeding...');

  // 1. Tạo danh sách phòng ban
  const departments = [
    { name: 'Kế toán', code: 'KE_TOAN' },
    { name: 'Kiểm toán Báo cáo Tài chính', code: 'KIEM_TOAN_BCTC' },
    { name: 'Kiểm toán XDCB', code: 'KIEM_TOAN_XDCB' },
    { name: 'Thẩm định giá, Tư vấn thuế', code: 'THAM_DINH_GIA' },
    { name: 'Khác', code: 'KHAC' } // Phòng này dùng để chứa Admin tổng hoặc user vãng lai
  ];

  // Chạy vòng lặp tạo từng phòng
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name },
      create: dept,
    });
  }
  console.log('✅ Created Default Departments');

  // 2. Tạo Admin Tổng
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN_TOTAL',
      // 👇 SỬA LẠI ĐOẠN NÀY: Kết nối Admin vào phòng "KHAC" thay vì để rỗng
      department: {
        connect: { code: 'KHAC' }
      }
    },
  });
  
  console.log('✅ Created Admin User: admin / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });