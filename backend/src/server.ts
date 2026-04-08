//backend/src/server.ts
//this file is used to start the server and handle graceful shutdown
// and load environment variables
import app from './app';
import dotenv from 'dotenv';
import prisma from './config/prisma';
// Load environment variables from .env file
dotenv.config();

const PORT = process.env.PORT || 3000;

// Start the server
const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`
   Server is running!
   API URL: http://0.0.0.0:${PORT}
   Environment: ${process.env.NODE_ENV}
  `);
});

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  await prisma.$disconnect(); 
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});