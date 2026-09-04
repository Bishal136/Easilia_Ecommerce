import { apiSlice } from "../../app/apiSlice";

export const adminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Dashboard & Analytics
    getAdminDashboard: builder.query({
      query: () => "/admin/dashboard",
      providesTags: ["Admin"],
    }),

    // 2. User Accounts Management
    getAdminUsers: builder.query({
      query: (params = {}) => ({
        url: "/admin/users",
        params,
      }),
      providesTags: ["Admin", "User"],
    }),

    getAdminUserById: builder.query({
      query: (id) => `/admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),

    updateUserRole: builder.mutation({
      query: ({ userId, role }) => ({
        url: `/admin/users/${userId}/role`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: ["Admin", "User"],
    }),

    toggleUserBan: builder.mutation({
      query: ({ userId, isBanned }) => ({
        url: `/admin/users/${userId}/ban`,
        method: "PUT",
        body: { isBanned },
      }),
      invalidatesTags: ["Admin", "User"],
    }),

    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `/admin/users/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Admin", "User"],
    }),

    // 3. Sellers & KYC Management
    getAdminSellers: builder.query({
      query: (params = {}) => ({
        url: "/admin/sellers",
        params,
      }),
      providesTags: (result) => {
        const sellers = result?.data?.sellers || [];
        return [
          ...sellers.map(({ _id }) => ({ type: "Shop", id: _id })),
          { type: "Shop", id: "LIST" },
          "Admin",
        ];
      },
    }),

    getAdminSellerById: builder.query({
      query: (id) => `/admin/sellers/${id}`,
      providesTags: (result, error, id) => [{ type: "Shop", id }],
    }),

    updateSellerStatus: builder.mutation({
      query: ({ shopId, ...body }) => ({
        url: `/admin/sellers/${shopId}/status`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { shopId }) => [
        { type: "Shop", id: shopId },
        { type: "Shop", id: "LIST" },
        "Admin",
        "User",
      ],
    }),

    // 4. Orders & Oversight Management
    getAdminOrders: builder.query({
      query: (params = {}) => ({
        url: "/admin/orders",
        params,
      }),
      providesTags: (result) => {
        const orders = result?.data?.orders || result?.orders || [];
        return [
          ...orders.map(({ _id }) => ({ type: "Order", id: _id })),
          { type: "Order", id: "LIST" },
          "Admin",
        ];
      },
    }),

    getAdminOrderById: builder.query({
      query: (id) => `/admin/orders/${id}`,
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),

    updateAdminOrderStatus: builder.mutation({
      query: ({ orderId, ...body }) => ({
        url: `/admin/orders/${orderId}/status`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "Order", id: orderId },
        { type: "Order", id: "LIST" },
        "Admin",
      ],
    }),

    // 5. Platform Settings & Coupons
    getPlatformSettings: builder.query({
      query: () => "/admin/settings",
      providesTags: ["Admin"],
    }),

    updatePlatformSettings: builder.mutation({
      query: (body) => ({
        url: "/admin/settings",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Admin"],
    }),

    getAdminCoupons: builder.query({
      query: (params = {}) => ({
        url: "/coupons",
        params,
      }),
      providesTags: (result) => {
        const coupons = result?.data?.coupons || result?.coupons || [];
        return [
          ...coupons.map(({ _id }) => ({ type: "Coupon", id: _id })),
          { type: "Coupon", id: "LIST" },
          "Coupon",
        ];
      },
    }),

    createAdminCoupon: builder.mutation({
      query: (body) => ({
        url: "/coupons",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Coupon", id: "LIST" }],
    }),

    updateAdminCoupon: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/coupons/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Coupon", id },
        { type: "Coupon", id: "LIST" },
      ],
    }),

    toggleAdminCouponStatus: builder.mutation({
      query: (id) => ({
        url: `/coupons/${id}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Coupon", id },
        { type: "Coupon", id: "LIST" },
      ],
    }),

    deleteAdminCoupon: builder.mutation({
      query: (id) => ({
        url: `/coupons/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Coupon", id: "LIST" }],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetAdminUsersQuery,
  useGetAdminUserByIdQuery,
  useUpdateUserRoleMutation,
  useToggleUserBanMutation,
  useDeleteUserMutation,
  useGetAdminSellersQuery,
  useGetAdminSellerByIdQuery,
  useUpdateSellerStatusMutation,
  useGetAdminOrdersQuery,
  useGetAdminOrderByIdQuery,
  useUpdateAdminOrderStatusMutation,
  useGetPlatformSettingsQuery,
  useUpdatePlatformSettingsMutation,
  useGetAdminCouponsQuery,
  useCreateAdminCouponMutation,
  useUpdateAdminCouponMutation,
  useToggleAdminCouponStatusMutation,
  useDeleteAdminCouponMutation,
} = adminApi;

export default adminApi;
