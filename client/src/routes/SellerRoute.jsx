import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Spinner from "../components/ui/Spinner";

/**
 * SellerRoute: Route guard for Merchant Seller Hub routes (/seller/*).
 * Verifies the user is authenticated and possesses the 'seller' or 'admin' role.
 *
 * @param {Object} props
 * @param {string} [props.redirectPath="/login"] - Path to redirect if unauthenticated
 * @param {React.ReactNode} [props.children] - Optional custom children
 */
export const SellerRoute = ({ redirectPath = "/login", children }) => {
  const { isAuthenticated, isLoading, isSeller } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Spinner size="lg" text="Authenticating merchant hub..." className="border-fuchsia-500" />
      </div>
    );
  }

  // Not logged in -> Redirect to login with return path
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // Logged in but not a seller or admin -> Redirect to forbidden
  if (!isSeller) {
    return <Navigate to="/forbidden" state={{ from: location, requiredRole: "seller" }} replace />;
  }

  // Render seller layout / outlet
  return children ? children : <Outlet />;
};

export default SellerRoute;
