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
        cleanId.endsWith("/config/disciplines.json") ||
        cleanId.endsWith("\\config\\disciplines.json")
      ) {
        const parsed = JSON.parse(readFileSync(cleanId, "utf8"));
        const compactProfiles = {};
        for (const [repo, entry] of Object.entries(parsed.profiles || {})) {
          if (entry?.reviewed_at && entry.evidence === true) {
            compactProfiles[repo] = [
              entry.disciplines || [],
              entry.majors || [],
              entry.common ? 1 : 0,
            ];
          }
        }
        return JSON.stringify({
          disciplines: parsed.disciplines,
          profiles: compactProfiles,
        });
      }
      if (id.endsWith("config/editorial.json?contexts")) {
        const cleanPath = id.split("?")[0];
        const parsed = JSON.parse(readFileSync(cleanPath, "utf8"));
        const contexts = {};
        for (const [repo, entry] of Object.entries(parsed.installations || {})) {
          if (entry && (entry.context_zh || entry.context_en)) {
            contexts[repo] = [entry.context_zh || "", entry.context_en || ""];
          }
        }
        return `export default ${JSON.stringify(contexts)};`;
      }
      if (
        !cleanId.endsWith("/config/editorial.json") &&
        !cleanId.endsWith("\\config\\editorial.json")
      ) {
        return null;
      }
      const parsed = JSON.parse(readFileSync(cleanId, "utf8"));
      delete parsed.installation_audit;
      delete parsed.provenance;
      for (const [repo, entry] of Object.entries(parsed.installations || {})) {
        if (entry && typeof entry === "object") {
          delete entry.source_blob_sha;
          delete entry.context_zh;
          delete entry.context_en;
          const prefix = `https://github.com/${repo}`;
          if (typeof entry.source_url === "string" && entry.source_url.startsWith(prefix)) {
            entry.source_url = "~" + entry.source_url.slice(prefix.length);
          }
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
