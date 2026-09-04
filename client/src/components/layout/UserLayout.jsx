import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";

export const UserLayout = () => {
  const location = useLocation();
  const isMessagesPage = location.pathname.startsWith("/user/messages");

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 antialiased font-sans ${isMessagesPage ? "h-screen overflow-hidden" : ""}`}>
      {/* Main Store Header / Navbar */}
      <Navbar />

      {/* Buyer Panel Main Content */}
      <main
        className={`flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 ${
          isMessagesPage
            ? "py-3 flex flex-col min-h-0 h-[calc(100vh-135px)] overflow-hidden"
            : "py-8"
        }`}
      >
        <Outlet />
      </main>

      {/* Footer (Hidden on full-height real-time messaging hub) */}
      {!isMessagesPage && (
        <footer className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} Easilia Marketplace. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default UserLayout;
