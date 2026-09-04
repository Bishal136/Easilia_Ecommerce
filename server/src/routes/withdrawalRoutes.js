import { Router } from 'express';
import {
  requestWithdrawal,
  getSellerWithdrawals,
  getAdminWithdrawals,
  processWithdrawal,
} from '../controllers/withdrawalController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createWithdrawalSchema,
  updateWithdrawalStatusSchema,
} from '../validators/withdrawalValidator.js';

const router = Router();

router.use(protect);

// Seller Endpoints
router.post('/', authorize('seller'), validate(createWithdrawalSchema), requestWithdrawal);
router.get('/seller', authorize('seller'), getSellerWithdrawals);

// Admin Endpoints
router.get('/admin', authorize('admin'), getAdminWithdrawals);
router.put('/:id', authorize('admin'), validate(updateWithdrawalStatusSchema), processWithdrawal);

export default router;
