import { apiSlice } from "../../app/apiSlice";
import { setCredentials } from "../auth/authSlice";

export const userApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get User Profile
    getProfile: builder.query({
      query: () => "/users/profile",
      providesTags: ["User", "Auth"],
      transformResponse: (response) => response?.data?.user || response?.user || response?.data || response,
    }),

    // 2. Update User Profile
    updateProfile: builder.mutation({
      query: (body) => ({
        url: "/users/profile",
        method: "PUT",
        body,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
        try {
          const { data } = await queryFulfilled;
          const updatedUser = data?.data?.user || data?.user || data?.data || data;
          if (updatedUser) {
            const currentToken = getState()?.auth?.token || localStorage.getItem("easilia_token");
            const currentRefreshToken = getState()?.auth?.refreshToken || localStorage.getItem("easilia_refresh_token");
            dispatch(
              setCredentials({
                user: updatedUser,
                token: currentToken,
                refreshToken: currentRefreshToken,
              })
            );
          }
        } catch {
          // Handled by component
        }
      },
      invalidatesTags: ["User", "Auth"],
    }),

    // 3. Change Password
    changePassword: builder.mutation({
      query: (body) => ({
        url: "/users/change-password",
        method: "PUT",
        body,
      }),
    }),

    // 4. Add Address
    addAddress: builder.mutation({
      query: (body) => ({
        url: "/users/addresses",
        method: "POST",
        body,
      }),
      invalidatesTags: ["User", "Auth"],
    }),

    // 5. Update Address
    updateAddress: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/users/addresses/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User", "Auth"],
    }),

    // 6. Delete Address
    deleteAddress: builder.mutation({
      query: (id) => ({
        url: `/users/addresses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User", "Auth"],
    }),

    // 7. Upload Image / File
    uploadImage: builder.mutation({
      query: (formData) => ({
        url: "/upload/single",
        method: "POST",
        body: formData,
      }),
      transformResponse: (response) =>
        response?.data?.file || response?.file || response?.data || response,
    }),

    // 8. Get Wishlist
    getWishlist: builder.query({
      query: () => "/users/wishlist",
      providesTags: ["Wishlist"],
      transformResponse: (response) => response?.data?.wishlist || response?.wishlist || [],
    }),

    // 9. Toggle Wishlist Item
    toggleWishlist: builder.mutation({
      query: (productId) => ({
        url: `/users/wishlist/${productId}`,
        method: "POST",
      }),
      invalidatesTags: ["Wishlist", "User"],
    }),
  }),
});

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useUploadImageMutation,
  useGetWishlistQuery,
  useToggleWishlistMutation,
} = userApi;

export default userApi;
