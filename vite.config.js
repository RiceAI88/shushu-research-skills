import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

function stripAuditHashesForClient() {
  return {
    name: "strip-editorial-audit-hashes",
    transform(code, id) {
      if (!id.endsWith("/config/editorial.json") && !id.endsWith("\\config\\editorial.json")) {
        return null;
      }
      // source_blob_sha (40-char random hex) is an offline audit record never read at runtime.
      return code.replace(/,?\s*"source_blob_sha"\s*:\s*"[a-f0-9]+"/gi, "");
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [stripAuditHashesForClient(), react()],
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
