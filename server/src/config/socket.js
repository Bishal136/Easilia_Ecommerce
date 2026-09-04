import { Server } from 'socket.io';
import socketHandler from '../socket/socketHandler.js';

let io = null;

/**
 * Initialize Socket.io with the HTTP server
 * @param {import('http').Server} server
 * @returns {Server}
 */
export const initSocket = (server) => {
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  socketHandler(io);

  console.log('[SOCKET] Socket.io initialized successfully');
  return io;
};

/**
 * Get the initialized Socket.io instance
 * @returns {Server}
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};

export default initSocket;
