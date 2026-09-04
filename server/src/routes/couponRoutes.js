import { Router } from 'express';
import {
  applyCoupon,
  createCoupon,
  getCoupons,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
} from '../controllers/couponController.js';
import { protect, optionalAuth } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createCouponSchema,
  updateCouponSchema,
  applyCouponSchema,
} from '../validators/couponValidator.js';

const router = Router();

// Apply coupon (Guests and authenticated buyers)
router.post('/apply', optionalAuth, validate(applyCouponSchema), applyCoupon);

// Manage coupons (Seller & Admin)
router.get('/', protect, authorize('seller', 'admin'), getCoupons);
router.post('/', protect, authorize('seller', 'admin'), validate(createCouponSchema), createCoupon);
router.put('/:id', protect, authorize('seller', 'admin'), validate(updateCouponSchema), updateCoupon);
router.patch('/:id/toggle', protect, authorize('seller', 'admin'), toggleCouponStatus);
router.delete('/:id', protect, authorize('seller', 'admin'), deleteCoupon);

export default router;
