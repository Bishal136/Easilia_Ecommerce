import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Spinner from "../components/ui/Spinner";

/**
 * ProtectedRoute: Route guard for authenticated buyer/user routes.
 *
 * @param {Object} props
 * @param {string[]} [props.allowedRoles] - Optional list of authorized roles
 * @param {string} [props.redirectPath="/login"] - Path to redirect if unauthenticated
 * @param {React.ReactNode} [props.children] - Optional custom children
 */
export const ProtectedRoute = ({
  allowedRoles,
  redirectPath = "/login",
  children,
}) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Spinner size="lg" text="Verifying authentication..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/forbidden" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
