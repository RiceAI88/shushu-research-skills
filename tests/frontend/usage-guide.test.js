import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyInstallLocation,
  aiInstallPromptFor,
  deriveSetupThresholds,
  usagePromptFor,
  webChatPromptFor,
} from "../../src/usageGuide.js";

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
