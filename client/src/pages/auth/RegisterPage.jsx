import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useRegisterMutation, useRegisterSellerMutation } from "../../features/auth/authApi";
import { setCredentials } from "../../features/auth/authSlice";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import AuthIllustration from "../../components/auth/AuthIllustration";

export const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "seller" ? "seller" : "user";
  const [accountType, setAccountType] = useState(initialRole); // 'user' | 'seller'

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    shopName: "",
    shopDescription: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [registerUser, { isLoading: isRegisteringUser }] = useRegisterMutation();
  const [registerSeller, { isLoading: isRegisteringSeller }] = useRegisterSellerMutation();
  const { triggerGoogleLogin, isGoogleLoading } = useGoogleAuth({
    role: accountType,
    onError: (msg) => setErrorMessage(msg),
  });

  const isLoading = isRegisteringUser || isRegisteringSeller;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Password validation
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-enter your password.");
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }

    // Seller-specific validation
    if (accountType === "seller") {
      if (!formData.phone.trim()) {
        setErrorMessage("A contact phone number is required for merchant verification.");
        return;
      }
      if (!formData.shopName.trim()) {
        setErrorMessage("Please provide a name for your online store.");
        return;
      }
    }

    try {
      if (accountType === "seller") {
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
      } else {
        const payload = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim() || undefined,
          password: formData.password,
        };

        const response = await registerUser(payload).unwrap();
        const data = response?.data || response;
        const user = data?.user;
        const token = data?.accessToken || data?.token;

        if (user && token) {
          dispatch(
            setCredentials({
              user,
              token,
            })
          );
        }
      }

      // Navigate to OTP email verification page with email parameter
      navigate(
        `/verify-email?email=${encodeURIComponent(
          formData.email.trim().toLowerCase()
        )}&type=${accountType}`
      );
    } catch (err) {
      console.error("Registration failed:", err);
      const serverMessage =
        err?.data?.message ||
        err?.data?.errors?.[0]?.message ||
        err?.error ||
        "Registration failed. Please verify your details.";
      setErrorMessage(serverMessage);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-r from-[#D0C2F7] via-[#D5B8EE] to-[#E3C7F8] p-4 sm:p-6 lg:p-8">
      {/* Background Decorative Ambient Geometrics (Left Side) */}
      <div className="absolute -top-20 -left-20 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-[#BFA8EE]/60 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 sm:w-96 sm:h-96 rounded-full border-[36px] sm:border-[44px] border-[#F2A8CD]/70 pointer-events-none" />

      {/* Main Glassmorphic Split Container */}
      <div className="relative z-10 w-full max-w-[960px] bg-white/20 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-purple-950/15 rounded-[32px] overflow-hidden grid grid-cols-1 md:grid-cols-2 my-6">
        {/* Left Side: Clean White Form Canvas */}
        <div className="bg-white p-7 sm:p-9 md:p-10 flex flex-col justify-center max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h1 className="text-2xl sm:text-[26px] font-serif font-bold text-[#111827] tracking-tight">
              Create An Account
            </h1>
          </div>

          {/* Account Type Selector Tabs */}
          <div className="flex p-1 bg-slate-100/90 rounded-xl mb-3.5 border border-slate-200/70">
            <button
              type="button"
              onClick={() => {
                setAccountType("user");
                setErrorMessage("");
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                accountType === "user"
                  ? "bg-white text-[#C24188] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>👤</span>
              <span>Buyer Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAccountType("seller");
                setErrorMessage("");
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                accountType === "seller"
                  ? "bg-white text-purple-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>🏪</span>
              <span>Seller Account</span>
            </button>
          </div>

          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <span className="text-rose-500 font-bold shrink-0">⚠️</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2.5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                {accountType === "seller" ? "Owner Full Name" : "Full Name"}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="John Doe"
                disabled={isLoading}
                className="w-full h-9.5 px-3.5 rounded-md bg-[#FAFAFA] border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#C24188]/20 focus:border-[#C24188] text-xs sm:text-sm text-slate-800 transition-all disabled:opacity-60"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="name@example.com"
                disabled={isLoading}
                className="w-full h-9.5 px-3.5 rounded-md bg-[#FAFAFA] border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#C24188]/20 focus:border-[#C24188] text-xs sm:text-sm text-slate-800 transition-all disabled:opacity-60"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Phone Number {accountType === "seller" && <span className="text-rose-500">*</span>}
              </label>
              <input
                type="tel"
                required={accountType === "seller"}
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+880 1XXXXXXXXX"
                disabled={isLoading}
                className="w-full h-9.5 px-3.5 rounded-md bg-[#FAFAFA] border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#C24188]/20 focus:border-[#C24188] text-xs sm:text-sm text-slate-800 transition-all disabled:opacity-60"
              />
            </div>

            {/* SELLER SPECIFIC FIELDS */}
            {accountType === "seller" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    Store / Shop Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.shopName}
                    onChange={(e) => handleChange("shopName", e.target.value)}
                    placeholder="e.g. Apex Fashion House"
                    disabled={isLoading}
                    className="w-full h-9.5 px-3.5 rounded-md bg-[#FAFAFA] border border-purple-200/90 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-xs sm:text-sm text-slate-800 transition-all disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-800 mb-1">
                    Store Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.shopDescription}
                    onChange={(e) => handleChange("shopDescription", e.target.value)}
                    placeholder="Brief summary of what you sell"
                    disabled={isLoading}
                    className="w-full h-9.5 px-3.5 rounded-md bg-[#FAFAFA] border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#C24188]/20 focus:border-[#C24188] text-xs sm:text-sm text-slate-800 transition-all disabled:opacity-60"
                  />
                </div>
              </>
            )}

            {/* Password with Show/Hide Toggle */}
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Password
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

            {/* Confirm Password with Show/Hide Toggle */}
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full h-9.5 pl-3.5 pr-10 rounded-md bg-[#FAFAFA] border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#C24188]/20 focus:border-[#C24188] text-xs sm:text-sm text-slate-800 transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
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

            {/* Submit Registration Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full h-10.5 rounded-lg text-white font-bold text-sm shadow-md transition-all cursor-pointer mt-2 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-75 ${
                accountType === "seller"
                  ? "bg-purple-700 hover:bg-purple-800 shadow-purple-700/30"
                  : "bg-[#C24188] hover:bg-[#b03678] shadow-[rgba(194,65,136,0.35)]"
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>
                    {accountType === "seller" ? "Registering Store..." : "Registering Account..."}
                  </span>
                </>
              ) : (
                <span>
                  {accountType === "seller"
                    ? "Register Merchant Store"
                    : "Create Customer Account"}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="text-center text-[11px] text-slate-400 font-medium my-1">
              -OR-
            </div>

            {/* Google Fast Registration */}
            <button
              type="button"
              onClick={triggerGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full h-9.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/90 shadow-[0_2px_4px_rgba(0,0,0,0.03)] flex items-center justify-center gap-2.5 text-xs font-medium text-slate-800 transition-all cursor-pointer disabled:opacity-60 active:scale-[0.99]"
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign Up With Google</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Call to Action */}
          <div className="mt-3.5 text-center text-xs text-slate-600 font-normal">
            Already Have An Account?{" "}
            <Link
              to="/login"
              className="text-[#E14E96] font-semibold hover:underline transition-colors"
            >
              Login
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

export default RegisterPage;
