import mongoose from 'mongoose';

const { Schema } = mongoose;

const variantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true }, // e.g. "Red / XL"
    sku: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    attributes: {
      color: { type: String, trim: true },
      size: { type: String, trim: true },
      material: { type: String, trim: true },
      custom: { type: Map, of: String },
    },
  },
  { _id: true }
);

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    path: { type: String, default: '' },
    isThumbnail: { type: Boolean, default: false },
  },
  { _id: true }
);

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a product title'],
      trim: true,
      maxlength: [250, 'Product title cannot exceed 250 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
    },
    images: {
      type: [mediaSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Product must have at least one image',
      },
    },
    videos: [mediaSchema],
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product must belong to a category'],
      index: true,
    },
    subCategory: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },
    brand: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      index: true,
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Product must belong to a shop'],
      index: true,
    },
    variants: [variantSchema],
    basePrice: {
      type: Number,
      required: [true, 'Please provide base price'],
      min: [0, 'Base price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
    },
    totalStock: {
      type: Number,
      default: 0,
      min: [0, 'Total stock cannot be negative'],
    },
    soldCount: {
      type: Number,
      default: 0,
      min: [0, 'Sold count cannot be negative'],
    },
    ratings: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be below 0'],
      max: [5, 'Rating cannot be above 5'],
      index: true,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    metaTitle: {
      type: String,
      trim: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Full-text search index
productSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
});

// Compound indexes for high-speed queries
productSchema.index({ category: 1, isActive: 1, basePrice: 1 });
productSchema.index({ shop: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });

export const Product = mongoose.model('Product', productSchema);
export default Product;
