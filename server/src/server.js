import 'dotenv/config';
import http from 'http';
import app from './app.js';
import connectDB from './config/db.js';
import initSocket from './config/socket.js';

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error(`[UNCAUGHT EXCEPTION] ${err.name}: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

// Start Server Bootstrap
const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDB();

    // 2. Start HTTP Server
    server.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 Nerob Ecommerce Server running on port http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${NODE_ENV}`);
      console.log(`🔗 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`=========================================`);
    });
  } catch (error) {
    console.error(`[SERVER BOOTSTRAP ERROR] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error(`[UNHANDLED REJECTION] ${err.name}: ${err.message}`);
  console.error(err.stack);
  // Gracefully close server before exiting
  server.close(() => {
    process.exit(1);
  });
});

// Graceful Shutdown on termination signals
const handleGracefulShutdown = (signal) => {
  console.log(`\n[SHUTDOWN] Received ${signal}. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('[SHUTDOWN] HTTP server closed.');
    process.exit(0);
  });

  // Force close after 10s if connections linger
  setTimeout(() => {
    console.error('[SHUTDOWN] Forced shutdown after 10s timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

export default server;
