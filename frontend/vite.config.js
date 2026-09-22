import { defineConfig } from "vite";

// 後端 FastAPI 預設跑在 127.0.0.1:8000（backend/dev.sh）
const API_TARGET = process.env.API_TARGET ?? "http://127.0.0.1:8000";

export default defineConfig({
  server: {
    port: 5173,
    open: true,
    // /api 與 /health 轉給後端，前端就能直接用相對路徑 fetch("/api/...")
    proxy: {
      "/api": { target: API_TARGET, changeOrigin: true },
      "/health": { target: API_TARGET, changeOrigin: true },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
