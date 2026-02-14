// backend/src/services/AuthService.ts
// this file is responsible for user authentication logic
// and generating JWT tokens upon successful login
import { prisma } from '../app';
import * as bcrypt from 'bcryptjs';
import { signToken } from '../utils/jwt';

export const AuthService = {
  //function to handle user login
  login: async (username: string, pass: string) => {
    const user = await prisma.user.findUnique({
  where: { username },
  select: {  
    id: true,
    username: true,
    password: true,
    role: true,
    departmentId: true
  }
});

    if (!user) {
      throw new Error('User not found'); 
    }

    // check password
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new Error('Invalid password'); 
    }

    // create JWT token
    const token = signToken({ id: user.id, role: user.role });
    const { password, ...userInfo } = user;
    return { user: userInfo, token };
  },

  // function to  get user profile
  getProfile: async (userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        role: true,
        departmentId: true
      }
    });
    if (!user) throw new Error('User not found');
    
    return {
      username: user.username,
      role: user.role === 'ADMIN_TOTAL' ? 'admin_total' : (user.role === 'ADMIN_DEPT' ? 'admin_dept' : 'user'),
      department: user.departmentId
    };
  },

  //function to check if system
  isSetupMode: async () => {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN_TOTAL' } });
    return adminCount === 0;
  }
};