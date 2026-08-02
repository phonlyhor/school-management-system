import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false, // Disable Source Maps in production so original code is unreadable
    minify: 'esbuild',
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      host: "localhost",
      port: 5173,
    },
  },
});