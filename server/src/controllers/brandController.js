import Brand from '../models/Brand.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { generateSlug } from '../utils/generateSlug.js';

/**
 * @desc    Get all active brands
 * @route   GET /api/v1/brands
 * @access  Public
 */
export const getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find({ isActive: true }).sort({ name: 1 }).lean();

  res.status(200).json(
    new ApiResponse(200, 'Brands fetched successfully', {
      brands,
      totalCount: brands.length,
    })
  );
});

/**
 * @desc    Get single brand by ID
 * @route   GET /api/v1/brands/:id
 * @access  Public
 */
export const getBrandById = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id).lean();

  if (!brand) {
    throw new ApiError(404, 'Brand not found');
  }

  res.status(200).json(new ApiResponse(200, 'Brand fetched successfully', { brand }));
});

/**
 * @desc    Get single brand by Slug
 * @route   GET /api/v1/brands/slug/:slug
 * @access  Public
 */
export const getBrandBySlug = asyncHandler(async (req, res) => {
  const brand = await Brand.findOne({ slug: req.params.slug, isActive: true }).lean();

  if (!brand) {
    throw new ApiError(404, 'Brand not found');
  }

  res.status(200).json(new ApiResponse(200, 'Brand fetched successfully', { brand }));
});

/**
 * @desc    Create new brand
 * @route   POST /api/v1/brands
 * @access  Admin
 */
export const createBrand = asyncHandler(async (req, res) => {
  const { name, logo, description, website, isActive } = req.body;

  let slug = generateSlug(name);
  const existing = await Brand.findOne({ slug });
  if (existing) {
    slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const brand = await Brand.create({
    name,
    slug,
    logo: logo || {},
    description,
    website,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json(new ApiResponse(201, 'Brand created successfully', { brand }));
});

/**
 * @desc    Update brand
 * @route   PUT /api/v1/brands/:id
 * @access  Admin
 */
export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    throw new ApiError(404, 'Brand not found');
  }

  if (req.body.name && req.body.name !== brand.name) {
    brand.name = req.body.name;
    brand.slug = generateSlug(req.body.name);
  }

  if (req.body.logo !== undefined) brand.logo = req.body.logo;
  if (req.body.description !== undefined) brand.description = req.body.description;
  if (req.body.website !== undefined) brand.website = req.body.website;
  if (req.body.isActive !== undefined) brand.isActive = req.body.isActive;

  await brand.save();

  res.status(200).json(new ApiResponse(200, 'Brand updated successfully', { brand }));
});

/**
 * @desc    Delete brand
 * @route   DELETE /api/v1/brands/:id
 * @access  Admin
 */
export const deleteBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);

  if (!brand) {
    throw new ApiError(404, 'Brand not found');
  }

  await brand.deleteOne();

  res.status(200).json(new ApiResponse(200, 'Brand deleted successfully'));
});

export default {
  getBrands,
  getBrandById,
  getBrandBySlug,
  createBrand,
  updateBrand,
  deleteBrand,
};
