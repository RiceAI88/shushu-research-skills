import reviewedUsage from "../config/project-usage.json" with {type:"json"};
import { DISCIPLINES, matchesDiscipline, disciplineFit } from "./disciplines.js";
import { createSearch } from "./search.js";
export const RESEARCH_TASKS = [
  {
    id: "find",
    categories: ["literature-review"],
    pattern:
      /\b(?:literature[ -](?:search|retrieval|discovery)|paper[ -](?:search|finder|discovery)|academic[ -]search|semantic[ -]scholar|zotero|pubmed|arxiv|cnki)\b|文献.{0,4}(?:检索|搜索|查找|发现)|(?:搜索|检索|查找).{0,4}(?:论文|文献)|知网/i,
  },
  {
    id: "read",
    categories: ["literature-review"],
    pattern:
      /\b(?:read(?:ing|er)?|summari[sz](?:e|ation|ing)|translat(?:e|ion|ing)|zotero)\b|读论文|论文.{0,4}(?:解读|阅读|翻译)|文献阅读/i,
  },
  {
    id: "write",
    categories: ["paper-writing"],
    pattern:
      /\b(?:academic[ -]writing|paper[ -]writing|latex|proofread(?:ing)?|manuscript)\b|论文写作|学术写作|论文润色|论文撰写/i,
  },
  {
    id: "figures",
    categories: [],
    pattern:
      /\b(?:figures?|plots?|plotting|visuali[sz](?:ation|e)|illustrations?|diagrams?|charts?|figures4papers)\b|科研绘图|论文配图|科学绘图|图表|画图|绘制/i,
  },
  {
    id: "reproduce",
    categories: ["experiment-reproducibility"],
    pattern:
      /\b(?:reproduc(?:e|ibility|tion)|replicat(?:e|ion)|benchmark(?:ing)?|experiment(?:al|s)?|ablation)\b|实验复现|实验设计|复现实验|基准测试|消融/i,
  },
  {
    id: "review",
    categories: ["peer-review"],
    pattern:
      /\b(?:peer[ -]review|reviewers?|referee|rebuttal|submission|revision|revise|review[ -](?:paper|manuscript)|pre[ -]submission)\b|审稿|评审|投稿|返修|回复审稿/i,
  },
  { id:'analyze', categories:[], pattern:/single[ -]cell|scRNA|genomics|bioinformatics|econometrics|stata|statistics|statistical|data analysis|meta.analysis|计量|统计分析|数据分析|生物信息|数学建模|单细胞/i },
  { id:'compute', categories:[], pattern:/scientific computing|simulation|mathematical model|theoretical.physics|molecular|numerical|研究计算|科研计算|数值计算|数学建模|仿真|分子/i },

];

// 论文阶段急救包：面向学生高频场景的精选锚点 + 规则筛选
export const RESEARCH_STAGES = [
  {
    id: "undergrad",
    zh: "🎓 本科毕设起步",
    en: "🎓 Thesis starter",
    hint_zh: "从选题、读英文文献到中文 Word / LaTeX 论文排版成稿的高频入门组合",
    hint_en: "Starter Skills from scoping and reading papers to Word/LaTeX thesis formatting",
    featured: [
      "Gostyan/docx-skill-4-cn-paper",
      "Imbad0202/academic-research-skills",
      "Edwardxlai/easyread",
      "HKUSTDial/Supervisor-Skills",
      "alfonso0512/research-writing-skill",
      "zouchenzhen/thesis-defense-pptx-skill",
    ],
    pattern:
      /\b(?:thesis|undergraduate|starter|beginner|docx|word|course[- ]paper|easyread)\b|毕设|毕业论文|课程论文|开题|入门|全文翻译|论文排版/i,
  },
  {
    id: "proposal",
    zh: "📚 开题文献综述",
    en: "📚 Lit review",
    hint_zh: "多源论文检索、Zotero 文献管理、精读笔记与可核验引文综述",
    hint_en: "Multi-source paper search, Zotero workflows, synthesis, and verified citations",
    featured: [
      "K-Dense-AI/scientific-agent-skills",
      "cheneternity/Zotero-Analytical-Workflow-Skills",
      "wp-a/nature-academic-search",
      "stephenlzc/AI-Powered-Literature-Review-Skills",
      "199-biotechnologies/claude-deep-research-skill",
      "jordan-gibbs/hyperresearch",
    ],
    pattern:
      /\b(?:literature[- ](?:review|survey|search)|systematic[- ]review|zotero|bibliometric|citation|deep[- ]research|pubmed|arxiv)\b|文献综述|开题|文献检索|引文核验|系统性综述|文献管理/i,
  },
  {
    id: "figures",
    zh: "🎨 顶刊配图/流程图",
    en: "🎨 Figures & charts",
    hint_zh: "Nature/顶会风格数据图、架构图及 Visio / Origin 可编辑配图",
    hint_en: "Publication charts, architecture diagrams, and editable Visio/Origin figures",
    featured: [
      "ChenLiu-1996/figures4papers",
      "dwzhu-pku/PaperBanana",
      "pengjunchi0/codex-visio-paper-figure-skill",
      "hang-jin/editaplot",
      "larashero3-dotcom/lieflat-charts",
      "yjz211/vivid-illustration-skill",
    ],
    tasks: ["figures"],
  },
  {
    id: "empirical",
    zh: "📊 问卷与实证计量",
    en: "📊 Stats & metrics",
    hint_zh: "Stata / R / Python 回归检验、问卷统计、元分析与数学建模",
    hint_en: "Stata/R/Python econometrics, survey stats, meta-analysis, and math modeling",
    featured: [
      "jihe520/MathModelAgent",
      "hanlulong/econ-writing-skill",
      "dylantmoore/stata-skill",
      "alchaincyf/huashu-report",
      "peacefulj/SSCI-SCI-skills",
      "K-Dense-AI/scientific-agent-skills",
    ],
    pattern:
      /\b(?:econometric|stata|causal|regression|panel[- ]data|survey|questionnaire|meta[- ]analysis|spss|mathematical[- ]model|ssci)\b|计量|实证|回归|问卷|统计检验|元分析|数学建模|因果推断/i,
  },
  {
    id: "slides",
    zh: "🎤 组会 PPT / 海报",
    en: "🎤 Slides & posters",
    hint_zh: "把论文 PDF 或 LaTeX 转成组会汇报、毕业答辩 PPT 与学术会议海报",
    hint_en: "Turn paper PDFs or LaTeX into lab-meeting slides, defense decks, and posters",
    featured: [
      "ningzimu/codex-ppt-skill",
      "Paper2Poster/Paper2Poster",
      "icip-cas/PPTAgent",
      "CRui5in/paper-ppt-agent",
      "QuZhan51496/paper2anything",
      "zouchenzhen/thesis-defense-pptx-skill",
    ],
    pattern:
      /\b(?:ppt|pptx|powerpoint|slides?|deck|poster|beamer|presentation|keynote)\b|组会|答辩|幻灯片|演示文稿|学术海报|汇报/i,
  },
  {
    id: "rebuttal",
    zh: "✍️ 润色改写与返修",
    en: "✍️ Polish & rebuttal",
    hint_zh: "消除防御性与 AI 腔表达、语法润色、模拟审稿自查与 Rebuttal 回复",
    hint_en: "Academic polishing, anti-defensive writing, mock peer review, and rebuttal",
    featured: [
      "Yuan1z0825/nature-skills",
      "Adkid-Zephyr/anti-defensive-writing-Skill",
      "Master-cai/Research-Paper-Writing-Skills",
      "Moonlit-Pages/AIGC-Detector-Rewriter-Skill",
      "MLNLP-World/Paper-Rebuttal-Tips",
      "LimHyungTae/awesome-claudecode-paper-proofreading",
    ],
    tasks: ["review"],
    pattern:
      /\b(?:proofread|polish|rebuttal|peer[- ]review|referee|revision|revise|anti[- ]defensive|rewrit|humaniz)\b|润色|降重|改写|防御性写作|审稿|返修|投稿自查/i,
  },
];

export function matchesResearchStage(item, stage) {
  if (!stage) return true;
  if (stage.featured?.includes(item.repo)) return true;
  if (
    stage.tasks?.some((tid) => {
      const task = RESEARCH_TASKS.find((entry) => entry.id === tid);
      return task && matchesResearchTask(item, task);
    })
  )
    return true;
  if (stage.pattern) {
    return stage.pattern.test(
      [
        item.repo,
        item.description,
        item.curated_use_zh,
        item.curated_use_en,
        ...(item.topics || []),
      ].join(" "),
    );
  }
  return false;
}

export const TASK_LABEL_KEYS = {
  analyze: "taskAnalyze",
  compute: "taskCompute",
  find: "taskFind",
  read: "taskRead",
  write: "taskWrite",
  figures: "taskFigures",
  reproduce: "taskReproduce",
  review: "taskReview",
};
const CATEGORY_PRIMARY_TASK = {
  "paper-writing": "write",
  "peer-review": "review",
  "experiment-reproducibility": "reproduce",
  "literature-review": "find",
  "deep-research": "find",
  "discipline-specific": "analyze",
};

const PRIMARY_SCENE_HINTS = [
  ["figures", /绘图|配图|图表|插图|海报|流程图|\b(?:figure|figures|plot|plotting|chart|diagram|poster|ppt|slide|illustration)\b/i],
  ["review", /审稿|返修|同行评审|\b(?:rebuttal|peer[- ]review|referee|proofread)\b/i],
  ["reproduce", /复现|消融|自主科研|自动实验|\b(?:reproduc|ablation|auto[- ]research|autonomous\s+ml|benchmark)\b/i],
  ["compute", /数学建模|分子模拟|数值仿真|物理仿真|\b(?:isaac|molecular|simulation|math[- ]?model)\b/i],
  ["analyze", /实证|计量|单细胞|转录组|统计检验|问卷|\b(?:econometric|stata|scrna|single[- ]cell|bioinformatic|meta[- ]analysis)\b/i],
  ["write", /写作|润色|降重|去\s*ai|排版|\b(?:humaniz|anti[- ]defensive|paper[- ]writing|manuscript|latex|docx)\b/i],
  ["read", /精读|翻译论文|阅读笔记|\b(?:paper[- ]reading|arxiv[- ]translat|pdf.*translat)\b/i],
];

export function sceneLabelsFor(item, t) {
  return RESEARCH_TASKS.filter((task) => matchesResearchTask(item, task)).map(
    (task) => t(TASK_LABEL_KEYS[task.id]),
  );
}

const FIGURE_PRIORITY_RE =
  /绘图|配图|图表|插图|海报|流程图|\b(?:figure|figures|plot|plotting|chart|diagram|poster|ppt|slide|illustration)\b/i;

// 为紧凑表格场景列排序任务标签：优先呼应当前筛选任务、显式绘图定位或项目主分类，避免清一色显示“找文献”
export function orderedSceneLabelsFor(item, t, activeTask = "all") {
  const matched = RESEARCH_TASKS.filter((task) => matchesResearchTask(item, task));
  if (matched.length <= 1) return matched.map((task) => t(TASK_LABEL_KEYS[task.id]));
  let preferredId =
    activeTask !== "all" && matched.some((m) => m.id === activeTask) ? activeTask : "";
  const shortSummary = [item?.repo, item?.curated_use_zh].join(" ");
  if (!preferredId && FIGURE_PRIORITY_RE.test(shortSummary) && matched.some((m) => m.id === "figures")) {
    preferredId = "figures";
  }
  if (
    !preferredId &&
    ["paper-writing", "peer-review", "experiment-reproducibility"].includes(item?.category?.id)
  ) {
    const catTask = CATEGORY_PRIMARY_TASK[item.category.id];
    if (catTask && matched.some((m) => m.id === catTask)) preferredId = catTask;
  }
  if (!preferredId) {
    const summaryText = [item?.repo, item?.curated_use_zh, item?.description].join(" ");
    for (const [tid, re] of PRIMARY_SCENE_HINTS) {
      if (re.test(summaryText) && matched.some((m) => m.id === tid)) {
        preferredId = tid;
        break;
      }
    }
  }
  if (!preferredId) {
    const catTask = CATEGORY_PRIMARY_TASK[item?.category?.id];
    if (catTask && matched.some((m) => m.id === catTask)) preferredId = catTask;
  }
  const sorted = preferredId
    ? [
        ...matched.filter((m) => m.id === preferredId),
        ...matched.filter((m) => m.id !== preferredId),
      ]
    : matched;
  return sorted.map((task) => t(TASK_LABEL_KEYS[task.id]));
}

const WEB_HEAVY_RUNTIME_RE =
  /\b(?:gpu|cuda|nvidia|vram|isaac[- ]?sim|mcp[- ]?server|fastmcp|docker|compose|gradio|streamlit|fastapi|flask|playwright|selenium|puppeteer|electron|vscode[- ]extension)\b|服务端|本地部署|数学建模\s*Agent/i;
const WEB_PROMPT_SIGNAL_RE =
  /\b(?:markdown[- ]only|prompt[- ]pack|prompt[- ]only|claude\.ai|(?:chatgpt|deepseek|kimi)\s+skill|web\s*(?:ai|chat|ui)|zero[- ]install|no[- ]code|humanizer|anti[- ]defensive)\b|提示词|纯文档|免安装|网页版|润色原则|写作原则/i;
const CODE_RUNTIME_LANGS = new Set([
  "Python",
  "TypeScript",
  "JavaScript",
  "Go",
  "Rust",
  "C++",
  "C",
  "Java",
  "Stata",
  "R",
  "Jupyter Notebook",
  "Shell",
  "PowerShell",
  "Batchfile",
]);

// 判定项目是否免装本地命令行/编程环境，支持在网页版 AI（DeepSeek/Kimi/ChatGPT/Claude）直接复制规则或在线使用
export function isWebAiReady(item) {
  const blob = [
    item?.repo,
    item?.description,
    item?.curated_use_zh,
    item?.curated_use_en,
    ...(item?.topics || []),
  ].join(" ");
  if (WEB_HEAVY_RUNTIME_RE.test(blob)) return false;
  if (
    Array.isArray(item?.agents) &&
    item.agents.length === 1 &&
    item.agents[0] === "mcp"
  )
    return false;
  if (WEB_PROMPT_SIGNAL_RE.test(blob)) return true;
  const lang = String(item?.language || "").trim();
  if (!lang || lang === "Markdown") return true;
  if (item?.repository_kind === "related" && !CODE_RUNTIME_LANGS.has(lang))
    return true;
  return false;
}

/* Agent platform catalog — the order here is the display/sort order. */
export const AGENT_PLATFORMS = [
  { id: "antigravity", label: "Antigravity", match: ["antigravity"] },
  { id: "windsurf", label: "Windsurf", match: ["windsurf"] },
  {
    id: "claude-code",
    label: "Claude Code",
    match: ["claude code", "claude-code", "claude code skill"],
  },
  { id: "codex", label: "Codex", match: ["codex"] },
  {
    id: "opencode",
    label: "OpenCode",
    match: ["opencode", "open code", "open-code"],
  },
  { id: "cursor", label: "Cursor", match: ["cursor"] },
  { id: "gemini", label: "Gemini", match: ["gemini"] },
  { id: "cline", label: "Cline", match: ["cline"] },
  { id: "mcp", label: "MCP", match: ["mcp"] },
];

export const FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"';
export const REPOSITORY_URL =
  "https://github.com/RiceAI88/shushu-research-skills";
export function detectAgents(item) {
  if (Array.isArray(item.agents) && (item.agents.length || item.platforms_reviewed)) return item.agents;
  const text = [item.repo, item.description, ...(item.topics || [])]
    .join(" ")
    .toLowerCase();
  return AGENT_PLATFORMS.filter((p) =>
    p.match.some((term) => text.includes(term)),
  ).map((p) => p.id);
}
const valid = (value, allowed, fallback) =>
  allowed.includes(value) ? value : fallback;
const REPO_SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/;
function parsePackRepos(raw, items) {
  if (!raw) return [];
  const byLower = new Map(items.map((i) => [i.repo.toLowerCase(), i.repo]));
  const hasCatalog = byLower.size > 0;
  const seen = new Set();
  const out = [];
  for (const part of String(raw).split(",")) {
    const clean = part.trim();
    if (!REPO_SLUG_RE.test(clean)) continue;
    const lower = clean.toLowerCase();
    if (seen.has(lower)) continue;
    if (hasCatalog && !byLower.has(lower)) continue;
    seen.add(lower);
    out.push(hasCatalog ? byLower.get(lower) : clean);
    if (out.length >= 20) break;
  }
  return out;
}
export function restoreState(storage, hash = "", defaults = {}, items = []) {
  const get = (key) => {
    try {
      return storage?.getItem(key);
    } catch {
      return null;
    }
  };
  const array = (key) => {
    try {
      const parsed = JSON.parse(get(key));
      return Array.isArray(parsed)
        ? [...new Set(parsed.filter((v) => typeof v === "string"))]
        : [];
    } catch {
      return [];
    }
  };
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  const repositories = new Set(items.map((i) => i.repo));
  const repoByLower = new Map(
    items.map((i) => [String(i.repo || "").toLowerCase(), i.repo]),
  );
  const pack = parsePackRepos(p.get("pack"), items);
  return {
    query: p.get("q") || "",
    includeRelated: p.get("related") === "1" || p.get("today") === "related",
    section: valid(p.get("section"), ["ranking", "insights"], "ranking"),
    category: "all",
    discipline: valid(p.get("discipline"), DISCIPLINES.map(d => d.id), "all"),
    major: valid(p.get("major"), DISCIPLINES.find(d => d.id === p.get("discipline"))?.majors.map(m => m.id) || [], "all"),
    includeCommon: p.get("common") !== "0",
    stage: valid(p.get("stage"), RESEARCH_STAGES.map((s) => s.id), ""),
    pack,
    packTitle: pack.length ? (p.get("packTitle") || "").trim().slice(0, 40) : "",
    task: valid(
      p.get("task") ||
        {
          "paper-writing": "write",
          "literature-review": "find",
          "peer-review": "review",
          "experiment-reproducibility": "reproduce",
        }[p.get("cat")],
      RESEARCH_TASKS.map((t) => t.id),
      "all",
    ),
    agent: valid(
      p.get("agent"),
      AGENT_PLATFORMS.map((a) => a.id),
      "all",
    ),
    sort: valid(
      p.get("sort") === "fit" && !DISCIPLINES.some(d => d.id === p.get("discipline")) ? "rank" : p.get("sort"),
      ["rank", "trend", "stars", "updated", "delta30", "delta7", "newest", "fit"],
      "rank",
    ),
    lang: valid(
      p.get("lang"),
      ["zh", "en"],
      valid(get("ars-lang"), ["zh", "en"], defaults.lang || "zh"),
    ),
    theme: valid(
      p.get("theme"),
      ["light", "dark"],
      valid(get("ars-theme"), ["light", "dark"], defaults.theme || "light"),
    ),
    view: valid(
      p.get("view"),
      ["table", "card"],
      valid(get("ars-view"), ["table", "card"], defaults.view || "table"),
    ),
    favorites: array("ars-favorites"),
    compare: array("ars-compare")
      .filter((repo) => repositories.has(repo))
      .slice(0, 3),
    favOnly: p.get("fav") === "1",
    webReady: p.get("web") === "1",
    newOnly: p.get("new") === "1",
    todayOnly: valid(p.get("today"), ["skill", "related"], ""),
    repo: repoByLower.get(String(p.get("repo") || "").toLowerCase()) || null,
  };
}
export function serializeState(state) {
  const p = new URLSearchParams();
  if (state.query) p.set("q", state.query);
  for (const [key, param, fallback] of [
    ["section", "section", "ranking"],
    ["task", "task", "all"],
    ["agent", "agent", "all"],
    ["sort", "sort", "rank"],
    ["view", "view", null],
    ["lang", "lang", "zh"],
    ["theme", "theme", "light"],
  ])
    if (state[key] !== fallback) p.set(param, state[key]);
  if (state.discipline && state.discipline !== "all") p.set("discipline", state.discipline);
  if (state.major && state.major !== "all") p.set("major", state.major);
  if (state.includeCommon === false) p.set("common", "0");
  if (state.stage) p.set("stage", state.stage);
  if (Array.isArray(state.pack) && state.pack.length) {
    p.set("pack", state.pack.join(","));
    if (state.packTitle) p.set("packTitle", state.packTitle);
  }
  if (state.includeRelated) p.set("related", "1");
  if (state.favOnly) p.set("fav", "1");
  if (state.webReady) p.set("web", "1");
  if (state.newOnly) p.set("new", "1");
  if (state.todayOnly) p.set("today", state.todayOnly);
  if (state.repo) p.set("repo", state.repo);
  return p.size ? "#" + p.toString() : "";
}
export function matchesResearchTask(item, task) {
  const reviewed=reviewedUsage[item.repo];
  if (reviewed?.reviewed_at && Array.isArray(reviewed.tasks)) return reviewed.tasks.includes(task.id);
  return (
    task.categories.includes(item.category?.id) ||
    task.pattern.test(
      [item.repo, item.description, ...(item.topics || [])].join(" "),
    )
  );
}
export function filterItems(items, state) {
  const q = state.query.trim();
  const search = createSearch(q);
  const task = RESEARCH_TASKS.find((t) => t.id === state.task);
  const stage = RESEARCH_STAGES.find((s) => s.id === state.stage);
  const packIndex =
    Array.isArray(state.pack) && state.pack.length
      ? new Map(state.pack.map((r, i) => [r.toLowerCase(), i]))
      : null;
  const result = items.filter((item) => {
    if (packIndex && !packIndex.has(item.repo.toLowerCase())) return false;
    if (!matchesDiscipline(item, state)) return false;
    if (
      !packIndex &&
      state.includeRelated !== undefined &&
      item.repository_kind !== "skill" &&
      !(state.includeRelated && item.repository_kind === "related")
    )
      return false;
    if (packIndex && item.repository_kind === "unknown") return false;
    if (state.newOnly && !item.new_this_week) return false;
    if (
      state.todayOnly &&
      (!item.new_today || item.repository_kind !== state.todayOnly)
    )
      return false;
    if (stage && !matchesResearchStage(item, stage)) return false;
    if (task && !matchesResearchTask(item, task)) return false;
    if (state.agent !== "all" && !detectAgents(item).includes(state.agent))
      return false;
    if (state.webReady && !isWebAiReady(item)) return false;
    if (state.favOnly && !state.favorites.includes(item.repo)) return false;
    return (
      !q ||
      search.matches(
        [
          item.repo,
          item.description,
          item.curated_use_zh,
          item.curated_use_en,
          item.category?.zh,
          item.category?.en,
          item.trend?.zh,
          item.trend?.en,
          ...(item.topics || []),
          item.language,
          ...detectAgents(item).flatMap((id) => [
            id,
            AGENT_PLATFORMS.find((a) => a.id === id)?.label,
          ]),
        ].join(" "),
      )
    );
  });
  const ranks = (a, b) => a.rank - b.rank;
  const sorts = {
    rank: ranks,
    stars: (a, b) => b.stars - a.stars || ranks(a, b),
    trend: (a, b) => b.trend_score - a.trend_score || b.stars - a.stars,
    updated: (a, b) =>
      (b.last_push_date || "").localeCompare(a.last_push_date || ""),
    delta7: (a, b) =>
      (b.star_delta_7d || 0) - (a.star_delta_7d || 0) || ranks(a, b),
    newest: (a, b) =>
      (Date.parse(b.first_seen_at || b.first_seen_date) || 0) -
        (Date.parse(a.first_seen_at || a.first_seen_date) || 0) || ranks(a, b),
    delta30: (a, b) =>
      (b.star_delta_30d ?? b.star_delta_7d ?? 0) -
        (a.star_delta_30d ?? a.star_delta_7d ?? 0) || b.stars - a.stars,
  };
  return result
    .sort((a,b) => {
      if (packIndex && state.sort === "rank") {
        return packIndex.get(a.repo.toLowerCase()) - packIndex.get(b.repo.toLowerCase());
      }
      if (state.sort === 'fit' && state.discipline && state.discipline !== 'all') {
        const priority = Number(disciplineFit(a,state) !== 'specific') - Number(disciplineFit(b,state) !== 'specific');
        if (priority) return priority;
      }
      if (stage && state.sort === "rank" && stage.featured?.length) {
        const ai = stage.featured.indexOf(a.repo);
        const bi = stage.featured.indexOf(b.repo);
        if (ai !== -1 || bi !== -1) {
          if (ai === -1) return 1;
          if (bi === -1) return -1;
          return ai - bi;
        }
      }
      return (sorts[state.sort] || ranks)(a,b);
    })
    .map((item, index) => ({ ...item, rank: index + 1 }));
}
export function persistState(storage, state) {
  for (const [key, value] of Object.entries({
    lang: state.lang,
    theme: state.theme,
    view: state.view,
    favorites: JSON.stringify(state.favorites),
    compare: JSON.stringify(state.compare),
  })) {
    try {
      storage?.setItem("ars-" + key, value);
    } catch {
      /* Browsing remains available when storage is disabled. */
    }
  }
}
export function safeExternalUrl(url) {
  try {
    const parsed = new URL(url);
    return ["https:", "http:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

export function taskCountsFor(items, state) {
  const eligible = filterItems(items, {
    ...state,
    task: "all",
    category: "all",
  });
  return Object.fromEntries([
    ["all", eligible.length],
    ...RESEARCH_TASKS.map((task) => [
      task.id,
      eligible.filter((item) => matchesResearchTask(item, task)).length,
    ]),
  ]);
}
export function recentlyUpdatedCount(items, generatedAt, days = 30) {
  const day = String(generatedAt).slice(0, 10);
  const anchor = Date.parse(day + "T00:00:00Z");
  if (
    !Number.isFinite(anchor) ||
    new Date(anchor).toISOString().slice(0, 10) !== day ||
    !Number.isInteger(days) ||
    days < 1
  )
    return 0;
  const cutoff = anchor - (days - 1) * 86400000;
  return items.filter((item) => {
    const date = item.last_push_date;
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))
      return false;
    const timestamp = Date.parse(date + "T00:00:00Z");
    return (
      Number.isFinite(timestamp) &&
      new Date(timestamp).toISOString().slice(0, 10) === date &&
      timestamp >= cutoff &&
      timestamp <= anchor
    );
  }).length;
}

export function isNewThisWeek(item, generatedAt) {
  if (item.first_seen_is_baseline) return false;
  const rawDay = String(generatedAt).slice(0, 10),
    first = item.first_seen_date;
  const rawDate = Date.parse(rawDay + "T00:00:00Z"),
    instant = Date.parse(generatedAt);
  if (
    !Number.isFinite(rawDate) ||
    !Number.isFinite(instant) ||
    new Date(rawDate).toISOString().slice(0, 10) !== rawDay
  )
    return false;
  const day = new Date(instant).toISOString().slice(0, 10);
  const now = Date.parse(day + "T00:00:00Z"),
    stamp = Date.parse(first + "T00:00:00Z");
  if (
    !Number.isFinite(now) ||
    !Number.isFinite(stamp) ||
    new Date(stamp).toISOString().slice(0, 10) !== first
  )
    return false;
  const monday = now - ((new Date(now).getUTCDay() + 6) % 7) * 86400000;
  return stamp >= monday && stamp <= now;
}

export function beijingDay(instant = Date.now()) {
  const time = new Date(instant).getTime();
  return Number.isFinite(time)
    ? new Date(time + 8 * 3600000).toISOString().slice(0, 10)
    : "";
}
export function isNewToday(item, now = Date.now()) {
  if (item.first_seen_is_baseline) return false;
  const today = beijingDay(now);
  if (!today) return false;
  if (item.first_seen_at != null) {
    if (
      typeof item.first_seen_at !== "string" ||
      !/(?:Z|[+-]\d{2}:\d{2})$/.test(item.first_seen_at)
    )
      return false;
    return beijingDay(item.first_seen_at) === today;
  }
  const date = item.first_seen_date;
  const stamp = Date.parse(date + "T00:00:00Z");
  return (
    typeof date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(stamp) &&
    new Date(stamp).toISOString().slice(0, 10) === date &&
    date === today
  );
}
