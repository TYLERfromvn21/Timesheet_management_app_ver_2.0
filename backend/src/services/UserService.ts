// backend/src/services/UserService.ts
// This file contains the UserService which handles user-related operations.
// and interacts with the database using Prisma ORM.
import { prisma } from '../app';
import * as bcrypt from 'bcryptjs';

export const UserService = {
  //function to get all users with their departments
  getAll: async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            name: true 
          }
        }
      },
      orderBy: { username: 'asc' }
    });

    return users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role === 'ADMIN_TOTAL' ? 'admin_total' : (u.role === 'ADMIN_DEPT' ? 'admin_dept' : 'user'),
      department: u.department ? u.department.name : '-',
      departmentId: u.departmentId 
    }));
  },

  //function to  create a new user
  create: async (data: any) => {
    const { username, password, role, departmentId } = data;

    // check if username already exists
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) throw new Error('Tên đăng nhập đã tồn tại!');

    // encrypt the password
    const hashedPassword = await bcrypt.hash(password, 8);

    //construct data object for user creation
    const dataToCreate: any = {
      username,
      password: hashedPassword,
      role: role === 'admin_dept' ? 'ADMIN_DEPT' : (role === 'admin_total' ? 'ADMIN_TOTAL' : 'USER'),
    };

    // if role is admin_dept, link the department
    if (departmentId && role !== 'admin_total') {
      dataToCreate.department = {
        connect: { id: departmentId }
      };
    }

    //call prisma to create the user
    return await prisma.user.create({
      data: dataToCreate
    });
  },

  //function to update an existing user
  update: async (id: string, data: any) => {
    const updateData: any = { username: data.username };
    if (data.password && data.password.trim() !== '') {
      updateData.password = await bcrypt.hash(data.password, 8);
    }
    return await prisma.user.update({ where: { id }, data: updateData });
  },

  //function to delete a user
  delete: async (id: string) => {
    return await prisma.user.delete({ where: { id } });
  }
};