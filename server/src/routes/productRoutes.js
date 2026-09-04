import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getProductBySlug,
  getFeaturedProducts,
  getTrendingProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createProductSchema,
  updateProductSchema,
} from '../validators/productValidator.js';

const router = Router();

// 1. Public Endpoints
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/trending', getTrendingProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/:id', getProductById);

// 2. Protected Seller & Admin Endpoints
router.post(
  '/',
  protect,
  authorize('seller', 'admin'),
  validate(createProductSchema),
  createProduct
);

router.put(
  '/:id',
  protect,
  authorize('seller', 'admin'),
  validate(updateProductSchema),
  updateProduct
);

router.delete('/:id', protect, authorize('seller', 'admin'), deleteProduct);

export default router;
