import Coupon from '../models/Coupon.js';
import Shop from '../models/Shop.js';
import ApiError from '../utils/ApiError.js';

export const applyCoupon = async (code, orderAmount) => {
  if (!code || typeof code !== 'string') {
    throw new ApiError(400, 'Please provide a valid coupon code');
  }

  const cleanCode = code.trim().toUpperCase();
  const coupon = await Coupon.findOne({
    code: cleanCode,
    isActive: true,
  });

  if (!coupon) {
    throw new ApiError(404, 'Invalid coupon code or coupon is inactive');
  }

  const now = new Date();
  if (coupon.validFrom && now < new Date(coupon.validFrom)) {
    throw new ApiError(400, 'This coupon promotion has not started yet');
  }

  const expiry = coupon.validTo || coupon.validUntil;
  if (expiry && now > new Date(expiry)) {
    throw new ApiError(400, 'This coupon code has expired');
  }

  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new ApiError(400, 'Coupon maximum usage limit has been reached');
  }

  const numOrderAmount = Number(orderAmount) || 0;
  if (coupon.minOrderAmount && numOrderAmount < coupon.minOrderAmount) {
    throw new ApiError(400, `Minimum order amount of ৳${coupon.minOrderAmount} required to use coupon "${coupon.code}"`);
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (numOrderAmount * (coupon.discountValue || 0)) / 100;
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else if (coupon.discountType === 'fixed') {
    discountAmount = Math.min(coupon.discountValue || 0, numOrderAmount);
  } else if (coupon.discountType === 'free_shipping') {
    discountAmount = 60; // Standard shipping discount
  }

  discountAmount = Math.round(discountAmount * 100) / 100;

  return {
    couponId: coupon._id,
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    minOrderAmount: coupon.minOrderAmount || 0,
    maxDiscountAmount: coupon.maxDiscountAmount || null,
    finalAmount: Math.max(0, numOrderAmount - discountAmount),
  };
};

export const createCoupon = async (user, couponData) => {
  let shopId = null;
  if (user.role === 'seller') {
    const shop = await Shop.findOne({ owner: user._id });
    if (!shop) throw new ApiError(403, 'Must have an active shop to create coupons');
    shopId = shop._id;
  }

  const cleanCode = couponData.code.trim().toUpperCase();
  const existing = await Coupon.findOne({ code: cleanCode });
  if (existing) {
    throw new ApiError(400, `Coupon code "${cleanCode}" already exists`);
  }

  const validFrom = couponData.validFrom ? new Date(couponData.validFrom) : new Date();
  let validTo = couponData.validTo || couponData.validUntil;
  if (!validTo) {
    // Default 30 days from now
    validTo = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  } else {
    validTo = new Date(validTo);
  }

  const cleanPayload = {
    code: cleanCode,
    discountType: couponData.discountType,
    discountValue: Number(couponData.discountValue) || 0,
    minOrderAmount: Number(couponData.minOrderAmount) || 0,
    maxDiscountAmount: couponData.maxDiscountAmount ? Number(couponData.maxDiscountAmount) : null,
    maxUses: couponData.maxUses ? Number(couponData.maxUses) : null,
    validFrom,
    validTo,
    isActive: couponData.isActive !== false,
    shop: shopId,
  };

  const coupon = await Coupon.create(cleanPayload);
  return coupon;
};

export const getCoupons = async (user, query = {}) => {
  const filter = {};
  if (user.role === 'seller') {
    const shop = await Shop.findOne({ owner: user._id });
    if (shop) filter.shop = shop._id;
  }

  if (query.code) {
    filter.code = { $regex: query.code.trim(), $options: 'i' };
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  }

  return await Coupon.find(filter).sort({ createdAt: -1 }).lean();
};

export const updateCoupon = async (user, couponId, updateData) => {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) throw new ApiError(404, 'Coupon not found');

  if (user.role !== 'admin') {
    const shop = await Shop.findOne({ owner: user._id });
    if (!shop || coupon.shop?.toString() !== shop._id.toString()) {
      throw new ApiError(403, 'Unauthorized to update this coupon');
    }
  }

  if (updateData.code && updateData.code.trim().toUpperCase() !== coupon.code) {
    const cleanCode = updateData.code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: cleanCode, _id: { $ne: couponId } });
    if (existing) {
      throw new ApiError(400, `Coupon code "${cleanCode}" already exists`);
    }
    coupon.code = cleanCode;
  }

  if (updateData.discountType) coupon.discountType = updateData.discountType;
  if (updateData.discountValue !== undefined) coupon.discountValue = Number(updateData.discountValue);
  if (updateData.minOrderAmount !== undefined) coupon.minOrderAmount = Number(updateData.minOrderAmount) || 0;
  if (updateData.maxDiscountAmount !== undefined) {
    coupon.maxDiscountAmount = updateData.maxDiscountAmount ? Number(updateData.maxDiscountAmount) : null;
  }
  if (updateData.maxUses !== undefined) {
    coupon.maxUses = updateData.maxUses ? Number(updateData.maxUses) : null;
  }
  if (updateData.validFrom) coupon.validFrom = new Date(updateData.validFrom);
  if (updateData.validTo || updateData.validUntil) {
    coupon.validTo = new Date(updateData.validTo || updateData.validUntil);
  }
  if (updateData.isActive !== undefined) coupon.isActive = Boolean(updateData.isActive);

  await coupon.save();
  return coupon;
};

export const toggleCouponStatus = async (user, couponId) => {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) throw new ApiError(404, 'Coupon not found');

  if (user.role !== 'admin') {
    const shop = await Shop.findOne({ owner: user._id });
    if (!shop || coupon.shop?.toString() !== shop._id.toString()) {
      throw new ApiError(403, 'Unauthorized to modify this coupon');
    }
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();
  return coupon;
};

export const deleteCoupon = async (user, couponId) => {
  const coupon = await Coupon.findById(couponId);
  if (!coupon) throw new ApiError(404, 'Coupon not found');

  if (user.role !== 'admin') {
    const shop = await Shop.findOne({ owner: user._id });
    if (!shop || coupon.shop?.toString() !== shop._id.toString()) {
      throw new ApiError(403, 'Unauthorized to delete this coupon');
    }
  }

  await coupon.deleteOne();
  return true;
};

export default {
  applyCoupon,
  createCoupon,
  getCoupons,
  updateCoupon,
  toggleCouponStatus,
  deleteCoupon,
};
