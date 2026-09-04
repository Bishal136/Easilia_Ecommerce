import mongoose from 'mongoose';

const { Schema } = mongoose;

const chatSchema = new Schema(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
      },
    ],
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop',
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

chatSchema.index({ participants: 1, lastMessageAt: -1 });

export const Chat = mongoose.model('Chat', chatSchema);
export default Chat;
