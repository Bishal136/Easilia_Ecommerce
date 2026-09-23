import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useRegisterSellerMutation } from "../../features/auth/authApi";
import { setCredentials } from "../../features/auth/authSlice";
import AuthIllustration from "../../components/auth/AuthIllustration";

export const SellerRegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    shopName: "",
    shopDescription: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [registerSeller, { isLoading }] = useRegisterSellerMutation();

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    if (!formData.phone.trim()) {
      setErrorMessage("A valid contact phone number is required.");
      return;
    }

    if (!formData.shopName.trim()) {
      setErrorMessage("Please enter your store / shop name.");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        shopName: formData.shopName.trim(),
        shopDescription: formData.shopDescription.trim() || undefined,
      };

      const response = await registerSeller(payload).unwrap();
      const data = response?.data || response;
      const user = data?.user;
      const token = data?.accessToken || data?.token;
      const shop = data?.shop;

      if (user && token) {
        dispatch(
          setCredentials({
            user: { ...user, shop },
            token,
          })
        );
      }

      navigate(
        `/verify-email?email=${encodeURIComponent(
          formData.email.trim().toLowerCase()
        )}&type=seller`
      );
    } catch (err) {
      console.error("Seller registration failed:", err);
      const serverMessage =
        err?.data?.message ||
        err?.data?.errors?.[0]?.message ||
        err?.error ||
        "Seller registration failed. Please verify your details.";
      setErrorMessage(serverMessage);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-x-hidden bg-gradient-to-r from-[#D0C2F7] via-[#D5B8EE] to-[#E3C7F8] p-3 sm:p-6 lg:p-8 py-6 sm:py-10">
      {/* Ambient background visuals */}
      <div className="absolute -top-20 -left-20 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-[#BFA8EE]/60 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 sm:w-96 sm:h-96 rounded-full border-[36px] sm:border-[44px] border-[#F2A8CD]/70 pointer-events-none" />

      {/* Main Glassmorphic Split Container */}
      <div className="relative z-10 w-full max-w-[960px] bg-white/20 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-purple-950/15 rounded-[32px] overflow-hidden grid grid-cols-1 md:grid-cols-2 my-2 sm:my-6">
        {/* Left Side: Clean White Form Canvas */}
        <div className="bg-white p-5 sm:p-8 md:p-10 flex flex-col justify-center max-h-none md:max-h-[90vh] overflow-y-auto">
          <div className="mb-4">
            <h1 className="text-2xl sm:text-[26px] font-serif font-bold text-[#111827] tracking-tight">
              Merchant Application
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Open your verified merchant store on <strong>Easilia</strong>
            </p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <span className="text-rose-500 font-bold shrink-0">⚠️</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Store / Shop Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.shopName}
                onChange={(e) => handleChange("shopName", e.target.value)}
                placeholder="e.g. Apex Electronics & Gadgets"
                disabled={isLoading}
                className="w-full h-9.5 px-3.5 rounded-md bg-[#FAFAFA] border border-purple-200 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-xs sm:text-sm text-slate-800 transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Owner Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                autoComplete="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Rahim Khan"
                disabled={isLoading}
                className="w-full h-9.5 px-3.5 rounded-md bg-[#FAFAFA] border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#C24188]/20 focus:border-[#C24188] text-xs sm:text-sm text-slate-800 transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Business Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="contact@myshop.com"
                disabled={isLoading}
                className="w-full h-9.5 px-3.5 rounded-md bg-[#FAFAFA] border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#C24188]/20 focus:border-[#C24188] text-xs sm:text-sm text-slate-800 transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Contact Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                autoComplete="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+880 1XXXXXXXXX"
                disabled={isLoading}
                className="w-full h-9.5 px-3.5 rounded-md bg-[#FAFAFA] border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#C24188]/20 focus:border-[#C24188] text-xs sm:text-sm text-slate-800 transition-all disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full h-9.5 pl-3.5 pr-10 rounded-md bg-[#FAFAFA] border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#C24188]/20 focus:border-[#C24188] text-xs sm:text-sm text-slate-800 transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.75}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-lg bg-purple-700 hover:bg-purple-800 active:scale-[0.99] disabled:opacity-75 text-white font-bold text-sm shadow-md shadow-purple-700/30 transition-all cursor-pointer mt-3 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Merchant Application...</span>
                </>
              ) : (
                <span>Submit Merchant Application</span>
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-600">
            Already registered as a seller?{" "}
            <Link to="/login" className="text-purple-600 font-semibold hover:underline">
              Merchant Login
            </Link>
          </div>
        </div>

        {/* Right Side: 3D Frosted Glass Visual Banner */}
        <div className="hidden md:block bg-white/10 backdrop-blur-md border-l border-white/30 relative">
          <AuthIllustration />
        </div>
      </div>
    </div>
  );
};

export default SellerRegisterPage;
