import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    // Bundle analysis
    visualizer({
      filename: "../reports/react-router-bundle-stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
