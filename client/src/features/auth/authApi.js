import { apiSlice } from "../../app/apiSlice";
import { setCredentials, logout as logoutAction } from "./authSlice";

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. User / Buyer Login
    login: builder.mutation({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Extract user, token and optional shop data
          const responseData = data?.data || data;
          const user = responseData?.user;
          const token = responseData?.accessToken || responseData?.token;
          const refreshToken = responseData?.refreshToken;
          const shop = responseData?.shop;

          if (user && token) {
            dispatch(
              setCredentials({
                user: { ...user, shop: shop || user.shop },
                token,
                refreshToken,
              })
            );
          }
        } catch (err) {
          // Handled by component
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),

    // 2. User / Buyer Registration
    register: builder.mutation({
      query: (userData) => ({
        url: "/auth/register",
        method: "POST",
        body: userData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const responseData = data?.data || data;
          const user = responseData?.user;
          const token = responseData?.accessToken || responseData?.token;
          const refreshToken = responseData?.refreshToken;

          if (user && token) {
            dispatch(
              setCredentials({
                user,
                token,
                refreshToken,
              })
            );
          }
        } catch (err) {
          // Handled by component
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),

    // 3. Merchant / Seller Registration
    registerSeller: builder.mutation({
      query: (sellerData) => ({
        url: "/auth/register-seller",
        method: "POST",
        body: sellerData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const responseData = data?.data || data;
          const user = responseData?.user;
          const token = responseData?.accessToken || responseData?.token;
          const refreshToken = responseData?.refreshToken;
          const shop = responseData?.shop;

          if (user && token) {
            dispatch(
              setCredentials({
                user: { ...user, shop },
                token,
                refreshToken,
              })
            );
          }
        } catch (err) {
          // Handled by component
        }
      },
      invalidatesTags: ["Auth", "User", "Shop"],
    }),

    // 4. Google OAuth Sign-In
    googleLogin: builder.mutation({
      query: (tokenPayload) => ({
        url: "/auth/google",
        method: "POST",
        body: tokenPayload,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const responseData = data?.data || data;
          const user = responseData?.user;
          const token = responseData?.accessToken || responseData?.token;
          const refreshToken = responseData?.refreshToken;
          const shop = responseData?.shop;

          if (user && token) {
            dispatch(
              setCredentials({
                user: { ...user, shop: shop || user.shop },
                token,
                refreshToken,
              })
            );
          }
        } catch (err) {
          // Handled by component
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),

    // 5. Get Current User Profile (Me)
    getMe: builder.query({
      query: () => "/auth/me",
      providesTags: ["Auth", "User"],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const responseData = data?.data || data;
          const user = responseData?.user;
          const shop = responseData?.shop;

          if (user) {
            const existingToken =
              localStorage.getItem("easilia_token") || localStorage.getItem("dealport_token");
            dispatch(
              setCredentials({
                user: { ...user, shop: shop || user.shop },
                token: existingToken,
              })
            );
          }
        } catch (err) {
          // Unauthorized or session expired
        }
      },
    }),

    // 6. Logout
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(logoutAction());
          dispatch(apiSlice.util.resetApiState());
        } catch (err) {
          dispatch(logoutAction());
        }
      },
      invalidatesTags: ["Auth", "User"],
    }),

    // 7. Verify Email OTP
    verifyEmail: builder.mutation({
      query: (payload) => ({
        url: "/auth/verify-email",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    // 8. Resend Email OTP
    resendOtp: builder.mutation({
      query: (payload) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body: payload,
      }),
    }),

    // 9. Forgot Password
    forgotPassword: builder.mutation({
      query: (payload) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: payload,
      }),
    }),

    // 10. Reset Password
    resetPassword: builder.mutation({
      query: ({ token, password }) => ({
        url: `/auth/reset-password/${token}`,
        method: "POST",
        body: { password },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRegisterSellerMutation,
  useGoogleLoginMutation,
  useGetMeQuery,
  useLogoutMutation,
  useVerifyEmailMutation,
  useResendOtpMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;

export default authApi;
