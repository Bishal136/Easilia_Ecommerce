import { useMemo } from "react";
import { useSelector } from "react-redux";

/**
 * Custom hook to access authentication status, user data, and role privileges.
 * Resiliently checks Redux store state (state.auth) with localStorage fallback.
 */
export const useAuth = () => {
  // Try reading from Redux store if configured
  const authState = useSelector((state) => state?.auth);

  const authData = useMemo(() => {
    let user = authState?.user || null;
    let token = authState?.token || null;
    let isLoading = authState?.isLoading ?? false;

    // Fallback to localStorage if Redux slice is empty / during initial page hydration
    if (!user && typeof window !== "undefined") {
      try {
        const storedUser =
          localStorage.getItem("easilia_user") || localStorage.getItem("dealport_user");
        const storedToken =
          localStorage.getItem("easilia_token") || localStorage.getItem("dealport_token");
        if (storedUser) {
          user = JSON.parse(storedUser);
        }
        if (storedToken) {
          token = storedToken;
        }
      } catch (err) {
        console.error("Failed to parse stored auth user:", err);
      }
    }

    const isAuthenticated = Boolean(token && user);
    const role = user?.role || (isAuthenticated ? "user" : "guest");
    const isAdmin = role === "admin";
    const isSeller = role === "seller" || role === "admin";
    const shop = user?.shop || null;
    const isShopActive = shop?.status === "active";
    const isShopPending = shop?.status === "pending";

    return {
      user,
      token,
      isAuthenticated,
      isLoading,
      role,
      isAdmin,
      isSeller,
      shop,
      isShopActive,
      isShopPending,
    };
  }, [authState]);

  return authData;
};

export default useAuth;
