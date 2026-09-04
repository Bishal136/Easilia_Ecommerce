import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * Protect routes - JWT verification middleware
 */
export const protect = asyncHandler(async (req, res, next) => {
  let token = null;

  // 1. Extract Bearer token from header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Authentication token missing. Please log in to access this resource.');
  }

  // 2. Verify Token
  let decoded;
  try {
    decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET || 'nerob_jwt_access_secret_key_default'
    );
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Authentication token has expired. Please refresh your token.');
    }
    throw new ApiError(401, 'Invalid authentication token');
  }

  // 3. Find User
  const user = await User.findById(decoded.id).select('-verifyOTP -verifyOTPExpiry -resetPasswordToken -resetPasswordExpiry -refreshToken');

  if (!user) {
    throw new ApiError(401, 'The user belonging to this token no longer exists.');
  }

  // 4. Check if user is banned
  if (user.isBanned) {
    throw new ApiError(403, 'Your account has been suspended. Please contact customer support.');
  }

  // 5. Attach user to request
  req.user = user;
  next();
});

/**
 * Optional Auth - Decodes user if token is provided, but doesn't block if missing
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  let token = null;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET || 'nerob_jwt_access_secret_key_default'
      );
      const user = await User.findById(decoded.id).select('-verifyOTP -verifyOTPExpiry -resetPasswordToken -resetPasswordExpiry -refreshToken');
      if (user && !user.isBanned) {
        req.user = user;
      }
    } catch {
      // Ignore token errors for optional auth
    }
  }

  next();
});

export default protect;
