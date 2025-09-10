import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    host: process.env.VITE_HOST,
    port: Number(process.env.VITE_PORT),
  },
  plugins: [tailwindcss()],
});
