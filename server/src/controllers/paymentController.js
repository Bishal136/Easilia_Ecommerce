import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as paymentService from '../services/paymentService.js';

export const createPortPosSession = asyncHandler(async (req, res) => {
  const result = await paymentService.createPortPosSession(req.user._id, req.body.orderId);
  res.status(200).json(new ApiResponse(200, 'PortPos session initiated', result));
});

export const handlePortPosIPN = asyncHandler(async (req, res) => {
  const result = await paymentService.handlePortPosIPN(req.body);
  res.status(200).json(new ApiResponse(200, 'IPN processed successfully', result));
});

export const confirmCODPayment = asyncHandler(async (req, res) => {
  const order = await paymentService.confirmCODPayment(req.user, req.params.orderId);
  res.status(200).json(new ApiResponse(200, 'COD payment marked as completed', { order }));
});

export default {
  createPortPosSession,
  handlePortPosIPN,
  confirmCODPayment,
};
