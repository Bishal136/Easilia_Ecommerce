import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Spinner from "../components/ui/Spinner";

/**
 * AdminRoute: Route guard for Platform Administrator Suite routes (/admin/*).
 * Verifies the user is authenticated and possesses the 'admin' role.
 *
 * @param {Object} props
 * @param {string} [props.redirectPath="/login"] - Path to redirect if unauthenticated
 * @param {React.ReactNode} [props.children] - Optional custom children
 */
export const AdminRoute = ({ redirectPath = "/login", children }) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Spinner size="lg" text="Verifying administrator credentials..." className="border-purple-500" />
      </div>
    );
  }

  // Not logged in -> Redirect to login with return path
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Logged in but not platform admin -> Redirect to forbidden
  if (!isAdmin) {
    return <Navigate to="/forbidden" state={{ from: location, requiredRole: "admin" }} replace />;
  }

  // Render admin layout / outlet
  return children ? children : <Outlet />;
};

export default AdminRoute;
