import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  toggleWishlist,
  getUserOrders,
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  addressSchema,
} from '../validators/userValidator.js';

const router = Router();

// All user routes are protected
router.use(protect);

// Profile
router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.put('/change-password', validate(changePasswordSchema), changePassword);

// Addresses
router.post('/addresses', validate(addressSchema), addAddress);
router.put('/addresses/:id', validate(addressSchema), updateAddress);
router.delete('/addresses/:id', deleteAddress);

// Wishlist
router.get('/wishlist', getWishlist);
router.post('/wishlist/:productId', toggleWishlist);

// Orders History
router.get('/orders', getUserOrders);

export default router;
