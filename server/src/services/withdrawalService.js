import Withdrawal from '../models/Withdrawal.js';
import Shop from '../models/Shop.js';
import ApiError from '../utils/ApiError.js';

export const requestWithdrawal = async (sellerUserId, payload = {}) => {
  const { amount } = payload;
  const paymentMethod = payload.paymentMethod || payload.payoutMethod || 'bank';
  const accountDetails = payload.accountDetails || {};

  const shop = await Shop.findOne({ owner: sellerUserId });
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  if (shop.status !== 'active' && shop.kycStatus !== 'approved') {
    throw new ApiError(400, 'Your shop must be verified and active to request payouts');
  }

  if ((shop.balance || 0) < amount) {
    throw new ApiError(400, `Insufficient wallet balance. Available balance: ৳${shop.balance || 0}`);
  }

  // Resolve method enum ('bank', 'bkash', 'nagad', 'rocket', 'card')
  let resolvedMethod = paymentMethod;
  if (resolvedMethod === 'mobile_banking') {
    resolvedMethod = shop.bankDetails?.mobileBankingType !== 'none' ? (shop.bankDetails?.mobileBankingType || 'bkash') : 'bkash';
  } else if (resolvedMethod === 'bank_transfer') {
    resolvedMethod = 'bank';
  }
  if (!['bank', 'bkash', 'nagad', 'rocket', 'card'].includes(resolvedMethod)) {
    resolvedMethod = 'bank';
  }

  // Populate missing account details based on method
  let resolvedAccountDetails = {};
  if (resolvedMethod === 'card') {
    resolvedAccountDetails = {
      accountNumber: accountDetails.cardNumber ? `Card: •••• ${accountDetails.cardNumber.slice(-4)}` : (accountDetails.accountNumber || ''),
      accountName: accountDetails.cardHolderName || accountDetails.accountName || shop.name,
      bankName: accountDetails.bankName || 'Debit/Credit Card',
      cardNumber: accountDetails.cardNumber || '',
      cardHolderName: accountDetails.cardHolderName || '',
      cardType: accountDetails.cardType || 'Visa/Mastercard',
    };
  } else if (resolvedMethod === 'bank') {
    resolvedAccountDetails = {
      accountNumber: accountDetails.accountNumber || shop.bankDetails?.accountNumber || '',
      accountName: accountDetails.accountName || shop.bankDetails?.accountName || shop.name,
      bankName: accountDetails.bankName || shop.bankDetails?.bankName || 'Bank',
      branch: accountDetails.branch || accountDetails.branchName || shop.bankDetails?.branch || '',
      routingNumber: accountDetails.routingNumber || shop.bankDetails?.routingNumber || '',
    };
  } else {
    // MFS (bkash, nagad, rocket)
    const mfsNum = accountDetails.mobileNumber || accountDetails.accountNumber || shop.bankDetails?.mobileBankingNumber || '';
    resolvedAccountDetails = {
      accountNumber: mfsNum,
      mobileNumber: mfsNum,
      accountName: accountDetails.accountName || shop.name,
      bankName: resolvedMethod.toUpperCase(),
    };
  }

  // Deduct from balance
  shop.balance = Math.max(0, (shop.balance || 0) - amount);
  await shop.save();

  const withdrawal = await Withdrawal.create({
    seller: sellerUserId,
    shop: shop._id,
    amount,
    paymentMethod: resolvedMethod,
    accountDetails: resolvedAccountDetails,
    status: 'pending',
  });

  return { withdrawal, currentBalance: shop.balance };
};

export const getSellerWithdrawals = async (sellerUserId) => {
  const shop = await Shop.findOne({ owner: sellerUserId });
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  const withdrawals = await Withdrawal.find({ seller: sellerUserId })
    .sort({ createdAt: -1 })
    .lean();

  return {
    withdrawals,
    currentBalance: shop.balance,
    totalSales: shop.totalSales,
  };
};

export const getAdminWithdrawals = async (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.status) filter.status = query.status;

  const [withdrawals, totalCount] = await Promise.all([
    Withdrawal.find(filter)
      .populate('seller', 'name email phone')
      .populate('shop', 'name balance')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Withdrawal.countDocuments(filter),
  ]);

  return {
    withdrawals,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    currentPage: page,
  };
};

export const processWithdrawal = async (adminUserId, withdrawalId, { status, adminNote, transactionReference }) => {
  const withdrawal = await Withdrawal.findById(withdrawalId);
  if (!withdrawal) {
    throw new ApiError(404, 'Withdrawal request not found');
  }

  if (withdrawal.status !== 'pending' && withdrawal.status !== 'processing') {
    throw new ApiError(400, `Cannot process a withdrawal that is already "${withdrawal.status}"`);
  }

  withdrawal.status = status;
  if (adminNote) withdrawal.adminNote = adminNote;
  if (transactionReference) withdrawal.transactionReference = transactionReference;

  if (status === 'approved') {
    withdrawal.processedAt = new Date();
  } else if (status === 'rejected') {
    // Refund amount back to shop balance
    const shop = await Shop.findById(withdrawal.shop);
    if (shop) {
      shop.balance = (shop.balance || 0) + withdrawal.amount;
      await shop.save();
    }
  }

  await withdrawal.save();
  return withdrawal;
};

export default {
  requestWithdrawal,
  getSellerWithdrawals,
  getAdminWithdrawals,
  processWithdrawal,
};
