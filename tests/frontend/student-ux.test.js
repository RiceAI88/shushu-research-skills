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
  buildSkillShareUrl,
  formatPackShareText,
  formatShareCardText,
} from "../../src/shareText.js";
import {
  askShushuAssistant,
  buildLocalAdvisorReply,
  retrieveAssistantCandidates,
  summarizePageContext,
} from "../../src/assistantEngine.js";

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
  const lowerRepoState = restoreState(
    null,
    "#repo=paper2poster%2Fpaper2poster",
    {},
    catalog,
  );
  assert.equal(lowerRepoState.repo, "Paper2Poster/Paper2Poster");

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
  assert.match(card, /https:\/\/riceai985\.cc\/skills\/K-Dense-AI\/scientific-agent-skills\//);

  const relatedUrl = buildSkillShareUrl(
    { repo: "SomeOrg/related-tool", repository_kind: "related" },
    { origin: "https://riceai985.cc", lang: "zh" },
  );
  assert.equal(relatedUrl, "https://riceai985.cc/#repo=SomeOrg%2Frelated-tool");

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

test("every published Skill and related project has Chinese card readability, and Top 30 Skills have tailored prompts", () => {
  const rankings = JSON.parse(
    readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
  );
  const examples = JSON.parse(
    readFileSync(
      new URL("../../config/usage-examples.json", import.meta.url),
      "utf8",
    ),
  );
  const hasZh = /[\u4e00-\u9fff]/;
  const visible = rankings.items.filter((i) =>
    ["skill", "related"].includes(i.repository_kind),
  );
  const missing = visible.filter(
    (i) => !hasZh.test(i.description || "") && !hasZh.test(i.curated_use_zh || ""),
  );
  assert.deepEqual(missing.map((i) => i.repo), []);

  const top30Skills = rankings.items
    .filter((i) => i.repository_kind === "skill")
    .slice(0, 30);
  const missingTop30Examples = top30Skills
    .filter((i) => !examples[i.repo])
    .map((i) => i.repo);
  assert.deepEqual(missingTop30Examples, []);
});

test("output-previews.json maps to real ranked repositories with complete bilingual fields", () => {
  const rankings = JSON.parse(
    readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
  );
  const previews = JSON.parse(
    readFileSync(
      new URL("../../config/output-previews.json", import.meta.url),
      "utf8",
    ),
  );
  const knownRepos = new Set(rankings.items.map((i) => i.repo.toLowerCase()));
  const entries = Object.entries(previews);
  assert.ok(entries.length >= 25);

  for (const [repo, p] of entries) {
    assert.ok(knownRepos.has(repo.toLowerCase()), `Unknown preview repo: ${repo}`);
    assert.ok(["before_after", "deliverable"].includes(p.mode), `${repo}: invalid mode`);
    assert.ok(p.label_zh && p.label_en, `${repo}: missing label`);
    assert.ok(p.takeaway_zh && p.takeaway_en, `${repo}: missing takeaway`);
    if (p.mode === "before_after") {
      assert.ok(p.before_zh && p.after_zh && p.before_en && p.after_en, `${repo}: incomplete diff`);
    } else {
      assert.ok(p.input_zh && p.input_en, `${repo}: missing input`);
      assert.ok(Array.isArray(p.steps_zh) && p.steps_zh.length >= 2, `${repo}: missing steps_zh`);
      assert.ok(Array.isArray(p.steps_en) && p.steps_en.length >= 2, `${repo}: missing steps_en`);
      assert.ok(Array.isArray(p.artifacts) && p.artifacts.length >= 1, `${repo}: missing artifacts`);
    }
  }
});

test("assistantEngine retrieves domain-relevant Skills and falls back to local advisor cleanly", async () => {
  const rankings = JSON.parse(
    readFileSync(new URL("../../data/rankings.json", import.meta.url), "utf8"),
  );
  const candidates = retrieveAssistantCandidates(
    "本科毕设不会敲命令行，写论文和 Word 排版用哪个？",
    rankings.items,
    6,
  );
  assert.ok(candidates.length > 0);
  assert.ok(
    candidates.some((c) => c.repo === "Gostyan/docx-skill-4-cn-paper"),
    "Should surface Chinese Word thesis formatting Skill for undergrad docx query",
  );

  const localText = buildLocalAdvisorReply(
    "不会编程想用网页版排版毕业论文",
    candidates,
    "zh",
  );
  assert.match(localText, /SKILL\.md/);

  const res = await askShushuAssistant({
    query: "经管实证 DID 回归推荐",
    items: rankings.items,
    lang: "zh",
    apiEndpoint: "local-only",
  });
  assert.equal(res.source, "local-advisor");
  assert.equal(res.picks.length, 3);

  // 多轮追问：当前短问题未点名学科，自动继承上一轮经管实证上下文与页面筛选
  assert.match(
    summarizePageContext(
      { discipline: "economics", major: "all", webReady: true },
      "zh",
    ),
    /经济学.*免安装/,
  );
  const followUpRes = await askShushuAssistant({
    query: "这里面哪个不用敲命令行？",
    items: rankings.items,
    lang: "zh",
    apiEndpoint: "local-only",
    history: [{ role: "user", text: "经管研究生做 DID 实证回归推荐什么？" }],
    pageState: { discipline: "economics", major: "all", webReady: true },
  });
  assert.match(followUpRes.reply, /经济学/);
  assert.match(followUpRes.reply, /SKILL\.md/);
});
