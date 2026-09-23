import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  MapPin,
  Plus,
  Check,
  X,
  Home,
  Building2,
  Navigation,
  ChevronDown,
  CheckCircle2,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useLogoutMutation } from "../../features/auth/authApi";
import { useGetBannersQuery } from "../../features/banners/bannerApi";
import { useGetUnreadCountQuery } from "../../features/chat/chatApi";
import {
  useGetProfileQuery,
  useUpdateAddressMutation,
  useAddAddressMutation,
} from "../../features/user/userApi";
import { useSelector } from "react-redux";

export const Navbar = () => {
  const { isAuthenticated, user: authUser, isSeller, isAdmin } = useAuth();
  const cartItems = useSelector((state) => state.cart?.items || []);
  const cartItemCount = cartItems.length;
  const [searchQuery, setSearchQuery] = useState("");
  const [showTicker, setShowTicker] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [guestCity, setGuestCity] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("easilia_delivery_city") || "Dhaka"
      : "Dhaka"
  );

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  // Fresh Profile Query for Live Addresses
  const { data: profileUser, refetch: refetchProfile } = useGetProfileQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [updateAddress, { isLoading: isUpdatingAddress }] = useUpdateAddressMutation();
  const [addAddress, { isLoading: isAddingAddress }] = useAddAddressMutation();

  // Add Address Form State
  const [newAddressForm, setNewAddressForm] = useState({
    title: "Home",
    fullName: "",
    phone: "",
    street: "",
    city: "Dhaka",
    zipCode: "",
    isDefault: true,
  });
  const [formError, setFormError] = useState("");

  // Unread chat messages count for logged-in buyer
  const { data: unreadData } = useGetUnreadCountQuery(undefined, {
    skip: !isAuthenticated || isSeller || isAdmin,
    pollingInterval: 15000,
  });
  const unreadMessagesCount = unreadData?.data?.unreadCount || unreadData?.unreadCount || 0;

  // Fetch Live Announcement Ticker Banner
  const { data: bannersResponse } = useGetBannersQuery();
  const banners = bannersResponse?.data?.banners || bannersResponse?.banners || [];
  const tickerBanner = banners.find((b) => b.position === "ticker" && b.isActive !== false);
  const tickerMessage = tickerBanner?.title || "";

  // A regular buyer is an authenticated user who is NEITHER seller NOR admin
  const isRegularBuyer = isAuthenticated && !isSeller && !isAdmin;

  // Live Addresses list
  const userAddresses = useMemo(() => {
    return profileUser?.addresses || authUser?.addresses || [];
  }, [profileUser, authUser]);

  // Active delivery address: default or first address
  const activeDeliveryAddress = useMemo(() => {
    if (!userAddresses || userAddresses.length === 0) return null;
    return userAddresses.find((a) => a.isDefault) || userAddresses[0];
  }, [userAddresses]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate("/");
    } catch {
      navigate("/");
    }
  };

  // Handle selecting an existing saved address as default
  const handleSelectAddress = async (address) => {
    if (!address?._id) return;
    try {
      await updateAddress({
        id: address._id,
        isDefault: true,
      }).unwrap();
      refetchProfile();
      setIsDeliveryModalOpen(false);
    } catch (err) {
      console.error("Failed to set default delivery address:", err);
    }
  };

  // Handle selecting guest location
  const handleSelectGuestCity = (city) => {
    setGuestCity(city);
    if (typeof window !== "undefined") {
      localStorage.setItem("easilia_delivery_city", city);
    }
    setIsDeliveryModalOpen(false);
  };

  // Handle submitting a new address
  const handleCreateNewAddress = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!newAddressForm.fullName.trim()) {
      setFormError("Recipient full name is required.");
      return;
    }
    if (!newAddressForm.phone.trim()) {
      setFormError("Phone number is required.");
      return;
    }
    if (!newAddressForm.street.trim()) {
      setFormError("Street / House / Area is required.");
      return;
    }
    if (!newAddressForm.city.trim()) {
      setFormError("City / District is required.");
      return;
    }

    try {
      await addAddress({
        title: newAddressForm.title,
        label: newAddressForm.title,
        fullName: newAddressForm.fullName.trim(),
        phone: newAddressForm.phone.trim(),
        street: newAddressForm.street.trim(),
        line1: newAddressForm.street.trim(),
        city: newAddressForm.city.trim(),
        zipCode: newAddressForm.zipCode.trim() || undefined,
        country: "Bangladesh",
        isDefault: true,
      }).unwrap();

      refetchProfile();
      setShowAddAddressForm(false);
      setIsDeliveryModalOpen(false);
      setNewAddressForm({
        title: "Home",
        fullName: "",
        phone: "",
        street: "",
        city: "Dhaka",
        zipCode: "",
        isDefault: true,
      });
    } catch (err) {
      setFormError(err?.data?.message || "Failed to add address.");
    }
  };

  // Popular Bangladesh Divisions / Major Cities for guest selection
  const BANGLADESH_CITIES = [
    "Dhaka",
    "Chittagong",
    "Sylhet",
    "Khulna",
    "Rajshahi",
    "Barisal",
    "Rangpur",
    "Mymensingh",
    "Gazipur",
    "Narayanganj",
    "Cumilla",
    "Cox's Bazar",
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] font-sans">
      {/* ========================================================================= */}
      {/* 0. Top Announcement Ticker Bar                                            */}
      {/* ========================================================================= */}
      {showTicker && tickerMessage && (
        <div className="w-full bg-[#0F172A] text-amber-300 text-[11px] sm:text-xs py-2 px-4 flex items-center justify-between font-semibold tracking-wide border-b border-slate-800 shadow-inner">
          <div className="flex-1 text-center truncate mx-4 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse hidden sm:inline-block shrink-0" />
            <Link
              to={tickerBanner?.link || "/products"}
              className="hover:underline hover:text-amber-200 transition-colors truncate"
            >
              {tickerMessage}
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setShowTicker(false)}
            className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer shrink-0 transition-colors"
            title="Dismiss announcement"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Top Navbar Row                                                            */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-6">
        {/* Left Side: LOGO + Dynamic "Deliver to Your Address" */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 group">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 group-hover:text-[#166534] transition-colors">
              Easilia
            </span>
          </Link>

          {/* DYNAMIC "DELIVER TO" ADDRESS BUTTON */}
          <button
            type="button"
            onClick={() => setIsDeliveryModalOpen(true)}
            className="flex items-center gap-2 px-2 sm:px-2.5 py-1 rounded-xl border-l border-slate-200 hover:bg-[#EBF7EE]/70 transition-all cursor-pointer text-left group"
            title="Change Delivery Location"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 group-hover:bg-[#166534] text-slate-700 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left leading-tight min-w-0">
              <span className="text-[10px] sm:text-[11px] text-slate-500 font-normal truncate">
                {isRegularBuyer
                  ? `Deliver to ${profileUser?.name?.split(" ")[0] || authUser?.name?.split(" ")[0] || "You"}`
                  : "Deliver to"}
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-slate-900 group-hover:text-[#166534] transition-colors truncate max-w-[110px] sm:max-w-[150px] flex items-center gap-1">
                {isRegularBuyer ? (
                  activeDeliveryAddress ? (
                    <>
                      <span>{activeDeliveryAddress.city || activeDeliveryAddress.street || "Bangladesh"}</span>
                      {activeDeliveryAddress.zipCode && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          {activeDeliveryAddress.zipCode}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-emerald-700 font-medium">+ Add address</span>
                  )
                ) : (
                  <span>{guestCity || "Bangladesh"}</span>
                )}
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-[#166534] shrink-0" />
              </span>
            </div>
          </button>
        </div>

        {/* Center: Search Bar with pale green pill styling (Tablet & Desktop) */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-xl mx-2 sm:mx-4">
          <div className="relative flex items-center w-full h-11 px-4 rounded-full bg-[#EBF7EE] border border-[#D5EED9] shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all focus-within:ring-2 focus-within:ring-[#166534]/20 focus-within:border-[#166534]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What you're looking for..."
              className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-500 focus:outline-none pr-24"
            />
            <button
              type="submit"
              className="absolute right-1.5 h-8 px-4 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold flex items-center gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-slate-100 cursor-pointer transition-all active:scale-95"
            >
              <svg
                className="w-3.5 h-3.5 text-slate-800"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Right Side: Role-Based User Controls */}
        <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
          {/* 1. ADMIN LOGGED IN */}
          {isAdmin ? (
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-fuchsia-50 hover:bg-fuchsia-100 border border-fuchsia-200 text-fuchsia-800 font-bold text-xs shadow-xs transition-all"
              >
                <span>🛡️</span>
                <span className="hidden sm:inline">Admin </span>
                <span>Dashboard</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : isSeller ? (
            /* 2. SELLER LOGGED IN */
            <div className="flex items-center gap-2 sm:gap-2.5">
              <Link
                to="/seller/dashboard"
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-bold text-xs shadow-xs transition-all"
              >
                <span>🏪</span>
                <span className="hidden sm:inline">Seller </span>
                <span>Dashboard</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : isRegularBuyer ? (
            /* 3. USER (BUYER) LOGGED IN */
            <>
              {/* Shopping Cart */}
              <Link
                to="/cart"
                className="text-slate-900 hover:text-[#166534] transition-colors relative p-1"
                title="Shopping Cart"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#166534] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                    {cartItemCount > 9 ? "9+" : cartItemCount}
                  </span>
                )}
              </Link>

              {/* Messenger / Customer Chat */}
              <Link
                to="/user/messages"
                className="text-slate-900 hover:text-[#166534] transition-colors relative p-1"
                title="Messages & Support"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {unreadMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#166534] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white animate-pulse">
                    {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
                  </span>
                )}
              </Link>

              {/* Buyer Profile Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 text-slate-950 hover:text-[#166534] transition-colors cursor-pointer select-none"
                  title="Account Menu"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden">
                    {profileUser?.avatar?.url || authUser?.avatar?.url ? (
                      <img
                        src={profileUser?.avatar?.url || authUser?.avatar?.url}
                        alt={profileUser?.name || authUser?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (profileUser?.name || authUser?.name) ? (
                      (profileUser?.name || authUser?.name).charAt(0).toUpperCase()
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-950 hidden sm:inline-block max-w-[120px] truncate">
                    {profileUser?.name || authUser?.name || "User"}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                      showUserDropdown ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                    <Link
                      to="/user/profile"
                      onClick={() => setShowUserDropdown(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors font-medium"
                    >
                      Profile & Addresses
                    </Link>

                    <Link
                      to="/user/orders"
                      onClick={() => setShowUserDropdown(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors font-medium"
                    >
                      My Orders
                    </Link>

                    <Link
                      to="/user/messages"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors font-medium"
                    >
                      <span>My Messages</span>
                      {unreadMessagesCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-[#166534] text-white text-[10px] font-bold">
                          {unreadMessagesCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/user/reviews"
                      onClick={() => setShowUserDropdown(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors font-medium"
                    >
                      My Reviews
                    </Link>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        setShowUserDropdown(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-rose-50/80 font-medium transition-colors cursor-pointer"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* 4. GUEST (NOT LOGGED IN) */
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#166534] px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white shadow-xs transition-all whitespace-nowrap"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Search Bar Row */}
      <div className="sm:hidden px-3.5 pb-2.5 pt-0.5">
        <form onSubmit={handleSearch} className="w-full">
          <div className="relative flex items-center w-full h-10 px-3.5 rounded-full bg-[#EBF7EE] border border-[#D5EED9] shadow-2xs transition-all focus-within:ring-2 focus-within:ring-[#166534]/20 focus-within:border-[#166534]">
            <svg
              className="w-4 h-4 text-slate-400 shrink-0 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands & categories..."
              className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-500 focus:outline-none pr-16"
            />
            <button
              type="submit"
              className="absolute right-1 h-8 px-3 rounded-full bg-white hover:bg-slate-50 text-slate-800 text-[11px] font-bold shadow-xs border border-slate-100 cursor-pointer transition-all active:scale-95"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* Bottom Sub-Navigation Row                                                 */}
      {/* ========================================================================= */}
      <div className="border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex items-center gap-6 sm:gap-8 text-xs sm:text-sm font-medium overflow-x-auto no-scrollbar whitespace-nowrap">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `py-2 sm:py-2.5 border-b-2 transition-all shrink-0 ${
                isActive
                  ? "border-[#166534] text-[#166534] font-bold"
                  : "border-transparent text-slate-700 hover:text-[#166534]"
              }`
            }
          >
            Home
          </NavLink>

          <NavLink
            to="/products"
            className={({ isActive }) =>
              `py-2 sm:py-2.5 border-b-2 transition-all shrink-0 ${
                isActive
                  ? "border-[#166534] text-[#166534] font-bold"
                  : "border-transparent text-slate-700 hover:text-[#166534]"
              }`
            }
          >
            Product
          </NavLink>

          <Link
            to="/#about"
            className="py-2 sm:py-2.5 border-b-2 border-transparent text-slate-700 hover:text-[#166534] transition-all shrink-0"
          >
            About Us
          </Link>

          <Link
            to="/#contact"
            className="py-2 sm:py-2.5 border-b-2 border-transparent text-slate-700 hover:text-[#166534] transition-all shrink-0"
          >
            Contact
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DELIVERY LOCATION MODAL / PICKER                                          */}
      {/* ========================================================================= */}
      {isDeliveryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Choose Delivery Location
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Select your delivery destination for localized shipping estimates
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsDeliveryModalOpen(false);
                  setShowAddAddressForm(false);
                  setFormError("");
                }}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 flex items-center justify-center text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {isRegularBuyer ? (
                /* AUTHENTICATED BUYER VIEW */
                <>
                  {!showAddAddressForm ? (
                    <div className="space-y-3.5">
                      {userAddresses.length > 0 ? (
                        <div className="space-y-2.5">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                            Your Saved Addresses ({userAddresses.length})
                          </span>

                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                            {userAddresses.map((addr) => {
                              const isSelected = activeDeliveryAddress?._id === addr._id;
                              return (
                                <button
                                  key={addr._id}
                                  type="button"
                                  onClick={() => handleSelectAddress(addr)}
                                  disabled={isUpdatingAddress}
                                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                                    isSelected
                                      ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20"
                                      : "bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-emerald-400"
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                        isSelected
                                          ? "bg-emerald-600 text-white shadow-xs"
                                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                      }`}
                                    >
                                      {addr.title?.toLowerCase().includes("work") ||
                                      addr.title?.toLowerCase().includes("office") ? (
                                        <Building2 className="w-4 h-4" />
                                      ) : (
                                        <Home className="w-4 h-4" />
                                      )}
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                                          {addr.title || addr.label || "Address"}
                                        </span>
                                        {isSelected && (
                                          <span className="px-2 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider">
                                            ✓ Active
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium truncate">
                                        {addr.fullName} ({addr.phone})
                                      </p>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                        {addr.street || addr.line1},{" "}
                                        {addr.city || addr.state} {addr.zipCode ? `- ${addr.zipCode}` : ""}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="shrink-0 mt-1">
                                    <div
                                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                        isSelected
                                          ? "border-emerald-600 bg-emerald-600 text-white"
                                          : "border-slate-300 dark:border-slate-600"
                                      }`}
                                    >
                                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4">
                          <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            No delivery address added yet
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Add your home or office address for 1-click checkout.
                          </p>
                        </div>
                      )}

                      {/* Add New Address Button */}
                      <button
                        type="button"
                        onClick={() => setShowAddAddressForm(true)}
                        className="w-full py-2.5 px-4 rounded-2xl bg-[#EBF7EE] dark:bg-emerald-950/40 hover:bg-[#D5EED9] text-[#166534] dark:text-emerald-300 text-xs font-bold transition-all border border-[#D5EED9] dark:border-emerald-800/60 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Add a New Delivery Address</span>
                      </button>

                      <div className="pt-2 text-center">
                        <Link
                          to="/user/profile"
                          onClick={() => setIsDeliveryModalOpen(false)}
                          className="text-[11px] font-bold text-slate-500 hover:text-[#166534] transition-colors"
                        >
                          Manage full address book in Profile →
                        </Link>
                      </div>
                    </div>
                  ) : (
                    /* INLINE ADD ADDRESS FORM */
                    <form onSubmit={handleCreateNewAddress} className="space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>📍</span>
                          <span>New Address Details</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddAddressForm(false)}
                          className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          ← Back to list
                        </button>
                      </div>

                      {formError && (
                        <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs border border-rose-200">
                          {formError}
                        </div>
                      )}

                      {/* Title / Label Pills */}
                      <div className="flex items-center gap-2">
                        {["Home", "Office", "Other"].map((label) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() =>
                              setNewAddressForm((prev) => ({ ...prev, title: label }))
                            }
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              newAddressForm.title === label
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Recipient Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. John Doe"
                            value={newAddressForm.fullName}
                            onChange={(e) =>
                              setNewAddressForm((prev) => ({ ...prev, fullName: e.target.value }))
                            }
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Contact Phone *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="017XXXXXXXX"
                            value={newAddressForm.phone}
                            onChange={(e) =>
                              setNewAddressForm((prev) => ({ ...prev, phone: e.target.value }))
                            }
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Street, Road, House / Area *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="House #12, Road #4, Sector #3, Uttara"
                          value={newAddressForm.street}
                          onChange={(e) =>
                            setNewAddressForm((prev) => ({ ...prev, street: e.target.value }))
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            City / District *
                          </label>
                          <select
                            value={newAddressForm.city}
                            onChange={(e) =>
                              setNewAddressForm((prev) => ({ ...prev, city: e.target.value }))
                            }
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            {BANGLADESH_CITIES.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Postal / Zip Code
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 1230"
                            value={newAddressForm.zipCode}
                            onChange={(e) =>
                              setNewAddressForm((prev) => ({ ...prev, zipCode: e.target.value }))
                            }
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setShowAddAddressForm(false)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isAddingAddress}
                          className="px-5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          {isAddingAddress ? "Saving..." : "Save & Set Default"}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              ) : (
                /* GUEST (NOT LOGGED IN) VIEW */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-center space-y-2">
                    <p className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                      Sign in to see your saved addresses and track real-time express delivery options.
                    </p>
                    <Link
                      to="/login"
                      onClick={() => setIsDeliveryModalOpen(false)}
                      className="inline-block px-5 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-xs transition-all"
                    >
                      Sign In to Account
                    </Link>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Or Select Delivery City / Division:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {BANGLADESH_CITIES.map((city) => {
                        const isSelected = guestCity === city;
                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() => handleSelectGuestCity(city)}
                            className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-2xs"
                                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400"
                            }`}
                          >
                            <span>{city}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
