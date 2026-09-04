import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Route Guards
import ProtectedRoute from "./ProtectedRoute";
import SellerRoute from "./SellerRoute";
import AdminRoute from "./AdminRoute";

// UI Loading Fallback
import Spinner from "../components/ui/Spinner";

// Layout Structures
import PublicLayout from "../components/layout/PublicLayout";
import UserLayout from "../components/layout/UserLayout";
import SellerLayout from "../components/layout/SellerLayout";
import AdminLayout from "../components/layout/AdminLayout";

// Lazy Loaded Auth Suite
const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("../pages/auth/RegisterPage"));
const SellerRegisterPage = lazy(() => import("../pages/auth/SellerRegisterPage"));
const ForgotPasswordPage = lazy(() => import("../pages/auth/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("../pages/auth/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("../pages/auth/VerifyEmailPage"));

// Lazy Loaded Public Storefront Suite
const HomePage = lazy(() => import("../pages/public/HomePage"));
const ProductListPage = lazy(() => import("../pages/public/ProductListPage"));
const ProductDetailPage = lazy(() => import("../pages/public/ProductDetailPage"));
const ShopPage = lazy(() => import("../pages/public/ShopPage"));
const CartPage = lazy(() => import("../pages/public/CartPage"));
const CheckoutPage = lazy(() => import("../pages/public/CheckoutPage"));
const PaymentSuccessPage = lazy(() => import("../pages/public/PaymentSuccessPage"));
const PaymentFailPage = lazy(() => import("../pages/public/PaymentFailPage"));

// Lazy Loaded Buyer Dashboard Suite
const UserDashboard = lazy(() => import("../pages/user/UserDashboard"));
const OrdersPage = lazy(() => import("../pages/user/OrdersPage"));
const WishlistPage = lazy(() => import("../pages/user/WishlistPage"));
const ProfilePage = lazy(() => import("../pages/user/ProfilePage"));
const UserMessagesPage = lazy(() => import("../pages/user/UserMessagesPage"));
const MyReviewsPage = lazy(() => import("../pages/user/MyReviewsPage"));
const ChangePasswordPage = lazy(() => import("../pages/user/ChangePasswordPage"));

// Lazy Loaded Merchant Seller Hub Suite
const SellerDashboard = lazy(() => import("../pages/seller/SellerDashboard"));
const SellerProductsPage = lazy(() => import("../pages/seller/SellerProductsPage"));
const SellerOrdersPage = lazy(() => import("../pages/seller/SellerOrdersPage"));
const SellerReviewsPage = lazy(() => import("../pages/seller/SellerReviewsPage"));
const SellerMessagesPage = lazy(() => import("../pages/seller/SellerMessagesPage"));
const ShopProfilePage = lazy(() => import("../pages/seller/ShopProfilePage"));
const SellerWithdrawalsPage = lazy(() => import("../pages/seller/SellerWithdrawalsPage"));

// Lazy Loaded Platform Admin Suite
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
const AdminSellersPage = lazy(() => import("../pages/admin/AdminSellersPage"));
const AdminCategoriesPage = lazy(() => import("../pages/admin/AdminCategoriesPage"));
const AdminOrdersPage = lazy(() => import("../pages/admin/AdminOrdersPage"));
const AdminBannersPage = lazy(() => import("../pages/admin/AdminBannersPage"));
const AdminSettingsPage = lazy(() => import("../pages/admin/AdminSettingsPage"));

// Error Boundaries & Fallback Pages
const NotFoundPage = lazy(() => import("../pages/errors/NotFoundPage"));
const ForbiddenPage = lazy(() => import("../pages/errors/ForbiddenPage"));

/**
 * AppRoutes: Central Application Router configuring the DealPort Multi-Vendor Platform.
 * Features:
 * - Code-split lazy loading with Suspense fallbacks (<150KB initial bundle target)
 * - Public Storefront layout wrapping search, catalog, product details, cart, and reviews
 * - Glassmorphism Authentication flows
 * - RBAC route guards for Buyer (ProtectedRoute), Merchant (SellerRoute), and Platform Admin (AdminRoute)
 */
export const AppRoutes = () => {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
          <Spinner size="lg" text="Loading Easilia Experience..." />
        </div>
      }
    >
      <Routes>
        {/* ========================================================================= */}
        {/* 1. PUBLIC STOREFRONT ROUTES (Wrapped in PublicLayout)                     */}
        {/* ========================================================================= */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="product/:slug" element={<ProductDetailPage />} />
          <Route path="shops/:slug" element={<ShopPage />} />
          <Route path="shop/:slug" element={<ShopPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="payment/success" element={<PaymentSuccessPage />} />
          <Route path="payment-success" element={<PaymentSuccessPage />} />
          <Route path="payment/fail" element={<PaymentFailPage />} />
          <Route path="payment-fail" element={<PaymentFailPage />} />
        </Route>

        {/* ========================================================================= */}
        {/* 2. AUTHENTICATION SUITE (Glassmorphism Split Layout)                      */}
        {/* ========================================================================= */}
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="register-seller" element={<SellerRegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />

        {/* ========================================================================= */}
        {/* 3. BUYER DASHBOARD & CHECKOUT (ProtectedRoute)                           */}
        {/* ========================================================================= */}
        <Route element={<ProtectedRoute />}>
          {/* Standalone Protected Checkout Route with Public Navigation Header */}
          <Route element={<PublicLayout />}>
            <Route path="checkout" element={<CheckoutPage />} />
          </Route>

          {/* User Account Portal wrapped in UserLayout */}
          <Route path="user" element={<UserLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="wishlist" element={<WishlistPage />} />
            <Route path="messages" element={<UserMessagesPage />} />
            <Route path="reviews" element={<MyReviewsPage />} />
            <Route path="change-password" element={<ChangePasswordPage />} />
            <Route path="password" element={<ChangePasswordPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* ========================================================================= */}
        {/* 4. MERCHANT SELLER HUB SUITE (SellerRoute -> SellerLayout)                */}
        {/* ========================================================================= */}
        <Route element={<SellerRoute />}>
          <Route path="seller" element={<SellerLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="products" element={<SellerProductsPage />} />
            <Route path="orders" element={<SellerOrdersPage />} />
            <Route path="reviews" element={<SellerReviewsPage />} />
            <Route path="messages" element={<SellerMessagesPage />} />
            <Route path="profile" element={<ShopProfilePage />} />
            <Route path="withdrawals" element={<SellerWithdrawalsPage />} />
          </Route>
        </Route>

        {/* ========================================================================= */}
        {/* 5. PLATFORM ADMINISTRATOR SUITE (AdminRoute -> AdminLayout)               */}
        {/* ========================================================================= */}
        <Route element={<AdminRoute />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="sellers" element={<AdminSellersPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="banners" element={<AdminBannersPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>

        {/* ========================================================================= */}
        {/* 6. ERROR HANDLING & WILDCARD CATCH-ALL                                    */}
        {/* ========================================================================= */}
        <Route path="forbidden" element={<ForbiddenPage />} />
        <Route path="403" element={<ForbiddenPage />} />
        <Route path="404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
