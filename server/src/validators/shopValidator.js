import Joi from 'joi';

export const updateShopSchema = Joi.object({
  name: Joi.string().min(2).max(120).optional(),
  email: Joi.string().email().allow('', null).optional(),
  description: Joi.string().max(2000).allow('', null).optional(),
  phone: Joi.string().allow('', null).optional(),
  address: Joi.object({
    street: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),
    zipCode: Joi.string().allow('', null).optional(),
    country: Joi.string().default('Bangladesh').allow('', null).optional(),
  }).optional(),
  location: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2).optional(),
  }).optional(),
  taxIds: Joi.object({
    gst: Joi.string().allow('', null).optional(),
    pan: Joi.string().allow('', null).optional(),
    tradeLicense: Joi.string().allow('', null).optional(),
    nid: Joi.string().allow('', null).optional(),
  }).optional(),
  taxId: Joi.string().allow('', null).optional(),
  socialLinks: Joi.object({
    facebook: Joi.string().allow('', null).optional(),
    instagram: Joi.string().allow('', null).optional(),
    twitter: Joi.string().allow('', null).optional(),
    youtube: Joi.string().allow('', null).optional(),
  }).optional(),
});

export const updateBankDetailsSchema = Joi.object({
  bankName: Joi.string().allow('', null).optional(),
  accountName: Joi.string().allow('', null).optional(),
  accountNumber: Joi.string().allow('', null).optional(),
  branch: Joi.string().allow('', null).optional(),
  branchName: Joi.string().allow('', null).optional(),
  routingNumber: Joi.string().allow('', null).optional(),
  mobileBankingType: Joi.string().valid('bkash', 'nagad', 'rocket', 'none').optional(),
  mobileBankingNumber: Joi.string().allow('', null).optional(),
  bkashNumber: Joi.string().allow('', null).optional(),
  nagadNumber: Joi.string().allow('', null).optional(),
  rocketNumber: Joi.string().allow('', null).optional(),
});

export const updateShopMediaSchema = Joi.object({
  logo: Joi.alternatives().try(
    Joi.string().allow('', null),
    Joi.object({
      url: Joi.string().allow('', null).optional(),
      path: Joi.string().allow('', null).optional(),
    })
  ).allow(null).optional(),
  banner: Joi.alternatives().try(
    Joi.string().allow('', null),
    Joi.object({
      url: Joi.string().allow('', null).optional(),
      path: Joi.string().allow('', null).optional(),
    })
  ).allow(null).optional(),
});

export default {
  updateShopSchema,
  updateBankDetailsSchema,
  updateShopMediaSchema,
};

