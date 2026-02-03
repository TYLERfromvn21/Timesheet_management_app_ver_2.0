// backend/src/services/AuthService.ts
// this file is responsible for user authentication logic
// and generating JWT tokens upon successful login
import { prisma } from '../app';
import * as bcrypt from 'bcryptjs';
import { signToken } from '../utils/jwt';

export const AuthService = {
  //function to handle user login
  login: async (username: string, pass: string) => {
    // 1. find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      include: { department: true }
    });

    if (!user) {
      throw new Error('User not found'); 
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new Error('Invalid password'); 
    }

    // 3. Create JWT token
    const token = signToken({ id: user.id, role: user.role });

    // 4. Return user info and token
    const { password, ...userInfo } = user;
    return { user: userInfo, token };
  }
};