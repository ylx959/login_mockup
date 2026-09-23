import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// 後端 FastAPI 預設跑在 127.0.0.1:9000（backend/dev.sh 的 ${PORT:-9000}）
const API_TARGET = process.env.API_TARGET ?? "http://127.0.0.1:9000";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    open: true,
    // /api 轉給後端，前端用相對路徑就好，也沒有 CORS 問題
    proxy: { "/api": { target: API_TARGET, changeOrigin: true } },
  },
  build: { outDir: "dist", sourcemap: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
