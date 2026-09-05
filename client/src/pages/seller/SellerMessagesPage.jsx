import React, { useState, useEffect, useRef } from "react";
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
import { getApiBaseUrl } from "../../utils/apiUrl";
import {
  Send,
  Image as ImageIcon,
  Search,
  Check,
  CheckCheck,
  User,
  ExternalLink,
  X,
  ArrowLeft,
  MessageSquare,
} from "lucide-react";
import { Link } from "react-router-dom";

export const SellerMessagesPage = () => {
  const { user } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [inputText, setInputText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showMobileList, setShowMobileList] = useState(true);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // 1. Fetch all seller conversations
  const {
    data: chatsRes,
    isLoading: chatsLoading,
    refetch: refetchChats,
  } = useGetUserChatsQuery(undefined, {
    pollingInterval: 12000,
  });
  const chats = chatsRes?.data?.chats || chatsRes?.chats || [];

  // Set active chat default
  useEffect(() => {
    if (!selectedChatId && chats.length > 0) {
      setSelectedChatId(chats[0]._id);
      setShowMobileList(false);
    }
  }, [chats, selectedChatId]);

  // 2. Fetch messages for active chat
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

  // 3. Socket.io setup for Seller Notifications & Real-Time Events
  useEffect(() => {
    if (!user?._id) return;
    const socket = getSocket();
    joinUserRoom(user._id);

    const handleNewNotification = (data) => {
      refetchChats();
    };

    socket.on("chat:new_notification", handleNewNotification);

    return () => {
      socket.off("chat:new_notification", handleNewNotification);
    };
  }, [user?._id, refetchChats]);

  // Room listeners for active conversation
  useEffect(() => {
    if (!selectedChatId) return;

    joinConversationRoom(selectedChatId);
    markChatAsRead(selectedChatId);
    emitMarkRead(selectedChatId, user?._id);

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
      if (data.senderId !== user?._id) {
        setOtherUserTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (data.senderId !== user?._id) {
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
  }, [selectedChatId, user?._id, markChatAsRead, refetchChats]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [liveMessages, otherUserTyping]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!selectedChatId || !user?._id) return;

    if (!isTyping) {
      setIsTyping(true);
      emitTyping(selectedChatId, user._id, user.name || "Merchant");
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emitStopTyping(selectedChatId, user._id);
    }, 2000);
  };

  // Upload image attachment
  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxMB = Number(import.meta.env.VITE_MAX_IMAGE_SIZE_MB) || 15;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`Image size should be under ${maxMB}MB`);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploadingImage(true);
    try {
      const serverUrl = getApiBaseUrl();
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
    emitStopTyping(selectedChatId, user?._id);

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

  const activeChat = chats.find((c) => c._id === selectedChatId);
  const otherParticipant = activeChat?.participants?.find(
    (p) => (p._id || p) !== (user?._id || user?.id)
  );

  // Filtered Chats
  const filteredChats = chats.filter((c) => {
    const other = c.participants?.find(
      (p) => (p._id || p) !== (user?._id || user?.id)
    );
    const name = other?.name || "";
    const email = other?.email || "";
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[550px]">
      {/* Lightbox for viewing photos */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
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
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-800 flex items-center justify-center font-bold shadow-lg"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className="flex-1 rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-slate-800 shadow-xs flex overflow-hidden min-h-0">
        {/* Sidebar: Customer Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/30 ${
            showMobileList ? "block" : "hidden md:flex"
          }`}
        >
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Buyer Inquiries ({chats.length})
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                Live Chat
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search buyer name..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {chatsLoading ? (
              <div className="py-8 flex justify-center">
                <Spinner size="sm" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs px-4">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  No buyer chats yet
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Customer product inquiries will appear here automatically in real time.
                </p>
              </div>
            ) : (
              filteredChats.map((c) => {
                const other = c.participants?.find(
                  (p) => (p._id || p) !== (user?._id || user?.id)
                );
                const isSelected = c._id === selectedChatId;
                const displayName = other?.name || "Customer Buyer";
                const lastMsg =
                  c.lastMessage?.content ||
                  (c.lastMessage?.attachments?.length > 0 ? "📷 Photo Attachment" : "") ||
                  (c.lastMessage?.product ? "📦 Product Inquiry" : "") ||
                  "Tap to view conversation";
                const unreadCount = c.unreadCounts?.[user?._id] || 0;

                return (
                  <div
                    key={c._id}
                    onClick={() => {
                      setSelectedChatId(c._id);
                      setShowMobileList(false);
                    }}
                    className={`p-3 rounded-xl cursor-pointer transition-colors flex items-center gap-3 ${
                      isSelected
                        ? "bg-purple-50 border border-purple-200 dark:bg-purple-950/40 dark:border-purple-800/60"
                        : "hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-transparent"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                      {other?.avatar?.url ? (
                        <img
                          src={other.avatar.url}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        displayName[0]?.toUpperCase() || "B"
                      )}
                    </div>
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
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {lastMsg}
                        </p>
                        {unreadCount > 0 && (
                          <span className="shrink-0 px-1.5 py-0.2 rounded-full bg-purple-600 text-white text-[10px] font-bold">
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

        {/* Chat Thread Panel */}
        <div
          className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0F172A] ${
            !showMobileList ? "flex" : "hidden md:flex"
          }`}
        >
          {selectedChatId ? (
            <>
              {/* Active Conversation Header */}
              <div className="h-14 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between bg-white dark:bg-[#111827]">
                <div className="flex items-center gap-3">
                  {/* Mobile Back Button */}
                  <button
                    type="button"
                    onClick={() => setShowMobileList(true)}
                    className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                    {otherParticipant?.avatar?.url ? (
                      <img
                        src={otherParticipant.avatar.url}
                        alt="Buyer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      otherParticipant?.name?.[0]?.toUpperCase() || "C"
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {otherParticipant?.name || "Customer Buyer"}
                    </h3>
                    <p className="text-[10px] text-emerald-500 font-medium">● Customer Inquiry</p>
                  </div>
                </div>
              </div>

              {/* Message History List */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/30 dark:bg-[#0B1120]">
                {messagesLoading ? (
                  <div className="py-12 flex justify-center">
                    <Spinner size="md" />
                  </div>
                ) : liveMessages.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs">
                    <p className="text-2xl mb-1">👋</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      Beginning of conversation
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Send a response below to greet this customer and assist with their purchase.
                    </p>
                  </div>
                ) : (
                  liveMessages.map((m) => {
                    const isMe =
                      (m.sender?._id || m.sender) === (user?._id || user?.id);

                    return (
                      <div
                        key={m._id || m.id || Math.random()}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-md sm:max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                            isMe
                              ? "bg-purple-600 text-white rounded-br-xs"
                              : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-xs"
                          }`}
                        >
                          {/* Product Card Preview if attached */}
                          {m.product && (
                            <Link
                              to={`/products/${m.product.slug}`}
                              className={`mb-2.5 p-2 rounded-xl flex items-center gap-2.5 transition-colors border ${
                                isMe
                                  ? "bg-purple-700/80 hover:bg-purple-700 border-purple-500 text-white"
                                  : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                              }`}
                            >
                              {m.product.thumbnail && (
                                <img
                                  src={m.product.thumbnail}
                                  alt={m.product.title}
                                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                                />
                              )}
                              <div className="min-w-0 flex-1 text-left">
                                <span className="text-[9px] uppercase font-bold tracking-wider opacity-80 block">
                                  Inquiring about
                                </span>
                                <p className="font-bold text-[11px] truncate">
                                  {m.product.title}
                                </p>
                                <p className="text-[11px] font-black text-amber-300">
                                  ৳{m.product.price?.toLocaleString()}
                                </p>
                              </div>
                              <ExternalLink className="w-3.5 h-3.5 opacity-70 shrink-0" />
                            </Link>
                          )}

                          {/* Text Message */}
                          {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}

                          {/* Image Attachments */}
                          {m.attachments?.map((att, i) => (
                            <div key={i} className="mt-2">
                              <img
                                src={att.url}
                                alt="Attachment"
                                onClick={() => setLightboxImage(att.url)}
                                className="max-w-xs max-h-56 rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity border border-white/20"
                              />
                            </div>
                          ))}
                        </div>

                        {/* Metadata */}
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
                                <CheckCheck className="w-3 h-3 text-blue-500 inline" />
                              ) : (
                                <Check className="w-3 h-3 text-slate-400 inline" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Live Customer Typing Indicator */}
                {otherUserTyping && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-fit text-xs text-slate-500 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" />
                    <span>Customer is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Upload Preview Bar */}
              {selectedImage && (
                <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedImage.url}
                      alt="Upload preview"
                      className="w-8 h-8 rounded-lg object-cover border"
                    />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Photo attachment ready
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

              {/* Input Form */}
              <form
                onSubmit={handleSend}
                className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/30"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
                  title="Attach Photo"
                >
                  {uploadingImage ? (
                    <Spinner size="sm" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Type your response to the customer..."
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />

                <button
                  type="submit"
                  disabled={isSending || (!inputText.trim() && !selectedImage)}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reply</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">
              <div className="text-center">
                <span className="text-3xl">📨</span>
                <p className="font-semibold text-slate-700 dark:text-slate-300 mt-2">
                  Select a conversation
                </p>
                <p className="text-[11px] text-slate-500">
                  Pick a customer inquiry from the left to view message history.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerMessagesPage;
