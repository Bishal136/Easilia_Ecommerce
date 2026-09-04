import { apiSlice } from "../../app/apiSlice";

export const reviewApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get Seller Reviews
    getSellerReviews: builder.query({
      query: (params = {}) => ({
        url: "/reviews/seller/list",
        params,
      }),
      providesTags: (result) => {
        const reviews = result?.data?.reviews || result?.reviews || [];
        return [
          ...reviews.map(({ _id }) => ({ type: "Review", id: _id })),
          { type: "Review", id: "SELLER_LIST" },
        ];
      },
    }),

    // 2. Get Product Reviews
    getProductReviews: builder.query({
      query: ({ productId, ...params }) => ({
        url: `/reviews/${productId}`,
        params,
      }),
      providesTags: (result, error, { productId }) => [
        { type: "Review", id: productId },
      ],
    }),

    // 3. Post Official Merchant Reply to Review
    replyReview: builder.mutation({
      query: ({ reviewId, reply }) => ({
        url: `/reviews/${reviewId}/reply`,
        method: "POST",
        body: { reply },
      }),
      invalidatesTags: [{ type: "Review", id: "SELLER_LIST" }, "Review"],
    }),

    // 4. Delete Review
    deleteReview: builder.mutation({
      query: (id) => ({
        url: `/reviews/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Review", id: "SELLER_LIST" },
        { type: "Review", id: "MY_REVIEWS" },
        "Review",
      ],
    }),

    // 5. Create Review
    createReview: builder.mutation({
      query: ({ productId, ...body }) => ({
        url: `/reviews/${productId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [
        "Review",
        "Product",
        "Order",
        { type: "Review", id: `ELIGIBILITY_${productId}` },
        { type: "Review", id: "MY_REVIEWS" },
        { type: "Review", id: "PENDING_REVIEWS" },
      ],
    }),

    // 6. Check Review Eligibility (if buyer purchased product)
    checkReviewEligibility: builder.query({
      query: (productId) => `/reviews/${productId}/eligibility`,
      providesTags: (result, error, productId) => [
        { type: "Review", id: `ELIGIBILITY_${productId}` },
      ],
    }),

    // 7. Get Buyer's Own Reviews (My Reviews)
    getMyReviews: builder.query({
      query: (params = {}) => ({
        url: "/reviews/my/list",
        params,
      }),
      providesTags: (result) => {
        const reviews = result?.data?.reviews || result?.reviews || [];
        return [
          ...reviews.map(({ _id }) => ({ type: "Review", id: _id })),
          { type: "Review", id: "MY_REVIEWS" },
        ];
      },
    }),

    // 8. Update Buyer's Own Review
    updateMyReview: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/reviews/my/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id, productId }) => [
        "Review",
        "Product",
        { type: "Review", id },
        { type: "Review", id: "MY_REVIEWS" },
        { type: "Review", id: "PENDING_REVIEWS" },
        ...(productId ? [{ type: "Review", id: productId }] : []),
      ],
    }),

    // 9. Get Buyer's Purchased Products Pending Review
    getPendingReviews: builder.query({
      query: () => "/reviews/my/pending",
      providesTags: ["Review", "Order", { type: "Review", id: "PENDING_REVIEWS" }],
    }),
  }),
});

export const {
  useGetSellerReviewsQuery,
  useGetProductReviewsQuery,
  useReplyReviewMutation,
  useDeleteReviewMutation,
  useCreateReviewMutation,
  useCheckReviewEligibilityQuery,
  useGetMyReviewsQuery,
  useUpdateMyReviewMutation,
  useGetPendingReviewsQuery,
} = reviewApi;

export default reviewApi;
