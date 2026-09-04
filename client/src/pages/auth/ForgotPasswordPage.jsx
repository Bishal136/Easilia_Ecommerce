import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForgotPasswordMutation } from "../../features/auth/authApi";
import AuthIllustration from "../../components/auth/AuthIllustration";

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    try {
      await forgotPassword({ email: email.trim().toLowerCase() }).unwrap();
      setStatusMessage("If an account matches that email, a password reset link has been dispatched.");
    } catch (err) {
      setErrorMessage(
        err?.data?.message || err?.error || "Failed to process password recovery request. Please try again."
      );
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
          <h1 className="text-2xl sm:text-[28px] font-serif font-bold text-[#111827] mb-1.5 tracking-tight">
            Forgot Password
          </h1>
          <p className="text-xs text-slate-500 mb-6">
            Enter your account email to receive reset instructions
          </p>

          {/* Success Alert */}
          {statusMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-start gap-2">
              <span className="text-emerald-500 font-bold shrink-0">✓</span>
              <span className="flex-1">{statusMessage}</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <span className="text-rose-500 font-bold shrink-0">⚠️</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                disabled={isLoading}
                className="w-full h-11 px-4 rounded-md bg-[#FAFAFA] border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#C24188]/20 focus:border-[#C24188] text-sm text-slate-800 transition-all disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-lg bg-[#C24188] hover:bg-[#b03678] active:scale-[0.99] disabled:opacity-75 text-white font-bold text-base shadow-[0_4px_14px_rgba(194,65,136,0.35)] transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>

            <div className="text-center text-xs text-slate-600 font-normal pt-2">
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-[#E14E96] font-semibold hover:underline transition-colors"
              >
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
