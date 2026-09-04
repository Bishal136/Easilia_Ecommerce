import mongoose from 'mongoose';

const { Schema } = mongoose;

const attachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    path: { type: String, default: '' },
    fileType: { type: String, default: 'image' },
    originalName: { type: String, default: '' },
  },
  { _id: false }
);

const productInquirySchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    title: { type: String, default: '' },
    slug: { type: String, default: '' },
    price: { type: Number, default: 0 },
    thumbnail: { type: String, default: '' },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    attachments: [attachmentSchema],
    product: productInquirySchema,
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ chat: 1, createdAt: 1 });

export const Message = mongoose.model('Message', messageSchema);
export default Message;
