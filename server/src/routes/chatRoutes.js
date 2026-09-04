import { Router } from 'express';
import {
  getOrCreateChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  markChatAsRead,
  getUnreadCount,
} from '../controllers/chatController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(protect);

router.post('/', getOrCreateChat);
router.get('/', getUserChats);
router.get('/unread-count', getUnreadCount);
router.get('/:id/messages', getChatMessages);
router.post('/:id/messages', sendMessage);
router.patch('/:id/read', markChatAsRead);

export default router;
