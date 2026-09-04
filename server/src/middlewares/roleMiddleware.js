import ApiError from '../utils/ApiError.js';

/**
 * Role-Based Access Control (RBAC) Middleware
 * @param  {...string} roles - Allowed roles (e.g. 'admin', 'seller')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized - No user session found'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          `Access denied. Role '${req.user.role}' is not authorized to access this resource.`
        )
      );
    }

    next();
  };
};

export default authorize;
