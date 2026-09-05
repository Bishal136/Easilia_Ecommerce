import { io } from "socket.io-client";
import { getSocketUrl } from "../utils/apiUrl";

const SOCKET_URL = getSocketUrl();

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("[SOCKET] Connected with ID:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("[SOCKET] Connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("[SOCKET] Disconnected:", reason);
    });
  }

  return socket;
};

/**
 * Join user personal notification room
 * @param {string} userId
 */
export const joinUserRoom = (userId) => {
  if (!userId) return;
  const s = getSocket();
  if (s.connected) {
    s.emit("join_user", userId.toString());
  } else {
    s.once("connect", () => {
      s.emit("join_user", userId.toString());
    });
  }
};

/**
 * Join conversation room
 * @param {string} chatId
 */
export const joinConversationRoom = (chatId) => {
  if (!chatId) return;
  const s = getSocket();
  if (s.connected) {
    s.emit("join_conversation", chatId.toString());
  } else {
    s.once("connect", () => {
      s.emit("join_conversation", chatId.toString());
    });
  }
};

/**
 * Leave conversation room
 * @param {string} chatId
 */
export const leaveConversationRoom = (chatId) => {
  if (!chatId) return;
  const s = getSocket();
  if (s.connected) {
    s.emit("leave_conversation", chatId.toString());
  }
};

/**
 * Emit typing indicator
 * @param {string} conversationId
 * @param {string} senderId
 * @param {string} senderName
 */
export const emitTyping = (conversationId, senderId, senderName) => {
  const s = getSocket();
  s.emit("chat:typing", { conversationId, senderId, senderName });
};

/**
 * Emit stop typing indicator
 * @param {string} conversationId
 * @param {string} senderId
 */
export const emitStopTyping = (conversationId, senderId) => {
  const s = getSocket();
  s.emit("chat:stop_typing", { conversationId, senderId });
};

/**
 * Emit mark as read event
 * @param {string} conversationId
 * @param {string} userId
 */
export const emitMarkRead = (conversationId, userId) => {
  const s = getSocket();
  s.emit("chat:mark_read", { conversationId, userId });
};

export default {
  getSocket,
  joinUserRoom,
  joinConversationRoom,
  leaveConversationRoom,
  emitTyping,
  emitStopTyping,
  emitMarkRead,
};
