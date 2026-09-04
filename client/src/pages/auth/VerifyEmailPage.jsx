import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useVerifyEmailMutation, useResendOtpMutation } from "../../features/auth/authApi";
import AuthIllustration from "../../components/auth/AuthIllustration";

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  const [verifyEmail, { isLoading }] = useVerifyEmailMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  // Handle single digit input
  const handleChange = (index, value) => {
    // If multiple digits typed/dropped at once, treat as paste
    const digitsOnly = value.replace(/\D/g, "");
    if (digitsOnly.length > 1) {
      fillOtpFromText(digitsOnly);
      return;
    }

    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    }
  };

  // Helper to fill OTP array from string
  const fillOtpFromText = (rawText) => {
    const cleaned = rawText.replace(/\D/g, "").slice(0, 6);
    if (!cleaned) return;

    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = cleaned[i] || "";
    }
    setOtp(newOtp);

    // Focus target
    const targetIndex = Math.min(cleaned.length, 5);
    const targetInput = document.getElementById(`otp-${targetIndex}`);
    if (targetInput) {
      targetInput.focus();
      targetInput.select();
    }
  };

  // Intercept Copy-Paste (Ctrl+V / Right-click paste) on any OTP input
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData("text") || "";
    fillOtpFromText(pastedText);
  };

  // One-click paste button from System Clipboard
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          fillOtpFromText(text);
          setStatusMessage("Pasted 6-digit code from clipboard!");
          setTimeout(() => setStatusMessage(""), 2500);
          return;
        }
      }
      setErrorMessage("Please press Ctrl+V / Paste directly into any OTP box.");
    } catch {
      setErrorMessage("Clipboard permission denied. Please press Ctrl+V into the box.");
    }
  };

  // Keyboard navigation (Backspace & Arrow keys)
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        const prevInput = document.getElementById(`otp-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
          const newOtp = [...otp];
          newOtp[index - 1] = "";
          setOtp(newOtp);
        }
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter or paste the complete 6-digit OTP code.");
      return;
    }

    try {
      await verifyEmail({
        email: email.trim().toLowerCase(),
        otp: fullOtp,
      }).unwrap();

      setStatusMessage("Email verified successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setErrorMessage(
        err?.data?.message || err?.error || "Invalid or expired OTP code. Please try again."
      );
    }
  };

  const handleResend = async () => {
    if (!email) {
      setErrorMessage("Please specify your email address to resend OTP.");
      return;
    }
    setErrorMessage("");
    try {
      await resendOtp({ email: email.trim().toLowerCase() }).unwrap();
      setStatusMessage("A new 6-digit verification code has been sent to your email.");
    } catch (err) {
      setErrorMessage(err?.data?.message || "Failed to resend OTP. Please try again later.");
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
            Verify Your Email
          </h1>
          <p className="text-xs text-slate-500 mb-6">
            Enter or paste the 6-digit OTP sent to{" "}
            <span className="font-semibold text-slate-800">
              {email || "your registered email address"}
            </span>
          </p>

          {/* Success Status Alert */}
          {statusMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <span className="text-emerald-500 font-bold shrink-0">✓</span>
              <span className="flex-1">{statusMessage}</span>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <span className="text-rose-500 font-bold shrink-0">⚠️</span>
              <span className="flex-1">{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            {!emailParam && (
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1.5">
                  Confirm Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-11 px-4 rounded-md bg-[#FAFAFA] border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#C24188]/20 focus:border-[#C24188] text-sm text-slate-800 transition-all"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium text-slate-800">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="text-[11px] font-semibold text-[#E14E96] hover:underline flex items-center gap-1 cursor-pointer"
                  title="Paste 6-digit OTP directly from clipboard"
                >
                  <span>📋 Paste Code</span>
                </button>
              </div>

              {/* 6 OTP Input Boxes with Copy-Paste Support */}
              <div
                onPaste={handlePaste}
                className="flex items-center justify-between gap-1.5 sm:gap-2"
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    disabled={isLoading}
                    className="w-10 h-12 sm:w-11 sm:h-12 text-center text-lg font-bold rounded-lg bg-[#FAFAFA] border border-slate-200/80 shadow-[0_2px_6px_rgba(0,0,0,0.03)] focus:outline-none focus:ring-2 focus:ring-[#C24188]/30 focus:border-[#C24188] text-slate-900 transition-all disabled:opacity-60"
                  />
                ))}
              </div>
            </div>

            {/* Submit Verification Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-lg bg-[#C24188] hover:bg-[#b03678] active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-base shadow-[0_4px_14px_rgba(194,65,136,0.35)] transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify Account</span>
              )}
            </button>

            {/* Resend OTP */}
            <div className="text-center text-xs text-slate-600 font-normal pt-1">
              Didn't receive the OTP?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-[#E14E96] font-semibold hover:underline cursor-pointer disabled:opacity-50"
              >
                {isResending ? "Resending..." : "Resend Code"}
              </button>
            </div>

            {/* Divider */}
            <div className="text-center text-xs text-slate-500 font-medium my-1">
              -OR-
            </div>

            {/* Return to Login */}
            <div className="text-center text-xs text-slate-600 font-normal">
              Already have verified credentials?{" "}
              <Link
                to="/login"
                className="text-[#E14E96] font-semibold hover:underline transition-colors"
              >
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
