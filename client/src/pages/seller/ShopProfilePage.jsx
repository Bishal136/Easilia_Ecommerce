import React, { useState, useEffect } from "react";
import {
  useGetOwnShopQuery,
  useUpdateOwnShopMutation,
  useUpdateBankDetailsMutation,
  useUpdateShopMediaMutation,
  useRequestWithdrawalMutation,
} from "../../features/shops/shopApi";
import { useUpdateProfileMutation } from "../../features/user/userApi";
import { useAuth } from "../../hooks/useAuth";
import Spinner from "../../components/ui/Spinner";
import SingleImageUpload from "../../components/ui/SingleImageUpload";

export const ShopProfilePage = () => {
  const { user } = useAuth();
  const { data: shopRes, isLoading: shopLoading, refetch } = useGetOwnShopQuery();
  const shop = shopRes?.data?.shop || shopRes?.shop;

  const [activeTab, setActiveTab] = useState("store"); // "store" | "kyc" | "media" | "payout"

  const [updateOwnShop, { isLoading: isUpdatingShop }] = useUpdateOwnShopMutation();
  const [updateBankDetails, { isLoading: isUpdatingBank }] = useUpdateBankDetailsMutation();
  const [updateMedia, { isLoading: isUpdatingMedia }] = useUpdateShopMediaMutation();
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [requestWithdrawal, { isLoading: isWithdrawing }] = useRequestWithdrawalMutation();

  // Tab 1: Store Info & Address
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Bangladesh");

  // Geolocation
  const [lng, setLng] = useState("90.4125");
  const [lat, setLat] = useState("23.8103");

  // Tab 2: KYC Tax Identifiers
  const [tradeLicense, setTradeLicense] = useState("");
  const [gst, setGst] = useState("");
  const [pan, setPan] = useState("");
  const [nid, setNid] = useState("");

  // Tab 3: Media (Store Logo, Store Banner, Seller Profile Avatar)
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Tab 4: Banking Details
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [branch, setBranch] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [mobileBankingType, setMobileBankingType] = useState("bkash");
  const [mobileBankingNumber, setMobileBankingNumber] = useState("");

  // Withdrawal Dialog State
  const [withdrawalModalOpen, setWithdrawalModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("mobile_banking");

  // Toast / Feedback State
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const showToast = (message, type = "success") => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
  };

  // Sync user avatar
  useEffect(() => {
    if (user) {
      const userAvatar = user.avatar?.url || (typeof user.avatar === "string" ? user.avatar : "");
      setAvatarUrl(userAvatar || "");
    }
  }, [user]);

  // Sync state when shop data is loaded
  useEffect(() => {
    if (shop) {
      setName(shop.name || "");
      setEmail(shop.email || "");
      setPhone(shop.phone || "");
      setDescription(shop.description || "");
      setStreet(shop.address?.street || "");
      setCity(shop.address?.city || "");
      setCountry(shop.address?.country || "Bangladesh");

      setTradeLicense(shop.taxIds?.tradeLicense || "");
      setGst(shop.taxIds?.gst || "");
      setPan(shop.taxIds?.pan || "");
      setNid(shop.taxIds?.nid || "");

      if (shop.location?.coordinates && shop.location.coordinates.length === 2) {
        setLng(shop.location.coordinates[0]?.toString() || "90.4125");
        setLat(shop.location.coordinates[1]?.toString() || "23.8103");
      }

      setLogoUrl(shop.logo?.url || (typeof shop.logo === "string" ? shop.logo : "") || "");
      setBannerUrl(shop.banner?.url || (typeof shop.banner === "string" ? shop.banner : "") || "");

      setBankName(shop.bankDetails?.bankName || "");
      setAccountName(shop.bankDetails?.accountName || "");
      setAccountNumber(shop.bankDetails?.accountNumber || "");
      setBranch(shop.bankDetails?.branch || "");
      setRoutingNumber(shop.bankDetails?.routingNumber || "");
      setMobileBankingType(shop.bankDetails?.mobileBankingType || "bkash");
      setMobileBankingNumber(shop.bankDetails?.mobileBankingNumber || "");
    }
  }, [shop]);

  const handleAutoLocate = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toFixed(6));
          setLng(position.coords.longitude.toFixed(6));
          showToast(`GPS coordinates captured: [${position.coords.longitude.toFixed(4)}, ${position.coords.latitude.toFixed(4)}]`);
        },
        (error) => {
          showToast(`GPS error: ${error.message}`, "error");
        }
      );
    } else {
      showToast("Geolocation is not supported by your browser.", "error");
    }
  };

  const handleSaveStoreInfo = async (e) => {
    e.preventDefault();
    try {
      await updateOwnShop({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        description: description.trim(),
        address: { street: street.trim(), city: city.trim(), country: country.trim() },
        location: {
          type: "Point",
          coordinates: [Number(lng) || 90.4125, Number(lat) || 23.8103],
        },
      }).unwrap();
      showToast("Store profile and address updated successfully!");
    } catch (err) {
      showToast(err?.data?.message || "Failed to update store details.", "error");
    }
  };

  const handleSaveKYC = async (e) => {
    e.preventDefault();
    try {
      await updateOwnShop({
        taxIds: {
          tradeLicense: tradeLicense.trim(),
          gst: gst.trim(),
          pan: pan.trim(),
          nid: nid.trim(),
        },
      }).unwrap();
      showToast("KYC Compliance & Tax Identifiers updated successfully!");
    } catch (err) {
      showToast(err?.data?.message || "Failed to update KYC documents.", "error");
    }
  };

  const handleSaveMedia = async (e) => {
    e.preventDefault();
    try {
      await updateMedia({
        logo: logoUrl ? { url: logoUrl } : { url: "" },
        banner: bannerUrl ? { url: bannerUrl } : { url: "" },
      }).unwrap();

      if (user && avatarUrl) {
        await updateProfile({
          avatar: { url: avatarUrl },
        }).unwrap();
      }
      showToast("Store branding, logo, banner, and avatar saved successfully!");
    } catch (err) {
      showToast(err?.data?.message || "Failed to update store branding media.", "error");
    }
  };

  const handleSaveBankDetails = async (e) => {
    e.preventDefault();
    try {
      await updateBankDetails({
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        branch: branch.trim(),
        routingNumber: routingNumber.trim(),
        mobileBankingType,
        mobileBankingNumber: mobileBankingNumber.trim(),
      }).unwrap();
      showToast("Payout & banking details saved successfully!");
    } catch (err) {
      showToast(err?.data?.message || "Failed to update bank details.", "error");
    }
  };

  const handleRequestPayout = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) return;

    try {
      const isMobile = withdrawMethod === "mobile_banking";
      const payload = {
        amount,
        paymentMethod: isMobile ? (mobileBankingType !== "none" ? mobileBankingType : "bkash") : "bank",
        accountDetails: isMobile
          ? {
              accountNumber: mobileBankingNumber || "01700000000",
              accountName: shop?.name || user?.name || "Merchant",
              mobileNumber: mobileBankingNumber || "",
            }
          : {
              accountNumber: accountNumber || "Corporate Account",
              accountName: accountName || shop?.name || "Merchant",
              bankName: bankName || "Corporate Bank",
              branchName: branch || routingNumber || "Main Branch",
            },
      };

      await requestWithdrawal(payload).unwrap();

      setWithdrawalModalOpen(false);
      setWithdrawAmount("");
      showToast(`Payout request for ৳${amount.toLocaleString()} submitted successfully!`);
    } catch (err) {
      showToast(err?.data?.message || "Failed to submit withdrawal request.", "error");
    }
  };

  if (shopLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="lg" text="Loading Merchant Store Settings..." />
      </div>
    );
  }

  const isVerified = shop?.kycStatus === "approved" && shop?.status === "active";
  const isKycPending = !shop || shop?.kycStatus === "pending" || shop?.status === "pending";
  const isKycRejected = shop?.kycStatus === "rejected" || shop?.status === "rejected";

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* 1. KYC Notification Alert Box */}
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
                  ? `Your store application was rejected: "${shop?.rejectionReason || "Please resubmit valid trade license and NID documents."}". Please update your details under the KYC Verification tab.`
                  : "Your seller account is currently under review by our administration team. You cannot publish products until your KYC is verified and approved."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("kyc")}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto transition-colors shadow-xs ${
              isKycRejected
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            }`}
          >
            Update KYC Details →
          </button>
        </div>
      )}

      {/* 2. Top Header with Payout Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#131B2E] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-fuchsia-600 to-purple-600 text-white flex items-center justify-center font-black text-lg overflow-hidden shadow-xs shrink-0">
            {shop?.logo?.url ? (
              <img src={shop.logo.url} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              shop?.name?.[0]?.toUpperCase() || "M"
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                {shop?.name || "Merchant Store"}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  isVerified
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30"
                    : isKycRejected
                    ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300"
                    : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300"
                }`}
              >
                ● {isVerified ? "Verified Merchant" : isKycRejected ? "KYC Rejected" : "KYC Pending Review"}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Official store identity, verified tax records, media covers, and payout configuration
            </p>
          </div>
        </div>

        {/* Store Balance & Request Payout Button */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Store Net Balance</p>
            <p className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
              ৳{(shop?.balance || 0).toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWithdrawalModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            Request Payout
          </button>
        </div>
      </div>

      {/* 3. Toast / Feedback Notification */}
      {feedback.message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-150 ${
            feedback.type === "error"
              ? "bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300"
              : "bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedback.type === "error" ? "⚠️" : "✓"}</span>
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: "", message: "" })}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. Tab Navigation Menu */}
      <div className="bg-white dark:bg-[#131B2E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-3 gap-6 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("store")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "store"
                ? "border-fuchsia-600 text-fuchsia-600 dark:text-fuchsia-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>🏪</span>
            <span>Store Profile & Address</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("kyc")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "kyc"
                ? "border-fuchsia-600 text-fuchsia-600 dark:text-fuchsia-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>🛡️</span>
            <span>KYC & Tax Verification</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] ${
                isVerified
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {shop?.kycStatus || "PENDING"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "media"
                ? "border-fuchsia-600 text-fuchsia-600 dark:text-fuchsia-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>🎨</span>
            <span>Store Branding & Media</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("payout")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === "payout"
                ? "border-fuchsia-600 text-fuchsia-600 dark:text-fuchsia-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            <span>💳</span>
            <span>Payout & Bank Account</span>
          </button>
        </div>

        {/* Tab 1: Store Profile & Address */}
        {activeTab === "store" && (
          <form onSubmit={handleSaveStoreInfo} className="p-6 space-y-5">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                General Merchant Business Profile
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Public storefront branding details, customer care channels, and physical warehouse location
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Store Name <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Support Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Store Contact Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  City / Division
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Dhaka"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-fuchsia-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Street Address / Warehouse Location
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="e.g. Plot 12, Road 4, Sector 7, Uttara"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Store Description & Brand Mission
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief overview of your store, brand mission, and products..."
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>

            {/* 2dsphere Geolocation */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    2dsphere GPS Geolocation (Store Finder Discovery)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Helps buyers nearby discover your physical storefront on maps
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoLocate}
                  className="text-xs font-semibold text-fuchsia-600 dark:text-fuchsia-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>📍</span>
                  <span>Auto-Detect My GPS</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Longitude (Lng)
                  </label>
                  <input
                    type="text"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Latitude (Lat)
                  </label>
                  <input
                    type="text"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingShop}
                className="px-6 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 cursor-pointer transition-all"
              >
                {isUpdatingShop ? "Saving Profile..." : "Save Store Info"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: KYC & Tax Verification */}
        {activeTab === "kyc" && (
          <form onSubmit={handleSaveKYC} className="p-6 space-y-5">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                KYC Compliance & Official Tax Identification
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official registration records required for seller compliance, marketplace payout verification, and product listing activation
              </p>
            </div>

            {/* Current KYC Status Overview */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Current Verification Status:
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                      isVerified
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300"
                        : isKycRejected
                        ? "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300"
                        : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300"
                    }`}
                  >
                    {shop?.kycStatus || "PENDING"}
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {isVerified
                      ? "• Store is fully verified and authorized to sell products."
                      : isKycRejected
                      ? `• Rejected: ${shop?.rejectionReason || "Documentation issues"}`
                      : "• Documents submitted and awaiting administrator approval."}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => refetch()}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Refresh Status 🔄
              </button>
            </div>

            {/* Tax Identifiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trade License Number
                </label>
                <input
                  type="text"
                  value={tradeLicense}
                  onChange={(e) => setTradeLicense(e.target.value)}
                  placeholder="TR-8392-DH"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GST / BIN Registration Number
                </label>
                <input
                  type="text"
                  value={gst}
                  onChange={(e) => setGst(e.target.value)}
                  placeholder="GST-4920-BD"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tax PAN / TIN Number
                </label>
                <input
                  type="text"
                  value={pan}
                  onChange={(e) => setPan(e.target.value)}
                  placeholder="TIN-9281-01"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Owner National ID (NID) Number
                </label>
                <input
                  type="text"
                  value={nid}
                  onChange={(e) => setNid(e.target.value)}
                  placeholder="NID-9482019482"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200 space-y-1">
              <p className="font-bold">📋 KYC Verification Guidelines:</p>
              <p>• Provide accurate tax numbers matching your trade registration certificate.</p>
              <p>• If you need to update documents, save this form to notify our verification team.</p>
              <p>• Verified sellers gain automatic access to instant product publishing and expedited payouts.</p>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingShop}
                className="px-6 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 cursor-pointer transition-all"
              >
                {isUpdatingShop ? "Saving KYC..." : "Save KYC & Tax Records"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Store Branding & Media */}
        {activeTab === "media" && (
          <form onSubmit={handleSaveMedia} className="p-6 space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Store Branding & Visual Media
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload your official store logo, storefront cover banner, and personal merchant avatar
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Store Logo */}
              <SingleImageUpload
                label="Store Logo"
                description="Square logo displayed on store page, header, and invoice documents"
                shape="square"
                value={logoUrl}
                onChange={(url) => setLogoUrl(url)}
              />

              {/* Seller Avatar */}
              <SingleImageUpload
                label="Seller Profile Photo (Avatar)"
                description="Personal photo displayed in seller header and customer messages"
                shape="circle"
                value={avatarUrl}
                onChange={(url) => setAvatarUrl(url)}
              />
            </div>

            {/* Store Cover Banner */}
            <div>
              <SingleImageUpload
                label="Storefront Cover Banner"
                description="Wide header banner displayed at the top of your public store profile (recommended: 1200x400)"
                shape="banner"
                value={bannerUrl}
                onChange={(url) => setBannerUrl(url)}
              />
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingMedia || isUpdatingProfile}
                className="px-6 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 cursor-pointer transition-all"
              >
                {isUpdatingMedia || isUpdatingProfile ? "Saving Media..." : "Save Store Media & Logo"}
              </button>
            </div>
          </form>
        )}

        {/* Tab 4: Payout & Bank Account */}
        {activeTab === "payout" && (
          <form onSubmit={handleSaveBankDetails} className="p-6 space-y-6">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Payout Channels & Electronic Banking
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure direct electronic bank transfer and instant mobile financial services (bKash / Nagad / Rocket)
              </p>
            </div>

            {/* Mobile Financial Services (MFS) */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Mobile Financial Services (bKash / Nagad / Rocket)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Provider
                  </label>
                  <select
                    value={mobileBankingType}
                    onChange={(e) => setMobileBankingType(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="bkash">bKash (Merchant / Personal)</option>
                    <option value="nagad">Nagad (Merchant / Personal)</option>
                    <option value="rocket">Rocket (DBBL)</option>
                    <option value="none">None</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Mobile Account Number
                  </label>
                  <input
                    type="tel"
                    value={mobileBankingNumber}
                    onChange={(e) => setMobileBankingNumber(e.target.value)}
                    placeholder="01700000000"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Traditional Bank Account */}
            <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Corporate Bank Account (BEFTN / NPSB Transfer)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g. BRAC Bank Ltd."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g. Apex Digital Ltd."
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="15012048291001"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Branch & Routing Number
                  </label>
                  <input
                    type="text"
                    value={routingNumber || branch}
                    onChange={(e) => {
                      setRoutingNumber(e.target.value);
                      setBranch(e.target.value);
                    }}
                    placeholder="Gulshan Branch (0602718)"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingBank}
                className="px-6 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 cursor-pointer transition-all"
              >
                {isUpdatingBank ? "Saving Bank Setup..." : "Save Payout Accounts"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 5. Payout Withdrawal Request Modal */}
      {withdrawalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#131B2E] w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Request Merchant Payout
              </h3>
              <button
                type="button"
                onClick={() => setWithdrawalModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500">Available Net Balance:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                ৳{(shop?.balance || 0).toLocaleString()}
              </span>
            </div>

            <form onSubmit={handleRequestPayout} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Withdrawal Amount (৳) <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="500"
                  max={shop?.balance || 100000}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-fuchsia-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">Minimum payout request is ৳500.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Destination Payout Channel
                </label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="mobile_banking">Mobile Banking ({mobileBankingType.toUpperCase()} - {mobileBankingNumber || "Configured"})</option>
                  <option value="bank_transfer">Direct Bank Transfer ({bankName || "Corporate Bank"})</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setWithdrawalModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) > (shop?.balance || 0)}
                  className="px-5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 cursor-pointer transition-all"
                >
                  {isWithdrawing ? "Submitting..." : "Submit Payout Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopProfilePage;
