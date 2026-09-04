import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as bannerService from '../services/bannerService.js';

export const getActiveBanners = asyncHandler(async (req, res) => {
  const banners = await bannerService.getActiveBanners(req.query);
  res.status(200).json(new ApiResponse(200, 'Banners fetched successfully', { banners }));
});

export const createBanner = asyncHandler(async (req, res) => {
  const banner = await bannerService.createBanner(req.body);
  res.status(201).json(new ApiResponse(201, 'Banner created successfully', { banner }));
});

export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await bannerService.updateBanner(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, 'Banner updated successfully', { banner }));
});

export const deleteBanner = asyncHandler(async (req, res) => {
  await bannerService.deleteBanner(req.params.id);
  res.status(200).json(new ApiResponse(200, 'Banner deleted successfully'));
});

export default {
  getActiveBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
