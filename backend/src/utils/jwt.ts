import jwt, { SignOptions } from 'jsonwebtoken'; // Thêm SignOptions vào import

const SECRET = process.env.JWT_SECRET || 'secret';

export const signToken = (payload: object) => {
  // Sửa dòng expiresIn bên dưới:
  return jwt.sign(payload, SECRET, { 
    expiresIn: (process.env.JWT_EXPIRY || '7d') as SignOptions['expiresIn'] 
  });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
};