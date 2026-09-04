import Joi from 'joi';

export const createCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(30).required().messages({
    'string.empty': 'Coupon code is required',
    'string.min': 'Coupon code must be at least 3 characters',
  }),
  discountType: Joi.string().valid('percentage', 'fixed', 'free_shipping').required(),
  discountValue: Joi.number().min(0).required(),
  minOrderAmount: Joi.number().min(0).allow(null, '').default(0),
  maxDiscountAmount: Joi.number().min(0).allow(null, '').optional(),
  maxUses: Joi.number().integer().min(1).allow(null, '').optional(),
  validFrom: Joi.date().allow(null, '').optional(),
  validTo: Joi.date().allow(null, '').optional(),
  validUntil: Joi.date().allow(null, '').optional(),
  isActive: Joi.boolean().default(true),
});

export const updateCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(3).max(30).optional(),
  discountType: Joi.string().valid('percentage', 'fixed', 'free_shipping').optional(),
  discountValue: Joi.number().min(0).optional(),
  minOrderAmount: Joi.number().min(0).allow(null, '').optional(),
  maxDiscountAmount: Joi.number().min(0).allow(null, '').optional(),
  maxUses: Joi.number().integer().min(1).allow(null, '').optional(),
  validFrom: Joi.date().allow(null, '').optional(),
  validTo: Joi.date().allow(null, '').optional(),
  validUntil: Joi.date().allow(null, '').optional(),
  isActive: Joi.boolean().optional(),
});

export const applyCouponSchema = Joi.object({
  code: Joi.string().trim().uppercase().required().messages({
    'string.empty': 'Coupon code is required',
    'any.required': 'Coupon code is required',
  }),
  orderAmount: Joi.number().min(0).required().messages({
    'number.base': 'Order amount is required',
    'any.required': 'Order amount is required',
  }),
});

export default {
  createCouponSchema,
  updateCouponSchema,
  applyCouponSchema,
};
