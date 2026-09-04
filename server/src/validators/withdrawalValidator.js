import Joi from 'joi';

export const createWithdrawalSchema = Joi.object({
  amount: Joi.number().positive().min(100).required().messages({
    'number.min': 'Minimum withdrawal amount is ৳100',
    'any.required': 'Withdrawal amount is required',
  }),
  paymentMethod: Joi.string().valid('bank', 'bkash', 'nagad', 'rocket', 'card', 'mobile_banking', 'bank_transfer').optional(),
  payoutMethod: Joi.string().valid('bank', 'bkash', 'nagad', 'rocket', 'card', 'mobile_banking', 'bank_transfer').optional(),
  accountDetails: Joi.object({
    accountNumber: Joi.string().allow('', null).optional(),
    accountName: Joi.string().allow('', null).optional(),
    bankName: Joi.string().allow('', null).optional(),
    branchName: Joi.string().allow('', null).optional(),
    mobileNumber: Joi.string().allow('', null).optional(),
    cardNumber: Joi.string().allow('', null).optional(),
    cardHolderName: Joi.string().allow('', null).optional(),
    cardType: Joi.string().allow('', null).optional(),
  }).optional(),
});

export const updateWithdrawalStatusSchema = Joi.object({
  status: Joi.string().valid('processing', 'approved', 'rejected').required(),
  adminNote: Joi.string().allow('', null).optional(),
  transactionReference: Joi.string().allow('', null).optional(),
});

export default {
  createWithdrawalSchema,
  updateWithdrawalStatusSchema,
};
