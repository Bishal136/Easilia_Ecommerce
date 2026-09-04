import User from '../models/User.js';
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';

export const getProfile = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

export const updateProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (updateData.name) user.name = updateData.name;
  if (updateData.phone !== undefined) user.phone = updateData.phone;
  if (updateData.avatar) user.avatar = updateData.avatar;
  if (updateData.banner) user.banner = updateData.banner;

  await user.save();
  return user;
};

export const changePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.authProvider === 'google' && !user.password) {
    throw new ApiError(400, 'Cannot change password on accounts authenticated with Google');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  return true;
};

export const addAddress = async (userId, addressData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (addressData.isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  } else if (user.addresses.length === 0) {
    addressData.isDefault = true;
  }

  user.addresses.push(addressData);
  await user.save();
  return user.addresses;
};

export const updateAddress = async (userId, addressId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const address = user.addresses.id(addressId);
  if (!address) {
    throw new ApiError(404, 'Address not found');
  }

  if (updateData.isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  Object.assign(address, updateData);
  await user.save();
  return user.addresses;
};

export const deleteAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  user.addresses.pull({ _id: addressId });
  await user.save();
  return user.addresses;
};

export const getWishlist = async (userId) => {
  const user = await User.findById(userId)
    .populate({
      path: 'wishlist',
      select: 'title slug basePrice discountPrice images ratings numReviews shop totalStock',
      populate: { path: 'shop', select: 'name slug' },
    })
    .lean();

  return user?.wishlist || [];
};

export const toggleWishlist = async (userId, productId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const index = user.wishlist.findIndex((id) => id.toString() === productId);
  let action = 'added';

  if (index > -1) {
    user.wishlist.splice(index, 1);
    action = 'removed';
  } else {
    user.wishlist.push(productId);
  }

  await user.save();
  return { wishlist: user.wishlist, action };
};

export const getUserOrders = async (userId, query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = { user: userId };
  if (query.status && query.status !== 'all' && query.status !== 'All Orders') {
    filter.orderStatus = query.status.toLowerCase();
  }

  if (query.search && query.search.trim()) {
    filter.$or = [
      { orderNumber: { $regex: query.search.trim(), $options: 'i' } },
    ];
  }

  const [orders, totalCount] = await Promise.all([
    Order.find(filter)
      .populate('items.product', 'title slug images basePrice discountPrice')
      .populate('items.shop', 'name slug logo phone email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  return {
    orders,
    totalCount,
    totalPages: Math.ceil(totalCount / limit) || 1,
    currentPage: page,
  };
};

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
