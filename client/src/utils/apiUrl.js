/**
 * Unified API & Server URL configuration helper for client
 * Ensures no duplicate or trailing slashes, and correctly resolves endpoints in dev and production
 */

/**
 * Get the base API endpoint (e.g. 'http://localhost:5000/api/v1' or '/api/v1')
 * @returns {string}
 */
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === "string") {
    let clean = envUrl.trim().replace(/\/+$/, "");
    // If the URL is only host without /api or /api/v1, append /api/v1
    if (!clean.includes("/api")) {
      clean = `${clean}/api/v1`;
    }
    return clean;
  }
  return "http://localhost:5000/api/v1";
};

/**
 * Get the backend server root URL (e.g. 'http://localhost:5000')
 * @returns {string}
 */
export const getServerBaseUrl = () => {
  const envServer = import.meta.env.VITE_SERVER_URL;
  if (envServer && typeof envServer === "string") {
    return envServer.trim().replace(/\/+$/, "");
  }

  const envApi = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envApi && typeof envApi === "string") {
    const stripped = envApi.trim().replace(/\/api(\/v1)?\/?$/, "");
    if (stripped) return stripped;
  }

  return "http://localhost:5000";
};

/**
 * Get the Socket.io server connection URL
 * @returns {string}
 */
export const getSocketUrl = () => {
  const envSocket = import.meta.env.VITE_SOCKET_URL;
  if (envSocket && typeof envSocket === "string") {
    return envSocket.trim().replace(/\/+$/, "");
  }
  return getServerBaseUrl();
};

export default {
  getApiBaseUrl,
  getServerBaseUrl,
  getSocketUrl,
};
