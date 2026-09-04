import Joi from 'joi';

export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Category name is required',
    'any.required': 'Category name is required',
  }),
  parent: Joi.string().hex().length(24).allow(null, '').optional(),
  image: Joi.object({
    url: Joi.string().allow('').optional(),
    path: Joi.string().allow('').optional(),
  }).optional(),
  icon: Joi.string().allow('', null).optional(),
  description: Joi.string().max(500).allow('', null).optional(),
  order: Joi.number().integer().min(0).default(0),
  isActive: Joi.boolean().default(true),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  parent: Joi.string().hex().length(24).allow(null, '').optional(),
  image: Joi.object({
    url: Joi.string().allow('').optional(),
    path: Joi.string().allow('').optional(),
  }).optional(),
  icon: Joi.string().allow('', null).optional(),
  description: Joi.string().max(500).allow('', null).optional(),
  order: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
});

export default {
  createCategorySchema,
  updateCategorySchema,
};
