import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import ApiError from '../utils/ApiError.js';
import { generateSlug } from '../utils/generateSlug.js';

/**
 * Get Paginated and Filtered Products
 */
export const getProducts = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.isActive !== undefined) {
    filter.isActive = query.isActive === 'true' || query.isActive === true;
  } else if (!query.shop && !query.seller) {
    filter.isActive = true;
  }

  // Category filter (supports ObjectId or category slug/name)
  if (query.category && query.category !== 'all' && query.category !== 'All Categories') {
    if (mongoose.Types.ObjectId.isValid(query.category)) {
      filter.category = query.category;
    } else {
      const foundCat = await Category.findOne({
        $or: [
          { slug: query.category },
          { name: { $regex: `^${query.category}$`, $options: 'i' } },
        ],
      }).lean();
      if (foundCat) {
        filter.category = foundCat._id;
      }
    }
  }

  // Discounted filter
  if (query.discounted === 'true' || query.onSale === 'true') {
    filter.discountPrice = { $gt: 0 };
  }

  // Subcategory filter
  if (query.subCategory) {
    filter.subCategory = query.subCategory;
  }

  // Brand filter
  if (query.brand) {
    filter.brand = query.brand;
  }

  // Shop filter
  if (query.shop) {
    filter.shop = query.shop;
  }

  // Featured filter
  if (query.isFeatured === 'true') {
    filter.isFeatured = true;
  }

  // In-stock filter
  if (query.inStock === 'true') {
    filter.totalStock = { $gt: 0 };
  }

  // Price range filter
  if (query.minPrice || query.maxPrice) {
    filter.basePrice = {};
    if (query.minPrice) filter.basePrice.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.basePrice.$lte = Number(query.maxPrice);
  }

  // Ratings filter
  if (query.rating) {
    filter.ratings = { $gte: Number(query.rating) };
  }

  // Full-text search with regex fallback
  if (query.search && query.search.trim()) {
    const q = query.search.trim();
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { tags: { $in: [new RegExp(q, 'i')] } },
    ];
  }

  // Sorting
  let sort = { createdAt: -1 };
  if (query.sort === 'price_asc' || query.sort === 'price-low') sort = { basePrice: 1 };
  if (query.sort === 'price_desc' || query.sort === 'price-high') sort = { basePrice: -1 };
  if (query.sort === 'rating' || query.sort === 'top-rated') sort = { ratings: -1 };
  if (query.sort === 'popular' || query.sort === 'popularity' || query.sort === 'trending')
    sort = { soldCount: -1 };
  if (query.sort === 'newest') sort = { createdAt: -1 };

  const [products, totalCount] = await Promise.all([
    Product.find(filter)
      .populate('shop', 'name slug logo')
      .populate('category', 'name slug')
      .populate('brand', 'name slug logo')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
    limit,
  };
};

export const getProductById = async (id) => {
  const product = await Product.findById(id)
    .populate('shop', 'name slug logo description ratings numReviews')
    .populate('category', 'name slug')
    .populate('subCategory', 'name slug')
    .populate('brand', 'name slug logo')
    .lean();

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const reviewStats = await Review.aggregate([
    { $match: { product: product._id } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  product.numReviews = reviewStats[0]?.count || 0;
  product.ratings = reviewStats[0]?.avgRating ? Number(reviewStats[0].avgRating.toFixed(1)) : 0;

  return product;
};

export const getProductBySlug = async (slugOrId) => {
  const query = { isActive: true };
  if (mongoose.Types.ObjectId.isValid(slugOrId)) {
    query.$or = [{ slug: slugOrId }, { _id: slugOrId }];
  } else {
    query.slug = slugOrId;
  }

  const product = await Product.findOne(query)
    .populate('shop', 'name slug logo description ratings numReviews')
    .populate('category', 'name slug')
    .populate('subCategory', 'name slug')
    .populate('brand', 'name slug logo')
    .lean();

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const reviewStats = await Review.aggregate([
    { $match: { product: product._id } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  product.numReviews = reviewStats[0]?.count || 0;
  product.ratings = reviewStats[0]?.avgRating ? Number(reviewStats[0].avgRating.toFixed(1)) : 0;

  return product;
};

/**
 * Get Featured Products
 */
export const getFeaturedProducts = async (limit = 8) => {
  return await Product.find({ isFeatured: true, isActive: true })
    .populate('shop', 'name slug logo')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

/**
 * Get Trending / Top Selling Products
 */
export const getTrendingProducts = async (limit = 8) => {
  return await Product.find({ isActive: true })
    .populate('shop', 'name slug logo')
    .populate('category', 'name slug')
    .sort({ soldCount: -1, ratings: -1 })
    .limit(limit)
    .lean();
};

/**
 * Create Product (Seller)
 */
export const createProduct = async (userId, productData) => {
  const shop = await Shop.findOne({ owner: userId });
  if (!shop) {
    throw new ApiError(403, 'You must have a registered shop to create products.');
  }

  // Enforce KYC verification check
  if (shop.kycStatus === 'pending' || shop.kycStatus !== 'approved' || shop.status !== 'active') {
    throw new ApiError(
      403,
      'You are not verified yet. Your KYC status is PENDING. You cannot create or publish products until your seller account is verified by Admin.'
    );
  }

  let slug = generateSlug(productData.title);
  const existing = await Product.findOne({ slug });
  if (existing) {
    slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Calculate total stock from variants if variants are supplied
  let totalStock = productData.totalStock || 0;
  if (productData.variants && productData.variants.length > 0) {
    totalStock = productData.variants.reduce((acc, curr) => acc + (curr.stock || 0), 0);
  }

  const product = await Product.create({
    ...productData,
    slug,
    shop: shop._id,
    totalStock,
  });

  return product;
};

/**
 * Update Product (Seller / Admin)
 */
export const updateProduct = async (user, productId, updateData) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  // Check ownership unless admin
  if (user.role !== 'admin') {
    const shop = await Shop.findOne({ owner: user._id });
    if (!shop || product.shop.toString() !== shop._id.toString()) {
      throw new ApiError(403, 'You are not authorized to update this product.');
    }
  }

  if (updateData.title && updateData.title !== product.title) {
    product.title = updateData.title;
    product.slug = generateSlug(updateData.title);
  }

  // Calculate stock if variants updated
  if (updateData.variants) {
    updateData.totalStock = updateData.variants.reduce((acc, curr) => acc + (curr.stock || 0), 0);
  }

  Object.assign(product, updateData);
  await product.save();

  return product;
};

/**
 * Delete Product (Seller / Admin)
 */
export const deleteProduct = async (user, productId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (user.role !== 'admin') {
    const shop = await Shop.findOne({ owner: user._id });
    if (!shop || product.shop.toString() !== shop._id.toString()) {
      throw new ApiError(403, 'You are not authorized to delete this product.');
    }
  }

  await product.deleteOne();
  return true;
};

export default {
  getProducts,
  getProductById,
  getProductBySlug,
  getFeaturedProducts,
  getTrendingProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
