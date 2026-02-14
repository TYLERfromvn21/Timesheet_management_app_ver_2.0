// backend/src/middleware/auth.middleware.ts
// this file is used to check if the user is authenticated before allowing access to certain routes (like timesheet routes)
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

// extend the Request interface to include a user property that will hold the decoded token information
export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // take the token from the Authorization header (the client should send
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new Error();
    }

    //check if the token is valid
    const secret = process.env.JWT_SECRET || 'super-secret-key-tqd-timesheet-2026';
    const decoded = jwt.verify(token, secret);

    // if valid, attach the decoded token information to the request object (you can access it in the controller)
    req.user = decoded;

    // call the next middleware or route handler
    next();
  } catch (err) {
    // if the token is missing or invalid, return a 401 Unauthorized response
    res.status(401).json({ error: 'Please authenticate (Vui lòng đăng nhập)' });
  }
};