import { Router } from 'express';
import {
  getDashboardAnalytics,
  getUsers,
  getUserById,
  updateUserRole,
  toggleUserBan,
  deleteUser,
  getSellers,
  getSellerById,
  updateSellerStatus,
  getPlatformSettings,
  updatePlatformSettings,
} from '../controllers/adminController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import {
  getAdminOrders,
  updateAdminOrderStatus,
  getOrderById as getAdminOrderDetails,
} from '../controllers/orderController.js';

const router = Router();

// All Admin routes require admin authorization
router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardAnalytics);
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/ban', toggleUserBan);
router.delete('/users/:id', deleteUser);

router.get('/sellers', getSellers);
router.get('/sellers/:id', getSellerById);
router.put('/sellers/:id/status', updateSellerStatus);

router.get('/orders', getAdminOrders);
router.get('/orders/:id', getAdminOrderDetails);
router.put('/orders/:id/status', updateAdminOrderStatus);

router.get('/settings', getPlatformSettings);
router.put('/settings', updatePlatformSettings);

export default router;
