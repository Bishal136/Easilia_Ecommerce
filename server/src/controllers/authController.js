import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { sendTokenResponse } from '../utils/generateToken.js';
import * as authService from '../services/authService.js';

/**
 * @desc    Register a new buyer / user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body);

  sendTokenResponse(
    res,
    201,
    'Registration successful. Please verify your email with the OTP sent to your inbox.',
    user,
    accessToken,
    refreshToken
  );
});

/**
 * @desc    Register a new seller with store
 * @route   POST /api/v1/auth/register-seller
 * @access  Public
 */
export const registerSeller = asyncHandler(async (req, res) => {
  const { user, shop, accessToken, refreshToken } = await authService.registerSeller(req.body);

  sendTokenResponse(
    res,
    201,
    'Seller registration submitted successfully. Your shop is currently pending admin approval.',
    user,
    accessToken,
    refreshToken,
    { shop }
  );
});

/**
 * @desc    Login with Email & Password
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { user, shop, accessToken, refreshToken } = await authService.loginUser(req.body);

  sendTokenResponse(res, 200, 'Logged in successfully', user, accessToken, refreshToken, { shop });
});

/**
 * @desc    Google OAuth Sign-In
 * @route   POST /api/v1/auth/google
 * @access  Public
 */
export const googleAuth = asyncHandler(async (req, res) => {
  const { user, shop, accessToken, refreshToken } = await authService.googleAuthLogin(req.body);

  sendTokenResponse(
    res,
    200,
    'Google authentication successful',
    user,
    accessToken,
    refreshToken,
    { shop }
  );
});

/**
 * @desc    Refresh Access Token using HttpOnly Cookie
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public (Uses Cookie)
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const cookieRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

  const { user, accessToken, refreshToken: newRefreshToken } =
    await authService.refreshAccessToken(cookieRefreshToken);

  sendTokenResponse(res, 200, 'Token refreshed successfully', user, accessToken, newRefreshToken);
});

/**
 * @desc    Logout user & clear refresh cookie
 * @route   POST /api/v1/auth/logout
 * @access  Protected
 */
export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user?._id);

  // Clear cookie
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });

  res.status(200).json(new ApiResponse(200, 'Logged out successfully'));
});

/**
 * @desc    Verify email with OTP code
 * @route   POST /api/v1/auth/verify-email
 * @access  Public
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { user, alreadyVerified } = await authService.verifyEmailOTP(req.body);

  res.status(200).json(
    new ApiResponse(
      200,
      alreadyVerified
        ? 'Your email is already verified'
        : 'Email verified successfully. You can now access all features.',
      {
        isVerified: true,
        email: user.email,
      }
    )
  );
});

/**
 * @desc    Resend email verification OTP
 * @route   POST /api/v1/auth/resend-otp
 * @access  Public
 */
export const resendOTP = asyncHandler(async (req, res) => {
  await authService.resendVerificationOTP(req.body.email);

  res.status(200).json(new ApiResponse(200, 'Verification code resent successfully to your email'));
});

/**
 * @desc    Forgot password - Send reset link
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);

  res.status(200).json(
    new ApiResponse(
      200,
      'If an account exists with that email, a password reset link has been sent.'
    )
  );
});

/**
 * @desc    Reset password with token
 * @route   POST /api/v1/auth/reset-password/:token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  await authService.resetPassword({ token, password });

  res.status(200).json(
    new ApiResponse(200, 'Password has been reset successfully. You can now log in with your new password.')
  );
});

/**
 * @desc    Get currently authenticated user & shop
 * @route   GET /api/v1/auth/me
 * @access  Protected
 */
export const getMe = asyncHandler(async (req, res) => {
  const { user, shop } = await authService.getCurrentUser(req.user._id);

  res.status(200).json(
    new ApiResponse(200, 'User profile fetched successfully', {
      user,
      shop,
    })
  );
});

export default {
  register,
  registerSeller,
  login,
  googleAuth,
  refreshToken,
  logout,
  verifyEmail,
  resendOTP,
  forgotPassword,
  resetPassword,
  getMe,
};
