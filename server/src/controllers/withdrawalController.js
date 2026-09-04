import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as withdrawalService from '../services/withdrawalService.js';

export const requestWithdrawal = asyncHandler(async (req, res) => {
  const result = await withdrawalService.requestWithdrawal(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, 'Withdrawal request submitted', result));
});

export const getSellerWithdrawals = asyncHandler(async (req, res) => {
  const result = await withdrawalService.getSellerWithdrawals(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Withdrawals fetched successfully', result));
});

export const getAdminWithdrawals = asyncHandler(async (req, res) => {
  const result = await withdrawalService.getAdminWithdrawals(req.query);
  res.status(200).json(new ApiResponse(200, 'All withdrawals fetched successfully', result));
});

export const processWithdrawal = asyncHandler(async (req, res) => {
  const withdrawal = await withdrawalService.processWithdrawal(req.user._id, req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Withdrawal request processed', { withdrawal }));
});

export default {
  requestWithdrawal,
  getSellerWithdrawals,
  getAdminWithdrawals,
  processWithdrawal,
};
