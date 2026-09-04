import mongoose from 'mongoose';

const { Schema } = mongoose;

const settingsSchema = new Schema(
  {
    siteName: {
      type: String,
      default: 'Nerob Ecommerce',
      trim: true,
    },
    siteTagline: {
      type: String,
      default: 'Your Ultimate Online Marketplace',
      trim: true,
    },
    siteLogo: {
      url: { type: String, default: '' },
      path: { type: String, default: '' },
    },
    siteFavicon: {
      url: { type: String, default: '' },
      path: { type: String, default: '' },
    },
    contactEmail: {
      type: String,
      trim: true,
      default: 'support@nerobecommerce.com',
    },
    contactPhone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    defaultCommissionRate: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    defaultDeliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      code: { type: String, default: 'BDT' },
      symbol: { type: String, default: '৳' },
    },
    shippingChargeDefault: {
      insideCity: { type: Number, default: 60 },
      outsideCity: { type: Number, default: 120 },
    },
    taxPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      twitter: { type: String, default: '' },
      youtube: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    isMaintenanceMode: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
