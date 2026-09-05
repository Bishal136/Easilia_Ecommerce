import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), "");

  // Determine backend server origin from .env and strip any trailing slash
  const rawServerUrl =
    env.VITE_SERVER_URL ||
    (env.VITE_API_URL ? env.VITE_API_URL.replace(/\/api(\/v1)?\/?$/, "") : "") ||
    "http://localhost:5000";
  const targetServerUrl = rawServerUrl.replace(/\/+$/, "");

  const port = Number(env.PORT || env.VITE_PORT) || 5173;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port,
      host: true, // Listen on all network addresses (0.0.0.0) for deployment/docker/LAN
      cors: true, // Enable CORS
      allowedHosts: true, // Allow all hosts/domains in Vite 6+
      proxy: {
        "/api": {
          target: targetServerUrl,
          changeOrigin: true,
          secure: false,
        },
        "/uploads": {
          target: targetServerUrl,
          changeOrigin: true,
          secure: false,
        },
        "/socket.io": {
          target: targetServerUrl,
          changeOrigin: true,
          ws: true,
          secure: false,
        },
      },
    },
    preview: {
      port,
      host: true,
      cors: true,
      allowedHosts: true,
      proxy: {
        "/api": {
          target: targetServerUrl,
          changeOrigin: true,
          secure: false,
        },
        "/uploads": {
          target: targetServerUrl,
          changeOrigin: true,
          secure: false,
        },
        "/socket.io": {
          target: targetServerUrl,
          changeOrigin: true,
          ws: true,
          secure: false,
        },
      },
    },
  };
});
