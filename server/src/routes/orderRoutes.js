import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  cancelOrder,
  getSellerOrders,
  updateSellerOrderItemStatus,
  getAdminOrders,
  updateAdminOrderStatus,
} from '../controllers/orderController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createOrderSchema,
  updateOrderItemStatusSchema,
} from '../validators/orderValidator.js';

const router = Router();

// All order operations require authentication
router.use(protect);

// 1. Buyer & Shared Endpoints
router.post('/', validate(createOrderSchema), createOrder);
router.get('/:id', getOrderById);
router.put('/:id/cancel', cancelOrder);

// 2. Seller Endpoints
router.get('/seller/list', authorize('seller', 'admin'), getSellerOrders);
router.put(
  '/seller/:orderId/items/:itemId/status',
  authorize('seller', 'admin'),
  validate(updateOrderItemStatusSchema),
  updateSellerOrderItemStatus
);

// 3. Admin Endpoints
router.get('/admin/all', authorize('admin'), getAdminOrders);
router.put('/admin/:id/status', authorize('admin'), updateAdminOrderStatus);

export default router;
