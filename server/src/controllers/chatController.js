import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as chatService from '../services/chatService.js';

export const getOrCreateChat = asyncHandler(async (req, res) => {
  const chat = await chatService.getOrCreateChat(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, 'Chat retrieved successfully', { chat }));
});

export const getUserChats = asyncHandler(async (req, res) => {
  const chats = await chatService.getUserChats(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Conversations fetched successfully', { chats }));
});

export const getChatMessages = asyncHandler(async (req, res) => {
  const result = await chatService.getChatMessages(req.user._id, req.params.id, req.query);
  res.status(200).json(new ApiResponse(200, 'Messages fetched successfully', result));
});

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await chatService.sendMessage(req.user._id, req.params.id, req.body);
  res.status(201).json(new ApiResponse(201, 'Message sent successfully', { message }));
});

export const markChatAsRead = asyncHandler(async (req, res) => {
  const result = await chatService.markChatAsRead(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, 'Conversation marked as read', result));
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await chatService.getUnreadCount(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Unread count fetched successfully', result));
});

export default {
  getOrCreateChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  markChatAsRead,
  getUnreadCount,
};
