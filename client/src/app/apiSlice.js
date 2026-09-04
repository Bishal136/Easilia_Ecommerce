import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, logout } from "../features/auth/authSlice";

// API Base URL (defaults to server port 5000 or relative /api/v1 via proxy)
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include", // Include cookies for refreshToken
  prepareHeaders: (headers, { getState }) => {
    // 1. Check Redux auth state and localStorage
    const token =
      getState()?.auth?.token ||
      localStorage.getItem("easilia_token") ||
      localStorage.getItem("dealport_token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // If 401 Unauthorized received, attempt automatic token refresh
  if (result.error && result.error.status === 401) {
    const url = typeof args === "string" ? args : args?.url || "";
    const isAuthRoute =
      url.includes("/auth/refresh-token") ||
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/reset-password");

    if (!isAuthRoute) {
      const storedRefreshToken =
        api.getState()?.auth?.refreshToken ||
        localStorage.getItem("easilia_refresh_token") ||
        localStorage.getItem("dealport_refresh_token");

      if (storedRefreshToken) {
        const refreshResult = await baseQuery(
          {
            url: "/auth/refresh-token",
            method: "POST",
            body: { refreshToken: storedRefreshToken },
          },
          api,
          extraOptions
        );

        if (refreshResult.data) {
          const responseData = refreshResult.data.data || refreshResult.data;
          const newAccessToken = responseData.accessToken || responseData.token;
          const newRefreshToken = responseData.refreshToken;
          const user = responseData.user;

          if (newAccessToken) {
            api.dispatch(
              setCredentials({
                user: user || api.getState()?.auth?.user,
                token: newAccessToken,
                refreshToken: newRefreshToken || storedRefreshToken,
              })
            );
            // Retry the original query with the new token
            result = await baseQuery(args, api, extraOptions);
          } else {
            api.dispatch(logout());
          }
        } else {
          api.dispatch(logout());
        }
      } else {
        api.dispatch(logout());
      }
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "User",
    "Shop",
    "Product",
    "Category",
    "Brand",
    "Order",
    "Review",
    "Coupon",
    "Banner",
    "Chat",
    "Notification",
    "Admin",
  ],
  endpoints: () => ({}),
});

export default apiSlice;
