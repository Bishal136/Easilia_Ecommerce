import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  Building,
  Check,
  Lock,
  Package,
  ShoppingBag,
  Mail,
  Plus,
  ChevronRight,
  X,
  User as UserIcon,
  Home,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useUploadImageMutation,
} from "../../features/user/userApi";

export const ProfilePage = () => {
  const { user: authUser } = useAuth();

  // Profile data query
  const { data: profileUser, refetch } = useGetProfileQuery();
  const user = profileUser || authUser;

  // Mutations
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [addAddress, { isLoading: isAddingAddress }] = useAddAddressMutation();
  const [updateAddress, { isLoading: isUpdatingAddress }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [uploadImage, { isLoading: isUploadingImage }] = useUploadImageMutation();

  // Personal Info Form State
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [personalInfoStatus, setPersonalInfoStatus] = useState({ type: "", message: "" });

  // Sync state when user loads
  useEffect(() => {
    if (user) {
      if (!name && user.name) setName(user.name);
      if (!phone && user.phone) setPhone(user.phone);
    }
  }, [user]);

  // File Upload Refs
  const bannerInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  // Modal States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ type: "", message: "" });

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    email: "",
    phone: "",
    street: "",
    line2: "",
    landmark: "",
    city: "",
    state: "",
    isDefault: false,
  });
  const [addressStatus, setAddressStatus] = useState({ type: "", message: "" });

  // Calculate default address and addresses list
  const addresses = user?.addresses || [];
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];
  const activePincode =
    defaultAddress?.zipCode ||
    defaultAddress?.postalCode ||
    defaultAddress?.pincode ||
    defaultAddress?.city ||
    "—";

  // Handle Personal Info Submit
  const handleSavePersonalInfo = async (e) => {
    e.preventDefault();
    setPersonalInfoStatus({ type: "", message: "" });

    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
      }).unwrap();

      setPersonalInfoStatus({
        type: "success",
        message: "Personal info saved successfully!",
      });
      setTimeout(() => setPersonalInfoStatus({ type: "", message: "" }), 3500);
    } catch (err) {
      setPersonalInfoStatus({
        type: "error",
        message: err?.data?.message || "Failed to update personal info",
      });
    }
  };

  // Handle Image Upload (Banner or Avatar)
  const handleImageFileChange = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await uploadImage(formData).unwrap();
      const uploadedUrl = uploadRes?.url || uploadRes?.path || "";
      const uploadedPath = uploadRes?.path || "";

      if (type === "banner") {
        await updateProfile({
          banner: { url: uploadedUrl, path: uploadedPath },
        }).unwrap();
      } else if (type === "avatar") {
        await updateProfile({
          avatar: { url: uploadedUrl, path: uploadedPath },
        }).unwrap();
      }
      refetch();
    } catch (err) {
      alert(err?.data?.message || `Failed to upload ${type}`);
    }
  };

  // Handle Change Password Submit
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus({ type: "", message: "" });

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({
        type: "error",
        message: "New password and confirm password do not match",
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordStatus({
        type: "error",
        message: "Password must be at least 6 characters long",
      });
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap();

      setPasswordStatus({
        type: "success",
        message: "Password changed successfully!",
      });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setPasswordStatus({ type: "", message: "" });
      }, 1500);
    } catch (err) {
      setPasswordStatus({
        type: "error",
        message: err?.data?.message || "Failed to change password",
      });
    }
  };

  // Open Address Modal (Add or Edit)
  const handleOpenAddressModal = (addr = null) => {
    setAddressStatus({ type: "", message: "" });
    if (addr) {
      setEditingAddressId(addr._id);
      setAddressForm({
        email: addr.email || user?.email || "",
        phone: addr.phone || user?.phone || "",
        street: addr.street || addr.line1 || "",
        line2: addr.line2 || "",
        landmark: addr.landmark || "",
        city: addr.city || "",
        state: addr.state || "",
        isDefault: !!addr.isDefault,
      });
    } else {
      setEditingAddressId(null);
      setAddressForm({
        email: user?.email || "",
        phone: user?.phone || "",
        street: "",
        line2: "",
        landmark: "",
        city: "",
        state: "",
        isDefault: addresses.length === 0,
      });
    }
    setIsAddressModalOpen(true);
  };

  // Save Address Submit
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressStatus({ type: "", message: "" });

    if (!addressForm.phone.trim()) {
      setAddressStatus({ type: "error", message: "Phone number is required" });
      return;
    }
    if (!addressForm.street.trim()) {
      setAddressStatus({ type: "error", message: "Street address is required" });
      return;
    }
    if (!addressForm.city.trim()) {
      setAddressStatus({ type: "error", message: "City is required" });
      return;
    }

    const payload = {
      title: addressForm.street.trim(),
      label: addressForm.street.trim(),
      fullName: user?.name || "Valued Customer",
      email: addressForm.email.trim() || undefined,
      phone: addressForm.phone.trim(),
      street: addressForm.street.trim(),
      line1: addressForm.street.trim(),
      line2: addressForm.line2.trim() || undefined,
      landmark: addressForm.landmark.trim() || undefined,
      city: addressForm.city.trim(),
      state: addressForm.state.trim() || undefined,
      country: "Bangladesh",
      isDefault: addressForm.isDefault,
    };

    try {
      if (editingAddressId) {
        await updateAddress({
          id: editingAddressId,
          ...payload,
        }).unwrap();
      } else {
        await addAddress(payload).unwrap();
      }

      setIsAddressModalOpen(false);
      refetch();
    } catch (err) {
      setAddressStatus({
        type: "error",
        message: err?.data?.message || "Failed to save address",
      });
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id) => {
    if (window.confirm("Are you sure you want to delete this address?")) {
      try {
        await deleteAddress(id).unwrap();
        refetch();
      } catch (err) {
        alert(err?.data?.message || "Failed to delete address");
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Hidden File Inputs for Banner & Avatar Upload */}
      <input
        type="file"
        ref={bannerInputRef}
        onChange={(e) => handleImageFileChange(e, "banner")}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={avatarInputRef}
        onChange={(e) => handleImageFileChange(e, "avatar")}
        accept="image/*"
        className="hidden"
      />

      {/* ========================================================================= */}
      {/* 1. Profile Header Banner Card                                             */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-950 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Banner Image / Cover */}
        <div className="relative w-full h-48 sm:h-64 bg-slate-900 overflow-hidden">
          {user?.banner?.url ? (
            <img
              src={user.banner.url}
              alt="Profile Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-950 via-indigo-950 to-blue-900 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
              <div className="text-center z-10 flex flex-col items-center">
                <span className="text-2xl sm:text-4xl font-black tracking-widest text-cyan-400 drop-shadow-md">
                  BR MODS
                </span>
                <span className="text-xs sm:text-sm text-cyan-200/80 font-medium tracking-wide">
                  Internal Free Fire - V7A
                </span>
              </div>
            </div>
          )}

          {/* Change Banner Button */}
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            disabled={isUploadingImage}
            className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-md border border-white/20 shadow-md cursor-pointer transition-all active:scale-95"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{isUploadingImage ? "Uploading..." : "Change Banner"}</span>
          </button>
        </div>

        {/* Profile Info Bar */}
        <div className="px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-6 -mt-12 sm:-mt-14 relative z-20">
          {/* Avatar & User Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            {/* Avatar with Camera Icon */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white dark:border-slate-950 shadow-md overflow-hidden bg-slate-900 flex items-center justify-center">
                {user?.avatar?.url ? (
                  <img
                    src={user.avatar.url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-white">
                    {user?.name ? user.name[0].toUpperCase() : "U"}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingImage}
                title="Change Avatar"
                className="absolute bottom-1 right-1 w-7 h-7 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-md cursor-pointer border-2 border-white transition-all active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Name, Badges & Email */}
            <div className="space-y-1.5 sm:pb-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {user?.name || "Bishal Biswas"}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                  User
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Verified
                </span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-500">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user?.email || "bishalbiswas2027@gmail.com"}</span>
              </div>
            </div>
          </div>

        
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Two Columns: Personal Info & Saved Addresses                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal Info (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-950 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-5">
            {/* Header with Change Password Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Personal Info
                  </h2>
                  <p className="text-xs text-slate-500">Manage your name and contact number</p>
                </div>
              </div>

              <Link
                to="/user/change-password"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-200/60 dark:border-purple-800 cursor-pointer transition-all active:scale-95"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Change Password</span>
              </Link>
            </div>

            {/* Alert Notification */}
            {personalInfoStatus.message && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  personalInfoStatus.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {personalInfoStatus.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{personalInfoStatus.message}</span>
              </div>
            )}

            {/* Form */}
            <form id="personalInfoForm" onSubmit={handleSavePersonalInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bishal Biswas"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01815391792"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || "bishalbiswas2027@gmail.com"}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Email is managed by your account login.
                </p>
              </div>
            </form>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              form="personalInfoForm"
              disabled={isUpdatingProfile}
              className="w-full py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isUpdatingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Personal Info</span>
            </button>
          </div>
        </div>

        {/* Right Column: Saved Addresses (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-950 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header with + Add Address Button */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Saved Addresses
                  </h2>
                  <p className="text-xs text-slate-500">Manage your shipping destinations</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenAddressModal(null)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Address</span>
              </button>
            </div>

            {/* Address Cards List */}
            <div className="mt-5 space-y-4">
              {addresses.length === 0 ? (
                /* Empty state */
                <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 flex items-center justify-center mx-auto">
                    <Home className="w-6 h-6 stroke-1" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      No Saved Addresses
                    </h4>
                    <p className="text-xs text-slate-400">
                      Add a shipping address for faster checkout on your orders.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenAddressModal(null)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr._id}
                    className={`rounded-2xl border p-4 relative transition-all shadow-xs ${
                      addr.isDefault
                        ? "border-2 border-indigo-300 dark:border-indigo-800 bg-indigo-50/20 dark:bg-indigo-950/10"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {addr.label || addr.title || "Shipping Address"}
                        </span>
                      </div>
                      {addr.isDefault && (
                        <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                          DEFAULT
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-2 space-y-1">
                      <p className="leading-relaxed">
                        {addr.street || addr.line1}
                        {addr.line2 ? `, ${addr.line2}` : ""}
                      </p>
                      {addr.landmark && (
                        <p className="text-[11px] text-slate-500 italic">
                          Landmark: {addr.landmark}
                        </p>
                      )}
                      <p>
                        {addr.city}
                        {addr.state ? `, ${addr.state}` : ""}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 dark:text-slate-400 pt-1 font-mono text-[11px]">
                        {addr.phone && <span>Phone: {addr.phone}</span>}
                        {addr.email && <span>Email: {addr.email}</span>}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      {addr.isDefault ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Primary shipping
                        </span>
                      ) : (
                        <span className="text-slate-400">Additional destination</span>
                      )}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleOpenAddressModal(addr)}
                          className="text-indigo-600 hover:underline font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr._id)}
                          className="text-rose-600 hover:underline font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Change Password Modal                                                  */}
      {/* ========================================================================= */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Change Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {passwordStatus.message && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  passwordStatus.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {passwordStatus.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{passwordStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isChangingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Add / Edit Address Modal (Exact Mockup Design)                         */}
      {/* ========================================================================= */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingAddressId ? "Edit Address" : "Add New Address"}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {addressStatus.message && (
              <div className="p-3 rounded-xl text-xs bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addressStatus.message}</span>
              </div>
            )}

            {/* Address Form */}
            <form onSubmit={handleSaveAddress} className="space-y-3.5">
              {/* Field 1: Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={addressForm.email}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, email: e.target.value })
                  }
                  placeholder="e.g. user@example.com"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5046e5]/20 focus:border-[#5046e5]"
                />
              </div>

              {/* Field 2: Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={addressForm.phone}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, phone: e.target.value })
                  }
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5046e5]/20 focus:border-[#5046e5]"
                />
              </div>

              {/* Field 3: Street Address / Line 1 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Street Address / Line 1 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={addressForm.street}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, street: e.target.value })
                  }
                  placeholder="House/Flat No., Street, Area"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5046e5]/20 focus:border-[#5046e5]"
                />
              </div>

              {/* Field 4: Address Line 2 (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Address Line 2 (Optional)
                </label>
                <input
                  type="text"
                  value={addressForm.line2}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, line2: e.target.value })
                  }
                  placeholder="Suite, Unit, Building"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5046e5]/20 focus:border-[#5046e5]"
                />
              </div>

              {/* Field 5: Landmark (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={addressForm.landmark}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, landmark: e.target.value })
                  }
                  placeholder="e.g. Near City Mosque, opposite hospital"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5046e5]/20 focus:border-[#5046e5]"
                />
              </div>

              {/* Field 6 & 7: City & State / Division */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.city}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, city: e.target.value })
                    }
                    placeholder="e.g. Dhaka"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5046e5]/20 focus:border-[#5046e5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    State / Division
                  </label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) =>
                      setAddressForm({ ...addressForm, state: e.target.value })
                    }
                    placeholder="e.g. Dhaka Division"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5046e5]/20 focus:border-[#5046e5]"
                  />
                </div>
              </div>

              {/* Checkbox: Set as default shipping address */}
              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="checkbox"
                  id="isDefaultAddress"
                  checked={addressForm.isDefault}
                  onChange={(e) =>
                    setAddressForm({ ...addressForm, isDefault: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-[#5046e5] focus:ring-[#5046e5] cursor-pointer"
                />
                <label
                  htmlFor="isDefaultAddress"
                  className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none"
                >
                  Set as default shipping address
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingAddress || isUpdatingAddress}
                  className="px-5 py-2.5 rounded-xl bg-[#5046e5] hover:bg-[#4338ca] text-white text-xs font-semibold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  {(isAddingAddress || isUpdatingAddress) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>{editingAddressId ? "Update Address" : "Save Address"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
