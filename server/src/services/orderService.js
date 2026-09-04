import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import Coupon from '../models/Coupon.js';
import Notification from '../models/Notification.js';
import ApiError from '../utils/ApiError.js';

/**
 * Helper: Generate human-friendly unique order number
 */
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(100000 + Math.random() * 900000);
  return `ORD-${dateStr}-${randomStr}`;
};

/**
 * Create Multi-Vendor Order
 */
export const createOrder = async (userId, orderData) => {
  const { items, shippingAddress, paymentMethod, couponCode, notes } = orderData;

  const populatedItems = [];
  let subtotal = 0;

  // 1. Validate items & stock
  for (const item of items) {
    const prodId = typeof item.product === 'object' ? (item.product._id || item.product.id) : item.product;
    const product = await Product.findById(prodId);
    if (!product || !product.isActive) {
      throw new ApiError(400, `Product not found or unavailable: ${prodId}`);
    }

    let unitPrice = product.discountPrice || product.basePrice || product.price || 0;
    let variantData = null;

    if (item.variant && item.variant.name) {
      const foundVariant = product.variants?.find((v) => v.name === item.variant.name);
      if (foundVariant) {
        if (typeof foundVariant.stock === 'number' && foundVariant.stock < item.quantity) {
          throw new ApiError(400, `Insufficient stock for variant "${foundVariant.name}" of "${product.title}"`);
        }
        unitPrice = foundVariant.discountPrice || foundVariant.price || unitPrice;
        variantData = {
          name: foundVariant.name,
          sku: foundVariant.sku || '',
        };
        if (typeof foundVariant.stock === 'number') {
          foundVariant.stock = Math.max(0, foundVariant.stock - item.quantity);
        }
      }
    } else {
      if (typeof product.totalStock === 'number' && product.totalStock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for product "${product.title}"`);
      }
    }

    // Deduct total product stock
    if (typeof product.totalStock === 'number') {
      product.totalStock = Math.max(0, product.totalStock - item.quantity);
    }
    product.soldCount = (product.soldCount || 0) + item.quantity;
    await product.save();

    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;

    populatedItems.push({
      product: product._id,
      shop: product.shop,
      variant: variantData,
      price: unitPrice,
      quantity: item.quantity,
      itemStatus: 'pending',
    });
  }

  // 2. Shipping calculation (flat 60 BDT inside Dhaka, 120 outside)
  const isOutsideDhaka = shippingAddress?.city && shippingAddress.city.toLowerCase() !== 'dhaka';
  const shippingCost = isOutsideDhaka ? 120 : 60;
  const tax = 0;

  // 3. Coupon Discount Calculation
  let discount = 0;
  let appliedCouponId = null;

  if (couponCode) {
    const coupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
      isActive: true,
    });

    if (coupon) {
      const now = new Date();
      const isStarted = !coupon.validFrom || new Date(coupon.validFrom) <= now;
      const expiry = coupon.validTo || coupon.validUntil;
      const isNotExpired = !expiry || new Date(expiry) >= now;
      const hasUsesLeft = !coupon.maxUses || (coupon.usedCount || 0) < coupon.maxUses;
      const meetsMinOrder = !coupon.minOrderAmount || subtotal >= coupon.minOrderAmount;

      if (isStarted && isNotExpired && hasUsesLeft && meetsMinOrder) {
        if (coupon.discountType === 'percentage') {
          discount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
            discount = coupon.maxDiscountAmount;
          }
        } else if (coupon.discountType === 'fixed') {
          discount = Math.min(coupon.discountValue, subtotal);
        } else if (coupon.discountType === 'free_shipping') {
          discount = shippingCost;
        }

        discount = Math.round(discount * 100) / 100;
        coupon.usedCount = (coupon.usedCount || 0) + 1;
        await coupon.save();

        appliedCouponId = coupon._id;
      }
    }
  }

  const totalPrice = Math.max(0, subtotal + shippingCost + tax - discount);

  const formattedAddress = {
    fullName: shippingAddress?.fullName || shippingAddress?.name || 'Valued Customer',
    phone: shippingAddress?.phone || '01700000000',
    street: shippingAddress?.street || shippingAddress?.address || 'Standard Delivery Address',
    city: shippingAddress?.city || 'Dhaka',
    state: shippingAddress?.state || '',
    zipCode: shippingAddress?.zipCode || shippingAddress?.postalCode || '',
    country: shippingAddress?.country || 'Bangladesh',
  };

  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    user: userId,
    items: populatedItems,
    shippingAddress: formattedAddress,
    paymentMethod: paymentMethod === 'portpos' ? 'portpos' : 'cod',
    paymentStatus: 'pending',
    subtotal,
    shippingCost,
    discount,
    tax,
    totalPrice,
    coupon: appliedCouponId,
    notes,
    orderStatus: 'pending',
  });

  // 4. Create in-app notifications for respective shop owners
  const uniqueShopIds = [...new Set(populatedItems.map((item) => item.shop.toString()))];
  for (const sId of uniqueShopIds) {
    const shop = await Shop.findById(sId);
    if (shop) {
      await Notification.create({
        user: shop.owner,
        title: 'New Order Received',
        message: `Order #${order.orderNumber} includes items from your store.`,
        type: 'order',
        link: `/seller/orders`,
      });
    }
  }

  return order;
};

/**
 * Get Order Details by ID
 */
export const getOrderById = async (user, orderId) => {
  const order = await Order.findById(orderId)
    .populate('user', 'name email phone')
    .populate('items.product', 'title slug images')
    .populate('items.shop', 'name slug logo phone email')
    .populate('coupon', 'code discountType discountValue')
    .lean();

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (user.role !== 'admin' && order.user._id.toString() !== user._id.toString()) {
    const userShop = await Shop.findOne({ owner: user._id });
    const isSellerOfOrder =
      userShop &&
      order.items.some((item) => item.shop?._id?.toString() === userShop._id.toString());

    if (!isSellerOfOrder) {
      throw new ApiError(403, 'Not authorized to view this order');
    }
  }

  return order;
};

/**
 * Cancel Order (Buyer before shipping)
 */
export const cancelOrder = async (userId, orderId, reason) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.user.toString() !== userId.toString()) {
    throw new ApiError(403, 'You are not authorized to cancel this order');
  }

  if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
    throw new ApiError(400, `Cannot cancel order with status "${order.orderStatus}"`);
  }

  // Restore inventory
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      if (item.variant?.name) {
        const foundVariant = product.variants.find((v) => v.name === item.variant.name);
        if (foundVariant) foundVariant.stock += item.quantity;
      }
      product.totalStock += item.quantity;
      product.soldCount = Math.max(0, (product.soldCount || 0) - item.quantity);
      await product.save();
    }
    item.itemStatus = 'cancelled';
  }

  order.orderStatus = 'cancelled';
  order.cancelledAt = new Date();
  order.notes = reason ? `Cancelled by buyer: ${reason}` : order.notes;
  await order.save();

  // Revert seller balance if this order was already credited
  if (order.isSellerCredited) {
    await debitSellerBalanceForOrder(order._id);
  }

  return order;
};

/**
 * Get Orders for Seller Shop
 */
export const getSellerOrders = async (sellerUserId, query = {}) => {
  const shop = await Shop.findOne({ owner: sellerUserId });
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { 'items.shop': shop._id };
  if (query.status) {
    filter['items.itemStatus'] = query.status;
  }

  const [orders, totalCount] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email phone')
      .populate('items.product', 'title slug images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  const formattedOrders = orders.map((order) => {
    const sellerItems = order.items.filter(
      (item) => item.shop.toString() === shop._id.toString()
    );
    const sellerSubtotal = sellerItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    return {
      ...order,
      sellerItems,
      sellerSubtotal,
    };
  });

  return {
    orders: formattedOrders,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};

/**
 * Helper: Credit seller balance for an order when payment is confirmed (PortPos / Online Gateway or confirmed COD collection)
 */
export const creditSellerBalanceForOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) return null;

  // Never credit if already credited or if payment is not paid
  if (order.isSellerCredited || order.paymentStatus !== 'paid') {
    return order;
  }

  // Calculate earnings for each shop based on valid non-cancelled items
  const shopEarnings = {};
  for (const item of order.items) {
    if (item.itemStatus === 'cancelled') continue;
    const sId = item.shop.toString();
    const itemTotal = item.price * item.quantity;
    if (!shopEarnings[sId]) {
      shopEarnings[sId] = { total: 0 };
    }
    shopEarnings[sId].total += itemTotal;
  }

  for (const [shopId, data] of Object.entries(shopEarnings)) {
    const shop = await Shop.findById(shopId);
    if (shop) {
      const commissionRate = shop.commissionRate || 10;
      const commissionAmount = (data.total * commissionRate) / 100;
      const sellerNetEarning = Math.max(0, data.total - commissionAmount);

      shop.balance = (shop.balance || 0) + sellerNetEarning;
      shop.totalSales = (shop.totalSales || 0) + data.total;
      await shop.save();
    }
  }

  order.isSellerCredited = true;
  await order.save();
  return order;
};

/**
 * Helper: Revert / Debit seller balance for a cancelled or refunded order if it was previously credited
 */
export const debitSellerBalanceForOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order || !order.isSellerCredited) return null;

  const shopEarnings = {};
  for (const item of order.items) {
    const sId = item.shop.toString();
    const itemTotal = item.price * item.quantity;
    if (!shopEarnings[sId]) {
      shopEarnings[sId] = { total: 0 };
    }
    shopEarnings[sId].total += itemTotal;
  }

  for (const [shopId, data] of Object.entries(shopEarnings)) {
    const shop = await Shop.findById(shopId);
    if (shop) {
      const commissionRate = shop.commissionRate || 10;
      const commissionAmount = (data.total * commissionRate) / 100;
      const sellerNetEarning = Math.max(0, data.total - commissionAmount);

      shop.balance = Math.max(0, (shop.balance || 0) - sellerNetEarning);
      shop.totalSales = Math.max(0, (shop.totalSales || 0) - data.total);
      await shop.save();
    }
  }

  order.isSellerCredited = false;
  await order.save();
  return order;
};

/**
 * Update Line Item Status by Seller
 */
export const updateSellerOrderItemStatus = async (sellerUserId, orderId, itemId, { status }) => {
  const shop = await Shop.findOne({ owner: sellerUserId });
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const item = order.items.id(itemId);
  if (!item) {
    throw new ApiError(404, 'Order item not found');
  }

  if (item.shop.toString() !== shop._id.toString()) {
    throw new ApiError(403, 'Not authorized to update items belonging to another shop');
  }

  item.itemStatus = status;

  if (status === 'delivered') {
    // For COD orders, delivering and collecting cash updates paymentStatus and credits seller balance
    if (order.paymentMethod === 'cod') {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
      await order.save();
      await creditSellerBalanceForOrder(order._id);
    }
  } else if (status === 'cancelled') {
    // Restore product and variant stock upon cancellation
    try {
      const product = await Product.findById(item.product);
      if (product) {
        product.totalStock = (product.totalStock || 0) + item.quantity;
        if (item.variant && item.variant.name) {
          const varObj = product.variants?.find((v) => v.name === item.variant.name);
          if (varObj) {
            varObj.stock = (varObj.stock || 0) + item.quantity;
          }
        }
        await product.save();
      }
    } catch (err) {
      console.error('Stock restoration error on seller order cancellation:', err);
    }
  }

  const allCancelled = order.items.every((it) => it.itemStatus === 'cancelled');
  if (allCancelled) {
    order.orderStatus = 'cancelled';
    order.cancelledAt = new Date();
  } else {
    const allDelivered = order.items.every((it) => it.itemStatus === 'delivered');
    if (allDelivered) {
      order.orderStatus = 'delivered';
      order.deliveredAt = new Date();
    } else {
      const anyShipped = order.items.some((it) => ['shipped', 'delivered'].includes(it.itemStatus));
      if (anyShipped) {
        order.orderStatus = 'shipped';
      } else {
        const anyProcessing = order.items.some((it) => it.itemStatus === 'processing');
        if (anyProcessing) order.orderStatus = 'processing';
      }
    }
  }

  await order.save();
  return order;
};

/**
 * Get All Orders (Admin)
 */
export const getAdminOrders = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};

  // Lifecycle status filter
  if (query.orderStatus && query.orderStatus !== 'all' && query.orderStatus !== 'All') {
    filter.orderStatus = query.orderStatus.toLowerCase();
  } else if (query.status && query.status !== 'all' && query.status !== 'All') {
    filter.orderStatus = query.status.toLowerCase();
  }

  // Payment status filter
  if (query.paymentStatus && query.paymentStatus !== 'all' && query.paymentStatus !== 'All') {
    filter.paymentStatus = query.paymentStatus.toLowerCase();
  }

  // Date range filter
  if (query.fromDate || query.toDate) {
    filter.createdAt = {};
    if (query.fromDate) {
      const fromStr = query.fromDate.includes('T')
        ? query.fromDate
        : `${query.fromDate}T00:00:00.000Z`;
      const fromDateObj = new Date(fromStr);
      if (!isNaN(fromDateObj.getTime())) {
        filter.createdAt.$gte = fromDateObj;
      }
    }
    if (query.toDate) {
      const toStr = query.toDate.includes('T')
        ? query.toDate
        : `${query.toDate}T23:59:59.999Z`;
      const toDateObj = new Date(toStr);
      if (!isNaN(toDateObj.getTime())) {
        filter.createdAt.$lte = toDateObj;
      }
    }
  }

  // Search across order number, buyer name/email/phone, or shop
  if (query.search && query.search.trim()) {
    const searchRegex = { $regex: query.search.trim(), $options: 'i' };
    
    // Find matching users and shops to include their ObjectIds
    const [matchingUsers, matchingShops] = await Promise.all([
      User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
        ],
      }).select('_id').lean(),
      Shop.find({
        name: searchRegex,
      }).select('_id').lean(),
    ]);

    const userIds = matchingUsers.map((u) => u._id);
    const shopIds = matchingShops.map((s) => s._id);

    filter.$or = [
      { orderNumber: searchRegex },
      { 'shippingAddress.fullName': searchRegex },
      { 'shippingAddress.phone': searchRegex },
      { user: { $in: userIds } },
      { 'items.shop': { $in: shopIds } },
    ];
  }

  const [orders, totalCount, allOrdersSummary] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email phone avatar')
      .populate('items.product', 'title slug images price')
      .populate('items.shop', 'name slug logo phone email')
      .populate('coupon', 'code discountType discountValue')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
    Order.aggregate([
      {
        $group: {
          _id: null,
          totalGMV: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 },
          pendingCount: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'pending'] }, 1, 0] },
          },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const summary = allOrdersSummary[0] || {
    totalGMV: 0,
    totalOrders: 0,
    pendingCount: 0,
    deliveredCount: 0,
  };

  return {
    orders,
    totalCount,
    totalPages: Math.ceil(totalCount / limit) || 1,
    currentPage: page,
    stats: summary,
  };
};

/**
 * Update Entire Order Status (Admin)
 */
export const updateAdminOrderStatus = async (orderId, { orderStatus, paymentStatus, notes }) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (orderStatus) {
    order.orderStatus = orderStatus;
    if (orderStatus === 'delivered') order.deliveredAt = new Date();
    if (orderStatus === 'cancelled') order.cancelledAt = new Date();
    order.items.forEach((it) => {
      it.itemStatus = orderStatus;
    });
  }

  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
    if (paymentStatus === 'paid' && !order.paidAt) {
      order.paidAt = new Date();
    }
  }

  if (notes) {
    order.notes = notes;
  }

  await order.save();

  if (order.paymentStatus === 'paid') {
    await creditSellerBalanceForOrder(order._id);
  }

  const populatedOrder = await Order.findById(orderId)
    .populate('user', 'name email phone avatar')
    .populate('items.product', 'title slug images price')
    .populate('items.shop', 'name slug logo phone email')
    .populate('coupon', 'code discountType discountValue')
    .lean();

  return populatedOrder;
};

export default {
  createOrder,
  getOrderById,
  cancelOrder,
  getSellerOrders,
  updateSellerOrderItemStatus,
  getAdminOrders,
  updateAdminOrderStatus,
};
