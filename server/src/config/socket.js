import { Server } from 'socket.io';
import socketHandler from '../socket/socketHandler.js';
import { isOriginAllowed } from './cors.js';

let io = null;

/**
 * Initialize Socket.io with the HTTP server
 * @param {import('http').Server} server
 * @returns {Server}
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error(`Socket CORS error: Origin ${origin} not allowed`));
        }
      },
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
