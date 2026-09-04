import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Withdrawal from '../models/Withdrawal.js';
import Settings from '../models/Settings.js';
import ApiError from '../utils/ApiError.js';

export const getDashboardAnalytics = async () => {
  const [
    totalUsers,
    totalSellers,
    totalProducts,
    totalOrders,
    pendingSellers,
    pendingWithdrawals,
    processedOrders,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    User.countDocuments(),
    Shop.countDocuments({ $or: [{ status: 'active' }, { kycStatus: 'approved' }] }),
    Product.countDocuments({ isActive: true }),
    Order.countDocuments(),
    Shop.countDocuments({ $or: [{ status: 'pending' }, { kycStatus: 'pending' }] }),
    Withdrawal.countDocuments({ status: 'pending' }),
    Order.find({ orderStatus: { $ne: 'cancelled' } }).select('totalPrice itemsPrice shippingPrice discountPrice'),
    Order.find()
      .populate('user', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Product.find({ isActive: true })
      .sort({ soldCount: -1 })
      .limit(5)
      .select('title slug basePrice discountPrice soldCount images')
      .lean(),
  ]);

  const totalGrossSales = processedOrders.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
  const platformRevenue = totalGrossSales * 0.1; // ~10% platform commission

  return {
    metrics: {
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      pendingSellers,
      pendingWithdrawals,
      totalGrossSales,
      platformRevenue,
    },
    recentOrders,
    topProducts,
  };
};

export const getUsers = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  
  // Role filtering
  const roleParam = (query.role || '').toLowerCase().trim();
  if (roleParam && roleParam !== 'all') {
    filter.role = roleParam;
  }

  // Verification filtering
  const verificationParam = (query.verification || query.isVerified || '').toString().toLowerCase().trim();
  if (verificationParam && verificationParam !== 'all') {
    if (verificationParam === 'verified' || verificationParam === 'true') {
      filter.isVerified = true;
    } else if (verificationParam === 'unverified' || verificationParam === 'false') {
      filter.isVerified = false;
    }
  }

  // Account status (Active vs Blocked / Banned)
  const statusParam = (query.status || query.accountStatus || '').toString().toLowerCase().trim();
  if (statusParam && statusParam !== 'all') {
    if (statusParam === 'active') {
      filter.isBanned = false;
    } else if (statusParam === 'blocked' || statusParam === 'banned') {
      filter.isBanned = true;
    }
  }

  // Search keyword across name, email, phone
  if (query.search && query.search.trim()) {
    const searchRegex = { $regex: query.search.trim(), $options: 'i' };
    const searchCondition = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
    ];
    if (filter.$and) {
      filter.$and.push({ $or: searchCondition });
    } else if (filter.role || filter.isVerified !== undefined || filter.isBanned !== undefined) {
      filter.$and = [{ $or: searchCondition }];
    } else {
      filter.$or = searchCondition;
    }
  }

  const [users, totalCount, statsData] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
    Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ isVerified: true }),
      User.countDocuments({ isVerified: false }),
      User.countDocuments({ isBanned: true }),
    ]),
  ]);

  const [total, buyers, sellers, admins, verified, unverified, banned] = statsData;

  return {
    users,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    stats: {
      total,
      buyers,
      sellers,
      admins,
      verified,
      unverified,
      banned,
    },
  };
};

export const getUserById = async (userId) => {
  const user = await User.findById(userId).lean();
  if (!user) throw new ApiError(404, 'User not found');
  let shop = null;
  if (user.role === 'seller') {
    shop = await Shop.findOne({ owner: user._id }).lean();
  }
  return { user, shop };
};

export const updateUserRole = async (userId, role) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  user.role = role;
  await user.save();
  return user;
};

export const toggleUserBan = async (userId, isBanned) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  user.isBanned = isBanned !== undefined ? Boolean(isBanned) : !user.isBanned;
  await user.save();
  return user;
};

export const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found');

  // Prevent deleting superadmin if only one admin exists
  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) {
      throw new ApiError(400, 'Cannot delete the sole platform administrator');
    }
  }

  await User.findByIdAndDelete(userId);
  return { success: true, message: 'User account deleted successfully' };
};

export const getSellers = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  const statusParam = (query.status || '').toLowerCase().trim();

  if (statusParam && statusParam !== 'all') {
    if (statusParam === 'pending') {
      filter.$or = [{ status: 'pending' }, { kycStatus: 'pending' }];
    } else if (statusParam === 'approved' || statusParam === 'active') {
      filter.$or = [{ status: 'active' }, { kycStatus: 'approved' }];
    } else if (statusParam === 'rejected') {
      filter.$or = [{ status: 'rejected' }, { kycStatus: 'rejected' }];
    } else if (statusParam === 'suspended') {
      filter.$or = [{ status: 'suspended' }, { isSuspended: true }];
    } else {
      filter.status = statusParam;
    }
  }

  if (query.search && query.search.trim()) {
    const searchRegex = { $regex: query.search.trim(), $options: 'i' };
    
    // Find matching users if searched by owner name or owner email/phone
    const matchingUsers = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ],
    }).select('_id');
    const userIds = matchingUsers.map((u) => u._id);

    const searchConditions = [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { 'address.city': searchRegex },
      { 'address.street': searchRegex },
      { 'taxIds.gst': searchRegex },
      { 'taxIds.pan': searchRegex },
      { 'taxIds.tradeLicense': searchRegex },
      { taxId: searchRegex },
    ];

    if (userIds.length > 0) {
      searchConditions.push({ owner: { $in: userIds } });
    }

    if (filter.$or) {
      filter.$and = [
        { $or: filter.$or },
        { $or: searchConditions },
      ];
      delete filter.$or;
    } else {
      filter.$or = searchConditions;
    }
  }

  const [sellers, totalCount, statsData] = await Promise.all([
    Shop.find(filter)
      .populate('owner', 'name email phone avatar isBanned role isVerified createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Shop.countDocuments(filter),
    Promise.all([
      Shop.countDocuments(),
      Shop.countDocuments({ $or: [{ status: 'pending' }, { kycStatus: 'pending' }] }),
      Shop.countDocuments({ $or: [{ status: 'active' }, { kycStatus: 'approved' }] }),
      Shop.countDocuments({ $or: [{ status: 'rejected' }, { kycStatus: 'rejected' }] }),
      Shop.countDocuments({ $or: [{ status: 'suspended' }, { isSuspended: true }] }),
    ]),
  ]);

  const [total, pending, approved, rejected, suspended] = statsData;

  return {
    sellers,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    stats: {
      total,
      pending,
      approved,
      rejected,
      suspended,
    },
  };
};

export const getSellerById = async (shopId) => {
  const shop = await Shop.findById(shopId)
    .populate('owner', 'name email phone avatar isBanned role isVerified createdAt')
    .lean();
  if (!shop) throw new ApiError(404, 'Shop not found');
  return shop;
};

export const updateSellerStatus = async (shopId, updatePayload) => {
  const shop = await Shop.findById(shopId);
  if (!shop) throw new ApiError(404, 'Shop not found');

  // Accept string or object payload
  const payload = typeof updatePayload === 'string' ? { status: updatePayload } : (updatePayload || {});
  const { status, kycStatus, isSuspended, rejectionReason, commissionRate } = payload;

  if (commissionRate !== undefined) {
    shop.commissionRate = Number(commissionRate);
  }

  if (rejectionReason !== undefined) {
    shop.rejectionReason = rejectionReason;
  }

  if (status === 'active' || kycStatus === 'approved') {
    shop.status = 'active';
    shop.kycStatus = 'approved';
    shop.isSuspended = false;
    shop.rejectionReason = '';
    // Elevate user to seller role
    if (shop.owner) {
      await User.findByIdAndUpdate(shop.owner, { role: 'seller' });
    }
  } else if (status === 'rejected' || kycStatus === 'rejected') {
    shop.status = 'rejected';
    shop.kycStatus = 'rejected';
  } else if (status === 'pending' || kycStatus === 'pending') {
    shop.status = 'pending';
    shop.kycStatus = 'pending';
  } else if (status === 'suspended' || isSuspended === true) {
    shop.status = 'suspended';
    shop.isSuspended = true;
  } else if (isSuspended === false && shop.status === 'suspended') {
    shop.status = 'active';
    shop.isSuspended = false;
  } else if (status) {
    shop.status = status;
  }

  if (isSuspended !== undefined) {
    shop.isSuspended = Boolean(isSuspended);
    if (shop.isSuspended) {
      shop.status = 'suspended';
    } else if (shop.status === 'suspended') {
      shop.status = 'active';
    }
  }

  await shop.save();

  const updatedShop = await Shop.findById(shopId)
    .populate('owner', 'name email phone avatar isBanned role isVerified createdAt')
    .lean();

  return updatedShop;
};

export const getPlatformSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      siteName: 'Nerob Commerce',
      currency: 'BDT',
      currencySymbol: '৳',
      defaultCommissionRate: 10,
      shippingChargeInsideDhaka: 60,
      shippingChargeOutsideDhaka: 120,
    });
  }
  return settings;
};

export const updatePlatformSettings = async (settingsData) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create(settingsData);
  } else {
    Object.assign(settings, settingsData);
    await settings.save();
  }
  return settings;
};

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
