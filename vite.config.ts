import { defineConfig } from "vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { fileBasedRouter } from "./plugins/file-based-router";

export default defineConfig({
  plugins: [fileBasedRouter(), cloudflare()],
});
