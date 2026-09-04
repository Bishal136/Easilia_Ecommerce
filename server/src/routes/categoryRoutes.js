import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validators/categoryValidator.js';

const router = Router();

// Public Routes
router.get('/', getCategories);
router.get('/slug/:slug', getCategoryBySlug);
router.get('/:id', getCategoryById);

// Admin Routes
router.post('/', protect, authorize('admin'), validate(createCategorySchema), createCategory);
router.put('/:id', protect, authorize('admin'), validate(updateCategorySchema), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

export default router;
