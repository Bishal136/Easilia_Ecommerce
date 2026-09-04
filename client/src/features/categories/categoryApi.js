import { apiSlice } from "../../app/apiSlice";

export const categoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get all categories (supports flat=true or hierarchical tree)
    getCategories: builder.query({
      query: (params = {}) => ({
        url: "/categories",
        params,
      }),
      providesTags: (result) => {
        const categories = result?.data?.categories || [];
        return [
          ...categories.map(({ _id }) => ({ type: "Category", id: _id })),
          { type: "Category", id: "LIST" },
        ];
      },
    }),

    // 2. Get single category by ID
    getCategoryById: builder.query({
      query: (id) => `/categories/${id}`,
      providesTags: (result, error, id) => [{ type: "Category", id }],
    }),

    // 3. Create new category (Admin)
    createCategory: builder.mutation({
      query: (body) => ({
        url: "/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Category", id: "LIST" }, "Admin"],
    }),

    // 4. Update category (Admin)
    updateCategory: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/categories/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Category", id },
        { type: "Category", id: "LIST" },
        "Admin",
      ],
    }),

    // 5. Delete category (Admin)
    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Category", id: "LIST" }, "Admin"],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;

export default categoryApi;
