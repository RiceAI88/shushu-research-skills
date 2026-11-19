import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  base: "/",
  plugins: [react()],
  build: {
    rolldownOptions: {
      input: { main: resolve("index.html"), en: resolve("en/index.html") },
      output: {
        // Split startup vendors for long-term caching while keeping all lazy features out of initial load.
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              tags: ["$initial"],
              priority: 40,
            },
            {
              name: "vendor-motion",
              test: /node_modules[\\/](motion|motion-dom|motion-utils)[\\/]/,
              tags: ["$initial"],
              priority: 30,
            },
            {
              name: "vendor-antd",
              test: /node_modules[\\/](antd|@ant-design|@rc-component|rc-)[\\/]/,
              tags: ["$initial"],
              priority: 20,
            },
            {
              name: "initial",
              tags: ["$initial"],
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
