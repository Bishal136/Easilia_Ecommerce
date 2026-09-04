import Order from '../models/Order.js';
import Payment from '../models/Payment.js';
import ApiError from '../utils/ApiError.js';
import { creditSellerBalanceForOrder } from './orderService.js';

const FRONTEND_URL = process.env.CLIENT_URL || 'http://localhost:5173';

/**
 * Initiate PortPos Checkout Session
 */
export const createPortPosSession = async (userId, orderId) => {
  const order = await Order.findById(orderId).populate('user', 'name email phone');
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.user._id.toString() !== userId.toString()) {
    throw new ApiError(403, 'Unauthorized access to this order');
  }

  if (order.paymentStatus === 'paid') {
    throw new ApiError(400, 'Order is already paid');
  }

  const invoiceId = `INV-${order.orderNumber}`;
  const redirectUrl = `${FRONTEND_URL}/payment/process?orderId=${order._id}&invoiceId=${invoiceId}`;

  // Create / update Payment record
  let payment = await Payment.findOne({ order: order._id });
  if (!payment) {
    payment = await Payment.create({
      order: order._id,
      user: order.user._id,
      method: 'portpos',
      amount: order.totalPrice,
      currency: 'BDT',
      status: 'pending',
      portposInvoiceId: invoiceId,
      ipnData: { initiatedAt: new Date() },
    });
  } else {
    payment.status = 'pending';
    payment.portposInvoiceId = invoiceId;
    await payment.save();
  }

  return {
    paymentUrl: redirectUrl,
    invoiceId,
    amount: order.totalPrice,
    orderId: order._id,
  };
};

/**
 * Handle PortPos IPN Webhook / Gateway Confirmation
 */
export const handlePortPosIPN = async (payload) => {
  const { invoice_id, status, transaction_id, amount } = payload;

  const payment = await Payment.findOne({
    $or: [{ portposInvoiceId: invoice_id }, { transactionId: transaction_id }],
  });

  if (!payment) {
    throw new ApiError(404, 'Payment transaction record not found');
  }

  payment.ipnData = payload;

  if (status === 'ACCEPTED' || status === 'COMPLETED' || status === 'PAID') {
    payment.status = 'paid';
    payment.paidAt = new Date();
    payment.transactionId = transaction_id || payment.transactionId;
    await payment.save();

    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
      await order.save();

      // Credit seller balance immediately for online prepaid gateway orders (PortPos, bKash, Nagad)
      await creditSellerBalanceForOrder(order._id);
    }
  } else if (status === 'FAILED' || status === 'CANCELLED') {
    payment.status = 'failed';
    await payment.save();

    const order = await Order.findById(payment.order);
    if (order) {
      order.paymentStatus = 'failed';
      await order.save();
    }
  }

  return { success: true };
};

/**
 * Confirm Cash on Delivery (COD) Collection
 */
export const confirmCODPayment = async (user, orderId) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.paymentMethod !== 'cod') {
    throw new ApiError(400, 'This order is not configured for Cash on Delivery');
  }

  order.paymentStatus = 'paid';
  order.paidAt = new Date();
  await order.save();

  await Payment.create({
    order: order._id,
    user: order.user,
    method: 'cod',
    amount: order.totalPrice,
    currency: 'BDT',
    status: 'paid',
    paidAt: new Date(),
    transactionId: `COD-${order.orderNumber}`,
  });

  // Credit seller balance once COD cash payment is collected & confirmed
  await creditSellerBalanceForOrder(order._id);

  return order;
};

export default {
  createPortPosSession,
  handlePortPosIPN,
  confirmCODPayment,
};

