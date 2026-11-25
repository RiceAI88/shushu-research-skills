import test from "node:test";
import assert from "node:assert/strict";
import {
  applyPromptPlaceholders,
  classifyInstallLocation,
  aiInstallPromptFor,
  deriveSetupThresholds,
  directWebPromptFor,
  drawerSupportHintsFor,
  extractEditablePlaceholders,
  usagePromptFor,
  webChatPromptFor,
} from "../../src/usageGuide.js";
import { outputPreviewFor } from "../../src/outputPreviewData.js";

test("extractEditablePlaceholders skips skill name tokens and applyPromptPlaceholders substitutes user inputs cleanly", () => {
  const item = {
    repo: "demo-lab/my-latex-helper",
    description: "Academic writing and LaTeX manuscript polishing skill",
    category: { id: "paper-writing" },
  };
  const ex = usagePromptFor(item, "zh");
  const slots = extractEditablePlaceholders(ex.prompt, item);
  assert.equal(slots.some((s) => s.inner === "my-latex-helper"), false);
  assert.equal(slots.length, 1);
  assert.match(slots[0].inner, /draft/);

  const unchanged = applyPromptPlaceholders(ex.prompt, {});
  assert.equal(unchanged, ex.prompt);

  const filled = applyPromptPlaceholders(ex.prompt, { [slots[0].token]: "thesis_v2.tex" });
  assert.match(filled, /thesis_v2\.tex/);
  assert.doesNotMatch(filled, /【draft\.tex/);
});

test("classifyInstallLocation distinguishes terminal, host chat, repo-local terminal, manual, docs and reference", () => {
  assert.equal(
    classifyInstallLocation({ mode: "command", command: "npx skills add a/b" }, "zh").kind,
    "terminal",
  );
  assert.equal(
    classifyInstallLocation({ mode: "command", command: "/plugin marketplace add a/b" }, "zh").kind,
    "host-chat",
  );
  assert.equal(
    classifyInstallLocation(
      { mode: "command", command: 'mkdir -p ~/.claude/skills\nln -s "$(pwd)/skill" ~/.claude/skills/skill' },
      "zh",
    ).kind,
    "repo-terminal",
  );
  assert.equal(
    classifyInstallLocation({ mode: "manual", command: null }, "zh").kind,
    "manual",
  );
  assert.equal(
    classifyInstallLocation({ mode: "docs", command: null }, "zh").kind,
    "docs",
  );
  assert.equal(
    classifyInstallLocation({ mode: "reference", command: null }, "zh").kind,
    "reference",
  );
});

test("usagePromptFor returns curated example for top repositories and task-matched template for others", () => {
  const curated = usagePromptFor({ repo: "ChenLiu-1996/figures4papers" }, "zh");
  assert.equal(curated.isCurated, true);
  assert.match(curated.prompt, /scientific-figure-making/);

  const fallback = usagePromptFor(
    {
      repo: "demo-lab/my-latex-helper",
      description: "Academic writing and LaTeX manuscript polishing skill",
      category: { id: "paper-writing" },
    },
    "zh",
  );
  assert.equal(fallback.isCurated, false);
  assert.match(fallback.scenario, /论文写作/);
  assert.match(fallback.prompt, /my-latex-helper/);

  const english = usagePromptFor({ repo: "ChenLiu-1996/figures4papers" }, "en");
  assert.equal(english.isCurated, true);
  assert.match(english.prompt, /metrics\.csv/);
});

test("aiInstallPromptFor references official documentation without inventing commands", () => {
  const prompt = aiInstallPromptFor(
    { repo: "example/lab-skill", url: "https://github.com/example/lab-skill" },
    { source_url: "https://github.com/example/lab-skill/blob/main/README.md" },
    "zh",
  );
  assert.match(prompt, /example\/lab-skill/);
  assert.match(prompt, /README\.md/);
});

test("deriveSetupThresholds surfaces factual environment and API hints", () => {
  const pureMd = deriveSetupThresholds(
    { repo: "a/writing-skill", repository_kind: "skill", language: "Markdown" },
    { mode: "docs", command: null },
    {},
    "zh",
  );
  assert.equal(pureMd[0]?.id, "web-friendly");

  const gpuPython = deriveSetupThresholds(
    { repo: "a/sim-lab", repository_kind: "skill", language: "Python" },
    { mode: "command", command: "pip install sim-lab" },
    { environment_zh: "需本地或云端 NVIDIA GPU 环境，自备外部 API Key" },
    "zh",
  );
  assert.deepEqual(
    gpuPython.map((b) => b.id),
    ["gpu", "api-key"],
  );

  const refOnly = deriveSetupThresholds(
    { repo: "a/guide", repository_kind: "related" },
    { mode: "reference", command: null },
    {},
    "en",
  );
  assert.deepEqual(refOnly.map((b) => b.id), ["reference"]);
});

test("webChatPromptFor builds a zero-CLI wrapper around SKILL.md", () => {
  const zhPrompt = webChatPromptFor(
    {
      repo: "demo/paper-polisher",
      description: "Academic writing and polishing skill",
      category: { id: "paper-writing" },
    },
    "zh",
  );
  assert.match(zhPrompt, /SKILL\.md/);
  assert.match(zhPrompt, /paper-polisher/);
});

test("directWebPromptFor generates self-contained zero-GitHub instructions and outputPreviewFor covers new repos", () => {
  const direct = directWebPromptFor(
    {
      repo: "newlab/fresh-writing-skill",
      repository_kind: "skill",
      curated_use_zh: "学术论文段落逻辑润色",
      description: "Academic paper writing and polishing skill",
      category: { id: "paper-writing" },
    },
    "zh",
  );
  assert.match(direct, /fresh-writing-skill/);
  assert.doesNotMatch(direct, /此处粘贴你从仓库/);

  const preview = outputPreviewFor({
    repo: "newlab/fresh-writing-skill",
    repository_kind: "skill",
    description: "Academic paper writing and manuscript polishing",
  });
  assert.ok(preview);
  assert.equal(preview.isCurated, false);
  assert.equal(preview.mode, "before_after");

  const hints = drawerSupportHintsFor(
    {
      repo: "newlab/fresh-writing-skill",
      repository_kind: "skill",
      agents: ["codex"],
      description: "Academic writing skill",
    },
    { mode: "command", command: "npx skills add newlab/fresh-writing-skill" },
    [],
  );
  assert.equal(hints.needsAgentAccess, true);
  assert.equal(hints.isPaperWritingFlow, true);
});
