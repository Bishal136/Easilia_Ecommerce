import { apiSlice } from "../../app/apiSlice";

export const shopApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get Own Shop details for logged-in Seller
    getOwnShop: builder.query({
      query: () => "/shops/seller/me",
      providesTags: ["Shop"],
    }),

    // 2. Get Public Shop by Slug
    getShopBySlug: builder.query({
      query: (slug) => `/shops/slug/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Shop", id: slug }],
    }),

    // 3. Update Own Shop Details (Profile, Address, Location, Tax IDs)
    updateOwnShop: builder.mutation({
      query: (body) => ({
        url: "/shops/seller/me",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Shop", "Auth", "User"],
    }),

    // 4. Update Shop Media (Logo & Banner)
    updateShopMedia: builder.mutation({
      query: (body) => ({
        url: "/shops/seller/me/media",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Shop"],
    }),

    // 5. Update Shop Bank & Mobile Banking Details
    updateBankDetails: builder.mutation({
      query: (body) => ({
        url: "/shops/seller/me/bank",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Shop"],
    }),

    // 6. Get Seller Withdrawals
    getSellerWithdrawals: builder.query({
      query: () => "/withdrawals/seller",
      providesTags: ["Shop"],
    }),

    // 7. Request Withdrawal
    requestWithdrawal: builder.mutation({
      query: (body) => ({
        url: "/withdrawals",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Shop"],
    }),
  }),
});

export const {
  useGetOwnShopQuery,
  useGetShopBySlugQuery,
  useUpdateOwnShopMutation,
  useUpdateShopMediaMutation,
  useUpdateBankDetailsMutation,
  useGetSellerWithdrawalsQuery,
  useRequestWithdrawalMutation,
} = shopApi;

export default shopApi;
