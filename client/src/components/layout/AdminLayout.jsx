import React, { useState } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useLogoutMutation } from "../../features/auth/authApi";

export const AdminLayout = () => {
  const { user } = useAuth();
  const [logout] = useLogoutMutation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate("/login");
    } catch {
      navigate("/login");
    }
  };

  const adminNav = [
    {
      label: "Overview",
      path: "/admin/dashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      label: "User Management",
      path: "/admin/users",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: "Seller & KYC",
      path: "/admin/sellers",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      label: "Categories",
      path: "/admin/categories",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
    },
    {
      label: "Orders Oversight",
      path: "/admin/orders",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      label: "Banners & CMS",
      path: "/admin/banners",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Platform Settings",
      path: "/admin/settings",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans antialiased text-slate-800">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Left: Mobile Toggle + Brand Logo & Admin Badge */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-1.5 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
            aria-label="Open navigation menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link to="/admin/dashboard" className="flex items-center gap-1.5 group">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 group-hover:text-purple-600 transition-colors">
              Easilia
            </span>
          </Link>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
            <span className="hidden xs:inline">ADMIN</span> PANEL
          </span>
        </div>

        {/* Right Menu: Storefront link, Admin User Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-purple-600 font-medium transition-colors p-1.5 sm:p-0 rounded-lg hover:bg-slate-50 sm:hover:bg-transparent"
            title="View Storefront"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="hidden md:inline">Storefront</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              {user?.name ? user.name[0].toUpperCase() : "A"}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                {user?.name || "Administrator"}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Platform Admin</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-slate-600 hover:text-rose-600 font-medium ml-1 sm:ml-2 transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-50"
              title="Sign Out"
            >
              <span className="hidden sm:inline">Log Out</span>
              <svg className="w-4 h-4 sm:hidden text-slate-500 hover:text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Body Container */}
      <div className="flex flex-1 min-w-0 relative">
        {/* Mobile Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar: Persistent on Desktop, Drawer on Mobile */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 p-4 shrink-0 flex flex-col min-h-screen lg:min-h-[calc(100vh-64px)] transform transition-transform duration-200 ease-in-out ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Mobile Drawer Top Bar */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 lg:hidden">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-purple-700">Easilia</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">Admin</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-3 mb-2">
            Navigation Menu
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto">
            {adminNav.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/25 font-semibold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`
                }
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="pt-3 border-t border-slate-100 mt-auto text-[11px] text-slate-400 px-3">
            Easilia v2.0 • Admin Suite
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
