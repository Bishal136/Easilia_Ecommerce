import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Shop from '../models/Shop.js';
import ApiError from '../utils/ApiError.js';
import { getIO } from '../config/socket.js';

export const getOrCreateChat = async (userId, { shopId, targetUserId, productId }) => {
  let shop = null;
  let targetUser = targetUserId;

  if (shopId) {
    shop = await Shop.findById(shopId);
    if (!shop) throw new ApiError(404, 'Shop not found');
    targetUser = shop.owner;
  }

  if (!targetUser) {
    throw new ApiError(400, 'Target user or shop required');
  }

  if (targetUser.toString() === userId.toString()) {
    throw new ApiError(400, 'You cannot start a conversation with your own store or account');
  }

  // Check if conversation already exists
  let chat = await Chat.findOne({
    participants: { $all: [userId, targetUser] },
  })
    .populate('participants', 'name avatar role email')
    .populate('shop', 'name slug logo')
    .populate('product', 'title slug basePrice discountPrice images')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'name avatar role' },
    });

  if (!chat) {
    const unreadMap = new Map();
    unreadMap.set(userId.toString(), 0);
    unreadMap.set(targetUser.toString(), 0);

    const createdChat = await Chat.create({
      participants: [userId, targetUser],
      shop: shop?._id || null,
      product: productId || null,
      unreadCounts: unreadMap,
      lastMessageAt: new Date(),
    });

    chat = await Chat.findById(createdChat._id)
      .populate('participants', 'name avatar role email')
      .populate('shop', 'name slug logo')
      .populate('product', 'title slug basePrice discountPrice images')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name avatar role' },
      });
  } else {
    // Update shop or product if newly provided and previously null
    let modified = false;
    if (shop?._id && !chat.shop) {
      chat.shop = shop._id;
      modified = true;
    }
    if (productId && !chat.product) {
      chat.product = productId;
      modified = true;
    }
    if (modified) {
      await chat.save();
      chat = await Chat.findById(chat._id)
        .populate('participants', 'name avatar role email')
        .populate('shop', 'name slug logo')
        .populate('product', 'title slug basePrice discountPrice images')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'name avatar role' },
        });
    }
  }

  return chat;
};

export const getUserChats = async (userId) => {
  return await Chat.find({ participants: userId })
    .populate('participants', 'name avatar role email')
    .populate('shop', 'name slug logo')
    .populate('product', 'title slug basePrice discountPrice images')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'name avatar role' },
    })
    .sort({ lastMessageAt: -1, updatedAt: -1 })
    .lean();
};

export const getChatMessages = async (userId, chatId, query = {}) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, 'Conversation not found');
  }

  const isParticipant = chat.participants.some(
    (p) => (p._id ? p._id.toString() : p.toString()) === userId.toString()
  );
  if (!isParticipant) {
    throw new ApiError(403, 'Unauthorized access to this conversation');
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 40));
  const skip = (page - 1) * limit;

  // Mark unread messages as read
  const unreadUpdate = await Message.updateMany(
    { chat: chatId, sender: { $ne: userId }, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  // Reset unread count for current user
  if (chat.unreadCounts) {
    chat.unreadCounts.set(userId.toString(), 0);
    await chat.save();
  }

  // Notify socket room that messages were read
  if (unreadUpdate.modifiedCount > 0) {
    try {
      const io = getIO();
      io.to(`conv_${chatId}`).to(`chat:${chatId}`).emit('chat:messages_read', {
        chatId,
        readBy: userId,
        readAt: new Date(),
      });
    } catch {
      // Socket not initialized in standalone tests
    }
  }

  const [messages, totalCount] = await Promise.all([
    Message.find({ chat: chatId })
      .populate('sender', 'name avatar role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments({ chat: chatId }),
  ]);

  return {
    messages: messages.reverse(),
    totalCount,
    currentPage: page,
  };
};

export const sendMessage = async (userId, chatId, { content, attachments, product }) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, 'Conversation not found');
  }

  const isParticipant = chat.participants.some(
    (p) => (p._id ? p._id.toString() : p.toString()) === userId.toString()
  );
  if (!isParticipant) {
    throw new ApiError(403, 'Unauthorized access to this conversation');
  }

  if (!content && (!attachments || attachments.length === 0) && !product) {
    throw new ApiError(400, 'Message cannot be empty');
  }

  const message = await Message.create({
    chat: chatId,
    sender: userId,
    content: content || '',
    attachments: attachments || [],
    product: product || null,
  });

  // Update chat last message & timestamp
  chat.lastMessage = message._id;
  chat.lastMessageAt = new Date();

  // Increment unread count for other participants
  chat.participants.forEach((pId) => {
    const pStr = pId._id ? pId._id.toString() : pId.toString();
    if (pStr !== userId.toString()) {
      const current = chat.unreadCounts?.get(pStr) || 0;
      if (chat.unreadCounts) chat.unreadCounts.set(pStr, current + 1);
    }
  });

  await chat.save();

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name avatar role')
    .lean();

  // Real-time broadcast via Socket.io
  try {
    const io = getIO();
    // 1. Broadcast to active conversation room
    io.to(`conv_${chatId}`).to(`chat:${chatId}`).emit('chat:receive_message', populatedMessage);

    // 2. Broadcast to other participants' personal notification rooms
    chat.participants.forEach((pId) => {
      const pStr = pId._id ? pId._id.toString() : pId.toString();
      if (pStr !== userId.toString()) {
        io.to(`user_${pStr}`).emit('chat:new_notification', {
          chatId,
          message: populatedMessage,
          unreadCount: chat.unreadCounts?.get(pStr) || 1,
        });
      }
    });
  } catch {
    // Socket not initialized in standalone test
  }

  return populatedMessage;
};

export const markChatAsRead = async (userId, chatId) => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, 'Conversation not found');
  }

  const isParticipant = chat.participants.some(
    (p) => (p._id ? p._id.toString() : p.toString()) === userId.toString()
  );
  if (!isParticipant) {
    throw new ApiError(403, 'Unauthorized access to this conversation');
  }

  await Message.updateMany(
    { chat: chatId, sender: { $ne: userId }, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  if (chat.unreadCounts) {
    chat.unreadCounts.set(userId.toString(), 0);
    await chat.save();
  }

  try {
    const io = getIO();
    io.to(`conv_${chatId}`).to(`chat:${chatId}`).emit('chat:messages_read', {
      chatId,
      readBy: userId,
      readAt: new Date(),
    });
  } catch {
    // ignore
  }

  return { success: true };
};

export const getUnreadCount = async (userId) => {
  const chats = await Chat.find({ participants: userId }).lean();
  let totalUnread = 0;

  for (const chat of chats) {
    if (chat.unreadCounts) {
      const count = chat.unreadCounts[userId.toString()] || 0;
      totalUnread += count;
    }
  }

  return { unreadCount: totalUnread };
};

export default {
  getOrCreateChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  markChatAsRead,
  getUnreadCount,
};
