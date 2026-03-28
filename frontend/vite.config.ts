import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    allowedHosts: ["frontend"],
    host: process.env.VITE_HOST || "0.0.0.0",
    port: Number(process.env.VITE_PORT),
    // ft_frontendコンテナに直接アクセスして操作するときでもAPIサーバーに繋がるようにする
    proxy: {
      "/api/common": {
        target: "http://ft_be_common",
        changeOrigin: true,
        secure: false,
      },
      "/api/connect": {
        target: "http://ft_be_connect",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      // For test_webrtc adapter using "/ws/connect/*" path
      "/ws/connect": {
        target: "http://ft_be_connect",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  preview: {
    strictPort: true,
    allowedHosts: ["frontend"],
    host: process.env.VITE_HOST || "0.0.0.0",
    port: Number(process.env.VITE_PORT),
  },
  plugins: [tsconfigPaths(), tailwindcss()],
  optimizeDeps: {
    exclude: ["@babylonjs/core", "@babylonjs/gui", "@babylonjs/loaders"],
  },
});
