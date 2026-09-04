import { apiSlice } from "../../app/apiSlice";

export const productApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get Products with Search, Category, Price & Pagination filters
    getProducts: builder.query({
      query: (params = {}) => ({
        url: "/products",
        params,
      }),
      providesTags: (result) => {
        const products = result?.data?.products || result?.products || [];
        return [
          ...products.map(({ _id }) => ({ type: "Product", id: _id })),
          { type: "Product", id: "LIST" },
        ];
      },
    }),

    // 2. Get Featured Products
    getFeaturedProducts: builder.query({
      query: (params = {}) => ({
        url: "/products/featured",
        params,
      }),
      providesTags: [{ type: "Product", id: "FEATURED" }],
    }),

    // 3. Get Trending Products
    getTrendingProducts: builder.query({
      query: (params = {}) => ({
        url: "/products/trending",
        params,
      }),
      providesTags: [{ type: "Product", id: "TRENDING" }],
    }),

    // 4. Get Product Details by Slug
    getProductBySlug: builder.query({
      query: (slug) => `/products/slug/${slug}`,
      providesTags: (result, error, slug) => [{ type: "Product", id: slug }],
    }),

    // 5. Get Product Details by ID
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: (result, error, id) => [{ type: "Product", id }],
    }),

    // 6. Create New Product (Seller/Admin)
    createProduct: builder.mutation({
      query: (body) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Product", id: "LIST" }, "Product"],
    }),

    // 7. Update Product (Seller/Admin)
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Product", id },
        { type: "Product", id: "LIST" },
      ],
    }),

    // 8. Delete Product (Seller/Admin)
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Product", id: "LIST" }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetFeaturedProductsQuery,
  useGetTrendingProductsQuery,
  useGetProductBySlugQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productApi;

export default productApi;

