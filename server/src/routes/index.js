import { Router } from 'express';
import ApiResponse from '../utils/ApiResponse.js';

// Route Modules
import authRoutes from './authRoutes.js';
import uploadRoutes from './uploadRoutes.js';
import userRoutes from './userRoutes.js';
import shopRoutes from './shopRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import brandRoutes from './brandRoutes.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import couponRoutes from './couponRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import chatRoutes from './chatRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import withdrawalRoutes from './withdrawalRoutes.js';
import bannerRoutes from './bannerRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

// Health Check Endpoint
router.get('/health', (req, res) => {
  res.status(200).json(
    new ApiResponse(200, 'Nerob Ecommerce Backend is running smoothly', {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
    })
  );
});

// API Info Endpoint
router.get('/', (req, res) => {
  res.status(200).json(
    new ApiResponse(200, 'Welcome to Nerob Multi-Vendor Ecommerce API v1', {
      docs: '/api/v1/health',
      version: 'v1',
    })
  );
});

// Mount All Core API Routes
router.use('/auth', authRoutes);
router.use('/upload', uploadRoutes);
router.use('/users', userRoutes);
router.use('/shops', shopRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/payments', paymentRoutes);
router.use('/coupons', couponRoutes);
router.use('/reviews', reviewRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/withdrawals', withdrawalRoutes);
router.use('/banners', bannerRoutes);
router.use('/admin', adminRoutes);

export default router;
