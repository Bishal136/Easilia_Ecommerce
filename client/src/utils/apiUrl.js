/**
 * Unified API & Server URL configuration helper for client
 * Ensures no duplicate or trailing slashes, and correctly resolves endpoints in dev and production
 */

/**
 * Get the base API endpoint (e.g. 'http://localhost:5000/api/v1' or '/api/v1')
 * @returns {string}
 */
export const getApiBaseUrl = () => {
  const isBrowser = typeof window !== "undefined" && window.location;
  const currentHostname = isBrowser ? window.location.hostname : "localhost";

  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === "string") {
    let clean = envUrl.trim().replace(/\/+$/, "");

    // When accessing from mobile phone/LAN, redirect 'localhost'/'127.0.0.1' to the host machine's IP
    if (
      isBrowser &&
      currentHostname !== "localhost" &&
      currentHostname !== "127.0.0.1" &&
      (clean.includes("localhost") || clean.includes("127.0.0.1"))
    ) {
      clean = clean
        .replace("localhost", currentHostname)
        .replace("127.0.0.1", currentHostname);
    }

    // If the URL is only host without /api or /api/v1, append /api/v1
    if (!clean.includes("/api")) {
      clean = `${clean}/api/v1`;
    }
    return clean;
  }

  // Fallback: if on mobile/LAN device, connect to backend on host machine
  if (isBrowser && currentHostname !== "localhost" && currentHostname !== "127.0.0.1") {
    return `http://${currentHostname}:5000/api/v1`;
  }

  return "http://localhost:5000/api/v1";
};

/**
 * Get the backend server root URL (e.g. 'http://localhost:5000')
 * @returns {string}
 */
export const getServerBaseUrl = () => {
  const isBrowser = typeof window !== "undefined" && window.location;
  const currentHostname = isBrowser ? window.location.hostname : "localhost";

  const envServer = import.meta.env.VITE_SERVER_URL;
  if (envServer && typeof envServer === "string") {
    let clean = envServer.trim().replace(/\/+$/, "");
    if (
      isBrowser &&
      currentHostname !== "localhost" &&
      currentHostname !== "127.0.0.1" &&
      (clean.includes("localhost") || clean.includes("127.0.0.1"))
    ) {
      clean = clean
        .replace("localhost", currentHostname)
        .replace("127.0.0.1", currentHostname);
    }
    return clean;
  }

  const envApi = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envApi && typeof envApi === "string") {
    let stripped = envApi.trim().replace(/\/api(\/v1)?\/?$/, "");
    if (
      isBrowser &&
      currentHostname !== "localhost" &&
      currentHostname !== "127.0.0.1" &&
      (stripped.includes("localhost") || stripped.includes("127.0.0.1"))
    ) {
      stripped = stripped
        .replace("localhost", currentHostname)
        .replace("127.0.0.1", currentHostname);
    }
    if (stripped) return stripped;
  }

  if (isBrowser && currentHostname !== "localhost" && currentHostname !== "127.0.0.1") {
    return `http://${currentHostname}:5000`;
  }

  return "http://localhost:5000";
};

/**
 * Get the Socket.io server connection URL
 * @returns {string}
 */
export const getSocketUrl = () => {
  const isBrowser = typeof window !== "undefined" && window.location;
  const currentHostname = isBrowser ? window.location.hostname : "localhost";

  const envSocket = import.meta.env.VITE_SOCKET_URL;
  if (envSocket && typeof envSocket === "string") {
    let clean = envSocket.trim().replace(/\/+$/, "");
    if (
      isBrowser &&
      currentHostname !== "localhost" &&
      currentHostname !== "127.0.0.1" &&
      (clean.includes("localhost") || clean.includes("127.0.0.1"))
    ) {
      clean = clean
        .replace("localhost", currentHostname)
        .replace("127.0.0.1", currentHostname);
    }
    return clean;
  }
  return getServerBaseUrl();
};

export default {
  getApiBaseUrl,
  getServerBaseUrl,
  getSocketUrl,
};
