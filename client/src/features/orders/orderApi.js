import { apiSlice } from "../../app/apiSlice";

export const orderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get Seller Orders
    getSellerOrders: builder.query({
      query: (params = {}) => ({
        url: "/orders/seller/list",
        params,
      }),
      providesTags: (result) => {
        const orders = result?.data?.orders || result?.orders || [];
        return [
          ...orders.map(({ _id }) => ({ type: "Order", id: _id })),
          { type: "Order", id: "SELLER_LIST" },
        ];
      },
    }),

    // 2. Update Seller Order Item Status (e.g. processing, shipped, delivered, cancelled)
    updateSellerOrderItemStatus: builder.mutation({
      query: ({ orderId, itemId, status }) => ({
        url: `/orders/seller/${orderId}/items/${itemId}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: [
        { type: "Order", id: "SELLER_LIST" },
        "Order",
        "Shop",
      ],
    }),

    // 3. Get Single Order Details
    getOrderById: builder.query({
      query: (id) => `/orders/${id}`,
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),
    // 4. Get Buyer User Orders
    getUserOrders: builder.query({
      query: (params = {}) => ({
        url: "/users/orders",
        params,
      }),
      providesTags: ["Order"],
    }),

    // 5. Cancel Order
    cancelOrder: builder.mutation({
      query: (id) => ({
        url: `/orders/${id}/cancel`,
        method: "PUT",
      }),
      invalidatesTags: ["Order", "User"],
    }),

    // 6. Create New Order (Checkout)
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: "/orders",
        method: "POST",
        body: orderData,
      }),
      invalidatesTags: ["Order", "Product", "User", "Review"],
    }),
  }),
});

export const {
  useGetSellerOrdersQuery,
  useUpdateSellerOrderItemStatusMutation,
  useGetOrderByIdQuery,
  useGetUserOrdersQuery,
  useCancelOrderMutation,
  useCreateOrderMutation,
} = orderApi;

export default orderApi;
