import { Router } from 'express';
import {
  createPortPosSession,
  handlePortPosIPN,
  confirmCODPayment,
} from '../controllers/paymentController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';

const router = Router();

// Public IPN Webhook
router.post('/portpos/ipn', handlePortPosIPN);

// Protected Payment Endpoints
router.post('/portpos/create', protect, createPortPosSession);
router.post('/cod/:orderId/confirm', protect, authorize('seller', 'admin'), confirmCODPayment);

export default router;
