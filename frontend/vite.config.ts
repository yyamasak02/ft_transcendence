import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    host: process.env.VITE_HOST,
    port: Number(process.env.VITE_PORT),
  },
  plugins: [tsconfigPaths()],
});
