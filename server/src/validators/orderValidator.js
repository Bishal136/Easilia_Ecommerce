import Joi from 'joi';

const orderItemInputSchema = Joi.object({
  product: Joi.alternatives()
    .try(
      Joi.string().hex().length(24),
      Joi.string(),
      Joi.object().unknown()
    )
    .required(),
  variant: Joi.object({
    name: Joi.string().allow('', null).optional(),
    sku: Joi.string().allow('', null).optional(),
    price: Joi.number().min(0).optional(),
  })
    .allow(null)
    .optional(),
  quantity: Joi.number().integer().min(1).default(1),
  price: Joi.number().min(0).optional(),
});

export const createOrderSchema = Joi.object({
  items: Joi.array().items(orderItemInputSchema).min(1).required().messages({
    'array.min': 'Order must contain at least one product item',
    'any.required': 'Order items are required',
  }),
  shippingAddress: Joi.object({
    fullName: Joi.string().allow('', null).optional(),
    name: Joi.string().allow('', null).optional(),
    phone: Joi.string().allow('', null).optional(),
    street: Joi.string().allow('', null).optional(),
    address: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional().default('Dhaka'),
    state: Joi.string().allow('', null).optional(),
    zipCode: Joi.string().allow('', null).optional(),
    postalCode: Joi.string().allow('', null).optional(),
    country: Joi.string().allow('', null).optional().default('Bangladesh'),
  })
    .required()
    .unknown(true),
  paymentMethod: Joi.string()
    .valid('cod', 'portpos', 'card', 'bkash', 'nagad')
    .default('cod'),
  couponCode: Joi.string().allow('', null).optional(),
  notes: Joi.string().max(500).allow('', null).optional(),
  deliveryNotes: Joi.string().max(500).allow('', null).optional(),
});

export const updateOrderItemStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'returned'
    )
    .required(),
  trackingNumber: Joi.string().allow('', null).optional(),
});

export default {
  createOrderSchema,
  updateOrderItemStatusSchema,
};
