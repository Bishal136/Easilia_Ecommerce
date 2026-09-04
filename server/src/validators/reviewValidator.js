import Joi from 'joi';

export const createReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'Rating must be at least 1 star',
    'number.max': 'Rating cannot exceed 5 stars',
    'any.required': 'Rating is required',
  }),
  title: Joi.string().max(120).allow('', null).optional(),
  comment: Joi.string().min(3).max(1000).required().messages({
    'string.min': 'Review comment must be at least 3 characters',
    'any.required': 'Review comment is required',
  }),
  images: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().required(),
        path: Joi.string().allow('').optional(),
      })
    )
    .max(5)
    .optional(),
  video: Joi.object({
    url: Joi.string().allow('').optional(),
    path: Joi.string().allow('').optional(),
  })
    .allow(null)
    .optional(),
}).unknown(true);

export const replyReviewSchema = Joi.object({
  reply: Joi.string().min(2).max(1000).required(),
});

export default {
  createReviewSchema,
  replyReviewSchema,
};
