import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().allow('', null).optional(),
  avatar: Joi.object({
    url: Joi.string().allow('').optional(),
    path: Joi.string().allow('').optional(),
  }).optional(),
  banner: Joi.object({
    url: Joi.string().allow('').optional(),
    path: Joi.string().allow('').optional(),
  }).optional(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newPassword: Joi.string().min(6).max(100).required().messages({
    'string.min': 'New password must be at least 6 characters',
    'any.required': 'New password is required',
  }),
});

export const addressSchema = Joi.object({
  title: Joi.string().allow('', null).optional(),
  label: Joi.string().allow('', null).optional(),
  fullName: Joi.string().allow('', null).optional(),
  phone: Joi.string().allow('', null).optional(),
  email: Joi.string().email({ tlds: { allow: false } }).allow('', null).optional(),
  street: Joi.string().allow('', null).optional(),
  line1: Joi.string().allow('', null).optional(),
  line2: Joi.string().allow('', null).optional(),
  landmark: Joi.string().allow('', null).optional(),
  city: Joi.string().allow('', null).optional(),
  state: Joi.string().allow('', null).optional(),
  zipCode: Joi.string().allow('', null).optional(),
  country: Joi.string().allow('', null).default('Bangladesh'),
  isDefault: Joi.boolean().default(false),
}).unknown(true);

export default {
  updateProfileSchema,
  changePasswordSchema,
  addressSchema,
};
