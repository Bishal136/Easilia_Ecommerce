import Joi from 'joi';

export const createBrandSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Brand name is required',
    'any.required': 'Brand name is required',
  }),
  logo: Joi.object({
    url: Joi.string().allow('').optional(),
    path: Joi.string().allow('').optional(),
  }).optional(),
  description: Joi.string().max(500).allow('', null).optional(),
  website: Joi.string().uri().allow('', null).optional(),
  isActive: Joi.boolean().default(true),
});

export const updateBrandSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  logo: Joi.object({
    url: Joi.string().allow('').optional(),
    path: Joi.string().allow('').optional(),
  }).optional(),
  description: Joi.string().max(500).allow('', null).optional(),
  website: Joi.string().uri().allow('', null).optional(),
  isActive: Joi.boolean().optional(),
});

export default {
  createBrandSchema,
  updateBrandSchema,
};
