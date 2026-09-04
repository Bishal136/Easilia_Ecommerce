import React, { useState } from "react";
import {
  useGetSellerOrdersQuery,
  useUpdateSellerOrderItemStatusMutation,
} from "../../features/orders/orderApi";
import Spinner from "../../components/ui/Spinner";

export const SellerOrdersPage = () => {
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Fetch live seller orders from backend
  const { data: ordersRes, isLoading } = useGetSellerOrdersQuery(
    selectedStatus !== "all" ? { status: selectedStatus, limit: 50 } : { limit: 50 }
  );
  const orders = ordersRes?.data?.orders || ordersRes?.orders || [];

  const [updateStatus, { isLoading: isUpdating }] = useUpdateSellerOrderItemStatusMutation();

  // Compute live stage counts
  const pendingCount = orders.filter((o) =>
    o.sellerItems?.some((i) => i.itemStatus === "pending")
  ).length;
  const processingCount = orders.filter((o) =>
    o.sellerItems?.some((i) => i.itemStatus === "processing")
  ).length;
  const shippedCount = orders.filter((o) =>
    o.sellerItems?.some((i) => i.itemStatus === "shipped")
  ).length;
  const deliveredCount = orders.filter((o) =>
    o.sellerItems?.some((i) => i.itemStatus === "delivered")
  ).length;
  const cancelledCount = orders.filter((o) =>
    o.sellerItems?.some((i) => i.itemStatus === "cancelled")
  ).length;

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("Out of Stock");

  const pipelineStages = [
    { title: "Pending", count: pendingCount, key: "pending", color: "border-amber-500/40 text-amber-600 dark:text-amber-300" },
    { title: "Processing", count: processingCount, key: "processing", color: "border-blue-500/40 text-blue-600 dark:text-blue-300" },
    { title: "Shipped", count: shippedCount, key: "shipped", color: "border-purple-500/40 text-purple-600 dark:text-purple-300" },
    { title: "Delivered", count: deliveredCount, key: "delivered", color: "border-emerald-500/40 text-emerald-600 dark:text-emerald-300" },
    { title: "Cancelled", count: cancelledCount, key: "cancelled", color: "border-rose-500/40 text-rose-600 dark:text-rose-300" },
  ];

  const [copiedAddressId, setCopiedAddressId] = useState(null);

  const handleCopyShippingInfo = (order) => {
    const name = order.shippingAddress?.fullName || order.user?.name || "Customer";
    const phone = order.shippingAddress?.phone || order.user?.phone || "N/A";
    const addr = `${order.shippingAddress?.street || ""}, ${order.shippingAddress?.city || ""}, ${order.shippingAddress?.state || ""} ${order.shippingAddress?.zipCode || ""}, ${order.shippingAddress?.country || "Bangladesh"}`.trim();
    const itemsSummary = (order.sellerItems || order.items || [])
      .map((i) => `${i.product?.title || "Item"} x${i.quantity}${i.variant?.name ? ` (${i.variant.name})` : ""}`)
      .join(", ");
    const amount = `৳${(order.sellerSubtotal || 0).toLocaleString()}`;
    const payment = order.paymentMethod === "cod" ? `Cash on Delivery (Collect: ${amount})` : "Prepaid Online";

    const textToCopy = `📦 SHIPMENT / COURIER LABEL\nRecipient: ${name}\nPhone: ${phone}\nAddress: ${addr}\nItems: ${itemsSummary}\nPayment: ${payment}\nOrder: ${order.orderNumber || order._id}`;

    navigator.clipboard.writeText(textToCopy);
    setCopiedAddressId(order._id);
    setTimeout(() => setCopiedAddressId(null), 2500);
  };

  const handleStageUpdate = async (orderId, itemId, newStatus) => {
    try {
      await updateStatus({ orderId, itemId, status: newStatus }).unwrap();
      if (cancelTarget) setCancelTarget(null);
      if (selectedOrder) setSelectedOrder(null);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const buyerName = order.user?.name?.toLowerCase() || "";
    const buyerPhone = order.shippingAddress?.phone || order.user?.phone || "";
    const buyerAddr = `${order.shippingAddress?.street || ""} ${order.shippingAddress?.city || ""}`.toLowerCase();
    const orderNum = order.orderNumber?.toLowerCase() || order._id?.toLowerCase() || "";
    const q = search.toLowerCase();
    return (
      buyerName.includes(q) ||
      buyerPhone.includes(q) ||
      buyerAddr.includes(q) ||
      orderNum.includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Page Header */}
      <div className="bg-white dark:bg-[#131B2E] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
          Order Fulfillment Pipeline
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage live buyer purchases, package preparation, dispatch, delivery confirmation, customer shipping addresses, and order cancellations
        </p>
      </div>

      {/* 5 Pipeline Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {pipelineStages.map((stage) => (
          <button
            key={stage.key}
            type="button"
            onClick={() => setSelectedStatus(stage.key)}
            className={`p-4 rounded-2xl bg-white dark:bg-[#131B2E] border text-left transition-all cursor-pointer shadow-xs ${
              selectedStatus === stage.key
                ? "ring-2 ring-fuchsia-500 border-fuchsia-500"
                : stage.color
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wider">{stage.title}</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
              {stage.count}
            </p>
          </button>
        ))}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white dark:bg-[#131B2E] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search by Order ID, buyer name, phone, or delivery city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
          <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all", label: `All (${orders.length})` },
            { id: "pending", label: `Pending (${pendingCount})` },
            { id: "processing", label: `Processing (${processingCount})` },
            { id: "shipped", label: `Shipped (${shippedCount})` },
            { id: "delivered", label: `Delivered (${deliveredCount})` },
            { id: "cancelled", label: `Cancelled (${cancelledCount})` },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setSelectedStatus(st.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer ${
                selectedStatus === st.id
                  ? "bg-fuchsia-600 text-white shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 shadow-xs">
        {isLoading ? (
          <div className="py-16 flex justify-center">
            <Spinner size="lg" text="Loading Order Pipeline..." />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 space-y-2">
            <span className="text-4xl">🚚</span>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No orders found</h3>
            <p className="text-xs text-slate-500">
              No merchant order items match the selected filter status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] uppercase bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Order #</th>
                  <th className="px-4 py-3 min-w-[200px]">Buyer & Delivery Details</th>
                  <th className="px-4 py-3">Your Store Items</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Current Stage</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Update Stage / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((order) => {
                  const sellerItems = order.sellerItems || order.items || [];
                  const firstItem = sellerItems[0];
                  const currentStatus = firstItem?.itemStatus || order.orderStatus || "pending";
                  const buyerName = order.shippingAddress?.fullName || order.user?.name || "Verified Customer";
                  const buyerPhone = order.shippingAddress?.phone || order.user?.phone || "N/A";
                  const buyerAddress = order.shippingAddress?.street
                    ? `${order.shippingAddress.street}, ${order.shippingAddress.city || ""}`
                    : order.user?.email || "Dhaka, Bangladesh";

                  return (
                    <tr key={order._id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3.5 font-mono align-top">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="font-bold text-fuchsia-600 dark:text-fuchsia-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>{order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`}</span>
                        </button>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Recent"}
                        </p>
                      </td>

                      {/* Buyer Details Column */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className="font-bold text-slate-900 dark:text-slate-100 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 text-left transition-colors cursor-pointer"
                          >
                            {buyerName}
                          </button>
                          <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                            <span>📞</span>
                            <span>{buyerPhone}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2" title={buyerAddress}>
                            📍 {buyerAddress}
                          </p>
                        </div>
                      </td>

                      {/* Store Items Column */}
                      <td className="px-4 py-3.5 align-top">
                        <div className="space-y-1">
                          {sellerItems.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <span className="font-semibold truncate max-w-[160px]">
                                {item.product?.title || "Item"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                x{item.quantity}
                              </span>
                              {item.variant?.name && (
                                <span className="text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                  {item.variant.name}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-white align-top">
                        ৳{(order.sellerSubtotal || 0).toLocaleString()}
                      </td>

                      {/* Payment */}
                      <td className="px-4 py-3.5 align-top">
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {order.paymentMethod === "cod" ? "Cash on Delivery" : "Paid (PortPos)"}
                        </span>
                      </td>

                      {/* Current Stage */}
                      <td className="px-4 py-3.5 align-top">
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-bold capitalize ${
                            currentStatus === "delivered"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                              : currentStatus === "shipped"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300"
                              : currentStatus === "processing"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
                              : currentStatus === "cancelled"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
                          }`}
                        >
                          {currentStatus}
                        </span>
                      </td>

                      {/* Update Stage / Action */}
                      <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap align-top">
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                          title="View Full Customer Address & Order Details"
                        >
                          👁️ View Details
                        </button>

                        {currentStatus === "pending" && firstItem?._id && (
                          <>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStageUpdate(order._id, firstItem._id, "processing")}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                              Mark Processing →
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                setCancelTarget({
                                  orderId: order._id,
                                  itemId: firstItem._id,
                                  orderNumber: order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`,
                                  productTitle: firstItem.product?.title || "Item",
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-200 dark:border-rose-800 disabled:opacity-50 cursor-pointer"
                              title="Cancel this order item"
                            >
                              ✕ Cancel
                            </button>
                          </>
                        )}
                        {currentStatus === "processing" && firstItem?._id && (
                          <>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => handleStageUpdate(order._id, firstItem._id, "shipped")}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                              Mark Shipped →
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() =>
                                setCancelTarget({
                                  orderId: order._id,
                                  itemId: firstItem._id,
                                  orderNumber: order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`,
                                  productTitle: firstItem.product?.title || "Item",
                                })
                              }
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-200 dark:border-rose-800 disabled:opacity-50 cursor-pointer"
                              title="Cancel this order item"
                            >
                              ✕ Cancel
                            </button>
                          </>
                        )}
                        {currentStatus === "shipped" && firstItem?._id && (
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleStageUpdate(order._id, firstItem._id, "delivered")}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
                          >
                            Confirm Delivered ✓
                          </button>
                        )}
                        {currentStatus === "delivered" && (
                          <span className="text-emerald-500 font-bold text-xs">Delivered ✓</span>
                        )}
                        {currentStatus === "cancelled" && (
                          <span className="text-rose-500 font-bold text-xs">Cancelled</span>
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

      {/* Cancellation Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#131B2E] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 font-sans animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 text-lg">
                ⚠️
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Cancel Order Item
                </h3>
                <p className="text-xs text-slate-400">
                  {cancelTarget.orderNumber} • {cancelTarget.productTitle}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200">
                <p className="font-semibold">⚠️ Inventory Automatic Replenish</p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  Cancelling this order will automatically restore the product & variant inventory stock back into your store catalog.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  Cancellation Reason:
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="Out of Stock">Out of Stock</option>
                  <option value="Customer Requested Cancellation">Customer Requested Cancellation</option>
                  <option value="Delivery Location Unreachable">Delivery Location Unreachable</option>
                  <option value="Pricing or Catalog Error">Pricing or Catalog Error</option>
                  <option value="Other Merchant Reason">Other Merchant Reason</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleStageUpdate(cancelTarget.orderId, cancelTarget.itemId, "cancelled")}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Buyer Address & Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#131B2E] w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col font-sans animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300">
                    Order Manifest
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {selectedOrder.orderNumber || `#${selectedOrder._id}`}
                  </span>
                </div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                  Customer Shipping & Order Info
                </h2>
                <p className="text-xs text-slate-500">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* 1. Buyer & Shipping Information Card */}
              <div className="p-5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1.5">
                    <span>📍</span>
                    <span>Recipient & Delivery Address</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => handleCopyShippingInfo(selectedOrder)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{copiedAddressId === selectedOrder._id ? "✓ Copied!" : "📋 Copy For Courier"}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 text-slate-700 dark:text-slate-300">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100/80 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Recipient Name</span>
                    <p className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
                      {selectedOrder.shippingAddress?.fullName || selectedOrder.user?.name || "Verified Customer"}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100/80 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact Phone Number</span>
                    <a
                      href={`tel:${selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone}`}
                      className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5 block hover:underline"
                    >
                      📞 {selectedOrder.shippingAddress?.phone || selectedOrder.user?.phone || "N/A"}
                    </a>
                  </div>

                  <div className="sm:col-span-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100/80 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Delivery Address</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 mt-1 leading-relaxed">
                      {selectedOrder.shippingAddress?.street || "Street address not provided"}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-slate-500">
                      {selectedOrder.shippingAddress?.city && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          City: {selectedOrder.shippingAddress.city}
                        </span>
                      )}
                      {selectedOrder.shippingAddress?.state && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          State / District: {selectedOrder.shippingAddress.state}
                        </span>
                      )}
                      {selectedOrder.shippingAddress?.zipCode && (
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                          Postal Code: {selectedOrder.shippingAddress.zipCode}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        Country: {selectedOrder.shippingAddress?.country || "Bangladesh"}
                      </span>
                    </div>
                  </div>

                  {selectedOrder.notes && (
                    <div className="sm:col-span-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
                      <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 block">
                        Customer Delivery Note
                      </span>
                      <p className="mt-0.5 italic">"{selectedOrder.notes}"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Order Items Breakdown */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Your Store Items ({selectedOrder.sellerItems?.length || 0})
                </h3>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(selectedOrder.sellerItems || selectedOrder.items || []).map((item, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {item.product?.title || "Item"}
                        </p>
                        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                          <span>Qty: {item.quantity}</span>
                          <span>•</span>
                          <span>Unit: ৳{item.price?.toLocaleString()}</span>
                          {item.variant?.name && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                              Variant: {item.variant.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                        ৳{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Payment & Grand Total Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Method</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                    {selectedOrder.paymentMethod === "cod" ? "💵 Cash on Delivery (COD)" : "💳 Paid Online (PortPos)"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Store Subtotal</span>
                  <p className="font-mono font-black text-lg text-slate-900 dark:text-white">
                    ৳{(selectedOrder.sellerSubtotal || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-5 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              {(() => {
                const sellerItems = selectedOrder.sellerItems || selectedOrder.items || [];
                const firstItem = sellerItems[0];
                const currentStatus = firstItem?.itemStatus || selectedOrder.orderStatus || "pending";
                if (["pending", "processing"].includes(currentStatus) && firstItem?._id) {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        const target = {
                          orderId: selectedOrder._id,
                          itemId: firstItem._id,
                          orderNumber: selectedOrder.orderNumber || `#${selectedOrder._id.slice(-6).toUpperCase()}`,
                          productTitle: firstItem.product?.title || "Item",
                        };
                        setSelectedOrder(null);
                        setCancelTarget(target);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                    >
                      ✕ Cancel Order
                    </button>
                  );
                }
                return <div />;
              })()}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOrdersPage;


