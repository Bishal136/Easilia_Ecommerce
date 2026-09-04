import crypto from 'crypto';

/**
 * Generate a random numeric OTP
 * @param {number} length - Default 6 digits
 * @returns {string}
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
};

/**
 * Generate expiry date for OTP
 * @param {number} minutes - Expiry time in minutes (default 10)
 * @returns {Date}
 */
export const getOTPExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

export default {
  generateOTP,
  getOTPExpiry,
};
