import { Router } from 'express';
import {
  createReview,
  getProductReviews,
  getSellerReviews,
  getMyReviews,
  getPendingReviews,
  updateMyReview,
  replyReview,
  deleteReview,
  checkEligibility,
} from '../controllers/reviewController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authorize } from '../middlewares/roleMiddleware.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  createReviewSchema,
  replyReviewSchema,
} from '../validators/reviewValidator.js';

const router = Router();

// Protected: Seller view all shop reviews (MUST be above /:productId)
router.get('/seller/list', protect, authorize('seller', 'admin'), getSellerReviews);

// Protected: Buyer view their own reviews (MUST be above /:productId)
router.get('/my/list', protect, getMyReviews);

// Protected: Buyer view purchased products pending review (MUST be above /:productId)
router.get('/my/pending', protect, getPendingReviews);

// Protected: Buyer update their own review
router.put('/my/:id', protect, validate(createReviewSchema), updateMyReview);

// Public: View product reviews
router.get('/:productId', getProductReviews);

// Protected: Check review eligibility (if user bought product)
router.get('/:productId/eligibility', protect, checkEligibility);

// Protected: Write review
router.post('/:productId', protect, validate(createReviewSchema), createReview);

// Protected: Seller reply to review
router.post('/:id/reply', protect, authorize('seller', 'admin'), validate(replyReviewSchema), replyReview);

// Protected: Delete review
router.delete('/:id', protect, deleteReview);

export default router;
