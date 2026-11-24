import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

import { readFileSync } from "node:fs";

function stripAuditHashesForClient() {
  return {
    name: "strip-editorial-audit-hashes",
    load(id) {
      const cleanId = id.split("?")[0];
      if (
        !cleanId.endsWith("/config/editorial.json") &&
        !cleanId.endsWith("\\config\\editorial.json")
      ) {
        return null;
      }
      const parsed = JSON.parse(readFileSync(cleanId, "utf8"));
      delete parsed.installation_audit;
      delete parsed.provenance;
      for (const entry of Object.values(parsed.installations || {})) {
        if (entry && typeof entry === "object") {
          delete entry.source_blob_sha;
        }
      }
      return JSON.stringify(parsed);
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
