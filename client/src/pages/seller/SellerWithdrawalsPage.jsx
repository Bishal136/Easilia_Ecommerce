import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building,
  CreditCard,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Info,
  HelpCircle,
} from "lucide-react";
import {
  useGetOwnShopQuery,
  useGetSellerWithdrawalsQuery,
  useRequestWithdrawalMutation,
} from "../../features/shops/shopApi";
import Spinner from "../../components/ui/Spinner";

export const SellerWithdrawalsPage = () => {
  const { data: shopData, isLoading: isShopLoading, refetch: refetchShop } = useGetOwnShopQuery();
  const {
    data: withdrawalsData,
    isLoading: isWithdrawalsLoading,
    refetch: refetchWithdrawals,
  } = useGetSellerWithdrawalsQuery();

  const [requestWithdrawal, { isLoading: isSubmitting }] = useRequestWithdrawalMutation();

  const shop = shopData?.data?.shop || shopData?.shop || shopData?.data;
  const rawWithdrawals = withdrawalsData?.data?.withdrawals || withdrawalsData?.withdrawals || [];
  const currentBalance = withdrawalsData?.data?.currentBalance ?? shop?.balance ?? 0;
  const totalSales = withdrawalsData?.data?.totalSales ?? shop?.totalSales ?? 0;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("bkash"); // "bkash" | "nagad" | "card" | "bank"

  // Method specific fields
  const [mobileNumber, setMobileNumber] = useState(shop?.bankDetails?.mobileBankingNumber || "");
  const [accountName, setAccountName] = useState(shop?.bankDetails?.accountName || shop?.name || "");
  const [accountNumber, setAccountNumber] = useState(shop?.bankDetails?.accountNumber || "");
  const [bankName, setBankName] = useState(shop?.bankDetails?.bankName || "");
  const [branch, setBranch] = useState(shop?.bankDetails?.branch || "");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolderName, setCardHolderName] = useState(shop?.name || "");
  const [cardBankName, setCardBankName] = useState("");

  // Filter & Search
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const isVerified = shop?.kycStatus === "approved" && shop?.status === "active";

  // Calculations
  const pendingTotal = useMemo(() => {
    return rawWithdrawals
      .filter((w) => w.status === "pending" || w.status === "processing")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [rawWithdrawals]);

  const completedTotal = useMemo(() => {
    return rawWithdrawals
      .filter((w) => w.status === "approved")
      .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [rawWithdrawals]);

  const filteredWithdrawals = useMemo(() => {
    return rawWithdrawals.filter((item) => {
      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        item.paymentMethod?.toLowerCase().includes(searchLower) ||
        item.accountDetails?.accountNumber?.toLowerCase().includes(searchLower) ||
        item.accountDetails?.mobileNumber?.toLowerCase().includes(searchLower) ||
        item.accountDetails?.cardNumber?.toLowerCase().includes(searchLower) ||
        item.transactionReference?.toLowerCase().includes(searchLower) ||
        String(item.amount).includes(searchQuery);

      return matchesStatus && matchesSearch;
    });
  }, [rawWithdrawals, statusFilter, searchQuery]);

  const handleOpenModal = () => {
    if (!isVerified) {
      showToast("Your merchant account must be KYC approved and active to withdraw funds.", "error");
      return;
    }
    if (currentBalance < 100) {
      showToast("Minimum withdrawal threshold is ৳100. Current balance is insufficient.", "error");
      return;
    }
    setWithdrawAmount("");
    setIsModalOpen(true);
  };

  const handleSubmitWithdrawal = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);

    if (!amount || isNaN(amount) || amount < 100) {
      showToast("Minimum withdrawal amount is ৳100", "error");
      return;
    }
    if (amount > currentBalance) {
      showToast(`Cannot withdraw ৳${amount.toLocaleString()}. Available balance is ৳${currentBalance.toLocaleString()}`, "error");
      return;
    }

    let accountDetailsPayload = {};
    if (selectedMethod === "bkash" || selectedMethod === "nagad") {
      if (!mobileNumber.trim()) {
        showToast(`Please enter your ${selectedMethod.toUpperCase()} wallet mobile number`, "error");
        return;
      }
      accountDetailsPayload = {
        mobileNumber: mobileNumber.trim(),
        accountNumber: mobileNumber.trim(),
        accountName: accountName.trim() || shop?.name,
        bankName: selectedMethod.toUpperCase(),
      };
    } else if (selectedMethod === "card") {
      if (!cardNumber.trim()) {
        showToast("Please enter your card number", "error");
        return;
      }
      accountDetailsPayload = {
        cardNumber: cardNumber.trim(),
        cardHolderName: cardHolderName.trim() || shop?.name,
        bankName: cardBankName.trim() || "Card Provider",
      };
    } else if (selectedMethod === "bank") {
      if (!accountNumber.trim() || !bankName.trim()) {
        showToast("Please provide your bank name and account number", "error");
        return;
      }
      accountDetailsPayload = {
        accountName: accountName.trim() || shop?.name,
        accountNumber: accountNumber.trim(),
        bankName: bankName.trim(),
        branch: branch.trim(),
      };
    }

    try {
      await requestWithdrawal({
        amount,
        paymentMethod: selectedMethod,
        accountDetails: accountDetailsPayload,
      }).unwrap();

      showToast(`Withdrawal request for ৳${amount.toLocaleString()} submitted successfully!`, "success");
      setIsModalOpen(false);
      setWithdrawAmount("");
      refetchShop();
      refetchWithdrawals();
    } catch (err) {
      const errorMsg =
        err?.data?.message ||
        err?.data?.errorDetails?.[0]?.message ||
        err?.error ||
        "Failed to submit withdrawal request";
      showToast(errorMsg, "error");
    }
  };

  const getMethodBadge = (method) => {
    switch (method?.toLowerCase()) {
      case "bkash":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#E2136E]/10 text-[#E2136E] border border-[#E2136E]/20">
            <Smartphone className="w-3.5 h-3.5" />
            <span>bKash</span>
          </span>
        );
      case "nagad":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-[#F7921E]/10 text-[#F7921E] border border-[#F7921E]/20">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Nagad</span>
          </span>
        );
      case "card":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Card (Debit/Credit)</span>
          </span>
        );
      case "bank":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Building className="w-3.5 h-3.5" />
            <span>Bank Transfer</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <XCircle className="w-3 h-3" />
            <span>Rejected & Refunded</span>
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>In Processing</span>
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            <span>Pending Review</span>
          </span>
        );
    }
  };

  if (isShopLoading || isWithdrawalsLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" text="Loading Merchant Wallet & Withdrawals..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-xs font-semibold transition-all ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200"
              : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200"
          }`}
        >
          <span>{toast.type === "error" ? "⚠️" : "✅"}</span>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* KYC Warning Banner if not approved */}
      {!isVerified && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <h4 className="font-bold text-amber-900 dark:text-amber-200">
              KYC Verification Required For Payout Transfers
            </h4>
            <p className="text-amber-700 dark:text-amber-300/90 mt-0.5">
              Your merchant store is currently awaiting verification. Wallet earnings are safely accumulated, but payout withdrawals are unlocked upon KYC approval by Easilia Administration.
            </p>
          </div>
          <Link
            to="/seller/profile"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 transition-colors shadow-xs"
          >
            Complete KYC
          </Link>
        </div>
      )}

      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Payouts & Wallet Withdrawals
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Easilia Pay
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Transfer merchant earnings directly to your bKash, Nagad, Debit/Credit Card, or Corporate Bank Account.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              refetchShop();
              refetchWithdrawals();
              showToast("Wallet data refreshed", "success");
            }}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh balance"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleOpenModal}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Request Withdrawal</span>
          </button>
        </div>
      </div>

      {/* Wallet Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Available Payout */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Available For Payout
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              ৳{currentBalance.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
            <span>● Ready to transfer</span>
          </div>
        </div>

        {/* Card 2: Pending Requests */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pending Processing
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              ৳{pendingTotal.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <span>In queue for bank/MFS release</span>
          </div>
        </div>

        {/* Card 3: Total Completed Payouts */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Withdrawn
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              ৳{completedTotal.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <span>Successfully disbursed to you</span>
          </div>
        </div>

        {/* Card 4: Gross Sales Volume */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Gross Store Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              ৳{totalSales.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <span>Lifetime delivered volume</span>
          </div>
        </div>
      </div>

      {/* Supported Payment Channels Highlight */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
            <CreditCard className="w-5 h-5 text-fuchsia-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">
              Instant & Automated Payout Gateways
            </h4>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Withdraw directly to <strong>bKash</strong>, <strong>Nagad</strong>, <strong>Visa/Mastercard Debit & Credit Cards</strong>, or any <strong>Scheduled Commercial Bank</strong> in Bangladesh.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-lg bg-[#E2136E]/20 text-[#FF65A8] border border-[#E2136E]/40 font-bold text-[11px]">
            bKash (MFS)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-[#F7921E]/20 text-[#FFA94D] border border-[#F7921E]/40 font-bold text-[11px]">
            Nagad (MFS)
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold text-[11px]">
            Debit/Credit Card
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[11px]">
            Bank EFT
          </span>
        </div>
      </div>

      {/* Payout History & Transaction Logs */}
      <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Withdrawal Requests & History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live ledger of all payout requests, disbursement status, and transaction references
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search amount, method, account..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === "all"
                    ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === "pending"
                    ? "bg-white dark:bg-slate-800 text-amber-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("approved")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === "approved"
                    ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Completed
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("rejected")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  statusFilter === "rejected"
                    ? "bg-white dark:bg-slate-800 text-rose-600 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                Rejected
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredWithdrawals.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
              <Wallet className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              No withdrawal records found
            </p>
            <p className="max-w-sm mx-auto text-slate-400">
              When you submit a withdrawal request, its processing timeline and confirmation ID will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Request Date</th>
                  <th className="px-5 py-3.5">Amount (৳)</th>
                  <th className="px-5 py-3.5">Payout Method</th>
                  <th className="px-5 py-3.5">Destination Account</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Transaction Ref / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredWithdrawals.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-black font-mono text-sm text-slate-900 dark:text-white">
                        ৳{item.amount?.toLocaleString()}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {getMethodBadge(item.paymentMethod)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.accountDetails?.accountNumber ||
                          item.accountDetails?.mobileNumber ||
                          (item.accountDetails?.cardNumber
                            ? `•••• ${item.accountDetails.cardNumber.slice(-4)}`
                            : "Account Verified")}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {item.accountDetails?.bankName || item.accountDetails?.cardHolderName || item.accountDetails?.accountName || "Merchant Beneficiary"}
                        {item.accountDetails?.branch ? ` • ${item.accountDetails.branch}` : ""}
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    <td className="px-5 py-4">
                      {item.transactionReference ? (
                        <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-800 dark:text-slate-200">
                          {item.transactionReference}
                        </span>
                      ) : item.adminNote ? (
                        <span className="text-[11px] text-slate-500 italic">
                          {item.adminNote}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Withdrawal Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Submit Payout Request</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Available Wallet Balance: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">৳{currentBalance.toLocaleString()}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitWithdrawal}>
              <div className="p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
                {/* Amount Input & Preset Buttons */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Withdrawal Amount (৳) <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Min ৳100</span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400 font-mono">
                      ৳
                    </span>
                    <input
                      type="number"
                      required
                      min="100"
                      max={currentBalance}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Enter amount (e.g. 2000)"
                      className="w-full pl-9 pr-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Preset Amount Badges */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {[500, 1000, 2500, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setWithdrawAmount(String(amt))}
                        disabled={amt > currentBalance}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        ৳{amt.toLocaleString()}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(String(currentBalance))}
                      disabled={currentBalance <= 0}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      All Available (৳{currentBalance.toLocaleString()})
                    </button>
                  </div>
                </div>

                {/* Payout Channel Selection */}
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Select Payout Channel
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* bKash */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod("bkash")}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        selectedMethod === "bkash"
                          ? "border-[#E2136E] bg-[#E2136E]/5 text-[#E2136E] ring-2 ring-[#E2136E]/20"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-[#E2136E]" />
                      <div>
                        <div className="font-bold text-xs">bKash</div>
                        <div className="text-[10px] text-slate-400">Personal / Merchant</div>
                      </div>
                    </button>

                    {/* Nagad */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod("nagad")}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        selectedMethod === "nagad"
                          ? "border-[#F7921E] bg-[#F7921E]/5 text-[#F7921E] ring-2 ring-[#F7921E]/20"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-[#F7921E]" />
                      <div>
                        <div className="font-bold text-xs">Nagad</div>
                        <div className="text-[10px] text-slate-400">Personal / Merchant</div>
                      </div>
                    </button>

                    {/* Card (Debit / Credit) */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod("card")}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        selectedMethod === "card"
                          ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <CreditCard className="w-5 h-5 text-indigo-600" />
                      <div>
                        <div className="font-bold text-xs">Debit / Credit Card</div>
                        <div className="text-[10px] text-slate-400">Visa / Mastercard</div>
                      </div>
                    </button>

                    {/* Bank Transfer */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod("bank")}
                      className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                        selectedMethod === "bank"
                          ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <Building className="w-5 h-5 text-emerald-600" />
                      <div>
                        <div className="font-bold text-xs">Bank Transfer</div>
                        <div className="text-[10px] text-slate-400">Direct Deposit (EFT)</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Conditional Account Fields */}
                {(selectedMethod === "bkash" || selectedMethod === "nagad") && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        {selectedMethod.toUpperCase()} Account Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="017XXXXXXXX / 018XXXXXXXX"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        Account Holder / Merchant Name
                      </label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Account name"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {selectedMethod === "card" && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        16-Digit Card Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="•••• •••• •••• ••••"
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-slate-900 dark:text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                          Cardholder Name
                        </label>
                        <input
                          type="text"
                          value={cardHolderName}
                          onChange={(e) => setCardHolderName(e.target.value)}
                          placeholder="Name on card"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                          Issuing Bank / Card Type
                        </label>
                        <input
                          type="text"
                          value={cardBankName}
                          onChange={(e) => setCardBankName(e.target.value)}
                          placeholder="e.g. City Bank Visa"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedMethod === "bank" && (
                  <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                          Bank Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. Dutch-Bangla Bank"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                          Account Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Account number"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                          Branch Name
                        </label>
                        <input
                          type="text"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          placeholder="Branch location"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                          Beneficiary Name
                        </label>
                        <input
                          type="text"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder="Beneficiary name"
                          className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Processing notice */}
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900 text-[11px] text-purple-900 dark:text-purple-200 flex items-start gap-2">
                  <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Processing Schedule:</strong> Mobile Banking (bKash/Nagad) payouts are released within <strong>2 to 6 hours</strong>. Card and Direct Bank transfers take <strong>1 business day</strong>.
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-700 hover:to-purple-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="xs" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <span>Confirm & Withdraw ৳{Number(withdrawAmount || 0).toLocaleString()}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerWithdrawalsPage;
