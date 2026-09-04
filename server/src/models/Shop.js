import mongoose from 'mongoose';

const { Schema } = mongoose;

const shopSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a shop name'],
      trim: true,
      maxlength: [120, 'Shop name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Shop must have an owner'],
      unique: true,
      index: true,
    },
    logo: {
      url: { type: String, default: '' },
      path: { type: String, default: '' },
    },
    banner: {
      url: { type: String, default: '' },
      path: { type: String, default: '' },
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zipCode: { type: String, trim: true },
      country: { type: String, default: 'Bangladesh', trim: true },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude] e.g. [90.247, 24.034]
        default: [90.4125, 23.8103],
      },
    },
    taxIds: {
      gst: { type: String, trim: true, default: '' },
      pan: { type: String, trim: true, default: '' },
      tradeLicense: { type: String, trim: true, default: '' },
      nid: { type: String, trim: true, default: '' },
    },
    taxId: {
      type: String,
      trim: true,
      default: '',
    },
    kycStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'active', 'suspended', 'rejected'],
        message: '{VALUE} is not a valid shop status',
      },
      default: 'pending',
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Shop balance cannot be negative'],
    },
    totalSales: {
      type: Number,
      default: 0,
      min: [0, 'Total sales cannot be negative'],
    },
    ratings: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot be above 5'],
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    commissionRate: {
      type: Number,
      default: 10, // Default 10% platform commission
      min: [0, 'Commission rate cannot be negative'],
      max: [100, 'Commission rate cannot exceed 100%'],
    },
    bankDetails: {
      accountName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      bankName: { type: String, trim: true },
      branch: { type: String, trim: true },
      routingNumber: { type: String, trim: true },
      mobileBankingType: {
        type: String,
        enum: ['bkash', 'nagad', 'rocket', 'none'],
        default: 'none',
      },
      mobileBankingNumber: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

shopSchema.index({ location: '2dsphere' });

export const Shop = mongoose.model('Shop', shopSchema);
export default Shop;
