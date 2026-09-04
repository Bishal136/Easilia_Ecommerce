import React from "react";
import { Link } from "react-router-dom";
import { useGetAdminDashboardQuery } from "../../features/admin/adminApi";
import { useAuth } from "../../hooks/useAuth";
import Spinner from "../../components/ui/Spinner";

export const AdminDashboard = () => {
  const { isAdmin } = useAuth();
  const { data: response, isLoading, isFetching, refetch } = useGetAdminDashboardQuery(undefined, {
    skip: !isAdmin,
  });

  const data = response?.data || response || {};
  const metrics = data.metrics || {
    totalGrossSales: 0,
    totalOrders: 0,
    totalSellers: 0,
    totalUsers: 0,
    pendingSellers: 0,
    platformRevenue: 0,
  };
  const recentOrders = data.recentOrders || [];

  const formatStatusBadge = (status = "pending") => {
    const s = status.toLowerCase();
    if (s === "delivered") {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
          Delivered
        </span>
      );
    }
    if (s === "cancelled") {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
          Cancelled
        </span>
      );
    }
    if (s === "processing" || s === "confirmed") {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
          Processing
        </span>
      );
    }
    if (s === "shipped") {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800">
          Shipped
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
        Pending
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center items-center">
        <Spinner size="lg" text="Loading Platform Analytics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Platform Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System overview, platform revenue, seller verification queue, and order fulfillment oversight.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors"
          >
            <svg
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-purple-600" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
          <Link
            to="/admin/sellers"
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <span>Verify Sellers ({metrics.pendingSellers || 0})</span>
          </Link>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Platform GMV */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Platform GMV
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm shadow-xs">
              💰
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ৳{Number(metrics.totalGrossSales || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Total value of all processed orders
            </div>
          </div>
        </div>

        {/* Card 2: Total Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm shadow-xs">
              📦
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {Number(metrics.totalOrders || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Lifetime customer orders placed
            </div>
          </div>
        </div>

        {/* Card 3: Registered Sellers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Registered Sellers
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-sm shadow-xs">
              🏪
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {Number(metrics.totalSellers || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              All active shops
            </div>
          </div>
        </div>

        {/* Card 4: Total Users */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total Users
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-sm shadow-xs">
              👥
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {Number(metrics.totalUsers || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Buyers, sellers & administrators
            </div>
          </div>
        </div>
      </div>

      {/* 3 Quick Navigation Shortcut Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* User Management */}
        <Link
          to="/admin/users"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-300 hover:shadow-sm transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
            👥
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
              User Management
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Manage buyer accounts, roles & block status
            </div>
          </div>
        </Link>

        {/* Categories & Hierarchy */}
        <Link
          to="/admin/categories"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-sm transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
            📁
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
              Categories & Hierarchy
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Add subcategories, sort orders & SEO metadata
            </div>
          </div>
        </Link>

        {/* Platform Settings */}
        <Link
          to="/admin/settings"
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all flex items-center gap-4 group"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
            ⚙️
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
              Platform Settings
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Commission rates, delivery fees & coupon codes
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Platform Orders Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">Recent Platform Orders</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Latest customer transactions across all stores
            </p>
          </div>
          <Link
            to="/admin/orders"
            className="text-xs font-semibold text-slate-600 hover:text-purple-600 border border-slate-200 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-white transition-all"
          >
            View All →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No customer orders placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="text-[11px] font-semibold text-slate-500 bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Items</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((o) => {
                  const orderCode =
                    o.orderNumber ||
                    `#${(o._id || "").slice(-8).toUpperCase()}`;
                  const customerName =
                    o.user?.name || o.shippingAddress?.fullName || "Bishal Biswas";
                  const customerEmail =
                    o.user?.email || "customer@example.com";
                  const itemCount =
                    o.items?.length ||
                    (o.orderItems ? o.orderItems.length : 1);
                  const dateStr = o.createdAt
                    ? new Date(o.createdAt).toLocaleDateString("en-US", {
                        month: "numeric",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "8/26/2026";

                  return (
                    <tr key={o._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Order ID */}
                      <td className="px-6 py-4">
                        <Link
                          to={`/admin/orders`}
                          className="text-[#4F46E5] font-mono font-semibold text-xs hover:underline"
                        >
                          {orderCode.startsWith("#") ? orderCode : `#${orderCode}`}
                        </Link>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {customerName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {customerEmail}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-6 py-4 text-slate-700">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                      </td>

                      {/* Total Amount */}
                      <td className="px-6 py-4 font-bold text-slate-900">
                        ৳{Number(o.totalPrice || 0).toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {formatStatusBadge(o.orderStatus || "Pending")}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-slate-500">
                        {dateStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
