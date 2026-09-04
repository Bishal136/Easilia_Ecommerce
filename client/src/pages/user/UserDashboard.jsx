import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useGetUnreadCountQuery } from "../../features/chat/chatApi";

export const UserDashboard = () => {
  const { user } = useAuth();
  const { data: unreadData } = useGetUnreadCountQuery();
  const unreadCount = unreadData?.data?.unreadCount || unreadData?.unreadCount || 0;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-950 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">
            Welcome back, {user?.name || "Customer"}!
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your active orders, seller inquiries, wishlist, and shipping addresses
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
              Active Orders
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">2</p>
            <Link
              to="/user/orders"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-2 inline-block font-semibold"
            >
              View orders →
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
            <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold">Saved Items</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">8</p>
            <Link
              to="/user/wishlist"
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline mt-2 inline-block font-semibold"
            >
              View wishlist →
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
            <div className="flex items-center justify-between">
              <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold">
                Store Inquiries
              </p>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-teal-600 text-white text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {unreadCount > 0 ? `${unreadCount} Unread` : "Live"}
            </p>
            <Link
              to="/user/messages"
              className="text-xs text-teal-700 dark:text-teal-400 hover:underline mt-2 inline-block font-semibold"
            >
              Open Messenger →
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              Account Status
            </p>
            <p className="text-base font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Verified Buyer
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
