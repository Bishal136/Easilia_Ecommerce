import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import Order from '../models/Order.js';
import ApiError from '../utils/ApiError.js';

/**
 * Helper: Recalculate Average Ratings for Product & Shop
 */
const recalculateRatings = async (productId, shopId) => {
  const reviews = await Review.find({ product: productId });
  const numReviews = reviews.length;
  const avgRating = numReviews > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / numReviews : 0;

  await Product.findByIdAndUpdate(productId, {
    ratings: Number(avgRating.toFixed(1)),
    numReviews,
  });

  if (shopId) {
    const shopReviews = await Review.find({ shop: shopId });
    const shopNumReviews = shopReviews.length;
    const shopAvgRating =
      shopNumReviews > 0 ? shopReviews.reduce((acc, r) => acc + r.rating, 0) / shopNumReviews : 0;

    await Shop.findByIdAndUpdate(shopId, {
      ratings: Number(shopAvgRating.toFixed(1)),
      numReviews: shopNumReviews,
    });
  }
};

export const createReview = async (userId, productId, reviewData) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const existingReview = await Review.findOne({ user: userId, product: productId });
  if (existingReview) {
    throw new ApiError(400, 'You have already reviewed this product');
  }

  // Check if verified purchase
  const deliveredOrder = await Order.findOne({
    user: userId,
    'items.product': productId,
    orderStatus: 'delivered',
  });

  const isVerifiedPurchase = !!deliveredOrder;

  const review = await Review.create({
    user: userId,
    product: productId,
    shop: product.shop,
    rating: reviewData.rating,
    title: reviewData.title || undefined,
    comment: reviewData.comment,
    images: reviewData.images || [],
    video: reviewData.video || undefined,
    isVerifiedPurchase,
  });

  await recalculateRatings(productId, product.shop);
  return review;
};

export const getProductReviews = async (productId, query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const [reviews, totalCount] = await Promise.all([
    Review.find({ product: productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ product: productId }),
  ]);

  return {
    reviews,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};

export const getSellerReviews = async (sellerUserId, query = {}) => {
  const shop = await Shop.findOne({ owner: sellerUserId });
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { shop: shop._id };
  if (query.rating) {
    filter.rating = Number(query.rating);
  }

  const [reviews, totalCount] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name avatar')
      .populate('product', 'title slug images basePrice')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};

export const replyReview = async (sellerUserId, reviewId, replyText) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  const shop = await Shop.findOne({ owner: sellerUserId });
  if (!shop || review.shop.toString() !== shop._id.toString()) {
    throw new ApiError(403, 'Unauthorized to reply to reviews for other shops');
  }

  review.reply = {
    comment: replyText,
    createdAt: new Date(),
  };

  await review.save();
  return review;
};

export const deleteReview = async (user, reviewId) => {
  const review = await Review.findById(reviewId);
  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  if (user.role !== 'admin' && review.user.toString() !== user._id.toString()) {
    throw new ApiError(403, 'Unauthorized to delete this review');
  }

  const { product, shop } = review;
  await review.deleteOne();
  await recalculateRatings(product, shop);
  return true;
};

export const checkReviewEligibility = async (userId, productId) => {
  if (!userId) {
    return { canReview: false, reason: 'unauthenticated' };
  }

  const existingReview = await Review.findOne({ user: userId, product: productId });
  if (existingReview) {
    return { canReview: false, reason: 'already_reviewed', review: existingReview };
  }

  const order = await Order.findOne({
    user: userId,
    'items.product': productId,
    orderStatus: { $ne: 'cancelled' },
  });

  if (!order) {
    return { canReview: false, reason: 'not_purchased' };
  }

  return { canReview: true, isDelivered: order.orderStatus === 'delivered' };
};

export const getMyReviews = async (userId, query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { user: userId };

  const [reviews, totalCount] = await Promise.all([
    Review.find(filter)
      .populate('product', 'title slug images basePrice discountPrice price')
      .populate('shop', 'name logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};

export const updateMyReview = async (userId, reviewId, reviewData) => {
  const review = await Review.findOne({ _id: reviewId, user: userId });
  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  if (reviewData.rating) review.rating = reviewData.rating;
  if (reviewData.title !== undefined) review.title = reviewData.title;
  if (reviewData.comment) review.comment = reviewData.comment;
  if (reviewData.images) review.images = reviewData.images;
  if (reviewData.video !== undefined) review.video = reviewData.video;

  await review.save();
  await recalculateRatings(review.product, review.shop);
  return review;
};

export const getPendingReviews = async (userId) => {
  const orders = await Order.find({
    user: userId,
    orderStatus: { $ne: 'cancelled' },
  })
    .populate('items.product', 'title slug images basePrice discountPrice price shop')
    .populate('items.shop', 'name logo')
    .sort({ createdAt: -1 })
    .lean();

  const userReviews = await Review.find({ user: userId }).select('product').lean();
  const reviewedProductIds = new Set(userReviews.map((r) => r.product.toString()));

  const pendingMap = new Map();

  for (const order of orders) {
    for (const item of order.items || []) {
      if (!item.product || !item.product._id) continue;
      const prodIdStr = item.product._id.toString();

      if (!reviewedProductIds.has(prodIdStr) && !pendingMap.has(prodIdStr)) {
        pendingMap.set(prodIdStr, {
          product: item.product,
          shop: item.shop || null,
          orderId: order._id,
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          purchasedAt: order.createdAt,
          price: item.price,
        });
      }
    }
  }

  return Array.from(pendingMap.values());
};

export default {
  createReview,
  getProductReviews,
  getSellerReviews,
  getMyReviews,
  getPendingReviews,
  updateMyReview,
  replyReview,
  deleteReview,
  checkReviewEligibility,
};

