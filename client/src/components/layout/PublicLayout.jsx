import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { Mail, CheckCircle, ShieldCheck, Lock } from "lucide-react";
import Navbar from "./Navbar";

export const PublicLayout = () => {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setIsSubscribed(true);
      setTimeout(() => {
        setIsSubscribed(false);
        setNewsletterEmail("");
      }, 4000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 antialiased font-sans">
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Outlet */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs">
        {/* Newsletter & Brand Intro Section */}
        <div className="border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="max-w-md text-center lg:text-left">
                <Link to="/" className="inline-block mb-3">
                  <span className="text-2xl font-black tracking-tight text-white hover:text-emerald-400 transition-colors">
                    Easilia
                  </span>
                </Link>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Your trusted marketplace for premium quality products, verified sellers, and seamless shopping experiences worldwide.
                </p>
              </div>

              {/* Newsletter Signup */}
              <div className="w-full lg:w-auto">
                <form
                  onSubmit={handleSubscribe}
                  className="flex flex-col sm:flex-row items-center gap-2 max-w-md mx-auto lg:mx-0"
                >
                  <div className="relative w-full sm:w-80">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs whitespace-nowrap transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isSubscribed ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Subscribed!</span>
                      </>
                    ) : (
                      <span>Subscribe</span>
                    )}
                  </button>
                </form>
                {isSubscribed ? (
                  <p className="text-[11px] text-emerald-400 font-medium mt-2 text-center lg:text-left animate-in fade-in">
                    ✓ Thank you for subscribing! Check your inbox for exclusive deals.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-2 text-center lg:text-left flex items-center justify-center lg:justify-start gap-1.5">
                    <Lock className="w-3 h-3 text-slate-600" />
                    <span>No spam. Unsubscribe anytime with one click.</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Column 1: Company Info */}
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                Company Info
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/careers" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link to="/press" className="hover:text-white transition-colors">
                    Press Releases
                  </Link>
                </li>
                <li>
                  <Link to="/sustainability" className="hover:text-white transition-colors">
                    Sustainability Practices
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Customer Support */}
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                Customer Support
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/help" className="hover:text-white transition-colors">
                    Help Center (FAQs)
                  </Link>
                </li>
                <li>
                  <Link to="/orders" className="hover:text-white transition-colors">
                    Track My Order
                  </Link>
                </li>
                <li>
                  <Link to="/returns" className="hover:text-white transition-colors">
                    Return & Refund Policy
                  </Link>
                </li>
                <li>
                  <Link to="/shipping" className="hover:text-white transition-colors">
                    Shipping Information
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Explore */}
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                Explore
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/products" className="hover:text-white transition-colors">
                    Categories
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="hover:text-white transition-colors">
                    Bestsellers
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="hover:text-white transition-colors">
                    New Arrivals
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="hover:text-white transition-colors">
                    Deals & Promotions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal */}
            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                Legal
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/cookies" className="hover:text-white transition-colors">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link to="/accessibility" className="hover:text-white transition-colors">
                    Accessibility Statement
                  </Link>
                </li>
                <li>
                  <Link to="/returns" className="hover:text-white transition-colors">
                    Return & Refund Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Payment Methods & Verification Strip */}
          <div className="mt-10 pt-8 border-t border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Accepted Payments */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-2.5">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                Accepted Payments:
              </span>
              {/* bKash */}
              <div className="h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-black text-[#E2136E] hover:bg-white/10 transition-colors shadow-xs">
                bKash
              </div>
              {/* Nagad */}
              <div className="h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-black text-[#F7941D] hover:bg-white/10 transition-colors shadow-xs">
                Nagad
              </div>
              {/* Rocket */}
              <div className="h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-black text-[#8C3494] hover:bg-white/10 transition-colors shadow-xs">
                Rocket
              </div>
              {/* Visa */}
              <div className="h-7 px-3 rounded-lg bg-white text-[#1A1F71] font-black italic text-[11px] flex items-center justify-center shadow-xs">
                VISA
              </div>
              {/* Mastercard */}
              <div className="h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-black text-[#EB001B] hover:bg-white/10 transition-colors shadow-xs">
                Mastercard
              </div>
              {/* PortPos */}
              <div className="h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-black text-emerald-400 hover:bg-white/10 transition-colors shadow-xs">
                PortPos
              </div>
              {/* Cash on Delivery */}
              <div className="h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[11px] font-semibold text-slate-300 hover:bg-white/10 transition-colors shadow-xs">
                Cash On Delivery
              </div>
            </div>

            {/* Trust & Verification Badges */}
            <div className="flex items-center gap-4 text-slate-400 text-xs shrink-0">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-medium text-[11px]">100% Buyer Protection</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="font-medium text-[11px]">256-Bit SSL Encrypted</span>
              </div>
            </div>
          </div>

          {/* Social Links & Trust Cert */}
          <div className="mt-6 pt-6 border-t border-slate-850 flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Social media icons */}
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 font-medium">Follow Us:</span>
              <div className="flex items-center gap-3">
                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#1877F2] transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#E4405F] transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                {/* Twitter / X */}
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter / X"
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-black transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-[#0A66C2] transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Trust badge */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Certified Official Multi-Vendor Marketplace • 100% Verified Sellers</span>
            </div>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="border-t border-slate-800 bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-xs">
            <p>© {new Date().getFullYear()} Easilia Multi-Vendor Marketplace. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="/register-seller" className="hover:text-emerald-400 font-medium transition-colors">
                Become a Seller
              </Link>
              <Link to="/help" className="hover:text-slate-300 transition-colors">
                Help Center
              </Link>
              <Link to="/privacy" className="hover:text-slate-300 transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-slate-300 transition-colors">
                Terms
              </Link>
              <Link to="/cookies" className="hover:text-slate-300 transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
