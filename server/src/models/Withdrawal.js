import mongoose from 'mongoose';

const { Schema } = mongoose;

const withdrawalSchema = new Schema(
  {
    seller: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [100, 'Minimum withdrawal amount is 100'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'processing', 'approved', 'rejected'],
        message: '{VALUE} is not a valid withdrawal status',
      },
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: {
        values: ['bank', 'bkash', 'nagad', 'rocket', 'card'],
        message: '{VALUE} is not a valid payout method',
      },
      required: true,
    },
    accountDetails: {
      accountName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      bankName: { type: String, trim: true },
      branch: { type: String, trim: true },
      routingNumber: { type: String, trim: true },
      mobileNumber: { type: String, trim: true },
      cardNumber: { type: String, trim: true },
      cardHolderName: { type: String, trim: true },
      cardType: { type: String, trim: true },
    },
    adminNote: {
      type: String,
      trim: true,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

withdrawalSchema.index({ seller: 1, status: 1, createdAt: -1 });

export const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);
export default Withdrawal;
