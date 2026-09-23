import React, { useState, useMemo } from "react";
import {
  useGetAdminOrdersQuery,
  useUpdateAdminOrderStatusMutation,
} from "../../features/admin/adminApi";
import Spinner from "../../components/ui/Spinner";

export const AdminOrdersPage = () => {
  // Query Filters State
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Modal States
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [statusModalOrder, setStatusModalOrder] = useState(null);
  const [statusForm, setStatusForm] = useState({
    orderStatus: "pending",
    paymentStatus: "pending",
    notes: "",
  });
  const [toast, setToast] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Fetch Admin Orders from Backend
  const queryParams = useMemo(() => {
    const params = {};
    if (appliedSearch) params.search = appliedSearch;
    if (orderStatusFilter !== "all") params.orderStatus = orderStatusFilter;
    if (paymentStatusFilter !== "all") params.paymentStatus = paymentStatusFilter;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    return params;
  }, [appliedSearch, orderStatusFilter, paymentStatusFilter, fromDate, toDate]);

  const { data: response, isLoading, isFetching, refetch } = useGetAdminOrdersQuery(queryParams);
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] = useUpdateAdminOrderStatusMutation();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const orders = response?.data?.orders || response?.orders || [];
  const stats = response?.data?.stats || response?.stats || { totalOrders: orders.length };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(searchInput.trim());
  };

  const handleQuickDate = (type) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const format = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (type === "today") {
      const todayStr = format(now);
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (type === "last7") {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setFromDate(format(past));
      setToDate(format(now));
    } else if (type === "last30") {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      setFromDate(format(past));
      setToDate(format(now));
    } else if (type === "thisMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(format(firstDay));
      setToDate(format(now));
    } else if (type === "clear") {
      setFromDate("");
      setToDate("");
    }
  };

  const handleOpenStatusModal = (order) => {
    setStatusModalOrder(order);
    setStatusForm({
      orderStatus: order.orderStatus || "pending",
      paymentStatus: order.paymentStatus || "pending",
      notes: order.notes || "",
    });
  };

  const handleSaveStatus = async (e) => {
    e.preventDefault();
    if (!statusModalOrder) return;

    try {
      await updateOrderStatus({
        orderId: statusModalOrder._id,
        orderStatus: statusForm.orderStatus,
        paymentStatus: statusForm.paymentStatus,
        notes: statusForm.notes,
      }).unwrap();

      showToast(`Order #${statusModalOrder.orderNumber} status updated successfully!`, "success");
      setStatusModalOrder(null);
    } catch (err) {
      showToast(err?.data?.message || err?.error || "Failed to update order status", "error");
    }
  };

  const handleCopyOrderId = (id) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    })} ${d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })}`;
  };

  const getPaymentMethodDisplay = (method) => {
    if (!method) return "Cash on Delivery";
    const lower = method.toLowerCase();
    if (lower === "portpos") return "PORTPOS (পোর্টপস)";
    if (lower === "cod") return "CASH ON DELIVERY (COD)";
    if (lower === "stripe") return "STRIPE";
    return method.toUpperCase();
  };

  const renderLifecycleBadge = (status) => {
    const s = (status || "pending").toLowerCase();
    switch (s) {
      case "pending":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Pending
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Confirmed
          </span>
        );
      case "processing":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Processing
          </span>
        );
      case "shipped":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Shipped
          </span>
        );
      case "delivered":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Delivered
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Cancelled
          </span>
        );
      case "refunded":
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const renderPaymentBadge = (status, method) => {
    const s = (status || "pending").toLowerCase();
    const isPaid = s === "paid";
    const isPending = s === "pending";
    const isFailed = s === "failed";

    return (
      <div>
        <span
          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            isPaid
              ? "bg-emerald-100/70 text-emerald-800 border border-emerald-200"
              : isPending
              ? "bg-amber-100/70 text-amber-800 border border-amber-200"
              : isFailed
              ? "bg-rose-100/70 text-rose-800 border border-rose-200"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {status || "PENDING"}
        </span>
        <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
          {getPaymentMethodDisplay(method)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-xs font-semibold transition-all animate-bounce ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <span>{toast.type === "error" ? "⚠️" : "✅"}</span>
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Platform Orders & Oversight
            </h1>
            <span className="px-2 py-0.5 bg-indigo-50 text-[#4F46E5] text-[10px] font-bold rounded-full border border-indigo-100">
              Admin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor real-time transactions, inspect items & buyer details, track delivery status, and override lifecycle status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <span className={isFetching ? "animate-spin" : ""}>🔄</span>
            <span>Refresh</span>
          </button>

          <div className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-semibold">
            Total Orders: <span className="text-[#4F46E5] font-bold">{orders.length}</span>
          </div>
        </div>
      </div>

      {/* Search and Comprehensive Filters Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Search Bar Row */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
              🔍
            </span>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by Order ID, Buyer name, Email, Shop name, Item name, Phone..."
              className="w-full pl-9 pr-8 py-2.5 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setAppliedSearch("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer text-center"
          >
            Search
          </button>
        </form>

        {/* Dropdown Filters & Date Range Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Order Status
            </label>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="all">All Statuses (Lifecycle)</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Payment Status
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="all">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Quick Date Shortcuts Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium text-[11px]">
            📅 Quick Date:
          </span>
          <button
            type="button"
            onClick={() => handleQuickDate("today")}
            className="px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium border border-slate-200 transition-colors"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => handleQuickDate("last7")}
            className="px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium border border-slate-200 transition-colors"
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => handleQuickDate("last30")}
            className="px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium border border-slate-200 transition-colors"
          >
            Last 30 Days
          </button>
          <button
            type="button"
            onClick={() => handleQuickDate("thisMonth")}
            className="px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium border border-slate-200 transition-colors"
          >
            This Month
          </button>
          {(fromDate || toDate) && (
            <button
              type="button"
              onClick={() => handleQuickDate("clear")}
              className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-medium border border-rose-200 transition-colors"
            >
              Clear Date Filter
            </button>
          )}
        </div>
      </div>

      {/* Orders Table Card */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-16 flex justify-center items-center">
          <Spinner size="md" text="Loading Platform Orders..." />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-16 text-center text-slate-400 text-xs font-medium">
          No orders found matching the filter criteria.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-xs text-left text-slate-600">
              <thead className="text-[11px] font-semibold text-slate-500 bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-5 py-3.5">Order ID</th>
                  <th className="px-4 sm:px-5 py-3.5">Buyer Details</th>
                  <th className="px-4 sm:px-5 py-3.5">Seller / Shop</th>
                  <th className="px-4 sm:px-5 py-3.5">Items</th>
                  <th className="px-4 sm:px-5 py-3.5">Total GMV</th>
                  <th className="px-4 sm:px-5 py-3.5">Payment</th>
                  <th className="px-4 sm:px-5 py-3.5">Lifecycle Status</th>
                  <th className="px-4 sm:px-5 py-3.5">Placed Date</th>
                  <th className="px-4 sm:px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => {
                  const firstShop = order.items?.[0]?.shop;
                  const shopName = firstShop?.name || "Marketplace Seller";
                  const totalItemsCount = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 1;
                  const buyerName = order.user?.name || order.shippingAddress?.fullName || "Guest Customer";
                  const buyerEmail = order.user?.email || "—";

                  return (
                    <tr key={order._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Order ID */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-100">
                            #{order.orderNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyOrderId(order.orderNumber)}
                            className="text-slate-400 hover:text-slate-600 text-xs"
                            title="Copy Order ID"
                          >
                            {copiedId === order.orderNumber ? "✓" : "📋"}
                          </button>
                        </div>
                      </td>

                      {/* Buyer Details */}
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 text-xs">
                          {buyerName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {buyerEmail}
                        </div>
                      </td>

                      {/* Seller / Shop */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <span>🏪</span>
                          <span>{shopName}</span>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-700">
                          <span>🛍️</span>
                          <span>{totalItemsCount} item{totalItemsCount !== 1 ? "s" : ""}</span>
                        </div>
                      </td>

                      {/* Total GMV */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-slate-900 text-sm">
                          ৳{(order.totalPrice || 0).toLocaleString()}
                        </span>
                      </td>

                      {/* Payment */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {renderPaymentBadge(order.paymentStatus, order.paymentMethod)}
                      </td>

                      {/* Lifecycle Status */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {renderLifecycleBadge(order.orderStatus)}
                      </td>

                      {/* Placed Date */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-medium text-[11px]">
                        {formatDate(order.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderDetails(order)}
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition-colors"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenStatusModal(order)}
                          className="px-3 py-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-md text-xs font-medium shadow-xs transition-colors"
                        >
                          Status
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Details Inspection Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92dvh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    Order #{selectedOrderDetails.orderNumber}
                  </h3>
                  {renderLifecycleBadge(selectedOrderDetails.orderStatus)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Placed on {formatDate(selectedOrderDetails.createdAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs text-slate-700 overflow-y-auto">
              {/* Buyer & Shipping Address Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span>👤</span>
                    <span>Customer Details</span>
                  </h4>
                  <p className="font-semibold text-slate-800">{selectedOrderDetails.user?.name || selectedOrderDetails.shippingAddress?.fullName}</p>
                  <p className="text-slate-500">{selectedOrderDetails.user?.email || "—"}</p>
                  <p className="text-slate-500 font-mono mt-0.5">{selectedOrderDetails.shippingAddress?.phone || selectedOrderDetails.user?.phone || "—"}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <span>📍</span>
                    <span>Shipping Address</span>
                  </h4>
                  <p className="text-slate-800">{selectedOrderDetails.shippingAddress?.street || "—"}</p>
                  <p className="text-slate-500">
                    {[selectedOrderDetails.shippingAddress?.city, selectedOrderDetails.shippingAddress?.state, selectedOrderDetails.shippingAddress?.zipCode].filter(Boolean).join(", ")}
                  </p>
                  <p className="text-slate-500">{selectedOrderDetails.shippingAddress?.country || "Bangladesh"}</p>
                </div>
              </div>

              {/* Line Items List */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2.5">
                  Ordered Items ({selectedOrderDetails.items?.length || 0})
                </h4>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {selectedOrderDetails.items?.map((item, idx) => {
                    const productImg = item.product?.images?.[0]?.url || "https://placehold.co/80x80?text=Product";
                    const itemTotal = (item.price || 0) * (item.quantity || 1);

                    return (
                      <div key={idx} className="p-3.5 flex items-center gap-3 hover:bg-slate-50/50">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          <img src={productImg} alt={item.product?.title || "Product"} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-slate-900 truncate">
                            {item.product?.title || "Product Item"}
                          </h5>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Shop: <span className="text-slate-600 font-medium">{item.shop?.name || "Marketplace Seller"}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-slate-900">
                            ৳{itemTotal.toLocaleString()}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            ৳{item.price?.toLocaleString()} × {item.quantity}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial & Payment Summary */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-medium">৳{(selectedOrderDetails.subtotal || selectedOrderDetails.totalPrice || 0).toLocaleString()}</span>
                </div>
                {Boolean(selectedOrderDetails.shippingCost) && (
                  <div className="flex justify-between text-slate-600">
                    <span>Shipping Fee:</span>
                    <span className="font-medium">৳{selectedOrderDetails.shippingCost}</span>
                  </div>
                )}
                {Boolean(selectedOrderDetails.discount) && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount:</span>
                    <span>-৳{selectedOrderDetails.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total GMV:</span>
                  <span className="text-[#4F46E5]">৳{(selectedOrderDetails.totalPrice || 0).toLocaleString()}</span>
                </div>
                <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Payment Method: <strong>{getPaymentMethodDisplay(selectedOrderDetails.paymentMethod)}</strong></span>
                  <span>Payment Status: <strong className="uppercase">{selectedOrderDetails.paymentStatus}</strong></span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const ord = selectedOrderDetails;
                  setSelectedOrderDetails(null);
                  handleOpenStatusModal(ord);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer text-center"
              >
                Override Status
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Lifecycle & Payment Status Modal */}
      {statusModalOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92dvh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="min-w-0">
                <h3 className="text-base font-bold text-slate-900 truncate">
                  Override Order Status
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Order #{statusModalOrder.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setStatusModalOrder(null)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
                {/* Lifecycle Status Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Lifecycle Status
                  </label>
                  <select
                    value={statusForm.orderStatus}
                    onChange={(e) => setStatusForm({ ...statusForm, orderStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                {/* Payment Status Select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={statusForm.paymentStatus}
                    onChange={(e) => setStatusForm({ ...statusForm, paymentStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                {/* Notes / Reason */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Admin Reason / Override Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={statusForm.notes}
                    onChange={(e) => setStatusForm({ ...statusForm, notes: e.target.value })}
                    placeholder="Reason for status change or delivery tracking details..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setStatusModalOrder(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus}
                  className="w-full sm:w-auto px-5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer text-center"
                >
                  {isUpdatingStatus ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
