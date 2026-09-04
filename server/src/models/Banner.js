import mongoose from 'mongoose';

const { Schema } = mongoose;

const bannerSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide banner title'],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    image: {
      url: { type: String, default: '' },
      path: { type: String, default: '' },
    },
    mobileImage: {
      url: { type: String, default: '' },
      path: { type: String, default: '' },
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
    position: {
      type: String,
      enum: {
        values: [
          'home_hero',
          'home_middle',
          'home_bottom',
          'category_top',
          'sidebar',
          'popup',
          'ticker',
        ],
        message: '{VALUE} is not a valid banner position',
      },
      default: 'home_hero',
      index: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

bannerSchema.index({ position: 1, isActive: 1, priority: -1 });

export const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;
