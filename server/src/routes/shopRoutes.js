import { Router } from 'express';
import {
  getShops,
  getShopById,
  getShopBySlug,
  getOwnShop,
  updateOwnShop,
  updateShopMedia,
  updateBankDetails,
} from '../controllers/shopController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  updateShopSchema,
  updateBankDetailsSchema,
  updateShopMediaSchema,
} from '../validators/shopValidator.js';

const router = Router();

// Public Routes
router.get('/', getShops);
router.get('/slug/:slug', getShopBySlug);
router.get('/:id', getShopById);

// Protected Seller Routes
router.get('/seller/me', protect, authorize('seller', 'admin'), getOwnShop);
router.put('/seller/me', protect, authorize('seller', 'admin'), validate(updateShopSchema), updateOwnShop);
router.put('/seller/me/media', protect, authorize('seller', 'admin'), validate(updateShopMediaSchema), updateShopMedia);
router.put('/seller/me/bank', protect, authorize('seller', 'admin'), validate(updateBankDetailsSchema), updateBankDetails);

export default router;

