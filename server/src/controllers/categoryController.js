import Category from '../models/Category.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import { generateSlug } from '../utils/generateSlug.js';

/**
 * @desc    Get all categories (Hierarchical tree format)
 * @route   GET /api/v1/categories
 * @access  Public
 */
export const getCategories = asyncHandler(async (req, res) => {
  const { flat } = req.query;

  if (flat === 'true') {
    const categories = await Category.find({ isActive: true })
      .sort({ order: 1, name: 1 })
      .lean();
    return res
      .status(200)
      .json(new ApiResponse(200, 'Categories fetched successfully', { categories }));
  }

  // Fetch all parent categories
  const categories = await Category.find({ parent: null, isActive: true })
    .sort({ order: 1, name: 1 })
    .lean();

  // Populate subcategories recursively
  const populatedCategories = await Promise.all(
    categories.map(async (cat) => {
      const subcategories = await Category.find({ parent: cat._id, isActive: true })
        .sort({ order: 1, name: 1 })
        .lean();
      return { ...cat, subcategories };
    })
  );

  res.status(200).json(
    new ApiResponse(200, 'Categories tree fetched successfully', {
      categories: populatedCategories,
    })
  );
});

/**
 * @desc    Get single category by ID
 * @route   GET /api/v1/categories/:id
 * @access  Public
 */
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).populate('parent', 'name slug').lean();

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  const subcategories = await Category.find({ parent: category._id, isActive: true }).lean();

  res.status(200).json(
    new ApiResponse(200, 'Category fetched successfully', {
      category: { ...category, subcategories },
    })
  );
});

/**
 * @desc    Get single category by slug
 * @route   GET /api/v1/categories/slug/:slug
 * @access  Public
 */
export const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true })
    .populate('parent', 'name slug')
    .lean();

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  const subcategories = await Category.find({ parent: category._id, isActive: true }).lean();

  res.status(200).json(
    new ApiResponse(200, 'Category fetched successfully', {
      category: { ...category, subcategories },
    })
  );
});

/**
 * @desc    Create new category
 * @route   POST /api/v1/categories
 * @access  Admin
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, parent, image, icon, description, order, isActive } = req.body;

  let slug = generateSlug(name);
  const existing = await Category.findOne({ slug });
  if (existing) {
    slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const category = await Category.create({
    name,
    slug,
    parent: parent || null,
    image: image || {},
    icon,
    description,
    order: order || 0,
    isActive: isActive !== undefined ? isActive : true,
  });

  res.status(201).json(new ApiResponse(201, 'Category created successfully', { category }));
});

/**
 * @desc    Update category
 * @route   PUT /api/v1/categories/:id
 * @access  Admin
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  if (req.body.name && req.body.name !== category.name) {
    category.name = req.body.name;
    category.slug = generateSlug(req.body.name);
  }

  if (req.body.parent !== undefined) category.parent = req.body.parent || null;
  if (req.body.image !== undefined) category.image = req.body.image;
  if (req.body.icon !== undefined) category.icon = req.body.icon;
  if (req.body.description !== undefined) category.description = req.body.description;
  if (req.body.order !== undefined) category.order = req.body.order;
  if (req.body.isActive !== undefined) category.isActive = req.body.isActive;

  await category.save();

  res.status(200).json(new ApiResponse(200, 'Category updated successfully', { category }));
});

/**
 * @desc    Delete category
 * @route   DELETE /api/v1/categories/:id
 * @access  Admin
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  // Delete subcategories as well or make orphan
  await Category.deleteMany({ parent: category._id });
  await category.deleteOne();

  res.status(200).json(new ApiResponse(200, 'Category and subcategories removed successfully'));
});

export default {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
