import ApiError from '../utils/ApiError.js';

/**
 * Joi Schema Validation Middleware
 * @param {import('joi').ObjectSchema} schema - Joi validation schema
 * @param {'body'|'query'|'params'} property - Request property to validate
 */
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorDetails = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, ''),
      }));

      return next(new ApiError(400, 'Validation Error', errorDetails));
    }

    // Replace request data with validated & sanitized value
    req[property] = value;
    next();
  };
};

export default validate;
