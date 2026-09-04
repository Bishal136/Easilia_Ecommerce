import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as shopService from '../services/shopService.js';

export const getShops = asyncHandler(async (req, res) => {
  const result = await shopService.getShops(req.query);
  res.status(200).json(new ApiResponse(200, 'Shops fetched successfully', result));
});

export const getShopById = asyncHandler(async (req, res) => {
  const shop = await shopService.getShopById(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Shop details fetched successfully', { shop }));
});

export const getShopBySlug = asyncHandler(async (req, res) => {
  const result = await shopService.getShopBySlug(req.params.slug);
  res.status(200).json(new ApiResponse(200, 'Shop details fetched successfully', result));
});

export const getOwnShop = asyncHandler(async (req, res) => {
  const shop = await shopService.getOwnShop(req.user._id);
  res.status(200).json(new ApiResponse(200, 'Your shop details fetched successfully', { shop }));
});

export const updateOwnShop = asyncHandler(async (req, res) => {
  const shop = await shopService.updateOwnShop(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, 'Shop updated successfully', { shop }));
});

export const updateShopMedia = asyncHandler(async (req, res) => {
  const shop = await shopService.updateShopMedia(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, 'Shop media updated successfully', { shop }));
});

export const updateBankDetails = asyncHandler(async (req, res) => {
  const shop = await shopService.updateBankDetails(req.user._id, req.body);
  res.status(200).json(new ApiResponse(200, 'Bank details updated successfully', { shop }));
});

export default {
  getShops,
  getShopById,
  getShopBySlug,
  getOwnShop,
  updateOwnShop,
  updateShopMedia,
  updateBankDetails,
};
