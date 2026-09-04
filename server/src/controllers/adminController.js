import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as adminService from '../services/adminService.js';

export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const data = await adminService.getDashboardAnalytics();
  res.status(200).json(new ApiResponse(200, 'Analytics fetched successfully', data));
});

export const getUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getUsers(req.query);
  res.status(200).json(new ApiResponse(200, 'Users fetched successfully', result));
});

export const getUserById = asyncHandler(async (req, res) => {
  const data = await adminService.getUserById(req.params.id);
  res.status(200).json(new ApiResponse(200, 'User fetched successfully', data));
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserRole(req.params.id, req.body.role);
  res.status(200).json(new ApiResponse(200, 'User role updated successfully', { user }));
});

export const toggleUserBan = asyncHandler(async (req, res) => {
  const user = await adminService.toggleUserBan(req.params.id, req.body.isBanned);
  res.status(200).json(new ApiResponse(200, 'User ban status updated', { user }));
});

export const deleteUser = asyncHandler(async (req, res) => {
  const result = await adminService.deleteUser(req.params.id);
  res.status(200).json(new ApiResponse(200, result.message, result));
});

export const getSellers = asyncHandler(async (req, res) => {
  const result = await adminService.getSellers(req.query);
  res.status(200).json(new ApiResponse(200, 'Sellers fetched successfully', result));
});

export const getSellerById = asyncHandler(async (req, res) => {
  const shop = await adminService.getSellerById(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Seller fetched successfully', { shop }));
});

export const updateSellerStatus = asyncHandler(async (req, res) => {
  const shop = await adminService.updateSellerStatus(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Seller status updated successfully', { shop }));
});

export const getPlatformSettings = asyncHandler(async (req, res) => {
  const settings = await adminService.getPlatformSettings();
  res.status(200).json(new ApiResponse(200, 'Platform settings fetched', { settings }));
});

export const updatePlatformSettings = asyncHandler(async (req, res) => {
  const settings = await adminService.updatePlatformSettings(req.body);
  res.status(200).json(new ApiResponse(200, 'Platform settings updated', { settings }));
});

export default {
  getDashboardAnalytics,
  getUsers,
  getUserById,
  updateUserRole,
  toggleUserBan,
  deleteUser,
  getSellers,
  getSellerById,
  updateSellerStatus,
  getPlatformSettings,
  updatePlatformSettings,
};
