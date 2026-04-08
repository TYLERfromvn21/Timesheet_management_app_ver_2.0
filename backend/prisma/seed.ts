// backend/prisma/seed.ts
// this file is used to seed the database with initial data
// and can be run with the command `ts-node backend/prisma/seed.ts`
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Main seeding function
async function main() {
  console.log(' Start seeding...');

  // 1. create default departments
  const departments = [
    { name: 'Kế toán', code: 'KE_TOAN' },
    { name: 'Kiểm toán Báo cáo Tài chính', code: 'KIEM_TOAN_BCTC' },
    { name: 'Kiểm toán XDCB', code: 'KIEM_TOAN_XDCB' },
    { name: 'Thẩm định giá, Tư vấn thuế', code: 'THAM_DINH_GIA' },
    { name: 'Khác', code: 'KHAC' } // Other department and special case
  ];

  // 2. loop through departments and create them if they don't exist
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name },
      create: dept,
    });
  }
  console.log(' Created Default Departments');

  // 3. create an admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  // Note: The admin user is now connected to the "KHAC" department
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN_TOTAL',
      departments: {
        connect: [{ code: 'KHAC' }]
      }
    },
  });
  
  console.log(' Created Admin User: admin / admin123');
}

/// Execute the main function
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });