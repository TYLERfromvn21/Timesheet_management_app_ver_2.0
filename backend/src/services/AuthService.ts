import { prisma } from '../app';
import * as bcrypt from 'bcryptjs';
import { signToken } from '../utils/jwt';

export const AuthService = {
  login: async (username: string, pass: string) => {
    // 1. Tìm user
    const user = await prisma.user.findUnique({
      where: { username },
      include: { department: true }
    });

    if (!user) {
      throw new Error('User not found'); // Hoặc Username không đúng
    }

    // 2. So sánh mật khẩu
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new Error('Invalid password'); // Mật khẩu sai
    }

    // 3. Tạo Token
    const token = signToken({ id: user.id, role: user.role });

    // 4. Trả về info (bỏ password ra)
    const { password, ...userInfo } = user;
    return { user: userInfo, token };
  }
};