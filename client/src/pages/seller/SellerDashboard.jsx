import React from "react";
import { Link } from "react-router-dom";
import { useGetOwnShopQuery } from "../../features/shops/shopApi";
import { useGetSellerOrdersQuery, useUpdateSellerOrderItemStatusMutation } from "../../features/orders/orderApi";
import { useGetProductsQuery } from "../../features/products/productApi";
import { useGetSellerReviewsQuery } from "../../features/reviews/reviewApi";
import Spinner from "../../components/ui/Spinner";

export const SellerDashboard = () => {
  // 1. Fetch live shop data
  const { data: shopRes, isLoading: shopLoading } = useGetOwnShopQuery();
  const shop = shopRes?.data?.shop || shopRes?.shop;

  // 2. Fetch live seller orders
  const { data: ordersRes, isLoading: ordersLoading } = useGetSellerOrdersQuery({ limit: 10 });
  const orders = ordersRes?.data?.orders || ordersRes?.orders || [];
  const totalOrdersCount = ordersRes?.data?.totalCount ?? ordersRes?.totalCount ?? orders.length;

  // 3. Fetch products inventory for this shop
  const { data: productsRes, isLoading: productsLoading } = useGetProductsQuery(
    shop?._id ? { shop: shop._id, limit: 100 } : { limit: 100 },
    { skip: !shop?._id }
  );
  const products = productsRes?.data?.products || productsRes?.products || [];
  const totalProductsCount = productsRes?.data?.totalCount ?? productsRes?.totalCount ?? products.length;

  // 4. Fetch seller reviews
  const { data: reviewsRes } = useGetSellerReviewsQuery({ limit: 5 });
  const reviews = reviewsRes?.data?.reviews || reviewsRes?.reviews || [];
  const totalReviewsCount = reviewsRes?.data?.totalCount ?? reviewsRes?.totalCount ?? reviews.length;

  // Mutation for quick order item dispatch
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateSellerOrderItemStatusMutation();

  // Metrics calculations from live data
  const pendingOrders = orders.filter((o) =>
    o.sellerItems?.some((item) => item.itemStatus === "pending")
  ).length;

  const lowStockCount = products.filter((p) => (p.totalStock ?? 0) <= 5).length;

  // Calculate gross sales from seller items in delivered/processing orders or shop balance
  const availableBalance = shop?.balance || 0;
  const totalSalesVolume = shop?.totalSales || 0;
  const averageRating = shop?.ratings || 0;

  const handleQuickStatusUpdate = async (orderId, itemId, currentStatus) => {
    let nextStatus = "processing";
    if (currentStatus === "pending") nextStatus = "processing";
    else if (currentStatus === "processing") nextStatus = "shipped";
    else if (currentStatus === "shipped") nextStatus = "delivered";

    try {
      await updateStatus({ orderId, itemId, status: nextStatus }).unwrap();
    } catch (err) {
      console.error("Failed to update order status:", err);
    }
  };

  const isLoading = shopLoading || ordersLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" text="Loading Merchant Intelligence..." />
      </div>
    );
  }

  const isVerified = shop?.kycStatus === "approved" && shop?.status === "active";
  const isKycPending = !shop || shop?.kycStatus === "pending" || shop?.status === "pending";
  const isKycRejected = shop?.kycStatus === "rejected" || shop?.status === "rejected";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* KYC Warning Banner if Not Verified */}
      {!isVerified && (
        <div
          className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm animate-in fade-in duration-200 ${
            isKycRejected
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
              : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                isKycRejected
                  ? "bg-rose-100 dark:bg-rose-900 text-rose-700"
                  : "bg-amber-100 dark:bg-amber-900 text-amber-700"
              }`}
            >
              {isKycRejected ? "🚫" : "⚠️"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm">
                  {isKycRejected
                    ? "KYC Verification Rejected – Action Required"
                    : "You are not verified yet (KYC Status: PENDING)"}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isKycRejected
                      ? "bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                      : "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                  }`}
                >
                  {shop?.kycStatus || "PENDING"}
                </span>
              </div>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                {isKycRejected
                  ? `Your application was rejected: "${shop?.rejectionReason || "Please resubmit valid documents."}". Update in Shop Profile.`
                  : "Your seller account is under review. You cannot publish products until your KYC is verified by Admin."}
              </p>
            </div>
          </div>

          <Link
            to="/seller/profile"
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto transition-colors shadow-xs ${
              isKycRejected
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            }`}
          >
            Check KYC Status →
          </Link>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#131B2E] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              {shop?.name || "Merchant"} Analytics
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                isVerified
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                  : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30"
              }`}
            >
              ● {isVerified ? "Live Store" : "KYC Pending Review"}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time sales velocity, order pipeline tracking, and revenue overview
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/seller/products"
            className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            {isVerified ? "+ Add Product" : "Manage Products"}
          </Link>
          <Link
            to="/seller/withdrawals"
            className="px-4 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300 font-bold text-xs transition-colors border border-purple-200 dark:border-purple-800 flex items-center gap-1.5 shadow-xs"
          >
            <span>Wallet & Withdrawals</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* 4 Core Operational KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Balance & Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Available Payout
              </span>
              <span className="p-2 rounded-xl bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:text-fuchsia-400 text-xs">
                ৳
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
              ৳{availableBalance.toLocaleString()}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              Total: <strong>৳{totalSalesVolume.toLocaleString()}</strong>
            </span>
            <Link
              to="/seller/withdrawals"
              className="font-bold text-fuchsia-600 hover:text-fuchsia-700 dark:text-fuchsia-400 flex items-center gap-0.5 hover:underline"
            >
              <span>Withdraw</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Orders in Pipeline */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Order Pipeline
              </span>
              <span className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 text-xs">
                📦
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
              {totalOrdersCount}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              {pendingOrders} awaiting fulfillment
            </span>
            <Link to="/seller/orders" className="text-fuchsia-600 dark:text-fuchsia-400 hover:underline">
              View →
            </Link>
          </div>
        </div>

        {/* Products in Inventory */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Listed Catalog
              </span>
              <span className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400 text-xs">
                🏷️
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
              {totalProductsCount}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className={lowStockCount > 0 ? "text-rose-500 font-semibold" : "text-slate-400"}>
              {lowStockCount > 0 ? `⚠️ ${lowStockCount} low stock alerts` : "Stock levels optimal"}
            </span>
            <Link to="/seller/products" className="text-fuchsia-600 dark:text-fuchsia-400 hover:underline">
              Manage →
            </Link>
          </div>
        </div>

        {/* Store Rating & Feedback */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Store Reputation
              </span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 text-xs">
                ⭐
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono flex items-center gap-1.5">
              <span>{averageRating ? averageRating.toFixed(1) : "5.0"}</span>
              <span className="text-amber-400 text-lg">★</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">
              {totalReviewsCount} verified reviews
            </span>
            <Link to="/seller/reviews" className="text-fuchsia-600 dark:text-fuchsia-400 hover:underline">
              Replies →
            </Link>
          </div>
        </div>
      </div>

      {/* Main Row: Recent Orders Table & Low Stock Quick Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Customer Orders Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Recent Customer Orders
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Live fulfillment requests requiring dispatch
              </p>
            </div>
            <Link
              to="/seller/orders"
              className="text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400 hover:underline"
            >
              View All ({totalOrdersCount}) →
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <p className="text-2xl mb-2">🛒</p>
              <p className="font-semibold text-slate-700 dark:text-slate-300">No orders received yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                New buyer purchases for your products will appear here in real-time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                  <tr>
                    <th className="px-3.5 py-2.5 rounded-l-lg">Order #</th>
                    <th className="px-3.5 py-2.5">Buyer</th>
                    <th className="px-3.5 py-2.5">Your Items</th>
                    <th className="px-3.5 py-2.5">Subtotal</th>
                    <th className="px-3.5 py-2.5">Status</th>
                    <th className="px-3.5 py-2.5 rounded-r-lg text-right">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.slice(0, 5).map((order) => {
                    const sellerItem = order.sellerItems?.[0] || order.items?.[0];
                    const itemStatus = sellerItem?.itemStatus || order.orderStatus || "pending";
                    const productTitle = sellerItem?.product?.title || "Product item";

                    return (
                      <tr key={order._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                        <td className="px-3.5 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`}
                        </td>
                        <td className="px-3.5 py-3">
                          <p className="font-semibold text-slate-900 dark:text-slate-200">
                            {order.user?.name || "Customer"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {order.shippingAddress?.city || "Dhaka"}
                          </p>
                        </td>
                        <td className="px-3.5 py-3 text-slate-700 dark:text-slate-300">
                          <p className="truncate max-w-[160px]" title={productTitle}>
                            {productTitle}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Qty: {sellerItem?.quantity || 1}
                            {sellerItem?.variant?.name ? ` (${sellerItem.variant.name})` : ""}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 font-mono font-bold text-slate-900 dark:text-white">
                          ৳{(order.sellerSubtotal || sellerItem?.price * (sellerItem?.quantity || 1) || 0).toLocaleString()}
                        </td>
                        <td className="px-3.5 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize ${
                              itemStatus === "delivered"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                                : itemStatus === "shipped"
                                ? "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300"
                                : itemStatus === "processing"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
                                : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                            }`}
                          >
                            {itemStatus}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-right">
                          {itemStatus !== "delivered" && itemStatus !== "cancelled" && sellerItem?._id ? (
                            <button
                              type="button"
                              disabled={updatingStatus}
                              onClick={() => handleQuickStatusUpdate(order._id, sellerItem._id, itemStatus)}
                              className="px-2.5 py-1 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium text-[11px] transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {itemStatus === "pending" ? "Process →" : itemStatus === "processing" ? "Ship →" : "Deliver"}
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar Quick Card: Inventory Overview & Recent Customer Reviews */}
        <div className="space-y-6">
          {/* Low Stock Watchlist */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Inventory Health
              </h3>
              <Link to="/seller/products" className="text-[11px] text-fuchsia-600 dark:text-fuchsia-400 hover:underline">
                Manage Stock
              </Link>
            </div>
            {products.slice(0, 3).map((prod) => (
              <div
                key={prod._id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 flex items-center justify-between"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">
                    {prod.title}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    ৳{prod.basePrice?.toLocaleString()} • {prod.category?.name || "Catalog"}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                    (prod.totalStock ?? 0) <= 5
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                  }`}
                >
                  {prod.totalStock ?? 0} in stock
                </span>
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-4">No products in catalog</p>
            )}
          </div>

          {/* Customer Reviews Snippet */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Latest Buyer Feedback
              </h3>
              <Link to="/seller/reviews" className="text-[11px] text-fuchsia-600 dark:text-fuchsia-400 hover:underline">
                All Reviews
              </Link>
            </div>
            {reviews.length > 0 ? (
              reviews.slice(0, 2).map((rev) => (
                <div
                  key={rev._id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/50 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-amber-400 font-bold text-xs">
                      {"★".repeat(rev.rating || 5)}
                    </span>
                    <span className="text-[10px] text-slate-400">{rev.user?.name || "Buyer"}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 italic line-clamp-2">
                    "{rev.comment}"
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">No reviews recorded yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;
