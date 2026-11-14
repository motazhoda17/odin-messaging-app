import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // In development, forward /api requests to the Express server so we
    // don't have to deal with CORS or hard-coded URLs while coding.
    proxy: {
      "/api": process.env.API_PROXY_TARGET || "http://localhost:3000",
    },
  },
});
