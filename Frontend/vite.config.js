import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    // The preview runs behind a proxied host, so accept any incoming host.
    allowedHosts: true,
    proxy: {
      // Forward /api/* to the Express backend during local development.
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("firebase")) return "firebase";
          if (
            id.includes("@chakra-ui") ||
            id.includes("@emotion") ||
            id.includes("framer-motion")
          ) {
            return "chakra";
          }
          if (id.includes("@tanstack")) return "query";
          if (id.includes("@dnd-kit")) return "dnd";
          if (id.includes("react")) return "react";
          return undefined;
        },
      },
    },
  },
})