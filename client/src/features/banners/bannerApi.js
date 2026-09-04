import { apiSlice } from "../../app/apiSlice";

export const bannerApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get Banners (with position and status filters)
    getBanners: builder.query({
      query: (params = {}) => ({
        url: "/banners",
        params,
      }),
      providesTags: (result) => {
        const banners = result?.data?.banners || result?.banners || [];
        return [
          ...banners.map(({ _id }) => ({ type: "Banner", id: _id })),
          { type: "Banner", id: "LIST" },
          "Banner",
        ];
      },
    }),

    // 2. Create Banner
    createBanner: builder.mutation({
      query: (body) => ({
        url: "/banners",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Banner", id: "LIST" }],
    }),

    // 3. Update Banner
    updateBanner: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/banners/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Banner", id },
        { type: "Banner", id: "LIST" },
      ],
    }),

    // 4. Delete Banner
    deleteBanner: builder.mutation({
      query: (id) => ({
        url: `/banners/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Banner", id: "LIST" }],
    }),
  }),
});

export const {
  useGetBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} = bannerApi;

export default bannerApi;
