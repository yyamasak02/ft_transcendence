import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    host: process.env.VITE_HOST,
    port: Number(process.env.VITE_PORT),
    // ft_frontendコンテナに直接アクセスして操作するときでもAPIサーバーに繋がるようにする
    proxy: {
      "/api/common": {
        target: "http://ft_be_common",
        changeOrigin: true,
        secure: false,
      },
      "/api/game": {
        target: "http://ft_be_game",
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
  plugins: [tsconfigPaths(), tailwindcss()],
	// 新たに加えた部分 by yotsurud
	optimizeDeps: {
		exclude: [
			"@babylonjs/core",
			"@babylonjs/gui",
			"@babylonjs/loaders"
		],
	},
});
