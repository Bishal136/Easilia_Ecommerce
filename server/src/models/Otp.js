import mongoose from 'mongoose';

const { Schema } = mongoose;

const otpSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required for OTP'],
      lowercase: true,
      trim: true,
      index: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP code is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: {
        values: ['email_verification', 'password_reset', 'login_2fa', 'phone_verification'],
        message: '{VALUE} is not a valid OTP type',
      },
      default: 'email_verification',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: [5, 'Maximum verification attempts exceeded'],
    },
  },
  {
    timestamps: true,
  }
);

// MongoDB TTL index: automatically deletes expired OTP documents from database when expiresAt passes
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.index({ email: 1, type: 1 });

export const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
