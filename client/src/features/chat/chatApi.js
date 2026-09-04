import { apiSlice } from "../../app/apiSlice";

export const chatApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 1. Get All Conversations for User / Seller
    getUserChats: builder.query({
      query: () => "/chat",
      providesTags: (result) => {
        const chats = result?.data?.chats || result?.chats || [];
        return [
          ...chats.map(({ _id }) => ({ type: "Chat", id: _id })),
          { type: "Chat", id: "LIST" },
        ];
      },
    }),

    // 2. Get Messages for a Conversation
    getChatMessages: builder.query({
      query: ({ chatId, ...params }) => ({
        url: `/chat/${chatId}/messages`,
        params,
      }),
      providesTags: (result, error, { chatId }) => [
        { type: "Chat", id: chatId },
      ],
    }),

    // 3. Send Message in Conversation
    sendMessage: builder.mutation({
      query: ({ chatId, content, attachments, product }) => ({
        url: `/chat/${chatId}/messages`,
        method: "POST",
        body: { content, attachments, product },
      }),
      invalidatesTags: (result, error, { chatId }) => [
        { type: "Chat", id: chatId },
        { type: "Chat", id: "LIST" },
      ],
    }),

    // 4. Create or Get Existing Chat
    getOrCreateChat: builder.mutation({
      query: (body) => ({
        url: "/chat",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Chat", id: "LIST" }],
    }),

    // 5. Mark Conversation as Read
    markChatAsRead: builder.mutation({
      query: (chatId) => ({
        url: `/chat/${chatId}/read`,
        method: "PATCH",
      }),
      invalidatesTags: (result, error, chatId) => [
        { type: "Chat", id: chatId },
        { type: "Chat", id: "UNREAD" },
      ],
    }),

    // 6. Get Total Unread Messages Count
    getUnreadCount: builder.query({
      query: () => "/chat/unread-count",
      providesTags: [{ type: "Chat", id: "UNREAD" }],
    }),
  }),
});

export const {
  useGetUserChatsQuery,
  useGetChatMessagesQuery,
  useSendMessageMutation,
  useGetOrCreateChatMutation,
  useMarkChatAsReadMutation,
  useGetUnreadCountQuery,
} = chatApi;

export default chatApi;

