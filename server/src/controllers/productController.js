import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import * as productService from '../services/productService.js';

/**
 * @desc    Get all products (with pagination, filters, sorting & search)
 * @route   GET /api/v1/products
 * @access  Public
 */
export const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.getProducts(req.query);

  res.status(200).json(
    new ApiResponse(200, 'Products fetched successfully', result)
  );
});

/**
 * @desc    Get single product by ID
 * @route   GET /api/v1/products/:id
 * @access  Public
 */
export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  res.status(200).json(
    new ApiResponse(200, 'Product details fetched successfully', { product })
  );
});

/**
 * @desc    Get single product by Slug
 * @route   GET /api/v1/products/slug/:slug
 * @access  Public
 */
export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);

  res.status(200).json(
    new ApiResponse(200, 'Product details fetched successfully', { product })
  );
});

/**
 * @desc    Get featured products
 * @route   GET /api/v1/products/featured
 * @access  Public
 */
export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 8;
  const products = await productService.getFeaturedProducts(limit);

  res.status(200).json(
    new ApiResponse(200, 'Featured products fetched successfully', { products })
  );
});

/**
 * @desc    Get trending / popular products
 * @route   GET /api/v1/products/trending
 * @access  Public
 */
export const getTrendingProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 8;
  const products = await productService.getTrendingProducts(limit);

  res.status(200).json(
    new ApiResponse(200, 'Trending products fetched successfully', { products })
  );
});

/**
 * @desc    Create new product
 * @route   POST /api/v1/products
 * @access  Seller / Admin
 */
export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.user._id, req.body);

  res.status(201).json(
    new ApiResponse(201, 'Product created successfully', { product })
  );
});

/**
 * @desc    Update product
 * @route   PUT /api/v1/products/:id
 * @access  Seller / Admin
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.user, req.params.id, req.body);

  res.status(200).json(
    new ApiResponse(200, 'Product updated successfully', { product })
  );
});

/**
 * @desc    Delete product
 * @route   DELETE /api/v1/products/:id
 * @access  Seller / Admin
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.user, req.params.id);

  res.status(200).json(
    new ApiResponse(200, 'Product deleted successfully')
  );
});

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
