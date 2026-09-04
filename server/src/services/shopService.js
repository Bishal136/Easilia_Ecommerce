import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import { generateSlug } from '../utils/generateSlug.js';

export const getShops = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = { status: 'active' };
  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }

  const [shops, totalCount] = await Promise.all([
    Shop.find(filter)
      .select('name slug logo banner description ratings numReviews totalProducts totalSales')
      .sort({ ratings: -1, totalSales: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Shop.countDocuments(filter),
  ]);

  return {
    shops,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};

export const getShopById = async (id) => {
  const shop = await Shop.findById(id).lean();
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }
  return shop;
};

export const getShopBySlug = async (slug) => {
  const shop = await Shop.findOne({ slug, status: 'active' }).lean();
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  const products = await Product.find({ shop: shop._id, isActive: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return { shop, products };
};

export const getOwnShop = async (userId) => {
  const shop = await Shop.findOne({ owner: userId }).lean();
  if (!shop) {
    throw new ApiError(404, 'Shop not found for this user');
  }
  return shop;
};

export const updateOwnShop = async (userId, updateData) => {
  const shop = await Shop.findOne({ owner: userId });
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  if (updateData.name && updateData.name !== shop.name) {
    shop.name = updateData.name;
    shop.slug = generateSlug(updateData.name);
  }

  if (updateData.email !== undefined) shop.email = updateData.email;
  if (updateData.description !== undefined) shop.description = updateData.description;
  if (updateData.phone !== undefined) shop.phone = updateData.phone;
  if (updateData.address) {
    shop.address = { ...shop.address?.toObject?.() || shop.address, ...updateData.address };
  }
  if (updateData.location && updateData.location.coordinates) {
    shop.location = {
      type: 'Point',
      coordinates: updateData.location.coordinates,
    };
  }
  if (updateData.taxIds) {
    shop.taxIds = { ...shop.taxIds?.toObject?.() || shop.taxIds, ...updateData.taxIds };
  }
  if (updateData.taxId !== undefined) shop.taxId = updateData.taxId;
  if (updateData.socialLinks) {
    shop.socialLinks = { ...shop.socialLinks?.toObject?.() || shop.socialLinks, ...updateData.socialLinks };
  }

  await shop.save();
  return shop;
};

export const updateShopMedia = async (userId, { logo, banner }) => {
  const shop = await Shop.findOne({ owner: userId });
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  if (logo !== undefined) {
    shop.logo = typeof logo === 'string' ? { url: logo } : logo;
  }
  if (banner !== undefined) {
    shop.banner = typeof banner === 'string' ? { url: banner } : banner;
  }

  await shop.save();
  return shop;
};


export const updateBankDetails = async (userId, bankData) => {
  const shop = await Shop.findOne({ owner: userId });
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  const normalized = {
    accountName: bankData.accountName || shop.bankDetails?.accountName || '',
    accountNumber: bankData.accountNumber || shop.bankDetails?.accountNumber || '',
    bankName: bankData.bankName || shop.bankDetails?.bankName || '',
    branch: bankData.branch || bankData.branchName || shop.bankDetails?.branch || '',
    routingNumber: bankData.routingNumber || shop.bankDetails?.routingNumber || '',
    mobileBankingType: bankData.mobileBankingType || shop.bankDetails?.mobileBankingType || 'none',
    mobileBankingNumber: bankData.mobileBankingNumber || bankData.bkashNumber || bankData.nagadNumber || bankData.rocketNumber || shop.bankDetails?.mobileBankingNumber || '',
  };

  shop.bankDetails = normalized;
  await shop.save();
  return shop;
};

export default {
  getShops,
  getShopById,
  getShopBySlug,
  getOwnShop,
  updateOwnShop,
  updateShopMedia,
  updateBankDetails,
};
