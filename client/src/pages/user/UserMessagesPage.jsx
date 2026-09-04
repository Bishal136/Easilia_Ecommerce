import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  useGetUserChatsQuery,
  useGetChatMessagesQuery,
  useSendMessageMutation,
  useMarkChatAsReadMutation,
} from "../../features/chat/chatApi";
import { useAuth } from "../../hooks/useAuth";
import Spinner from "../../components/ui/Spinner";
import {
  getSocket,
  joinUserRoom,
  joinConversationRoom,
  leaveConversationRoom,
  emitTyping,
  emitStopTyping,
  emitMarkRead,
} from "../../services/socket";
import {
  Send,
  Image as ImageIcon,
  Search,
  Check,
  CheckCheck,
  Store,
  ExternalLink,
  X,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";

export const UserMessagesPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryChatId = searchParams.get("chatId");

  const [selectedChatId, setSelectedChatId] = useState(queryChatId || null);
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showMobileList, setShowMobileList] = useState(!queryChatId);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 1. Fetch Conversations
  const {
    data: chatsRes,
    isLoading: chatsLoading,
    refetch: refetchChats,
  } = useGetUserChatsQuery(undefined, {
    pollingInterval: 12000,
  });
  const chats = chatsRes?.data?.chats || chatsRes?.chats || [];

  // Sync selected chat from query params or default to first
  useEffect(() => {
    if (queryChatId) {
      setSelectedChatId(queryChatId);
      setShowMobileList(false);
    } else if (!selectedChatId && chats.length > 0) {
      setSelectedChatId(chats[0]._id);
    }
  }, [queryChatId, chats, selectedChatId]);

  // 2. Fetch Messages for Active Chat
  const {
    data: messagesRes,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useGetChatMessagesQuery(
    selectedChatId ? { chatId: selectedChatId } : undefined,
    { skip: !selectedChatId, pollingInterval: 8000 }
  );
  const [liveMessages, setLiveMessages] = useState([]);
  const [markChatAsRead] = useMarkChatAsReadMutation();

  useEffect(() => {
    const fetched = messagesRes?.data?.messages || messagesRes?.messages || [];
    setLiveMessages(fetched);
  }, [messagesRes]);

  // Mutation to send message
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  // Current user ID helper
  const currentUserId = (user?._id || user?.id)?.toString();

  // 3. Setup Socket.io Real-Time Listeners
  useEffect(() => {
    if (!currentUserId) return;
    const socket = getSocket();
    joinUserRoom(currentUserId);

    const handleNewNotification = (data) => {
      refetchChats();
    };

    socket.on("chat:new_notification", handleNewNotification);

    return () => {
      socket.off("chat:new_notification", handleNewNotification);
    };
  }, [currentUserId, refetchChats]);

  // Room listeners for active conversation
  useEffect(() => {
    if (!selectedChatId) return;

    joinConversationRoom(selectedChatId);
    markChatAsRead(selectedChatId);
    if (currentUserId) emitMarkRead(selectedChatId, currentUserId);

    const socket = getSocket();

    const handleReceiveMessage = (message) => {
      if (message.chat === selectedChatId) {
        setLiveMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev;
          return [...prev, message];
        });
        refetchChats();
        markChatAsRead(selectedChatId);
      }
    };

    const handleTyping = (data) => {
      if (data.senderId?.toString() !== currentUserId) {
        setOtherUserTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (data.senderId?.toString() !== currentUserId) {
        setOtherUserTyping(false);
      }
    };

    const handleMessagesRead = (data) => {
      if (data.chatId === selectedChatId) {
        setLiveMessages((prev) =>
          prev.map((m) => ({ ...m, isRead: true, readAt: data.readAt }))
        );
      }
    };

    socket.on("chat:receive_message", handleReceiveMessage);
    socket.on("chat:typing", handleTyping);
    socket.on("chat:stop_typing", handleStopTyping);
    socket.on("chat:messages_read", handleMessagesRead);

    return () => {
      leaveConversationRoom(selectedChatId);
      socket.off("chat:receive_message", handleReceiveMessage);
      socket.off("chat:typing", handleTyping);
      socket.off("chat:stop_typing", handleStopTyping);
      socket.off("chat:messages_read", handleMessagesRead);
    };
  }, [selectedChatId, currentUserId, markChatAsRead, refetchChats]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveMessages, otherUserTyping]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!selectedChatId || !currentUserId) return;

    if (!isTyping) {
      setIsTyping(true);
      emitTyping(selectedChatId, currentUserId, user.name || "Customer");
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emitStopTyping(selectedChatId, currentUserId);
    }, 2000);
  };

  // Upload image attachment
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be under 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadingImage(true);
    try {
      const serverUrl =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
      const token =
        localStorage.getItem("easilia_token") ||
        localStorage.getItem("dealport_token");

      const res = await fetch(`${serverUrl}/upload/single`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await res.json();
      if (data?.data?.file?.url) {
        setSelectedImage(data.data.file);
      }
    } catch (err) {
      console.error("Failed to upload image:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  // Send Message
  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!inputText.trim() && !selectedImage) || !selectedChatId) return;

    const content = inputText.trim();
    const attachments = selectedImage
      ? [
          {
            url: selectedImage.url,
            path: selectedImage.path || "",
            fileType: "image",
            originalName: selectedImage.originalName || "image.jpg",
          },
        ]
      : [];

    setInputText("");
    setSelectedImage(null);
    setIsTyping(false);
    if (currentUserId) emitStopTyping(selectedChatId, currentUserId);

    try {
      await sendMessage({
        chatId: selectedChatId,
        content,
        attachments,
      }).unwrap();
      refetchMessages();
      refetchChats();
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // Active Conversation Metadata
  const activeChat = chats.find((c) => c._id === selectedChatId);
  const otherParticipant = activeChat?.participants?.find((p) => {
    const pId = (p._id || p.id || p)?.toString();
    return pId !== currentUserId;
  });
  const shopInfo = activeChat?.shop;

  // Filtered Chats
  const filteredChats = chats.filter((c) => {
    const other = c.participants?.find((p) => {
      const pId = (p._id || p.id || p)?.toString();
      return pId !== currentUserId;
    });
    const shopName = c.shop?.name || "";
    const name = other?.name || "";
    return (
      shopName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      {/* Lightbox for viewing photos */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Attachment Preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-800 flex items-center justify-center font-bold shadow-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-sm flex overflow-hidden min-h-0">
        {/* ========================================================================= */}
        {/* Left Sidebar: Conversations List                                          */}
        {/* ========================================================================= */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/40 min-h-0 h-full ${
            showMobileList ? "block" : "hidden md:flex"
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>💬</span>
                <span>Messages & Support</span>
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                {chats.length} Store{chats.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search merchant or store..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#166534]"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0">
            {chatsLoading ? (
              <div className="py-12 flex justify-center">
                <Spinner size="sm" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-16 px-4 text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No conversations yet
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Click "Chat with Seller" on any product to ask questions or inquire about orders.
                </p>
              </div>
            ) : (
              filteredChats.map((c) => {
                const other = c.participants?.find((p) => {
                  const pId = (p._id || p.id || p)?.toString();
                  return pId !== currentUserId;
                });
                const isSelected = c._id === selectedChatId;
                const displayName = c.shop?.name || other?.name || "Merchant Store";
                const displayLogo = c.shop?.logo?.url || other?.avatar?.url;
                const lastMsg =
                  c.lastMessage?.content ||
                  (c.lastMessage?.attachments?.length > 0 ? "📷 Photo Attachment" : "") ||
                  (c.lastMessage?.product ? "📦 Product Inquiry" : "") ||
                  "Conversation started";
                const unreadCount = c.unreadCounts?.[currentUserId] || 0;

                return (
                  <div
                    key={c._id}
                    onClick={() => {
                      setSelectedChatId(c._id);
                      setSearchParams({ chatId: c._id });
                      setShowMobileList(false);
                    }}
                    className={`p-3 rounded-2xl cursor-pointer transition-all flex items-center gap-3 border ${
                      isSelected
                        ? "bg-[#166534]/10 border-[#166534]/40 shadow-xs"
                        : "hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border-transparent"
                    }`}
                  >
                    {/* Store Logo / Avatar */}
                    <div className="relative shrink-0">
                      {displayLogo ? (
                        <img
                          src={displayLogo}
                          alt={displayName}
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#166534] to-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {displayName[0]?.toUpperCase()}
                        </div>
                      )}
                      {c.shop && (
                        <div
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] shadow-xs"
                          title="Verified Merchant"
                        >
                          ✓
                        </div>
                      )}
                    </div>

                    {/* Store / Last Message Preview */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {displayName}
                        </p>
                        {c.lastMessageAt && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(c.lastMessageAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {lastMsg}
                        </p>
                        {unreadCount > 0 && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-[#166534] text-white text-[10px] font-bold">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Right Panel: Chat Thread Interface                                        */}
        {/* ========================================================================= */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0F172A] min-h-0 h-full ${
            !showMobileList ? "flex" : "hidden md:flex"
          }`}
        >
          {selectedChatId ? (
            <>
              {/* Active Conversation Header */}
              <div className="h-16 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between bg-white dark:bg-[#111827] shrink-0">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setShowMobileList(true)}
                    className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 cursor-pointer"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  {/* Store Avatar */}
                  <div className="relative shrink-0">
                    {shopInfo?.logo?.url || otherParticipant?.avatar?.url ? (
                      <img
                        src={shopInfo?.logo?.url || otherParticipant?.avatar?.url}
                        alt="Store"
                        className="w-10 h-10 rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-[#166534] text-white flex items-center justify-center font-bold text-sm">
                        {(shopInfo?.name || otherParticipant?.name || "S")[0]?.toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  </div>

                  {/* Store Title & Badges */}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {shopInfo?.name || otherParticipant?.name || "Merchant Store"}
                      </h3>
                      {shopInfo && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                          Official Store
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-600 font-medium">
                      ● Active Seller • Fast Response
                    </p>
                  </div>
                </div>

                {/* Right Action: Visit Shop Link */}
                {shopInfo?.slug && (
                  <Link
                    to={`/shop/${shopInfo.slug}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Visit Store</span>
                  </Link>
                )}
              </div>

              {/* Message History List */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3.5 bg-slate-50/40 dark:bg-[#0B1120] min-h-0">
                {messagesLoading ? (
                  <div className="py-16 flex justify-center">
                    <Spinner size="md" />
                  </div>
                ) : liveMessages.length === 0 ? (
                  <div className="text-center py-20 text-slate-400">
                    <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-2xl mb-3 shadow-xs">
                      💬
                    </div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Start your conversation with {shopInfo?.name || "Seller"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Ask about item details, shipping dates, bulk orders, or custom requests.
                    </p>
                  </div>
                ) : (
                  liveMessages.map((m) => {
                    const senderId = (m.sender?._id || m.sender?.id || m.sender)?.toString();
                    const isMe = currentUserId && senderId && currentUserId === senderId;

                    return (
                      <div
                        key={m._id || m.id || Math.random()}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-md sm:max-w-lg p-3.5 sm:p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                            isMe
                              ? "bg-[#166534] text-white rounded-br-xs"
                              : "bg-white text-slate-900 dark:bg-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs"
                          }`}
                        >
                          {/* 1. Attached Product Card Preview */}
                          {m.product && (
                            <Link
                              to={`/products/${m.product.slug}`}
                              className={`mb-3 p-2.5 rounded-2xl flex items-center gap-3 transition-colors border ${
                                isMe
                                  ? "bg-emerald-800/60 hover:bg-emerald-800 border-emerald-700 text-white"
                                  : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                              }`}
                            >
                              {m.product.thumbnail && (
                                <img
                                  src={m.product.thumbnail}
                                  alt={m.product.title}
                                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">
                                  Product Inquiry
                                </span>
                                <p className="font-bold text-xs truncate">
                                  {m.product.title}
                                </p>
                                <p className="text-xs font-black text-amber-300">
                                  ৳{m.product.price?.toLocaleString()}
                                </p>
                              </div>
                              <ExternalLink className="w-4 h-4 opacity-70 shrink-0" />
                            </Link>
                          )}

                          {/* 2. Text Message Content */}
                          {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}

                          {/* 3. Image Attachments */}
                          {m.attachments?.map((att, i) => (
                            <div key={i} className="mt-2.5">
                              <img
                                src={att.url}
                                alt="Attachment"
                                onClick={() => setLightboxImage(att.url)}
                                className="max-w-xs max-h-60 rounded-2xl object-cover cursor-pointer hover:opacity-90 transition-opacity border border-white/20"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Message Metadata (Timestamp & Read Checks) */}
                        <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400">
                          <span>
                            {m.createdAt
                              ? new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Just now"}
                          </span>
                          {isMe && (
                            <span>
                              {m.isRead ? (
                                <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-400 inline" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Live Typing Indicator */}
                {otherUserTyping && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-fit text-xs text-slate-500 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" />
                    <span>{shopInfo?.name || "Seller"} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Upload Preview Bar */}
              {selectedImage && (
                <div className="px-4 sm:px-6 py-2 bg-slate-100 dark:bg-slate-800 flex items-center justify-between border-t border-slate-200 dark:border-slate-700 shrink-0">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedImage.url}
                      alt="Upload preview"
                      className="w-10 h-10 rounded-xl object-cover border"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Photo ready to send
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="p-1 text-slate-500 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Chat Input Bar */}
              <form
                onSubmit={handleSend}
                className="shrink-0 p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-[#111827]"
              >
                {/* Hidden File Input for Image Uploads */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                {/* Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="p-2.5 sm:p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  title="Attach Photo"
                >
                  {uploadingImage ? (
                    <Spinner size="sm" />
                  ) : (
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>

                {/* Message Text Input */}
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e);
                    }
                  }}
                  placeholder="Type a message or question for the seller..."
                  className="flex-1 px-4 py-2.5 sm:py-3 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#166534]"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={
                    isSending || (!inputText.trim() && !selectedImage)
                  }
                  className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-xs sm:text-sm shadow-xs disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                >
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </>
          ) : (
            /* Empty State: No Conversation Selected */
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div className="max-w-md space-y-3">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center text-3xl shadow-xs">
                  💬
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Select a Merchant Conversation
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Choose a store inquiry from the list on the left to start live messaging with sellers, tracking queries, and negotiating orders.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserMessagesPage;
