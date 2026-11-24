import test from "node:test";
import assert from "node:assert/strict";
import {
  installationFor,
  editorialPicks,
  enrichItem,
  filterPublicSignals,
  classifyUpdateRun,
} from "../../src/practical.js";
import worker, { checkRateLimit } from "../../scripts/shushu-bot-worker.js";
const item = {
  repo: "sample/tool",
  description: "Original summary",
  url: "https://github.com/sample/tool",
  agents: ["codex"],
};
const content = {
  installations: {
    "sample/tool": {
      command: "npx skills add sample/tool",
      source_url: "https://github.com/sample/tool#readme",
      reviewed_at: "2026-10-24",
    },
  },
  featured: [
    {
      repo: "sample/tool",
      reason_zh: "明确的使用场景",
      source_url: "https://github.com/sample/tool#readme",
    },
  ],
  platforms: { "sample/tool": ["claude-code", "codex"] },
};
test("unverified installation commands are not invented", () => {
  assert.equal(
    installationFor(item, content).command,
    "npx skills add sample/tool",
  );
  const unknown = installationFor(
    { ...item, repo: "new/tool", skills_count: 99 },
    content,
  );
  assert.equal(unknown.command, null);
  assert.equal(unknown.source_url, "https://github.com/sample/tool#readme");
  assert.equal(
    installationFor(item, {
      installations: { "sample/tool": { command: "arbitrary" } },
    }).command,
    null,
  );
});
test("editorial picks keep editorial order and respect the currently visible repositories", () => {
  const second = { ...item, repo: "other/tool", stars: 100000 };
  const extended = {
    ...content,
    featured: [
      { repo: "sample/tool" },
      { repo: "other/tool" },
      { repo: "gone/tool" },
    ],
  };
  assert.deepEqual(
    editorialPicks([second, item], extended).map((p) => p.item.repo),
    ["sample/tool", "other/tool"],
  );
  assert.deepEqual(
    editorialPicks([second], extended).map((p) => p.item.repo),
    ["other/tool"],
  );
});
test("verified platform annotations enrich filtering without changing original objects", () => {
  const enriched = enrichItem(item, content);
  assert.deepEqual(enriched.agents, ["claude-code", "codex"]);
  assert.deepEqual(item.agents, ["codex"]);
  assert.equal(enriched.description, item.description);
});
test("workflow status distinguishes success, failure, running, pending publication and unverified", () => {
  const base = {
    id: 1,
    status: "completed",
    conclusion: "success",
    run_started_at: "2026-10-24T10:00:00Z",
    html_url:
      "https://github.com/RiceAI88/shushu-research-skills/actions/runs/1",
  };
  assert.equal(classifyUpdateRun(base, "2026-10-24T10:05:00Z").kind, "success");
  assert.equal(
    classifyUpdateRun(base, "2026-10-23T10:05:00Z").kind,
    "publishing",
  );
  assert.equal(
    classifyUpdateRun(
      { ...base, conclusion: "failure" },
      "2026-10-24T10:05:00Z",
    ).kind,
    "failure",
  );
  assert.equal(
    classifyUpdateRun(
      { ...base, status: "in_progress", conclusion: null },
      "2026-10-24T10:05:00Z",
    ).kind,
    "running",
  );
  assert.equal(classifyUpdateRun(null, "2026-10-24T10:05:00Z").kind, "unknown");
  assert.equal(
    classifyUpdateRun({ ...base, conclusion: null }, "2026-10-24T10:05:00Z")
      .kind,
    "unknown",
  );
});
test("installation mode is grounded in reviewed metadata and never guesses unknown setup", () => {
  assert.equal(installationFor(item, content).mode, "command");
  const manual = {
    installations: {
      "sample/tool": {
        mode: "manual",
        source_url: item.url,
        reviewed_at: "2026-10-25",
      },
    },
  };
  assert.equal(installationFor(item, manual).mode, "manual");
  assert.equal(
    installationFor({ ...item, repo: "unknown/repo" }, content).mode,
    "docs",
  );
  assert.equal(
    installationFor(item, {
      installations: { "sample/tool": { mode: "manual", command: "invented" } },
    }).mode,
    "docs",
  );
  assert.equal(
    installationFor(item, {
      installations: {
        "sample/tool": {
          mode: "manual",
          source_url: "javascript:alert(1)",
          reviewed_at: "2026-10-25",
        },
      },
    }).mode,
    "docs",
  );
  assert.equal(
    installationFor(item, {
      installations: {
        "sample/tool": {
          ...content.installations["sample/tool"],
          command: "   ",
        },
      },
    }).mode,
    "docs",
  );
});

test("enrichItem hydrates slim rankings.js payloads and strips internal admission signals", () => {
  const slim = enrichItem(
    {
      repo: "owner/slim-skill",
      stars: 128,
      category: "paper-writing",
      trend: "hot",
      license: "MIT",
      precision_signals: [
        "admission:skill_candidate",
        "readme_scope",
        "missing_strong_academic_signal",
        "trusted_seed",
        "literature review",
        "claude code",
      ],
    },
    content,
  );
  assert.equal(slim.url, "https://github.com/owner/slim-skill");
  assert.deepEqual(slim.category, {
    id: "paper-writing",
    zh: "论文写作",
    en: "Paper Writing",
  });
  assert.deepEqual(slim.trend, { id: "hot", zh: "热门上升", en: "Hot" });
  assert.equal(slim.license.spdx_id, "MIT");
  assert.deepEqual(slim.precision_signals, ["literature review", "claude code"]);
  assert.equal(slim.refresh_status, "fresh");
  assert.equal(slim.skills_count_complete, true);
  assert.deepEqual(filterPublicSignals(["negative:game", "paper writing"]), [
    "paper writing",
  ]);
});

test("bot worker rejects requests without allowed Origin and evicts rate limits incrementally", async () => {
  const noOriginReq = new Request("https://bot.riceai985.cc/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "test", candidates: [{ repo: "a/b" }] }),
  });
  const res = await worker.fetch(noOriginReq, {});
  assert.equal(res.status, 403);

  const t0 = 1_700_000_000_000;
  for (let i = 0; i < 12; i++) {
    assert.equal(checkRateLimit("attacker-ip", t0 + 5000), true);
  }
  assert.equal(checkRateLimit("attacker-ip", t0 + 5000), false);
  // Filling 2,005 newer IPs evicts the oldest entry first unless attacker is newer than early wave
  for (let i = 0; i < 1998; i++) {
    checkRateLimit(`ip-${i}`, t0 + 1000);
  }
  // Re-insert attacker after the early wave, then push past 2000 buckets
  for (let i = 0; i < 12; i++) {
    checkRateLimit("recent-heavy-ip", t0 + 6000);
  }
  assert.equal(checkRateLimit("recent-heavy-ip", t0 + 6000), false);
  for (let i = 0; i < 20; i++) {
    checkRateLimit(`overflow-ip-${i}`, t0 + 6500);
  }
  assert.equal(
    checkRateLimit("recent-heavy-ip", t0 + 6500),
    false,
    "active heavy IP must remain rate-limited after bucket eviction",
  );
});
