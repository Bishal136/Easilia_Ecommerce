import { Router } from 'express';
import {
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
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { validate } from '../middlewares/validateMiddleware.js';
import {
  registerSchema,
  registerSellerSchema,
  loginSchema,
  googleAuthSchema,
  verifyEmailSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/authValidator.js';

const router = Router();

// Apply auth rate limiter to all auth routes
router.use(authLimiter);

// 1. Registration
router.post('/register', validate(registerSchema), register);
router.post('/register-seller', validate(registerSellerSchema), registerSeller);

// 2. Authentication (Local & Google OAuth)
router.post('/login', validate(loginSchema), login);
router.post('/google', validate(googleAuthSchema), googleAuth);

// 3. Token Management & Session
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);

// 4. Verification & Password Recovery
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/resend-otp', validate(resendOTPSchema), resendOTP);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);

// 5. Current User Profile
router.get('/me', protect, getMe);

export default router;
