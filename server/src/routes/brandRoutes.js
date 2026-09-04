import { Router } from 'express';
import {
  getBrands,
  getBrandById,
  getBrandBySlug,
  createBrand,
  updateBrand,
  deleteBrand,
} from '../controllers/brandController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import { createBrandSchema, updateBrandSchema } from '../validators/brandValidator.js';

const router = Router();

// Public Routes
router.get('/', getBrands);
router.get('/slug/:slug', getBrandBySlug);
router.get('/:id', getBrandById);

// Admin Routes
router.post('/', protect, authorize('admin'), validate(createBrandSchema), createBrand);
router.put('/:id', protect, authorize('admin'), validate(updateBrandSchema), updateBrand);
router.delete('/:id', protect, authorize('admin'), deleteBrand);

export default router;
