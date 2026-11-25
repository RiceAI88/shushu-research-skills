import { highlightParts } from "../../src/highlight.js";
import test from "node:test";
import assert from "node:assert/strict";
import { createSearch, splitSearchTokens, suggestedTaskIds } from "../../src/search.js";
import { filterItems, restoreState } from "../../src/domain.js";
const items = [
  {
    repository_kind: "skill",
    repo: "a/proof",
    description: "Academic proofreading and POLISHING.",
    category: { id: "paper-writing" },
    rank: 1,
  },
  {
    repository_kind: "skill",
    repo: "b/chart",
    description: "Scientific figures and plots.",
    category: { id: "general-research" },
    rank: 2,
  },
  {
    repository_kind: "skill",
    repo: "c/setup",
    description: "Configure a project.",
    category: { id: "general-research" },
    rank: 3,
  },
  {
    repository_kind: "skill",
    repo: "d/zotero",
    description: "Zotero reference manager",
    category: { id: "literature-review" },
    rank: 4,
  },
  {
    repository_kind: "skill",
    repo: "e/other",
    description: "Mendeley integration",
    category: { id: "literature-review" },
    rank: 5,
  },
];
const state = restoreState(null, "", {}, items);
test("Chinese intents find original English descriptions while other filters still apply", () => {
  assert.deepEqual(
    filterItems(items, { ...state, query: "润色" }).map((x) => x.repo),
    ["a/proof"],
  );
  assert.deepEqual(
    filterItems(items, { ...state, query: "绘图" }).map((x) => x.repo),
    ["b/chart"],
  );
  assert.deepEqual(
    filterItems(items, { ...state, query: "文献管理" }).map((x) => x.repo),
    ["d/zotero", "e/other"],
  );
  assert.deepEqual(
    filterItems(items, { ...state, query: "绘图", task: "write" }),
    [],
  );
  assert.equal(items[0].description, "Academic proofreading and POLISHING.");
});
test("product names and full repository strings do not broaden into unrelated synonyms", () => {
  assert.deepEqual(
    filterItems(items, { ...state, query: "Zotero" }).map((x) => x.repo),
    ["d/zotero"],
  );
  assert.deepEqual(
    filterItems(items, { ...state, query: "a/proof" }).map((x) => x.repo),
    ["a/proof"],
  );
  assert.equal(createSearch("绘图").matches("Configure deployment"), false);
  assert.equal(createSearch("绘图").matches("A figure-generation skill"), true);
  assert.equal(createSearch("no-match").matches("anything"), false);
  assert.equal(createSearch("  ").matches("anything"), true);
});
test("highlight preserves source text and case, merges overlaps, treats regex characters literally", () => {
  const text = "Academic proofreading and POLISHING.";
  const parts = highlightParts(text, "润色");
  assert.equal(parts.map((x) => x.text).join(""), text);
  assert.deepEqual(
    parts.filter((x) => x.match).map((x) => x.text),
    ["proofreading", "POLISHING"],
  );
  assert.deepEqual(
    highlightParts("a+b [x] <script>", "a+b")
      .filter((x) => x.match)
      .map((x) => x.text),
    ["a+b"],
  );
  assert.deepEqual(
    highlightParts("figures", "figure")
      .filter((x) => x.match)
      .map((x) => x.text),
    ["figures"],
  );
  assert.equal(
    highlightParts("<img onerror=x>", "[")
      .map((x) => x.text)
      .join(""),
    "<img onerror=x>",
  );
  assert.deepEqual(highlightParts("Text", ""), [
    { text: "Text", match: false },
  ]);
});
test("task suggestions correspond to known intent and do not infer tasks for arbitrary names", () => {
  assert.ok(suggestedTaskIds("润色").includes("write"));
  assert.ok(suggestedTaskIds("figure").includes("figures"));
  assert.ok(suggestedTaskIds("幻灯片").includes("figures"));
  assert.ok(suggestedTaskIds("单细胞").includes("analyze"));
  assert.ok(suggestedTaskIds("数学建模").includes("compute"));
  assert.ok(suggestedTaskIds("文献综述").includes("find"));
  assert.ok(suggestedTaskIds("返修").includes("review"));
  assert.ok(suggestedTaskIds("英文润色").includes("write"));
  assert.ok(suggestedTaskIds("画流程图").includes("figures"));
  assert.ok(suggestedTaskIds("跑实验").includes("reproduce"));
  assert.deepEqual(suggestedTaskIds("owner/exact-repo"), []);
});

test("multi-word AND queries and compound Chinese/mixed intents match without breaking long natural-language handoff", () => {
  const richItems = [
    ...items,
    {
      repository_kind: "skill",
      repo: "f/stata-econ",
      description: "Stata econometric regression and causal inference tables.",
      category: { id: "other" },
      rank: 6,
    },
    {
      repository_kind: "skill",
      repo: "g/py-plot",
      description: "Python scripts to generate publication-ready figures and architecture diagrams.",
      category: { id: "other" },
      rank: 7,
    },
  ];
  assert.deepEqual(splitSearchTokens("英文润色"), ["英文", "润色"]);
  assert.deepEqual(splitSearchTokens("python配图"), ["python", "配图"]);
  assert.deepEqual(splitSearchTokens("reproduction"), ["reproduction"]);

  assert.deepEqual(
    filterItems(richItems, { ...state, query: "stata 回归" }).map((x) => x.repo),
    ["f/stata-econ"],
  );
  assert.deepEqual(
    filterItems(richItems, { ...state, query: "python 配图" }).map((x) => x.repo),
    ["g/py-plot"],
  );
  assert.deepEqual(
    filterItems(richItems, { ...state, query: "python配图" }).map((x) => x.repo),
    ["g/py-plot"],
  );
  assert.deepEqual(
    filterItems(richItems, { ...state, query: "画流程图" }).map((x) => x.repo),
    ["g/py-plot"],
  );
  // 长句自然语言提问仍应为空，以便触发 EmptyResults 引导一键问鼠鼠 AI
  assert.deepEqual(
    filterItems(richItems, { ...state, query: "本科生不会代码怎么降 AIGC 率" }),
    [],
  );
});
