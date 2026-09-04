import React from "react";
import { Link, useLocation } from "react-router-dom";

export const ForbiddenPage = () => {
  const location = useLocation();
  const requiredRole = location.state?.requiredRole;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 text-slate-100">
      <div className="text-center max-w-md bg-slate-800/80 border border-slate-700 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="text-7xl font-black text-rose-500 mb-2">403</div>
        <h2 className="text-2xl font-bold text-slate-100 mb-3">Access Denied</h2>
        <p className="text-sm text-slate-300 mb-6">
          You do not have the required permissions
          {requiredRole ? ` (${requiredRole} privileges)` : ""} to view this protected Easilia resource.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-medium text-sm transition-all shadow-md"
          >
            Return to Store
          </Link>
          <Link
            to="/login"
            className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm transition-all"
          >
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
