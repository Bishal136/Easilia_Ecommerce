import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useLoginMutation } from "../../features/auth/authApi";
import { setCredentials } from "../../features/auth/authSlice";
import { useGoogleAuth } from "../../hooks/useGoogleAuth";
import AuthIllustration from "../../components/auth/AuthIllustration";

export const LoginPage = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [login, { isLoading }] = useLoginMutation();
  const { triggerGoogleLogin, isGoogleLoading } = useGoogleAuth({
    onError: (msg) => setErrorMessage(msg),
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      // Backend expects email/phone & password
      const response = await login({
        email: emailOrPhone.trim(),
        password,
      }).unwrap();

      const data = response?.data || response;
      const user = data?.user;
      const token = data?.accessToken || data?.token;
      const shop = data?.shop;

      if (user && token) {
        dispatch(
          setCredentials({
            user: { ...user, shop: shop || user.shop },
            token,
          })
        );

        // Smart role-based destination redirect
        const redirectFrom = location.state?.from?.pathname;
        if (redirectFrom && redirectFrom !== "/login" && redirectFrom !== "/register") {
          navigate(redirectFrom, { replace: true });
        } else if (user.role === "admin") {
          navigate("/admin/dashboard", { replace: true });
        } else if (user.role === "seller") {
          navigate("/seller/dashboard", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }
    } catch (err) {
      console.error("Login failed:", err);
      const serverMessage =
        err?.data?.message ||
        err?.data?.errors?.[0]?.message ||
        err?.error ||
        "Invalid email or password. Please try again.";
      setErrorMessage(serverMessage);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-gradient-to-r from-[#D0C2F7] via-[#D5B8EE] to-[#E3C7F8] p-4 sm:p-6 lg:p-8">
      {/* Background Decorative Ambient Geometrics */}
      <div className="absolute -top-20 -right-20 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-[#BFA8EE]/60 pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 sm:w-96 sm:h-96 rounded-full border-[36px] sm:border-[44px] border-[#F2A8CD]/70 pointer-events-none" />

      {/* Main Glassmorphic Split Container */}
      <div className="relative z-10 w-full max-w-[940px] bg-white/20 backdrop-blur-2xl border border-white/50 shadow-2xl shadow-purple-950/15 rounded-[32px] overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Side: 3D Frosted Glass Visual Banner */}
        <div className="hidden md:block bg-white/10 backdrop-blur-md border-r border-white/30 relative">
          <AuthIllustration />
        </div>

        {/* Right Side: Clean White Form Canvas */}
        <div className="bg-white p-8 sm:p-10 md:p-12 flex flex-col justify-center">
          <h1 className="text-2xl sm:text-[28px] font-serif font-bold text-[#111827] mb-6 tracking-tight">
            Hello ! Welcome Back
          </h1>

          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <span className="text-rose-500 font-bold shrink-0">⚠️</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Or Mobile Number */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-800 mb-1.5">
                Email Or Mobile Number
              </label>
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="name@example.com"
                disabled={isLoading}
                className="w-full h-11 px-4 rounded-md bg-[#FAFAFA] border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#C24188]/20 focus:border-[#C24188] text-sm text-slate-800 transition-all disabled:opacity-60"
              />
            </div>

            {/* Password with Show/Hide Toggle */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-800 mb-1.5">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full h-11 pl-4 pr-11 rounded-md bg-[#FAFAFA] border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#C24188]/20 focus:border-[#C24188] text-sm text-slate-800 transition-all disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
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
                      className="w-5 h-5"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-xs border-slate-300 text-[#C24188] focus:ring-[#C24188] accent-[#C24188]"
                />
                <span className="text-xs text-slate-700 font-normal">Remember Me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs text-[#E14E96] hover:underline font-normal transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Primary Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-lg bg-[#C24188] hover:bg-[#b03678] active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-base shadow-[0_4px_14px_rgba(194,65,136,0.35)] transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Logging In...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>

            {/* Divider */}
            <div className="text-center text-xs text-slate-500 font-medium my-1.5">
              -OR-
            </div>

            {/* Google Social Sign In */}
            <button
              type="button"
              onClick={triggerGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              className="w-full h-11 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/90 shadow-[0_2px_6px_rgba(0,0,0,0.04)] flex items-center justify-center gap-3 text-xs sm:text-sm font-medium text-slate-800 transition-all cursor-pointer disabled:opacity-60 active:scale-[0.99]"
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#4285F4] border-t-transparent rounded-full animate-spin" />
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
                  <span>Sign In With Google</span>
                </>
              )}
            </button>

            {/* Hidden GSI Target container for automated button fallback */}
            <div id="googleSignInContainer" className="hidden" />
          </form>

          {/* Footer Call to Action */}
          <div className="mt-5 text-center text-xs text-slate-600 font-normal">
            Don't Have An Account?{" "}
            <Link
              to="/register"
              className="text-[#E14E96] font-semibold hover:underline transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
