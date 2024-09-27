import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/live": {
        target: "http://localhost:8080", // Proxy WebSocket to Fastify server
        ws: true, // Enable WebSocket proxying
        changeOrigin: true, // Change origin header to target URL
        rewrite: (path) => path.replace(/^\/live/, "/live"), // Ensure path matches
      },
    },
  },
  plugins: [react()],
});
