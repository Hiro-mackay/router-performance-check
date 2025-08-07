import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    // Bundle analysis
    visualizer({
      filename: "../performance-results/tanstack-router-stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
