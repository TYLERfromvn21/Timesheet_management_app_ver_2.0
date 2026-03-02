// backend/src/config/prisma.ts
// this file sets up the Prisma Client for database interactions, ensuring that we reuse the same instance in development to avoid exhausting database connections. In production, it creates a new instance as needed. It also configures logging for errors and warnings to help with debugging.
import { PrismaClient } from '@prisma/client';

// To prevent exhausting database connections in development, 
// we use a global variable to store the Prisma Client instance. 
// In production, we create a new instance as needed.
declare global {
  var prisma: PrismaClient | undefined;
}

// Create a new Prisma Client instance if it doesn't exist,
//  or reuse the existing one in development.
const prisma = global.prisma || new PrismaClient({
  log: ['error', 'warn'],
});

// In development, assign the Prisma Client instance to the global variable
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;