import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as reviewService from '../services/reviewService.js';

export const createReview = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview(req.user._id, req.params.productId, req.body);
  res.status(201).json(new ApiResponse(201, 'Review submitted successfully', { review }));
});

export const getProductReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getProductReviews(req.params.productId, req.query);
  res.status(200).json(new ApiResponse(200, 'Product reviews fetched successfully', result));
});

export const getSellerReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getSellerReviews(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, 'Seller reviews fetched successfully', result));
});

export const replyReview = asyncHandler(async (req, res) => {
  const review = await reviewService.replyReview(req.user._id, req.params.id, req.body.reply);
  res.status(200).json(new ApiResponse(200, 'Reply posted successfully', { review }));
});

export const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.user, req.params.id);
  res.status(200).json(new ApiResponse(200, 'Review deleted successfully'));
});

export const checkEligibility = asyncHandler(async (req, res) => {
  const result = await reviewService.checkReviewEligibility(req.user?._id, req.params.productId);
  res.status(200).json(new ApiResponse(200, 'Review eligibility checked', result));
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const result = await reviewService.getMyReviews(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, 'My reviews fetched successfully', result));
});

export const updateMyReview = asyncHandler(async (req, res) => {
  const review = await reviewService.updateMyReview(req.user._id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Review updated successfully', { review }));
});

export const getPendingReviews = asyncHandler(async (req, res) => {
  const pending = await reviewService.getPendingReviews(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Pending reviews fetched successfully', { pending }));
});

export default {
  createReview,
  getProductReviews,
  getSellerReviews,
  getMyReviews,
  getPendingReviews,
  updateMyReview,
  replyReview,
  deleteReview,
  checkEligibility,
};

