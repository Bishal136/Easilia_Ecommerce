/**
 * Clean and sanitize objects by removing keys with leading '$' or containing '.'
 * to prevent MongoDB Operator / NoSQL Injection attacks.
 * Fully compatible with Express 5.x.
 * 
 * @param {Object|Array} obj
 * @returns {Object|Array}
 */
export const sanitize = (obj) => {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      obj.forEach((item) => sanitize(item));
    } else {
      Object.keys(obj).forEach((key) => {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      });
    }
  }
  return obj;
};

/**
 * Express Middleware for NoSQL Injection sanitization
 */
export const mongoSanitizeMiddleware = (req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  if (req.query) sanitize(req.query);
  next();
};

export default mongoSanitizeMiddleware;
