import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  RESEARCH_STAGES,
  filterItems,
  restoreState,
  serializeState,
} from "../../src/domain.js";
import {
  buildPackUrl,
  formatPackShareText,
  formatShareCardText,
} from "../../src/shareText.js";

const mkItem = (repo, extra = {}) => ({
  repo,
  stars: 500,
  rank: 1,
  repository_kind: "skill",
  description: "Academic research skill",
  category: { id: "other" },
  topics: [],
  ...extra,
});

test("pack URL state round-trips, preserves curator order on default sort, and includes explicit related repos", () => {
  const catalog = [
    mkItem("alpha/one", { stars: 100, rank: 3 }),
    mkItem("beta/two", { stars: 900, rank: 1, repository_kind: "related" }),
    mkItem("gamma/three", { stars: 400, rank: 2 }),
  ];
  const state = restoreState(
    null,
    "#pack=BETA/two,alpha/one,missing/repo,alpha/one&packTitle=课题组必装",
    {},
    catalog,
  );
  assert.deepEqual(state.pack, ["beta/two", "alpha/one"]);
  assert.equal(state.packTitle, "课题组必装");

  const hash = serializeState(state);
  const restored = restoreState(null, hash, {}, catalog);
  assert.deepEqual(restored.pack, ["beta/two", "alpha/one"]);
  assert.equal(restored.packTitle, "课题组必装");

  const filtered = filterItems(catalog, restored);
  assert.deepEqual(
    filtered.map((i) => i.repo),
    ["beta/two", "alpha/one"],
  );
});

test("research stages round-trip in hash and pin featured starters ahead of regular matches", () => {
  assert.equal(RESEARCH_STAGES.length, 6);
  const catalog = [
    mkItem("other/ppt-helper", {
      stars: 9999,
      rank: 1,
      description: "Generate presentation slides for papers",
    }),
    mkItem("Paper2Poster/Paper2Poster", {
      stars: 4000,
      rank: 2,
      description: "Conference poster generation",
    }),
    mkItem("unrelated/chemistry", {
      stars: 5000,
      rank: 3,
      description: "Quantum chemistry solver",
    }),
  ];
  const state = restoreState(null, "#stage=slides", {}, catalog);
  assert.equal(state.stage, "slides");
  assert.match(serializeState(state), /stage=slides/);

  const visible = filterItems(catalog, state);
  assert.deepEqual(
    visible.map((i) => i.repo),
    ["Paper2Poster/Paper2Poster", "other/ppt-helper"],
  );
});

test("shareText formats peer recommendation cards and lab toolkit packs cleanly", () => {
  const card = formatShareCardText(
    {
      repo: "K-Dense-AI/scientific-agent-skills",
      stars: 58000,
      curated_use_zh: "科学数据分析、专业数据库与科研流程",
    },
    {
      lang: "zh",
      origin: "https://riceai985.cc",
      tasks: "找文献 · 科研绘图",
      agents: "Claude Code / Codex",
    },
  );
  assert.match(card, /scientific-agent-skills/);
  assert.match(card, /科学数据分析/);
  assert.match(card, /https:\/\/riceai985\.cc\/#repo=K-Dense-AI%2Fscientific-agent-skills/);

  const packUrl = buildPackUrl(["a/one", "b/two"], {
    origin: "https://riceai985.cc",
    title: "研一工具箱",
  });
  assert.match(packUrl, /pack=a%2Fone%2Cb%2Ftwo/);
  assert.match(packUrl, /packTitle=/);

  const packText = formatPackShareText(
    [
      { repo: "a/one", stars: 1200, curated_use_zh: "文献调研" },
      { repo: "b/two", stars: 800, curated_use_zh: "科研绘图" },
    ],
    { lang: "zh", origin: "https://riceai985.cc", title: "研一工具箱" },
  );
  assert.match(packText, /研一工具箱/);
  assert.match(packText, /1\. one/);
  assert.match(packText, /2\. two/);
});

test("every published Skill has Chinese card readability via description or curated_use_zh", () => {
  const rankings = JSON.parse(
    readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
  );
  const hasZh = /[\u4e00-\u9fff]/;
  const skills = rankings.items.filter((i) => i.repository_kind === "skill");
  const missing = skills.filter(
    (i) => !hasZh.test(i.description || "") && !hasZh.test(i.curated_use_zh || ""),
  );
  assert.deepEqual(missing.map((i) => i.repo), []);
});
