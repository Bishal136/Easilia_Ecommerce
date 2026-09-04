import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  KeyRound,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  ShieldAlert,
  Info,
  Check,
} from "lucide-react";
import { useChangePasswordMutation } from "../../features/user/userApi";

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [status, setStatus] = useState({ type: "", message: "" });

  // Password rules validation
  const rules = useMemo(() => {
    const pwd = form.newPassword;
    return {
      minLength: pwd.length >= 8,
      hasUpper: /[A-Z]/.test(pwd),
      hasLower: /[a-z]/.test(pwd),
      hasNumberOrSymbol: /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
    };
  }, [form.newPassword]);

  // Strength score: 0 to 4
  const strengthScore = useMemo(() => {
    let score = 0;
    if (rules.minLength) score += 1;
    if (rules.hasUpper) score += 1;
    if (rules.hasLower) score += 1;
    if (rules.hasNumberOrSymbol) score += 1;
    return score;
  }, [rules]);

  const strengthLabel = useMemo(() => {
    if (!form.newPassword) return { text: "Too Short", color: "text-slate-400", bg: "bg-slate-200" };
    switch (strengthScore) {
      case 1:
        return { text: "Weak", color: "text-rose-500", bg: "bg-rose-500" };
      case 2:
        return { text: "Fair", color: "text-amber-500", bg: "bg-amber-500" };
      case 3:
        return { text: "Good", color: "text-blue-500", bg: "bg-blue-500" };
      case 4:
        return { text: "Strong", color: "text-emerald-500", bg: "bg-emerald-500" };
      default:
        return { text: "Weak", color: "text-rose-500", bg: "bg-rose-500" };
    }
  }, [strengthScore, form.newPassword]);

  const passwordsMatch =
    form.confirmPassword.length > 0 && form.newPassword === form.confirmPassword;
  const passwordsMismatch =
    form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });

    if (!form.currentPassword) {
      setStatus({ type: "error", message: "Please enter your current password." });
      return;
    }

    if (form.newPassword.length < 6) {
      setStatus({ type: "error", message: "New password must be at least 6 characters long." });
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setStatus({ type: "error", message: "New password and confirmation do not match." });
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setStatus({
        type: "error",
        message: "New password must be different from your current password.",
      });
      return;
    }

    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }).unwrap();

      setStatus({
        type: "success",
        message: "Password changed successfully! Your account credentials have been updated.",
      });

      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err?.data?.message || err?.error || "Failed to change password. Please verify your current password.",
      });
    }
  };

  const isGoogleAccount = user?.authProvider === "google" && !user?.hasPassword;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* 1. Top Breadcrumb / Return */}
      <div className="flex items-center justify-between">
        <Link
          to="/user/profile"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#166534] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Profile</span>
        </Link>

        <span className="text-xs text-slate-400 font-medium">Account Security</span>
      </div>

      {/* 2. Header Banner Card */}
      <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold shadow-xs shrink-0">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Change Password
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Protect your account with a strong, secure password.
            </p>
          </div>
        </div>

        {user?.email && (
          <div className="bg-slate-50 dark:bg-slate-900/60 px-4 py-2 rounded-2xl border border-slate-200/60 dark:border-slate-800 shrink-0 self-start sm:self-center text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
              Signed in as
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {user.email}
            </span>
          </div>
        )}
      </div>

      {/* Google OAuth Banner (if Google user) */}
      {isGoogleAccount ? (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 p-6 rounded-3xl space-y-3">
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-300 font-bold text-sm">
            <Info className="w-5 h-5" />
            <span>Google Single Sign-On Active</span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            Your account is authenticated directly through your Google account. You do not have a separate marketplace password. To manage your sign-in security, please visit your Google Account Security Settings.
          </p>
          <Link
            to="/user/profile"
            className="inline-block px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors"
          >
            Return to Profile
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              {/* Status Notifications */}
              {status.message && (
                <div
                  className={`p-4 rounded-2xl text-xs flex items-start gap-3 animate-in fade-in duration-150 ${
                    status.type === "success"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                  }`}
                >
                  {status.type === "success" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <span className="font-bold block">
                      {status.type === "success" ? "Password Updated" : "Unable to Change Password"}
                    </span>
                    <span className="text-[11px] leading-relaxed opacity-90">{status.message}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 1. Current Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Current Password <span className="text-rose-500">*</span>
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-semibold text-[#166534] hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={form.currentPassword}
                      onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                      placeholder="Enter your current password"
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-1" />

                {/* 2. New Password */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    New Password <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={form.newPassword}
                      onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                      placeholder="Enter new password (min. 8 characters)"
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Progress Bar */}
                  {form.newPassword.length > 0 && (
                    <div className="space-y-1.5 pt-1 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Strength:</span>
                        <span className={`font-bold ${strengthLabel.color}`}>
                          {strengthLabel.text}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 h-1.5">
                        {[1, 2, 3, 4].map((bar) => (
                          <div
                            key={bar}
                            className={`rounded-full transition-colors ${
                              strengthScore >= bar ? strengthLabel.bg : "bg-slate-200 dark:bg-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      placeholder="Re-enter your new password"
                      className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-2xl border bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none transition-all ${
                        passwordsMatch
                          ? "border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          : passwordsMismatch
                          ? "border-rose-400 focus:ring-2 focus:ring-rose-400/20"
                          : "border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534]"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Match Indicator */}
                  {passwordsMatch && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Passwords match</span>
                    </span>
                  )}
                  {passwordsMismatch && (
                    <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Passwords do not match yet</span>
                    </span>
                  )}
                </div>

                {/* Submit and Cancel Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      setStatus({ type: "", message: "" });
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Clear Form
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || !form.currentPassword || !form.newPassword}
                    className="px-6 py-2.5 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Side Column: Security Requirements & Tips */}
          <div className="space-y-4">
            {/* Live Requirements Checklist */}
            <div className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-600" />
                <span>Password Requirements</span>
              </h3>

              <div className="space-y-2.5 text-xs">
                <div
                  className={`flex items-center gap-2 transition-colors ${
                    rules.minLength ? "text-emerald-600 font-bold" : "text-slate-500"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                      rules.minLength ? "bg-emerald-100 text-emerald-700 font-bold" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {rules.minLength ? "✓" : "•"}
                  </div>
                  <span>At least 8 characters long</span>
                </div>

                <div
                  className={`flex items-center gap-2 transition-colors ${
                    rules.hasUpper ? "text-emerald-600 font-bold" : "text-slate-500"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                      rules.hasUpper ? "bg-emerald-100 text-emerald-700 font-bold" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {rules.hasUpper ? "✓" : "•"}
                  </div>
                  <span>At least one uppercase letter (A-Z)</span>
                </div>

                <div
                  className={`flex items-center gap-2 transition-colors ${
                    rules.hasLower ? "text-emerald-600 font-bold" : "text-slate-500"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                      rules.hasLower ? "bg-emerald-100 text-emerald-700 font-bold" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {rules.hasLower ? "✓" : "•"}
                  </div>
                  <span>At least one lowercase letter (a-z)</span>
                </div>

                <div
                  className={`flex items-center gap-2 transition-colors ${
                    rules.hasNumberOrSymbol ? "text-emerald-600 font-bold" : "text-slate-500"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${
                      rules.hasNumberOrSymbol
                        ? "bg-emerald-100 text-emerald-700 font-bold"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {rules.hasNumberOrSymbol ? "✓" : "•"}
                  </div>
                  <span>At least one number or symbol</span>
                </div>
              </div>
            </div>

            {/* Security Best Practices */}
            <div className="bg-slate-50/70 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Security Recommendations</span>
              </h4>
              <ul className="text-[11px] text-slate-500 space-y-2 leading-relaxed">
                <li>• Avoid using birthdays, phone numbers, or common dictionary words.</li>
                <li>• Do not reuse this password on other online services or social media.</li>
                <li>• Never share your credentials. Easilia staff will never ask for your password.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangePasswordPage;
