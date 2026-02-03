// backend/src/utils/jwt.ts
// this file contains utility functions for signing and verifying JWT tokens
import jwt, { SignOptions } from 'jsonwebtoken'; 
const SECRET = process.env.JWT_SECRET || 'secret';

// Function to sign a JWT token with a given payload
export const signToken = (payload: object) => {
  return jwt.sign(payload, SECRET, { 
    expiresIn: (process.env.JWT_EXPIRY || '7d') as SignOptions['expiresIn'] 
  });
};

// Function to verify a JWT token and return the decoded payload
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
};