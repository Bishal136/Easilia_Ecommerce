import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Search,
  ChevronRight,
  Clock,
  RotateCcw,
  Eye,
  CreditCard,
  Building,
  Calendar,
  Star,
  X,
  ShoppingBag,
  AlertCircle,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  useGetUserOrdersQuery,
  useCancelOrderMutation,
} from "../../features/orders/orderApi";
import { useCreateReviewMutation } from "../../features/reviews/reviewApi";
import { addToCart } from "../../features/cart/cartSlice";

export const OrdersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Queries & Mutations
  const {
    data: ordersResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetUserOrdersQuery();

  const [cancelOrderMutation, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [createReviewMutation, { isLoading: isSubmittingReview }] = useCreateReviewMutation();

  // Active Filter & Search State
  const [selectedTab, setSelectedTab] = useState("All Orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Modal States
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [reviewModalProduct, setReviewModalProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState({ type: "", message: "" });
  const [actionMessage, setActionMessage] = useState({ type: "", message: "" });

  // Extract orders from backend response
  const orders = useMemo(() => {
    return ordersResponse?.data?.orders || ordersResponse?.orders || [];
  }, [ordersResponse]);

  // Calculate top stats directly from backend orders
  const stats = useMemo(() => {
    const total = orders.length;
    const inProgress = orders.filter((o) =>
      ["pending", "confirmed", "processing", "shipped"].includes(
        (o.orderStatus || "pending").toLowerCase()
      )
    ).length;
    const delivered = orders.filter(
      (o) => (o.orderStatus || "").toLowerCase() === "delivered"
    ).length;
    const cancelled = orders.filter((o) =>
      ["cancelled", "returned"].includes((o.orderStatus || "").toLowerCase())
    ).length;
    return { total, inProgress, delivered, cancelled };
  }, [orders]);

  // Filter and Sort Orders locally for instant responsiveness
  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        // Status Tab Filter
        const status = (order.orderStatus || "pending").toLowerCase();
        if (selectedTab === "Pending" && status !== "pending") return false;
        if (
          selectedTab === "Processing" &&
          !["processing", "confirmed"].includes(status)
        )
          return false;
        if (selectedTab === "Shipped" && status !== "shipped") return false;
        if (selectedTab === "Delivered" && status !== "delivered") return false;
        if (
          selectedTab === "Returns & Refunds" &&
          status !== "returned"
        )
          return false;
        if (selectedTab === "Cancelled" && status !== "cancelled") return false;

        // Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchOrderNumber = order.orderNumber
            ?.toLowerCase()
            .includes(q);
          const matchSeller = order.items?.some((it) =>
            it.shop?.name?.toLowerCase().includes(q)
          );
          const matchProducts = order.items?.some((it) =>
            it.product?.title?.toLowerCase().includes(q)
          );
          if (!matchOrderNumber && !matchSeller && !matchProducts) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest")
          return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === "oldest")
          return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === "high-price") return b.totalPrice - a.totalPrice;
        if (sortBy === "low-price") return a.totalPrice - b.totalPrice;
        return 0;
      });
  }, [orders, selectedTab, searchQuery, sortBy]);

  // Format Dates cleanly
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Handle Cancel Order with live backend mutation
  const handleCancelOrder = async (orderId) => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        setActionMessage({ type: "", message: "" });
        await cancelOrderMutation(orderId).unwrap();
        setActionMessage({
          type: "success",
          message: "Order has been successfully cancelled.",
        });
        refetch();
      } catch (err) {
        setActionMessage({
          type: "error",
          message: err?.data?.message || "Failed to cancel order",
        });
      }
    }
  };

  // Handle Buy Again
  const handleBuyAgain = (items) => {
    if (!items || items.length === 0) return;
    items.forEach((item) => {
      if (item.product) {
        dispatch(
          addToCart({
            product: item.product,
            quantity: item.quantity || 1,
            variant: item.variant || null,
          })
        );
      }
    });
    navigate("/cart");
  };

  // Handle Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewStatus({ type: "", message: "" });

    try {
      if (reviewModalProduct?._id) {
        await createReviewMutation({
          productId: reviewModalProduct._id,
          rating,
          comment: reviewComment,
        }).unwrap();
      }
      setReviewStatus({
        type: "success",
        message: "Thank you! Review submitted successfully.",
      });
      setTimeout(() => {
        setReviewModalProduct(null);
        setReviewComment("");
        setReviewStatus({ type: "", message: "" });
      }, 1500);
    } catch (err) {
      setReviewStatus({
        type: "error",
        message: err?.data?.message || "Failed to submit review",
      });
    }
  };

  const getStatusStepIndex = (status = "") => {
    const s = status.toLowerCase();
    if (s === "pending" || s === "confirmed") return 0;
    if (s === "processing") return 1;
    if (s === "shipped") return 2;
    if (s === "delivered") return 3;
    return 0;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16 font-sans">
      {/* ========================================================================= */}
      {/* 0. Breadcrumb & Page Header                                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-1.5">
            <Link to="/" className="hover:text-slate-900 transition-colors">
              Home
            </Link>
            <span>&gt;</span>
            <Link
              to="/user/profile"
              className="hover:text-slate-900 transition-colors"
            >
              My Account
            </Link>
            <span>&gt;</span>
            <span className="text-slate-800 font-semibold">Order History</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              My Orders & History
            </h1>
            {isFetching && (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track active shipments, view past receipts, and manage your order deliveries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:hover:bg-slate-900 cursor-pointer transition-colors"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
          <Link
            to="/products"
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#166534] hover:bg-[#14532d] text-white text-xs sm:text-sm font-semibold shadow-xs transition-all active:scale-95 shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>

      {/* Global Notification Banner */}
      {actionMessage.message && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{actionMessage.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage({ type: "", message: "" })}
            className="p-1 hover:opacity-75 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. Top Stats Cards Row (4 Cards)                                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <div className="bg-white dark:bg-slate-950 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 text-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              TOTAL ORDERS
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {stats.total}
            </p>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-slate-950 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0 text-xl">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              IN PROGRESS
            </p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {stats.inProgress}
            </p>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-white dark:bg-slate-950 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0 text-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              DELIVERED
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats.delivered}
            </p>
          </div>
        </div>

        {/* Cancelled */}
        <div className="bg-white dark:bg-slate-950 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center shrink-0 text-xl">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
              CANCELLED
            </p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
              {stats.cancelled}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Filter Navigation Tabs & Search Bar Card                               */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-950 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold select-none">
          {[
            "All Orders",
            "Pending",
            "Processing",
            "Shipped",
            "Delivered",
            "Returns & Refunds",
            "Cancelled",
          ].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-full whitespace-nowrap cursor-pointer transition-all ${
                selectedTab === tab
                  ? "bg-[#166534] text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Order ID, product or shop name..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534]"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <span className="text-xs text-slate-500 font-medium">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="high-price">Price: High to Low</option>
              <option value="low-price">Price: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Orders List State (Loading / Error / Empty / Cards)                     */}
      {/* ========================================================================= */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-950 rounded-3xl p-16 text-center border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#166534] mx-auto" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Loading your order history from the server...
          </p>
        </div>
      ) : error ? (
        <div className="bg-white dark:bg-slate-950 rounded-3xl p-12 text-center border border-rose-200 dark:border-rose-900/50 shadow-xs space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            Unable to Load Orders
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {error?.data?.message || "There was a problem connecting to the backend server."}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-950 rounded-3xl p-16 text-center border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-900 text-slate-400 mx-auto flex items-center justify-center text-2xl">
            <Package className="w-8 h-8 stroke-1" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              No Orders Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery
                ? `No orders matched your search query "${searchQuery}".`
                : selectedTab !== "All Orders"
                ? `You have no ${selectedTab.toLowerCase()} orders.`
                : "You haven't placed any orders yet. Discover trending products in our store!"}
            </p>
          </div>
          {searchQuery || selectedTab !== "All Orders" ? (
            <button
              type="button"
              onClick={() => {
                setSelectedTab("All Orders");
                setSearchQuery("");
              }}
              className="px-5 py-2.5 text-xs font-semibold text-[#166534] bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          ) : (
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-[#166534] hover:bg-[#14532d] rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Products</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const stepIndex = getStatusStepIndex(order.orderStatus);
            const isDelivered = (order.orderStatus || "").toLowerCase() === "delivered";
            const isCancelled = (order.orderStatus || "").toLowerCase() === "cancelled";
            const isProcessing = ["processing", "confirmed"].includes(
              (order.orderStatus || "").toLowerCase()
            );
            const isShipped = (order.orderStatus || "").toLowerCase() === "shipped";
            const sellerName =
              order.items?.[0]?.shop?.name ||
              order.seller?.name ||
              "Easilia Verified Store";

            return (
              <div
                key={order._id || order.orderNumber}
                className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Header Row */}
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        ORDER NUMBER
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        #{order.orderNumber}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        PLACED ON
                      </span>
                      <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDate(order.createdAt)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        SELLER
                      </span>
                      <span className="text-[#166534] font-semibold flex items-center gap-1">
                        <Building className="w-3.5 h-3.5" />
                        {sellerName}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isDelivered ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Delivered
                      </span>
                    ) : isCancelled ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" />
                        Cancelled
                      </span>
                    ) : isShipped ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Truck className="w-3.5 h-3.5" />
                        Shipped
                      </span>
                    ) : isProcessing ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <RotateCcw className="w-3.5 h-3.5" />
                        Processing
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        Pending Confirmation
                      </span>
                    )}
                  </div>
                </div>

                {/* Items List */}
                <div className="p-6 space-y-4">
                  {order.items?.map((item, idx) => {
                    const productTitle =
                      item.product?.title || "Easilia Product";
                    const productImg =
                      item.product?.images?.[0]?.url ||
                      item.product?.images?.[0] ||
                      "";

                    return (
                      <div
                        key={item._id || idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                            {productImg ? (
                              <img
                                src={productImg}
                                alt={productTitle}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 max-w-xl">
                              {productTitle}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                              Qty: {item.quantity} • ৳{item.price} each
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-2">
                          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                            ৳{item.price * item.quantity}
                          </span>

                          {isDelivered && (
                            <button
                              type="button"
                              onClick={() => setReviewModalProduct(item.product)}
                              className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 cursor-pointer transition-colors"
                            >
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                              <span>Review Product</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 4-Step Progress Tracker */}
                {!isCancelled && (
                  <div className="px-6 py-4 bg-slate-50/30 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800">
                    <div className="max-w-3xl mx-auto relative flex items-center justify-between py-2">
                      {/* Connection Line */}
                      <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-slate-800 z-0" />
                      <div
                        className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 transition-all duration-500 z-0"
                        style={{ width: `${(stepIndex / 3) * 100}%` }}
                      />

                      {/* Step 1: Order Placed */}
                      <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition-all ${
                            stepIndex >= 0
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 text-slate-500"
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          Order Placed
                        </span>
                      </div>

                      {/* Step 2: Processing */}
                      <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition-all ${
                            stepIndex >= 1
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                          }`}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-[11px] font-semibold ${
                            stepIndex >= 1
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-slate-400"
                          }`}
                        >
                          Processing
                        </span>
                      </div>

                      {/* Step 3: Shipped */}
                      <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition-all ${
                            stepIndex >= 2
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                          }`}
                        >
                          <Truck className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-[11px] font-semibold ${
                            stepIndex >= 2
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-slate-400"
                          }`}
                        >
                          Shipped
                        </span>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition-all ${
                            stepIndex >= 3
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span
                          className={`text-[11px] font-semibold ${
                            stepIndex >= 3
                              ? "text-emerald-700 dark:text-emerald-400"
                              : "text-slate-400"
                          }`}
                        >
                          Delivered
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Controls Row */}
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Payment Method & Total */}
                  <div className="flex items-center gap-2 text-xs">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Method:{" "}
                      <strong className="text-slate-800 dark:text-white uppercase">
                        {order.paymentMethod === "portpos"
                          ? "PORTPOS (পোস)"
                          : "CASH ON DELIVERY (COD)"}
                      </strong>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                        order.paymentStatus === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {order.paymentStatus || "pending"}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600 dark:text-slate-400 font-medium">
                      Total Amount:{" "}
                      <strong className="text-slate-900 dark:text-white font-black text-sm">
                        ৳{order.totalPrice}
                      </strong>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
                    {/* Pay Now Button (if PortPos and unpaid) */}
                    {order.paymentMethod === "portpos" &&
                      order.paymentStatus !== "paid" && (
                        <button
                          type="button"
                          onClick={() =>
                            alert(
                              `Redirecting to PortPos Gateway for Order #${order.orderNumber}`
                            )
                          }
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all active:scale-95"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Pay Now (PortPos)</span>
                        </button>
                      )}

                    {/* View Details */}
                    <button
                      type="button"
                      onClick={() => setSelectedOrderDetails(order)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>

                    {/* Buy Again */}
                    <button
                      type="button"
                      onClick={() => handleBuyAgain(order.items)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Buy Again</span>
                    </button>

                    {/* Cancel Order (if pending/processing) */}
                    {!isDelivered && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={isCancelling}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancel Order</span>
                      </button>
                    )}

                    {/* Request Return (if delivered) */}
                    {isDelivered && (
                      <button
                        type="button"
                        onClick={() =>
                          alert(
                            `Return request initiated for Order #${order.orderNumber}`
                          )
                        }
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-amber-800 text-xs font-semibold cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Request Return</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. Order Details Modal                                                    */}
      {/* ========================================================================= */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Order Details: #{selectedOrderDetails.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shipping Address & Recipient */}
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-1 text-xs">
              <p className="font-bold text-slate-800 dark:text-white">
                Shipping Address
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                {selectedOrderDetails.shippingAddress?.fullName} •{" "}
                {selectedOrderDetails.shippingAddress?.phone}
              </p>
              <p className="text-slate-500">
                {selectedOrderDetails.shippingAddress?.street},{" "}
                {selectedOrderDetails.shippingAddress?.city}
                {selectedOrderDetails.shippingAddress?.zipCode
                  ? ` - ${selectedOrderDetails.shippingAddress.zipCode}`
                  : ""}
              </p>
            </div>

            {/* Items Summary */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-800 dark:text-white">
                Ordered Items
              </p>
              {selectedOrderDetails.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 text-xs pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                      {item.product?.images?.[0]?.url && (
                        <img
                          src={item.product.images[0].url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {item.product?.title || "Product"}
                      </p>
                      <p className="text-slate-500">
                        Qty: {item.quantity} × ৳{item.price}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    ৳{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>৳{selectedOrderDetails.subtotal || selectedOrderDetails.totalPrice}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Shipping Fee</span>
                <span className="text-emerald-600 font-semibold">
                  {selectedOrderDetails.shippingCost
                    ? `৳${selectedOrderDetails.shippingCost}`
                    : "Free"}
                </span>
              </div>
              {selectedOrderDetails.discount > 0 && (
                <div className="flex justify-between text-rose-500">
                  <span>Discount</span>
                  <span>-৳{selectedOrderDetails.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>Total Amount</span>
                <span>৳{selectedOrderDetails.totalPrice}</span>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Product Review Modal                                                   */}
      {/* ========================================================================= */}
      {reviewModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Write a Review
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {reviewStatus.message && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  reviewStatus.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {reviewStatus.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{reviewStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-1 mb-2">
                  {reviewModalProduct.title}
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-500"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-2">
                    {rating} out of 5 Stars
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Your Review
                </label>
                <textarea
                  required
                  rows={4}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="What did you like or dislike about this product?"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewModalProduct(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingReview && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
