import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as userService from '../services/userService.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Profile fetched successfully', { user }));
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, 'Profile updated successfully', { user }));
});

export const changePassword = asyncHandler(async (req, res) => {
  await userService.changePassword(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, 'Password changed successfully'));
});

export const addAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.addAddress(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, 'Address added successfully', { addresses }));
});

export const updateAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.updateAddress(req.user._id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Address updated successfully', { addresses }));
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const addresses = await userService.deleteAddress(req.user._id, req.params.id);
  res.status(200).json(new ApiResponse(200, 'Address deleted successfully', { addresses }));
});

export const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await userService.getWishlist(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Wishlist fetched successfully', { wishlist }));
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const result = await userService.toggleWishlist(req.user._id, req.params.productId);
  res.status(200).json(
    new ApiResponse(
      200,
      result.action === 'added' ? 'Product added to wishlist' : 'Product removed from wishlist',
      result
    )
  );
});

export const getUserOrders = asyncHandler(async (req, res) => {
  const result = await userService.getUserOrders(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, 'Orders fetched successfully', result));
});

export default {
  getProfile,
  updateProfile,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  getWishlist,
  toggleWishlist,
  getUserOrders,
};
