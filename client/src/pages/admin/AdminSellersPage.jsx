import React, { useState } from "react";
import {
  useGetAdminSellersQuery,
  useUpdateSellerStatusMutation,
} from "../../features/admin/adminApi";
import Spinner from "../../components/ui/Spinner";

export const AdminSellersPage = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedShop, setSelectedShop] = useState(null);
  const [toast, setToast] = useState(null);

  // Moderation state
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [customCommission, setCustomCommission] = useState(10);

  // Fetch sellers with RTK Query
  const { data: response, isLoading, isFetching, refetch } = useGetAdminSellersQuery({
    page,
    limit: 15,
    status: activeTab,
    search: appliedSearch,
  });

  const [updateSellerStatus, { isLoading: isUpdating }] = useUpdateSellerStatusMutation();

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const sellers = response?.data?.sellers || response?.sellers || [];
  const totalCount = response?.data?.totalCount || response?.totalCount || sellers.length;
  const totalPages = response?.data?.totalPages || response?.totalPages || 1;
  const stats = response?.data?.stats || response?.stats || {
    total: totalCount,
    pending: 0,
    approved: 0,
    rejected: 0,
    suspended: 0,
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(searchInput.trim());
    setPage(1);
  };

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setPage(1);
  };

  const handleQuickStatusUpdate = async (shopId, statusPayload, successMessage) => {
    try {
      await updateSellerStatus({
        shopId,
        ...statusPayload,
      }).unwrap();
      showToast(successMessage || "Shop status updated successfully!", "success");
      if (selectedShop && selectedShop._id === shopId) {
        setSelectedShop((prev) => ({ ...prev, ...statusPayload }));
      }
    } catch (err) {
      showToast(err?.data?.message || err?.error || "Failed to update shop status", "error");
    }
  };

  const handleOpenDetails = (shop) => {
    setSelectedShop(shop);
    setCustomCommission(shop.commissionRate ?? 10);
    setRejectionReason(shop.rejectionReason || "");
    setShowRejectInput(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-xs font-semibold transition-all transform animate-bounce ${
            toast.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <span>{toast.type === "error" ? "⚠️" : "✅"}</span>
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Seller & KYC Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review store verification requests, manage merchant KYC, and monitor shop status.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
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
          <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200">
            Total Stores: <span className="text-purple-600 font-bold">{totalCount}</span>
          </span>
        </div>
      </div>

      {/* Controls Container: Filter Tabs + Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange("all")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-[#4F46E5] text-white shadow-sm shadow-indigo-600/30"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            All Sellers
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("pending")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "pending"
                ? "bg-[#4F46E5] text-white shadow-sm shadow-indigo-600/30"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>⏳</span>
            <span>Pending</span>
            {stats.pending > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
                {stats.pending}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("approved")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "approved"
                ? "bg-[#4F46E5] text-white shadow-sm shadow-indigo-600/30"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>✅</span>
            <span>Approved</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("rejected")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "rejected"
                ? "bg-[#4F46E5] text-white shadow-sm shadow-indigo-600/30"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span>❌</span>
            <span>Rejected</span>
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by shop name, seller name, or email..."
              className="w-full pl-4 pr-10 py-2.5 text-xs text-slate-800 placeholder-slate-400 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setAppliedSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Sellers Data Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <Spinner size="md" text="Loading Sellers & KYC Directory..." />
          </div>
        ) : sellers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-xl">
              🏬
            </div>
            <h3 className="text-sm font-bold text-slate-800">No stores found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {appliedSearch
                ? `No merchants match your search "${appliedSearch}". Try resetting filters.`
                : "No merchant applications currently match the active filter status."}
            </p>
            {appliedSearch && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setAppliedSearch("");
                }}
                className="mt-4 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-xs text-left text-slate-600">
              <thead className="text-[11px] font-semibold text-slate-500 bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5">Shop Details</th>
                  <th className="px-4 sm:px-6 py-3.5">Owner Account</th>
                  <th className="px-4 sm:px-6 py-3.5">Location (2dsphere)</th>
                  <th className="px-4 sm:px-6 py-3.5">Tax IDs</th>
                  <th className="px-4 sm:px-6 py-3.5">KYC Status</th>
                  <th className="px-4 sm:px-6 py-3.5">Suspension</th>
                  <th className="px-4 sm:px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sellers.map((s) => {
                  const lng = s.location?.coordinates?.[0] ?? 0;
                  const lat = s.location?.coordinates?.[1] ?? 0;
                  const gst = s.taxIds?.gst || s.taxId || "N/A";
                  const pan = s.taxIds?.pan || "N/A";

                  const isPending = s.kycStatus === "pending" || s.status === "pending";
                  const isApproved = s.kycStatus === "approved" || s.status === "active";
                  const isRejected = s.kycStatus === "rejected" || s.status === "rejected";
                  const isSuspended = s.isSuspended || s.status === "suspended";

                  return (
                    <tr key={s._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* 1. Shop Details */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {s.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {s.address?.city || "Dhaka"},{" "}
                          {s.address?.zipCode || "000000"}
                        </div>
                      </td>

                      {/* 2. Owner Account */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {s.owner?.name || "Test seller 1"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {s.owner?.email || s.email || "testseller1@gmail.com"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {s.owner?.phone || s.phone || "+088 123456788"}
                        </div>
                      </td>

                      {/* 3. Location (2dsphere) */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-[11px] text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded inline-block">
                          [{lng.toFixed(3)}, {lat.toFixed(3)}]
                        </span>
                      </td>

                      {/* 4. Tax IDs */}
                      <td className="px-6 py-4 space-y-0.5 font-mono text-[11px]">
                        <div className="text-slate-700">
                          <span className="font-sans font-medium text-slate-500">GST:</span> {gst}
                        </div>
                        <div className="text-slate-700">
                          <span className="font-sans font-medium text-slate-500">PAN:</span> {pan}
                        </div>
                      </td>

                      {/* 5. KYC Status */}
                      <td className="px-6 py-4">
                        {isApproved && (
                          <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-700">
                            APPROVED
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-100 text-amber-700">
                            PENDING
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-100 text-rose-700">
                            REJECTED
                          </span>
                        )}
                      </td>

                      {/* 6. Suspension */}
                      <td className="px-6 py-4">
                        {isSuspended ? (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-600">
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-600">
                            Active
                          </span>
                        )}
                      </td>

                      {/* 7. Actions */}
                      <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(s)}
                          className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-md text-xs font-medium transition-colors"
                        >
                          Details
                        </button>

                        {isSuspended ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickStatusUpdate(
                                s._id,
                                { isSuspended: false, status: "active" },
                                `Activated ${s.name}`
                              )
                            }
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                          >
                            Activate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickStatusUpdate(
                                s._id,
                                { isSuspended: true, status: "suspended" },
                                `Suspended ${s.name}`
                              )
                            }
                            className="text-xs text-slate-600 hover:text-rose-600 font-medium transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page <span className="font-semibold text-slate-700">{page}</span> of{" "}
              <span className="font-semibold text-slate-700">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KYC & Store Details Modal */}
      {selectedShop && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92dvh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                  {selectedShop.name ? selectedShop.name[0].toUpperCase() : "S"}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">{selectedShop.name}</h3>
                  <p className="text-xs text-slate-500">Merchant Store & KYC Verification Profile</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedShop(null)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto text-xs text-slate-700">
              {/* Section 1: Store & Owner Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-indigo-700 tracking-wider">
                    Store Information
                  </span>
                  <div className="space-y-1 pt-1">
                    <p><strong className="text-slate-900">Name:</strong> {selectedShop.name}</p>
                    <p><strong className="text-slate-900">Slug:</strong> /{selectedShop.slug || "n-a"}</p>
                    <p><strong className="text-slate-900">Phone:</strong> {selectedShop.phone || "N/A"}</p>
                    <p><strong className="text-slate-900">Email:</strong> {selectedShop.email || "N/A"}</p>
                    <p>
                      <strong className="text-slate-900">Address:</strong>{" "}
                      {selectedShop.address?.street
                        ? `${selectedShop.address.street}, `
                        : ""}
                      {selectedShop.address?.city || "Unknown"},{" "}
                      {selectedShop.address?.state || ""}{" "}
                      {selectedShop.address?.zipCode || ""},{" "}
                      {selectedShop.address?.country || "Bangladesh"}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-indigo-700 tracking-wider">
                    Owner Account
                  </span>
                  <div className="space-y-1 pt-1">
                    <p><strong className="text-slate-900">Owner Name:</strong> {selectedShop.owner?.name || "N/A"}</p>
                    <p><strong className="text-slate-900">Email:</strong> {selectedShop.owner?.email || "N/A"}</p>
                    <p><strong className="text-slate-900">Phone:</strong> {selectedShop.owner?.phone || "N/A"}</p>
                    <p>
                      <strong className="text-slate-900">Role:</strong>{" "}
                      <span className="uppercase font-semibold text-indigo-700">
                        {selectedShop.owner?.role || "User"}
                      </span>
                    </p>
                    <p>
                      <strong className="text-slate-900">Email Verified:</strong>{" "}
                      {selectedShop.owner?.isVerified ? "✅ Verified" : "⚠️ Unverified"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: 2dsphere Geolocation & Tax Documentation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-indigo-700 tracking-wider">
                      2dsphere Geolocation
                    </span>
                    {selectedShop.location?.coordinates && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedShop.location.coordinates[1]},${selectedShop.location.coordinates[0]}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-indigo-600 hover:underline font-semibold"
                      >
                        View on Map ↗
                      </a>
                    )}
                  </div>
                  <div className="pt-1 font-mono text-xs text-slate-800">
                    <p>Longitude (Lng): {selectedShop.location?.coordinates?.[0] ?? "0.000"}</p>
                    <p>Latitude (Lat): {selectedShop.location?.coordinates?.[1] ?? "0.000"}</p>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Used by MongoDB $geoNear indexing for nearest merchant storefront discovery.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold uppercase text-indigo-700 tracking-wider">
                    Official Tax & KYC IDs
                  </span>
                  <div className="pt-1 space-y-1">
                    <p><strong className="text-slate-900">GST / Tax ID:</strong> {selectedShop.taxIds?.gst || selectedShop.taxId || "N/A"}</p>
                    <p><strong className="text-slate-900">PAN ID:</strong> {selectedShop.taxIds?.pan || "N/A"}</p>
                    <p><strong className="text-slate-900">Trade License:</strong> {selectedShop.taxIds?.tradeLicense || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Bank & Payout Configuration */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-[11px] font-bold uppercase text-indigo-700 tracking-wider">
                  Bank & Payout Method
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <p>
                    <strong className="text-slate-900">Mobile Banking:</strong>{" "}
                    {selectedShop.bankDetails?.mobileBankingType
                      ? selectedShop.bankDetails.mobileBankingType.toUpperCase()
                      : "bKash / None"}
                  </p>
                  <p>
                    <strong className="text-slate-900">Account Number:</strong>{" "}
                    {selectedShop.bankDetails?.mobileBankingNumber || selectedShop.bankDetails?.accountNumber || "N/A"}
                  </p>
                  {selectedShop.bankDetails?.bankName && (
                    <>
                      <p><strong className="text-slate-900">Bank Name:</strong> {selectedShop.bankDetails.bankName}</p>
                      <p><strong className="text-slate-900">Branch:</strong> {selectedShop.bankDetails.branch || "N/A"}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Section 4: Commission & Moderation Controls */}
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <span className="text-[11px] font-bold uppercase text-indigo-800 tracking-wider">
                  Platform Commission & Actions
                </span>

                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-700">Platform Commission (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customCommission}
                    onChange={(e) => setCustomCommission(e.target.value)}
                    className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    disabled={isUpdating}
                    onClick={() =>
                      handleQuickStatusUpdate(
                        selectedShop._id,
                        { commissionRate: Number(customCommission) },
                        "Commission rate updated!"
                      )
                    }
                    className="px-3 py-1 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded text-xs font-semibold"
                  >
                    Save Rate
                  </button>
                </div>

                {/* Rejection input toggle */}
                {showRejectInput && (
                  <div className="space-y-2 pt-2 border-t border-indigo-200">
                    <label className="block text-xs font-semibold text-rose-700">
                      Reason for Rejection / Suspension:
                    </label>
                    <textarea
                      rows={2}
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Invalid trade license or blurry identity document..."
                      className="w-full p-2 bg-white border border-rose-200 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setShowRejectInput(false)}
                        className="px-3 py-1 rounded text-xs text-slate-600 hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => {
                          handleQuickStatusUpdate(
                            selectedShop._id,
                            {
                              status: "rejected",
                              kycStatus: "rejected",
                              rejectionReason,
                            },
                            "Seller KYC application rejected."
                          );
                          setSelectedShop(null);
                        }}
                        className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
                      >
                        Confirm Rejection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-500 font-medium">Status:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    selectedShop.kycStatus === "approved" || selectedShop.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : selectedShop.kycStatus === "rejected" || selectedShop.status === "rejected"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {selectedShop.kycStatus || selectedShop.status}
                </span>
                {selectedShop.isSuspended && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                    Suspended
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-end">
                {/* Approve Button */}
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => {
                    handleQuickStatusUpdate(
                      selectedShop._id,
                      {
                        status: "active",
                        kycStatus: "approved",
                        isSuspended: false,
                        commissionRate: Number(customCommission),
                      },
                      `Approved KYC & Activated ${selectedShop.name}`
                    );
                    setSelectedShop(null);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>✓</span>
                  <span>Approve KYC</span>
                </button>

                {/* Reject Button */}
                {!showRejectInput && (
                  <button
                    type="button"
                    onClick={() => setShowRejectInput(true)}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    Reject KYC
                  </button>
                )}

                {/* Suspend / Unsuspend */}
                {selectedShop.isSuspended ? (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => {
                      handleQuickStatusUpdate(
                        selectedShop._id,
                        { isSuspended: false, status: "active" },
                        `Reactivated store ${selectedShop.name}`
                      );
                      setSelectedShop(null);
                    }}
                    className="px-3.5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                  >
                    Reactivate
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => {
                      handleQuickStatusUpdate(
                        selectedShop._id,
                        { isSuspended: true, status: "suspended" },
                        `Suspended store ${selectedShop.name}`
                      );
                      setSelectedShop(null);
                    }}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    Suspend
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedShop(null)}
                  className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
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

export default AdminSellersPage;
