import apiSlice from "../../app/apiSlice";

export const couponApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Apply coupon (used in Checkout)
    applyCoupon: builder.mutation({
      query: (body) => ({
        url: "/coupons/apply",
        method: "POST",
        body,
      }),
    }),

    // Get all coupons (Admin / Seller)
    getCoupons: builder.query({
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

    // Create coupon
    createCoupon: builder.mutation({
      query: (body) => ({
        url: "/coupons",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Coupon", id: "LIST" }],
    }),

    // Update coupon
    updateCoupon: builder.mutation({
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

    // Toggle coupon active/inactive status
    toggleCouponStatus: builder.mutation({
      query: (id) => ({
        url: `/coupons/${id}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Coupon", id },
        { type: "Coupon", id: "LIST" },
      ],
    }),

    // Delete coupon
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `/coupons/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Coupon", id: "LIST" }],
    }),
  }),
});

export const {
  useApplyCouponMutation,
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useToggleCouponStatusMutation,
  useDeleteCouponMutation,
} = couponApi;

export default couponApi;
