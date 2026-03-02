// backend/src/services/UserService.ts
// This file contains the UserService which handles user-related operations.
// and interacts with the database using Prisma ORM.
import prisma from '../config/prisma';
import * as bcrypt from 'bcryptjs';

export const UserService = {
  //function to get all users with their departments
  getAll: async () => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        departments: { // take the department names and codes for display and processing
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: { username: 'asc' }
    });

    return users.map(u => ({
      id: u.id,
      username: u.username,
      role: u.role === 'ADMIN_TOTAL' ? 'admin_total' : (u.role === 'ADMIN_DEPT' ? 'admin_dept' : 'user'),
      department: u.departments.length > 0 ? u.departments.map(d => d.name).join(', ') : '-',
      departmentIds: u.departments.map(d => d.id),
      departmentCodes: u.departments.map(d => d.code),
      departments: u.departments
    }));
  },

  //function to  create a new user
  create: async (data: any) => {
    const { username, password, role, departmentIds } = data;

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

    if (departmentIds && Array.isArray(departmentIds) && departmentIds.length > 0 && role !== 'admin_total') {
      dataToCreate.departments = {
        connect: departmentIds.map((id: string) => ({ id }))
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

    if (data.departmentIds && Array.isArray(data.departmentIds)) {
      updateData.departments = {
        set: data.departmentIds.map((deptId: string) => ({ id: deptId }))
      };
    }

    return await prisma.user.update({ where: { id }, data: updateData });
  },

  //function to delete a user
  delete: async (id: string) => {
    return await prisma.user.delete({ where: { id } });
  }
};