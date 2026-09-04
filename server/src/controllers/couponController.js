import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as couponService from '../services/couponService.js';

export const applyCoupon = asyncHandler(async (req, res) => {
  const result = await couponService.applyCoupon(req.body.code, req.body.orderAmount);
  res.status(200).json(new ApiResponse(200, 'Coupon applied successfully', result));
});

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.user, req.body);
  res.status(201).json(new ApiResponse(201, 'Coupon created successfully', { coupon }));
});

export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await couponService.getCoupons(req.user, req.query);
  res.status(200).json(new ApiResponse(200, 'Coupons fetched successfully', { coupons }));
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.user, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Coupon updated successfully', { coupon }));
});

export const toggleCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await couponService.toggleCouponStatus(req.user, req.params.id);
  res.status(200).json(new ApiResponse(200, `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`, { coupon }));
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(req.user, req.params.id);
  res.status(200).json(new ApiResponse(200, 'Coupon deleted successfully'));
});

export default {
  applyCoupon,
  createCoupon,
  getCoupons,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
};
