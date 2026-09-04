import Banner from '../models/Banner.js';
import ApiError from '../utils/ApiError.js';

export const getActiveBanners = async (params = {}) => {
  const filter = {};
  if (typeof params === 'string') {
    filter.position = params;
    filter.isActive = true;
  } else if (params && typeof params === 'object') {
    if (params.position) filter.position = params.position;
    if (params.isActive !== undefined && params.isActive !== 'all') {
      filter.isActive = params.isActive === 'true' || params.isActive === true;
    }
  }

  return await Banner.find(filter).sort({ priority: -1, createdAt: -1 }).lean();
};

export const createBanner = async (bannerData) => {
  return await Banner.create(bannerData);
};

export const updateBanner = async (bannerId, updateData) => {
  const banner = await Banner.findByIdAndUpdate(bannerId, updateData, { new: true });
  if (!banner) throw new ApiError(404, 'Banner not found');
  return banner;
};

export const deleteBanner = async (bannerId) => {
  const banner = await Banner.findByIdAndDelete(bannerId);
  if (!banner) throw new ApiError(404, 'Banner not found');
  return true;
};

export default {
  getActiveBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
