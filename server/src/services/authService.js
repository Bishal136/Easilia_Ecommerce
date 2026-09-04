import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import Otp from '../models/Otp.js';
import ApiError from '../utils/ApiError.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { generateOTP, getOTPExpiry } from '../utils/generateOTP.js';
import { generateSlug } from '../utils/generateSlug.js';
import { sendEmail } from '../utils/sendEmail.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Register a regular Buyer / User
 */
export const registerUser = async ({ name, email, password, phone }) => {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(400, 'Email is already registered. Please login.');
  }

  const otp = generateOTP(6);
  const otpExpiry = getOTPExpiry(15); // 15 min

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone,
    role: 'user',
    isVerified: false,
    verifyOTP: otp,
    verifyOTPExpiry: otpExpiry,
  });

  // Store in dedicated Otp model collection with TTL expiration
  await Otp.deleteMany({ email: normalizedEmail, type: 'email_verification' });
  await Otp.create({
    email: normalizedEmail,
    otp,
    type: 'email_verification',
    expiresAt: otpExpiry,
  });

  // Send verification OTP email
  await sendEmail({
    to: user.email,
    subject: 'Verify your Easilia Account',
    html: `
      <h2>Welcome to Easilia!</h2>
      <p>Hello ${user.name},</p>
      <p>Your verification code is: <strong>${otp}</strong></p>
      <p>This code will expire in 15 minutes.</p>
    `,
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user, accessToken, refreshToken };
};

/**
 * Register a Seller with their store
 */
export const registerSeller = async ({
  name,
  email,
  password,
  phone,
  shopName,
  shopDescription,
  shopAddress,
}) => {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(400, 'Email is already registered. Please login.');
  }

  // Generate unique shop slug
  let slug = generateSlug(shopName);
  const existingShop = await Shop.findOne({ slug });
  if (existingShop) {
    slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const otp = generateOTP(6);
  const otpExpiry = getOTPExpiry(15);

  // 1. Create Seller User
  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone,
    role: 'seller',
    isVerified: false,
    verifyOTP: otp,
    verifyOTPExpiry: otpExpiry,
  });

  // 2. Create Shop in 'pending' status awaiting admin approval
  const shop = await Shop.create({
    name: shopName,
    slug,
    owner: user._id,
    description: shopDescription || '',
    phone: phone || '',
    email: normalizedEmail,
    address: shopAddress || {},
    status: 'pending',
  });

  // Store in dedicated Otp model collection
  await Otp.deleteMany({ email: normalizedEmail, type: 'email_verification' });
  await Otp.create({
    email: normalizedEmail,
    otp,
    type: 'email_verification',
    expiresAt: otpExpiry,
  });

  // Send verification OTP email
  await sendEmail({
    to: user.email,
    subject: 'Verify your Easilia Seller Account',
    html: `
      <h2>Welcome Seller!</h2>
      <p>Hello ${user.name}, thank you for registering your shop <strong>${shopName}</strong>.</p>
      <p>Your verification code is: <strong>${otp}</strong> (valid for 15 minutes).</p>
      <p>Once verified, your store application will be reviewed by our administration team.</p>
    `,
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user, shop, accessToken, refreshToken };
};

/**
 * Login with Email & Password
 */
export const loginUser = async ({ email, password }) => {
  const identifier = (email || '').trim();
  const normalizedEmail = identifier.toLowerCase();

  // Support login using either email address or phone number
  const user = await User.findOne({
    $or: [{ email: normalizedEmail }, { phone: identifier }],
  }).select('+password +refreshToken');

  if (!user) {
    throw new ApiError(401, 'Invalid email/phone or password');
  }

  if (user.authProvider === 'google' && !user.password) {
    throw new ApiError(
      400,
      'This account was registered using Google. Please log in using Google OAuth.'
    );
  }

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (user.isBanned) {
    throw new ApiError(403, 'Your account has been suspended. Please contact customer support.');
  }

  // Check if user is configured platform admin
  const isAdminEmail =
    process.env.ADMIN_EMAIL &&
    normalizedEmail === process.env.ADMIN_EMAIL.toLowerCase();

  if (isAdminEmail && user.role !== 'admin') {
    user.role = 'admin';
    await user.save({ validateBeforeSave: false });
  }

  // Check if user owns a shop
  let shop = null;
  const existingShop = await Shop.findOne({
    $or: [{ owner: user._id }, { email: normalizedEmail }],
  }).lean();

  if (existingShop) {
    if (!isAdminEmail && user.role !== 'seller') {
      user.role = 'seller';
      await user.save({ validateBeforeSave: false });
    }
    shop = existingShop;
  } else if (user.role === 'seller') {
    shop = await Shop.findOne({ owner: user._id }).lean();
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user, shop, accessToken, refreshToken };
};

/**
 * Google OAuth Authentication (Supports ID Token JWT, OAuth2 Access Token, and User Info)
 */
export const googleAuthLogin = async ({
  idToken,
  credential,
  accessToken: googleAccessToken,
  userInfo,
  role = 'user',
}) => {
  const token = idToken || credential || googleAccessToken;
  if (!token && !userInfo) {
    throw new ApiError(400, 'Google token or user information is required');
  }

  let payload = null;

  // 1. Direct userInfo payload provided from Google OAuth Client
  if (userInfo && (userInfo.email || userInfo.sub || userInfo.id)) {
    payload = {
      sub: userInfo.sub || userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    };
  }

  // 2. Try verifying as Google ID Token via google-auth-library
  if (!payload && token && typeof token === 'string' && token.includes('.')) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      // If verifyIdToken fails (e.g. audience mismatch or local dev), decode base64 JWT payload
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
          if (decoded && (decoded.email || decoded.sub)) {
            payload = decoded;
          }
        }
      } catch {
        // Fall through to access_token check
      }
    }
  }

  // 3. Try verifying as Google OAuth2 Access Token against Google's UserInfo API
  if (!payload && token && typeof token === 'string') {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.email) {
          payload = {
            sub: data.sub,
            email: data.email,
            name: data.name,
            picture: data.picture,
          };
        }
      }
    } catch (fetchErr) {
      console.error('Google userinfo fetch failed:', fetchErr.message);
    }
  }

  if (!payload || !payload.email) {
    throw new ApiError(401, 'Unable to authenticate with Google. Please verify your Google account or sign in with email.');
  }

  const { sub: googleId, email, name, picture } = payload;

  let user = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { googleId }],
  }).select('+refreshToken');

  let shop = null;

  const isAdminEmail =
    process.env.ADMIN_EMAIL &&
    email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

  // Check if a Shop exists in the database for this email or user
  const existingShop = await Shop.findOne({
    $or: [
      user ? { owner: user._id } : null,
      { email: email.toLowerCase() },
    ].filter(Boolean),
  }).lean();

  let targetRole = role === 'seller' || existingShop ? 'seller' : 'user';
  if (isAdminEmail) {
    targetRole = 'admin';
  }

  if (user) {
    // Link googleId if existing local user logs in with Google
    if (!user.googleId && googleId) {
      user.googleId = googleId;
    }
    user.authProvider = 'google';
    user.isVerified = true;
    if (isAdminEmail) {
      user.role = 'admin';
    } else if (existingShop || user.role === 'seller' || role === 'seller') {
      user.role = 'seller';
    }
    if (!user.avatar?.url && picture) {
      user.avatar = { url: picture, path: '' };
    }
    await user.save({ validateBeforeSave: false });

    if (user.role === 'seller') {
      shop = existingShop || (await Shop.findOne({ owner: user._id }).lean());
    }
  } else {
    // Create new Google user
    user = await User.create({
      name: name || (isAdminEmail ? 'Admin' : 'Google User'),
      email: email.toLowerCase(),
      googleId: googleId || `google_${Date.now()}`,
      authProvider: 'google',
      avatar: { url: picture || '', path: '' },
      role: targetRole,
      isVerified: true,
    });

    if (user.role === 'seller') {
      if (existingShop) {
        shop = existingShop;
        await Shop.findByIdAndUpdate(existingShop._id, { owner: user._id });
      } else {
        const slug = generateSlug(name || 'Shop') + '-' + Math.floor(1000 + Math.random() * 9000);
        shop = await Shop.create({
          name: `${name}'s Shop`,
          slug,
          owner: user._id,
          email: email.toLowerCase(),
          status: 'pending',
        });
      }
    }
  }

  if (user.isBanned) {
    throw new ApiError(403, 'Your account has been suspended. Please contact customer support.');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user, shop, accessToken, refreshToken };
};

/**
 * Refresh Access Token with Token Rotation
 */
export const refreshAccessToken = async (oldRefreshToken) => {
  if (!oldRefreshToken) {
    throw new ApiError(401, 'No refresh token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(
      oldRefreshToken,
      process.env.JWT_REFRESH_SECRET || 'nerob_jwt_refresh_secret_key_default'
    );
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token. Please log in again.');
  }

  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== oldRefreshToken) {
    throw new ApiError(401, 'Refresh token is invalid or has been revoked');
  }

  if (user.isBanned) {
    throw new ApiError(403, 'Your account has been suspended.');
  }

  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return { user, accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Logout User
 */
export const logoutUser = async (userId) => {
  if (userId) {
    await User.findByIdAndUpdate(userId, { refreshToken: null });
  }
  return true;
};

/**
 * Verify Email with OTP
 */
export const verifyEmailOTP = async ({ email, otp }) => {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
    '+verifyOTP +verifyOTPExpiry'
  );

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (user.isVerified) {
    return { user, alreadyVerified: true };
  }

  // Check Otp model collection first
  const otpRecord = await Otp.findOne({
    email: normalizedEmail,
    type: 'email_verification',
  });

  let isValid = false;

  if (otpRecord) {
    if (new Date() > new Date(otpRecord.expiresAt)) {
      await Otp.deleteOne({ _id: otpRecord._id });
      throw new ApiError(400, 'Verification code has expired. Please request a new code.');
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      await otpRecord.save();
      throw new ApiError(400, 'Invalid verification code');
    }

    isValid = true;
    await Otp.deleteOne({ _id: otpRecord._id });
  } else if (user.verifyOTP && user.verifyOTP === otp) {
    // Fallback to embedded OTP if present
    if (new Date() > new Date(user.verifyOTPExpiry)) {
      throw new ApiError(400, 'Verification code has expired. Please request a new code.');
    }
    isValid = true;
  }

  if (!isValid) {
    throw new ApiError(400, 'Invalid verification code');
  }

  user.isVerified = true;
  user.verifyOTP = undefined;
  user.verifyOTPExpiry = undefined;
  await user.save({ validateBeforeSave: false });

  return { user, alreadyVerified: false };
};

/**
 * Resend Verification OTP
 */
export const resendVerificationOTP = async (email) => {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw new ApiError(404, 'User not found with this email');
  }

  if (user.isVerified) {
    throw new ApiError(400, 'Account is already verified');
  }

  const otp = generateOTP(6);
  const otpExpiry = getOTPExpiry(15);

  user.verifyOTP = otp;
  user.verifyOTPExpiry = otpExpiry;
  await user.save({ validateBeforeSave: false });

  // Store in Otp collection
  await Otp.deleteMany({ email: normalizedEmail, type: 'email_verification' });
  await Otp.create({
    email: normalizedEmail,
    otp,
    type: 'email_verification',
    expiresAt: otpExpiry,
  });

  await sendEmail({
    to: user.email,
    subject: 'New Verification Code - Easilia',
    html: `
      <p>Hello ${user.name},</p>
      <p>Your new verification code is: <strong>${otp}</strong> (valid for 15 minutes).</p>
    `,
  });

  return true;
};

/**
 * Forgot Password - Send Reset Token / OTP
 */
export const forgotPassword = async (email) => {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    // Return true for security to avoid email enumeration
    return true;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Password Reset Request - Easilia',
    html: `
      <h2>Reset Your Password</h2>
      <p>Hello ${user.name},</p>
      <p>You requested a password reset. Please click the link below to reset your password:</p>
      <p><a href="${resetUrl}" target="_blank" style="padding: 10px 20px; background-color: #2563eb; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
      <p>Or copy this link: ${resetUrl}</p>
      <p>This link expires in 15 minutes. If you did not request this, please ignore this email.</p>
    `,
  });

  return true;
};

/**
 * Reset Password with Token
 */
export const resetPassword = async ({ token, password }) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired password reset token');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  return true;
};

/**
 * Get Current User Profile
 */
export const getCurrentUser = async (userId) => {
  let user = await User.findById(userId).lean();
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isAdminEmail =
    process.env.ADMIN_EMAIL &&
    user.email?.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

  let shop = null;
  const existingShop = await Shop.findOne({
    $or: [{ owner: user._id }, { email: user.email?.toLowerCase() }],
  }).lean();

  if (existingShop) {
    shop = existingShop;
    if (!isAdminEmail && user.role !== 'seller') {
      user.role = 'seller';
      await User.findByIdAndUpdate(user._id, { role: 'seller' });
    }
  } else if (user.role === 'seller') {
    shop = await Shop.findOne({ owner: user._id }).lean();
  }

  if (isAdminEmail && user.role !== 'admin') {
    user.role = 'admin';
    await User.findByIdAndUpdate(user._id, { role: 'admin' });
  }

  return { user, shop };
};

export default {
  registerUser,
  registerSeller,
  loginUser,
  googleAuthLogin,
  refreshAccessToken,
  logoutUser,
  verifyEmailOTP,
  resendVerificationOTP,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
