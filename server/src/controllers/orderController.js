import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as orderService from '../services/orderService.js';

export const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user._id, req.body);
  res.status(201).json(new ApiResponse(201, 'Order placed successfully', { order }));
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user, req.params.id);
  res.status(200).json(new ApiResponse(200, 'Order details fetched successfully', { order }));
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.user._id, req.params.id, req.body.reason);
  res.status(200).json(new ApiResponse(200, 'Order cancelled successfully', { order }));
});

export const getSellerOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getSellerOrders(req.user._id, req.query);
  res.status(200).json(new ApiResponse(200, 'Seller orders fetched successfully', result));
});

export const updateSellerOrderItemStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateSellerOrderItemStatus(
    req.user._id,
    req.params.orderId,
    req.params.itemId,
    req.body
  );
  res.status(200).json(new ApiResponse(200, 'Item status updated successfully', { order }));
});

export const getAdminOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getAdminOrders(req.query);
  res.status(200).json(new ApiResponse(200, 'Admin orders fetched successfully', result));
});

export const updateAdminOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateAdminOrderStatus(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Order status updated successfully', { order }));
});

export default {
  createOrder,
  getOrderById,
  cancelOrder,
  getSellerOrders,
  updateSellerOrderItemStatus,
  getAdminOrders,
  updateAdminOrderStatus,
};
