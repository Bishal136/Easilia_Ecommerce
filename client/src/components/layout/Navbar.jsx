import React, { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLogoutMutation } from "../../features/auth/authApi";
import { useGetBannersQuery } from "../../features/banners/bannerApi";
import { useGetUnreadCountQuery } from "../../features/chat/chatApi";
import { useSelector } from "react-redux";

export const Navbar = () => {
  const { isAuthenticated, user, isSeller, isAdmin } = useAuth();
  const cartItems = useSelector((state) => state.cart?.items || []);
  const cartItemCount = cartItems.length;
  const [searchQuery, setSearchQuery] = useState("");
  const [showTicker, setShowTicker] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4 sm:gap-6">
        {/* Left Side: LOGO + Deliver to Address (Only for Regular Buyers) */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 group">
            <span className="text-2xl font-black tracking-tight text-slate-950 group-hover:text-[#166534] transition-colors">
              Easilia
            </span>
          </Link>

          {/* Deliver to Address (Only visible when regular user/buyer is logged in) */}
          {isRegularBuyer && (
            <div className="hidden lg:flex items-center gap-2.5 pl-3 border-l border-slate-300">
              <svg
                className="w-5 h-5 text-slate-950 shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <div className="flex flex-col text-left leading-tight">
                <span className="text-[11px] text-slate-500 font-normal">Deliver to</span>
                <span className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                  {user?.address?.city || user?.address?.street || user?.address || "Your address"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Center: Search Bar with pale green pill styling */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-2 sm:mx-4">
          <div className="relative flex items-center w-full h-11 px-4 rounded-full bg-[#EBF7EE] border border-[#D5EED9] shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all focus-within:ring-2 focus-within:ring-[#166534]/20 focus-within:border-[#166534]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="What you're looking for"
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
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* 1. ADMIN LOGGED IN: Show ONLY "Admin Dashboard" button + "Sign Out" */}
          {isAdmin ? (
            <div className="flex items-center gap-2.5">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-fuchsia-50 hover:bg-fuchsia-100 border border-fuchsia-200 text-fuchsia-800 font-bold text-xs shadow-xs transition-all"
              >
                <span>🛡️</span>
                <span>Admin Dashboard</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : isSeller ? (
            /* 2. SELLER LOGGED IN: Show ONLY "Seller Dashboard" button + "Sign Out" */
            <div className="flex items-center gap-2.5">
              <Link
                to="/seller/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 font-bold text-xs shadow-xs transition-all"
              >
                <span>🏪</span>
                <span>Seller Dashboard</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : isRegularBuyer ? (
            /* 3. USER (BUYER) LOGGED IN: Show Cart, Messenger, Avatar & Dropdown */
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

              {/* Messenger / Customer Chat with Unread Badge */}
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
                    {user?.avatar?.url ? (
                      <img src={user.avatar.url} alt={user.name} className="w-full h-full object-cover" />
                    ) : user?.name ? (
                      user.name[0].toUpperCase()
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-950 hidden sm:inline-block max-w-[120px] truncate">
                    {user?.name || "User"}
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
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 overflow-hidden">
                    <Link
                      to="/user/profile"
                      onClick={() => setShowUserDropdown(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors font-medium"
                    >
                      Profile
                    </Link>

                    <Link
                      to="/user/orders"
                      onClick={() => setShowUserDropdown(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors font-medium"
                    >
                      Orders
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

                    <Link
                      to="/user/change-password"
                      onClick={() => setShowUserDropdown(false)}
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-950 transition-colors font-medium"
                    >
                      Change Password
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
            /* 4. GUEST (NOT LOGGED IN): Show Sign In & Join Free */
            <div className="flex items-center gap-2.5">
              <Link
                to="/login"
                className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#166534] px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-xs sm:text-sm font-bold px-4 py-2 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white shadow-xs transition-all"
              >
                Join Free
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* Bottom Sub-Navigation Row (Clean: Only Home, Product, About Us, Contact)  */}
      {/* ========================================================================= */}
      <div className="border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-8 text-xs sm:text-sm font-medium">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `py-2.5 border-b-2 transition-all ${
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
              `py-2.5 border-b-2 transition-all ${
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
            className="py-2.5 border-b-2 border-transparent text-slate-700 hover:text-[#166534] transition-all"
          >
            About Us
          </Link>

          <Link
            to="/#contact"
            className="py-2.5 border-b-2 border-transparent text-slate-700 hover:text-[#166534] transition-all"
          >
            Contact
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
