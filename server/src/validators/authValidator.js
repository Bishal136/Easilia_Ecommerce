import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'any.required': 'Name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(6).max(100).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
  }),
  phone: Joi.string().allow('', null).optional(),
});

export const registerSellerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  phone: Joi.string().required().messages({
    'any.required': 'Phone number is required for seller registration',
  }),
  shopName: Joi.string().min(2).max(120).required().messages({
    'any.required': 'Shop name is required',
  }),
  shopDescription: Joi.string().max(2000).allow('', null).optional(),
  shopAddress: Joi.object({
    street: Joi.string().allow('', null).optional(),
    city: Joi.string().allow('', null).optional(),
    state: Joi.string().allow('', null).optional(),
    zipCode: Joi.string().allow('', null).optional(),
    country: Joi.string().default('Bangladesh'),
  }).optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().required().messages({
    'string.empty': 'Email or phone number is required',
    'any.required': 'Email or phone number is required',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
    'any.required': 'Password is required',
  }),
});

export const googleAuthSchema = Joi.object({
  idToken: Joi.string().optional().allow('', null),
  credential: Joi.string().optional().allow('', null),
  accessToken: Joi.string().optional().allow('', null),
  userInfo: Joi.object().optional(),
  role: Joi.string().valid('user', 'seller').default('user'),
})
  .or('idToken', 'credential', 'accessToken', 'userInfo')
  .messages({
    'object.missing': 'Google token (idToken, credential, or accessToken) is required for Google authentication',
  });

export const verifyEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required().messages({
    'string.length': 'OTP must be 6 digits',
    'any.required': 'OTP is required',
  }),
});

export const resendOTPSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  password: Joi.string().min(6).max(100).required(),
});

export default {
  registerSchema,
  registerSellerSchema,
  loginSchema,
  googleAuthSchema,
  verifyEmailSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
