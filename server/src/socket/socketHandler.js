/**
 * Socket.io Connection & Event Handler
 * @param {import('socket.io').Server} io
 */
const onlineUsers = new Map(); // userId -> Set of socketIds

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    let currentUserId = null;

    // User joins personal room for notifications and private chats
    socket.on('join_user', (userId) => {
      if (userId) {
        currentUserId = userId.toString();
        socket.join(`user_${currentUserId}`);

        if (!onlineUsers.has(currentUserId)) {
          onlineUsers.set(currentUserId, new Set());
        }
        onlineUsers.get(currentUserId).add(socket.id);

        // Broadcast online status
        io.emit('user:status', { userId: currentUserId, status: 'online' });
      }
    });

    // User joins a specific conversation room
    socket.on('join_conversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conv_${conversationId}`);
        socket.join(`chat:${conversationId}`);
      }
    });

    // User leaves a specific conversation room
    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conv_${conversationId}`);
        socket.leave(`chat:${conversationId}`);
      }
    });

    // Real-time chat message broadcasting (if sent via socket)
    socket.on('chat:send_message', (data) => {
      const { conversationId, message } = data;
      if (conversationId && message) {
        io.to(`conv_${conversationId}`).to(`chat:${conversationId}`).emit('chat:receive_message', message);
      }
    });

    // Typing indicators
    socket.on('chat:typing', ({ conversationId, senderId, senderName }) => {
      if (conversationId) {
        socket.to(`conv_${conversationId}`).to(`chat:${conversationId}`).emit('chat:typing', {
          conversationId,
          senderId,
          senderName,
        });
      }
    });

    socket.on('chat:stop_typing', ({ conversationId, senderId }) => {
      if (conversationId) {
        socket.to(`conv_${conversationId}`).to(`chat:${conversationId}`).emit('chat:stop_typing', {
          conversationId,
          senderId,
        });
      }
    });

    // Read receipts
    socket.on('chat:mark_read', ({ conversationId, userId }) => {
      if (conversationId) {
        socket.to(`conv_${conversationId}`).to(`chat:${conversationId}`).emit('chat:messages_read', {
          chatId: conversationId,
          readBy: userId,
          readAt: new Date(),
        });
      }
    });

    // Check if user is online
    socket.on('check_online', (userId, callback) => {
      if (typeof callback === 'function') {
        const isOnline = onlineUsers.has(userId?.toString()) && onlineUsers.get(userId.toString()).size > 0;
        callback({ isOnline });
      }
    });

    socket.on('disconnect', () => {
      if (currentUserId && onlineUsers.has(currentUserId)) {
        const userSockets = onlineUsers.get(currentUserId);
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(currentUserId);
          io.emit('user:status', { userId: currentUserId, status: 'offline' });
        }
      }
    });
  });
};

export default socketHandler;
