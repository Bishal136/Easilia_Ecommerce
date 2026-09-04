import mongoose from 'mongoose';

const { Schema } = mongoose;

const reviewImageSchema = new Schema(
  {
    url: { type: String, required: true },
    path: { type: String, default: '' },
  },
  { _id: false }
);

const reviewSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Review must belong to a product'],
      index: true,
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: [true, 'Please provide a rating between 1 and 5'],
      min: [1, 'Rating cannot be less than 1'],
      max: [5, 'Rating cannot be more than 5'],
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [120, 'Review title cannot exceed 120 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Please provide a review comment'],
      trim: true,
      maxlength: [1000, 'Review comment cannot exceed 1000 characters'],
    },
    images: [reviewImageSchema],
    video: {
      url: { type: String, trim: true },
      path: { type: String, default: '' },
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
    reply: {
      comment: { type: String, trim: true },
      repliedAt: { type: Date },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, rating: -1, createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);
export default Review;
