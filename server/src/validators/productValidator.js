import Joi from 'joi';

const mediaItemSchema = Joi.object({
  url: Joi.string().required(),
  path: Joi.string().allow('').optional(),
  isThumbnail: Joi.boolean().optional(),
});

const variantItemSchema = Joi.object({
  name: Joi.string().required(),
  sku: Joi.string().allow('', null).optional(),
  price: Joi.number().positive().required(),
  discountPrice: Joi.number().min(0).allow(null).optional(),
  stock: Joi.number().integer().min(0).default(0),
  attributes: Joi.object().optional(),
});

export const createProductSchema = Joi.object({
  title: Joi.string().min(3).max(250).required().messages({
    'string.empty': 'Product title is required',
    'any.required': 'Product title is required',
  }),
  description: Joi.string().min(10).required().messages({
    'string.empty': 'Product description is required',
    'any.required': 'Product description is required',
  }),
  category: Joi.string().hex().length(24).required().messages({
    'any.required': 'Category ID is required',
  }),
  subCategory: Joi.string().hex().length(24).allow(null, '').optional(),
  brand: Joi.string().hex().length(24).allow(null, '').optional(),
  basePrice: Joi.number().positive().required().messages({
    'number.positive': 'Base price must be greater than 0',
    'any.required': 'Base price is required',
  }),
  discountPrice: Joi.number().min(0).allow(null).optional(),
  images: Joi.array().items(mediaItemSchema).min(1).required().messages({
    'array.min': 'Product must have at least one image',
    'any.required': 'Product images are required',
  }),
  videos: Joi.array().items(mediaItemSchema).optional(),
  variants: Joi.array().items(variantItemSchema).optional(),
  totalStock: Joi.number().integer().min(0).default(0),
  tags: Joi.array().items(Joi.string()).optional(),
  isFeatured: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  metaTitle: Joi.string().max(200).allow('', null).optional(),
  metaDescription: Joi.string().max(500).allow('', null).optional(),
});

export const updateProductSchema = Joi.object({
  title: Joi.string().min(3).max(250).optional(),
  description: Joi.string().min(10).optional(),
  category: Joi.string().hex().length(24).optional(),
  subCategory: Joi.string().hex().length(24).allow(null, '').optional(),
  brand: Joi.string().hex().length(24).allow(null, '').optional(),
  basePrice: Joi.number().positive().optional(),
  discountPrice: Joi.number().min(0).allow(null).optional(),
  images: Joi.array().items(mediaItemSchema).min(1).optional(),
  videos: Joi.array().items(mediaItemSchema).optional(),
  variants: Joi.array().items(variantItemSchema).optional(),
  totalStock: Joi.number().integer().min(0).optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isFeatured: Joi.boolean().optional(),
  isActive: Joi.boolean().optional(),
  metaTitle: Joi.string().max(200).allow('', null).optional(),
  metaDescription: Joi.string().max(500).allow('', null).optional(),
});

export default {
  createProductSchema,
  updateProductSchema,
};
