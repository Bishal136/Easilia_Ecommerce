import jwt from 'jsonwebtoken';
import ApiResponse from './ApiResponse.js';

/**
 * Generate short-lived Access Token
 * @param {Object} payload - User identification payload { id, role }
 * @returns {string}
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(
    { id: payload._id || payload.id, role: payload.role },
    process.env.JWT_ACCESS_SECRET || 'nerob_jwt_access_secret_key_default',
    { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
  );
};

/**
 * Generate long-lived Refresh Token
 * @param {Object} payload - User identification payload { id }
 * @returns {string}
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(
    { id: payload._id || payload.id },
    process.env.JWT_REFRESH_SECRET || 'nerob_jwt_refresh_secret_key_default',
    { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
  );
};

/**
 * Set HTTP-Only Refresh Cookie & Return Auth Response
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {Object} user
 * @param {string} accessToken
 * @param {string} refreshToken
 * @param {Object} extraData
 */
export const sendTokenResponse = (
  res,
  statusCode,
  message,
  user,
  accessToken,
  refreshToken,
  extraData = {}
) => {
  // Cookie options
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  };

  // Set httpOnly cookie for refresh token
  res.cookie('refreshToken', refreshToken, cookieOptions);

  // Clean user object (remove sensitive fields)
  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    isVerified: user.isVerified,
    authProvider: user.authProvider,
  };

  res.status(statusCode).json(
    new ApiResponse(statusCode, message, {
      user: safeUser,
      accessToken,
      ...extraData,
    })
  );
};

export default {
  generateAccessToken,
  generateRefreshToken,
  sendTokenResponse,
};
