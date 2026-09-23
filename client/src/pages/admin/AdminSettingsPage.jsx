import React, { useState, useEffect } from "react";
import {
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
  useGetAdminCouponsQuery,
  useCreateAdminCouponMutation,
  useUpdateAdminCouponMutation,
  useToggleAdminCouponStatusMutation,
  useDeleteAdminCouponMutation,
} from "../../features/admin/adminApi";
import Spinner from "../../components/ui/Spinner";

export const AdminSettingsPage = () => {
  // Form State
  const [defaultDeliveryCharge, setDefaultDeliveryCharge] = useState(0);
  const [commissionRate, setCommissionRate] = useState(10);
  const [toast, setToast] = useState(null);

  // Modal State for Adding / Editing Coupon
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: "",
    maxUses: "",
    validTo: "",
    isActive: true,
  });

  // RTK Query API Hooks
  const { data: settingsData, isLoading: isLoadingSettings, refetch: refetchSettings } =
    useGetPlatformSettingsQuery();
  const [updateSettings, { isLoading: isSavingSettings }] = useUpdatePlatformSettingsMutation();

  const { data: couponsData, isLoading: isLoadingCoupons, refetch: refetchCoupons } =
    useGetAdminCouponsQuery();
  const [createCoupon, { isLoading: isCreatingCoupon }] = useCreateAdminCouponMutation();
  const [updateCoupon, { isLoading: isUpdatingCoupon }] = useUpdateAdminCouponMutation();
  const [toggleCouponStatus, { isLoading: isTogglingCoupon }] = useToggleAdminCouponStatusMutation();
  const [deleteCoupon, { isLoading: isDeletingCoupon }] = useDeleteAdminCouponMutation();

  // Populate settings from backend
  useEffect(() => {
    const s = settingsData?.data?.settings || settingsData?.settings || settingsData?.data;
    if (s) {
      setDefaultDeliveryCharge(s.defaultDeliveryCharge ?? s.shippingChargeDefault?.insideCity ?? 0);
      setCommissionRate(s.defaultCommissionRate ?? 10);
    }
  }, [settingsData]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const rawCoupons = couponsData?.data?.coupons || couponsData?.coupons || [];

  // Dynamic Payout Calculation Preview
  const orderBase = 1000;
  const rateNum = Number(commissionRate) || 0;
  const platformRetains = Math.round((orderBase * rateNum) / 100);
  const sellerReceives = Math.max(0, orderBase - platformRetains);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await updateSettings({
        defaultDeliveryCharge: Number(defaultDeliveryCharge) || 0,
        defaultCommissionRate: Number(commissionRate) || 0,
      }).unwrap();
      showToast("Platform settings saved successfully!", "success");
    } catch (err) {
      const errorMsg = err?.data?.errorDetails?.[0]?.message || err?.data?.message || err?.error || "Failed to save settings";
      showToast(errorMsg, "error");
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCouponId(null);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const dateStr = futureDate.toISOString().split("T")[0];

    setCouponForm({
      code: "",
      discountType: "percentage",
      discountValue: 10,
      minOrderAmount: 0,
      maxDiscountAmount: "",
      maxUses: "",
      validTo: dateStr,
      isActive: true,
    });
    setIsCouponModalOpen(true);
  };

  const handleOpenEditModal = (coupon) => {
    setEditingCouponId(coupon._id);
    let dateStr = "";
    if (coupon.validTo) {
      dateStr = new Date(coupon.validTo).toISOString().split("T")[0];
    }

    setCouponForm({
      code: coupon.code,
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue || 0,
      minOrderAmount: coupon.minOrderAmount || 0,
      maxDiscountAmount: coupon.maxDiscountAmount || "",
      maxUses: coupon.maxUses || "",
      validTo: dateStr,
      isActive: coupon.isActive !== false,
    });
    setIsCouponModalOpen(true);
  };

  const handleCouponFormSubmit = async (e) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      showToast("Please enter a coupon code", "error");
      return;
    }

    try {
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        discountType: couponForm.discountType,
        discountValue: Number(couponForm.discountValue) || 0,
        minOrderAmount: Number(couponForm.minOrderAmount) || 0,
        maxDiscountAmount: couponForm.maxDiscountAmount ? Number(couponForm.maxDiscountAmount) : null,
        maxUses: couponForm.maxUses ? Number(couponForm.maxUses) : null,
        validTo: couponForm.validTo ? new Date(`${couponForm.validTo}T23:59:59.999Z`) : undefined,
        isActive: Boolean(couponForm.isActive),
      };

      if (editingCouponId) {
        await updateCoupon({ id: editingCouponId, ...payload }).unwrap();
        showToast(`Coupon "${payload.code}" updated successfully!`, "success");
      } else {
        await createCoupon(payload).unwrap();
        showToast(`Coupon "${payload.code}" created successfully!`, "success");
      }

      setIsCouponModalOpen(false);
      setEditingCouponId(null);
    } catch (err) {
      const errorMsg =
        err?.data?.errorDetails?.[0]?.message ||
        err?.data?.message ||
        err?.error ||
        "Failed to save coupon";
      showToast(errorMsg, "error");
    }
  };

  const handleToggleStatus = async (coupon) => {
    try {
      const res = await toggleCouponStatus(coupon._id).unwrap();
      const updated = res?.data?.coupon || res?.coupon;
      const statusText = updated?.isActive ? "activated" : "deactivated";
      showToast(`Coupon "${coupon.code}" ${statusText}!`, "success");
    } catch (err) {
      const errorMsg = err?.data?.message || err?.error || "Failed to update coupon status";
      showToast(errorMsg, "error");
    }
  };

  const handleDeleteCoupon = async (couponId, code) => {
    if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
    try {
      await deleteCoupon(couponId).unwrap();
      showToast(`Coupon "${code}" deleted successfully!`, "success");
    } catch (err) {
      const errorMsg = err?.data?.message || err?.error || "Failed to delete coupon";
      showToast(errorMsg, "error");
    }
  };

  if (isLoadingSettings && !settingsData) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-16 flex justify-center items-center max-w-5xl mx-auto">
        <Spinner size="md" text="Loading Platform Settings..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-xs font-semibold transition-all ${
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Platform Settings & Commission
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure global fee rules, delivery parameters, and manage platform discount coupons.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Card 1: Global Financial & Delivery Parameters */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <span>💳</span>
            <span>Global Financial & Delivery Parameters</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-start">
            {/* Default Delivery Charge */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-0.5">
                Default Delivery Charge (৳)
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Flat shipping fee applied to customer checkouts unless free shipping conditions are met.
              </p>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                  ৳
                </span>
                <input
                  type="number"
                  min="0"
                  value={defaultDeliveryCharge}
                  onChange={(e) => setDefaultDeliveryCharge(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Platform Commission Rate */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-0.5">
                Platform Commission Rate (%)
              </label>
              <p className="text-[11px] text-slate-400 mb-2">
                Percentage deducted from seller order payouts as platform transaction fee.
              </p>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full pl-3 pr-8 py-2 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic Payout Preview Callout Box */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-start sm:items-center gap-2.5 text-xs text-blue-900">
            <span className="shrink-0 mt-0.5 sm:mt-0">💡</span>
            <span>
              <strong>Payout Preview:</strong> On an order of ৳{orderBase.toLocaleString()}, Platform retains <strong>৳{platformRetains} ({rateNum}%)</strong>, and the seller receives <strong>৳{sellerReceives.toLocaleString()}</strong>.
            </span>
          </div>
        </div>

        {/* Card 2: Platform Coupon Codes */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span>🎟️</span>
                <span>Platform Coupon Codes</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Active discounts applied by customers during checkout
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="w-full sm:w-auto px-3.5 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>+</span>
              <span>Add Coupon</span>
            </button>
          </div>

          {/* Coupons List / Empty State */}
          {isLoadingCoupons ? (
            <div className="py-8 flex justify-center items-center">
              <Spinner size="sm" text="Loading coupons..." />
            </div>
          ) : rawCoupons.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-10 text-center text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-600">No coupon codes configured yet.</p>
              <p>Click "+ Add Coupon" above to create discounts for customer checkouts.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {rawCoupons.map((coupon) => {
                const isExpired = coupon.validTo && new Date() > new Date(coupon.validTo);
                const discountText =
                  coupon.discountType === "percentage"
                    ? `${coupon.discountValue}% Off`
                    : coupon.discountType === "free_shipping"
                    ? "Free Shipping (৳60 Off)"
                    : `৳${coupon.discountValue} Off`;

                return (
                  <div
                    key={coupon._id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-md font-mono font-bold text-xs tracking-wider shrink-0">
                        {coupon.code}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span>{discountText}</span>
                          {coupon.minOrderAmount > 0 && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              (Min Order: ৳{coupon.minOrderAmount})
                            </span>
                          )}
                          {coupon.maxDiscountAmount > 0 && (
                            <span className="text-[10px] text-purple-600 font-normal">
                              (Cap: ৳{coupon.maxDiscountAmount})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span>
                            {coupon.validTo
                              ? `Valid until ${new Date(coupon.validTo).toLocaleDateString()}`
                              : "No expiration"}
                          </span>
                          <span className="hidden sm:inline">•</span>
                          <span>
                            {coupon.maxUses
                              ? `${coupon.usedCount || 0}/${coupon.maxUses} uses`
                              : `${coupon.usedCount || 0} uses (Unlimited)`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                      {/* Active / Inactive Status Badge & Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(coupon)}
                        disabled={isTogglingCoupon}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                          isExpired
                            ? "bg-rose-50 text-rose-600 border-rose-200 cursor-not-allowed"
                            : coupon.isActive !== false
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                        }`}
                        title="Click to toggle active/inactive"
                      >
                        {isExpired
                          ? "Expired"
                          : coupon.isActive !== false
                          ? "● Active"
                          : "○ Inactive"}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(coupon)}
                        className="px-2.5 py-1 text-slate-600 hover:text-purple-600 border border-slate-200 rounded-lg hover:bg-purple-50 text-xs font-semibold transition-colors cursor-pointer"
                        title="Edit coupon"
                      >
                        Edit
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(coupon._id, coupon.code)}
                        disabled={isDeletingCoupon}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete coupon"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Save Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSavingSettings}
            className="w-full sm:w-auto px-7 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSavingSettings ? "Saving Settings..." : "Save Platform Settings"}
          </button>
        </div>
      </form>

      {/* Add / Edit Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {editingCouponId ? "Edit Platform Coupon" : "Create Platform Coupon"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingCouponId
                    ? "Update discount parameters for this coupon"
                    : "Add discount coupon code for customer checkouts"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCouponModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCouponFormSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
                {/* Coupon Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Coupon Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={couponForm.code}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. SUMMER20, WELCOME10, SAVE50"
                    className="w-full px-3 py-2 text-xs font-mono font-bold uppercase text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>

                {/* Discount Type & Value */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Discount Type
                    </label>
                    <select
                      value={couponForm.discountType}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, discountType: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (৳)</option>
                      <option value="free_shipping">Free Shipping</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Discount Value {couponForm.discountType === "percentage" ? "(%)" : "(৳)"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={couponForm.discountValue}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, discountValue: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Min Order & Max Discount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Min Order Amount (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={couponForm.minOrderAmount}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, minOrderAmount: e.target.value })
                      }
                      placeholder="0 (No minimum)"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Max Discount Cap (৳)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={couponForm.maxDiscountAmount}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, maxDiscountAmount: e.target.value })
                      }
                      placeholder="Optional limit"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Expiry Date & Max Uses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      value={couponForm.validTo}
                      onChange={(e) => setCouponForm({ ...couponForm, validTo: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-800 mb-1">
                      Max Total Uses
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={couponForm.maxUses}
                      onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                      placeholder="Unlimited"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>

                {/* Active Toggle Checkbox */}
                <div className="pt-1 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="couponIsActive"
                    checked={couponForm.isActive}
                    onChange={(e) =>
                      setCouponForm({ ...couponForm, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 cursor-pointer"
                  />
                  <label
                    htmlFor="couponIsActive"
                    className="text-xs font-semibold text-slate-700 cursor-pointer select-none"
                  >
                    Enable and make this coupon active immediately
                  </label>
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50/50 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingCoupon || isUpdatingCoupon}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 text-center"
                >
                  {isCreatingCoupon || isUpdatingCoupon
                    ? "Saving..."
                    : editingCouponId
                    ? "Update Coupon"
                    : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
