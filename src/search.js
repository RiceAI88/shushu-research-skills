// 显式科研意图词表：支持单意图扩展、多词空格组合（AND）与中文/中英无空格复合词切分。
// 纯产品名（如 Zotero）与 owner/repo 路径保持字面匹配，不泛化到竞品。
const groups = [
  {
    task: "write",
    queries: [
      "润色",
      "论文润色",
      "学术润色",
      "语法润色",
      "语法修改",
      "proofread",
      "proofreading",
      "polish",
      "polishing",
    ],
    terms: ["润色", "proofread", "proofreading", "polish", "polishing"],
  },
  {
    task: "write",
    queries: ["论文写作", "学术写作", "写论文", "paper writing", "academic writing"],
    terms: [
      "论文写作",
      "学术写作",
      "paper writing",
      "paper-writing",
      "academic writing",
      "academic-writing",
      "manuscript",
    ],
  },
  {
    task: "write",
    queries: [
      "排版",
      "论文排版",
      "格式排版",
      "word排版",
      "latex排版",
      "formatting",
      "typesetting",
    ],
    terms: [
      "排版",
      "latex",
      "typst",
      "docx",
      "overleaf",
      "formatting",
      "typesetting",
    ],
  },
  {
    task: "figures",
    queries: [
      "绘图",
      "科研绘图",
      "论文配图",
      "配图",
      "画图",
      "图表",
      "作图",
      "figure",
      "figures",
      "plot",
      "plots",
      "plotting",
      "diagram",
      "diagrams",
    ],
    terms: [
      "绘图",
      "论文配图",
      "配图",
      "画图",
      "图表",
      "figure",
      "figures",
      "plot",
      "plots",
      "plotting",
      "diagram",
      "diagrams",
    ],
  },
  {
    task: "figures",
    queries: [
      "流程图",
      "画流程图",
      "架构图",
      "画架构图",
      "示意图",
      "科研示意图",
      "插图",
      "科研插图",
      "flowchart",
      "architecture diagram",
    ],
    terms: [
      "流程图",
      "架构图",
      "示意图",
      "插图",
      "flowchart",
      "architecture",
      "diagram",
      "diagrams",
      "illustration",
      "illustrations",
      "visio",
      "mermaid",
    ],
  },
  {
    task: "figures",
    queries: ["可视化", "数据可视化", "visualization", "data visualization"],
    terms: ["可视化", "visualization", "visualizations", "chart", "charts", "plot", "plots"],
  },
  {
    task: "figures",
    queries: ["海报", "学术海报", "会议海报", "poster", "posters"],
    terms: ["海报", "poster", "posters"],
  },
  {
    task: "find",
    queries: [
      "文献检索",
      "论文检索",
      "找文献",
      "查文献",
      "搜论文",
      "查论文",
      "literature search",
      "paper search",
    ],
    terms: [
      "文献检索",
      "论文检索",
      "literature search",
      "literature-search",
      "paper search",
      "paper-search",
      "literature retrieval",
    ],
  },
  {
    task: "find",
    queries: [
      "文献管理",
      "参考文献管理",
      "引文管理",
      "reference management",
      "citation management",
    ],
    terms: [
      "文献管理",
      "reference management",
      "reference-management",
      "citation management",
      "zotero",
      "mendeley",
      "endnote",
    ],
  },
  {
    task: "find",
    queries: ["开题", "开题报告", "选题", "科研选题", "research proposal"],
    terms: [
      "开题",
      "选题",
      "文献综述",
      "literature review",
      "proposal",
      "scoping",
    ],
  },
  {
    task: "read",
    queries: [
      "读论文",
      "论文阅读",
      "文献阅读",
      "精读",
      "论文精读",
      "笔记",
      "阅读笔记",
      "文献笔记",
      "论文总结",
      "paper reading",
      "paper reader",
      "reading notes",
    ],
    terms: [
      "读论文",
      "论文阅读",
      "文献阅读",
      "精读",
      "笔记",
      "paper reading",
      "paper-reading",
      "paper reader",
      "paper-reader",
      "read papers",
      "summary",
      "summarize",
      "notes",
      "obsidian",
    ],
  },
  {
    task: "read",
    queries: ["翻译", "论文翻译", "文献翻译", "translate", "translation", "translating"],
    terms: ["翻译", "translate", "translation", "translating", "translator"],
  },
  {
    task: "reproduce",
    queries: [
      "复现",
      "实验复现",
      "复现实验",
      "跑实验",
      "做实验",
      "自动实验",
      "消融实验",
      "消融",
      "基准测试",
      "reproduce",
      "reproducibility",
      "replication",
      "ablation",
      "benchmark",
    ],
    terms: [
      "复现",
      "实验",
      "消融",
      "基准测试",
      "reproduce",
      "reproducibility",
      "reproducible",
      "replication",
      "experiment",
      "experiments",
      "experimental",
      "ablation",
      "benchmark",
      "benchmarking",
      "auto-research",
      "autonomous",
    ],
  },
  {
    task: "review",
    queries: ["审稿", "同行评审", "模拟审稿", "投稿", "peer review", "peer-review"],
    terms: [
      "审稿",
      "同行评审",
      "投稿",
      "peer review",
      "peer-review",
      "reviewer",
      "reviewers",
      "referee",
      "submission",
    ],
  },
  {
    task: "review",
    queries: ["返修", "审稿回复", "回复审稿人", "修回", "rebuttal"],
    terms: ["返修", "审稿回复", "修回", "rebuttal", "point-by-point", "revision"],
  },
  {
    task: "write",
    queries: [
      "去ai味",
      "去ai腔",
      "降aigc",
      "降重",
      "查重",
      "改写",
      "humanizer",
      "humanize",
    ],
    terms: ["去ai", "aigc", "降重", "改写", "humanizer", "humanize", "anti-defensive"],
  },
  {
    task: "figures",
    queries: ["ppt", "pptx", "幻灯片", "演示文稿", "组会ppt", "答辩ppt", "组会汇报", "slides"],
    terms: ["ppt", "pptx", "幻灯片", "powerpoint", "slides", "presentation", "beamer"],
  },
  {
    task: "find",
    queries: ["文献综述", "综述", "系统综述", "literature review", "systematic review"],
    terms: [
      "文献综述",
      "系统综述",
      "literature review",
      "literature-review",
      "systematic review",
      "systematic-review",
      "prisma",
    ],
  },
  {
    task: "analyze",
    queries: [
      "数据分析",
      "统计分析",
      "统计检验",
      "计量",
      "计量经济",
      "实证",
      "实证分析",
      "回归",
      "回归分析",
      "因果推断",
      "双重差分",
      "面板数据",
      "问卷",
      "问卷分析",
      "data analysis",
      "statistical analysis",
      "econometrics",
      "regression",
      "causal inference",
    ],
    terms: [
      "数据分析",
      "统计分析",
      "计量",
      "实证",
      "回归",
      "因果",
      "问卷",
      "data analysis",
      "data-analysis",
      "statistical",
      "statistics",
      "econometrics",
      "econometric",
      "regression",
      "causal",
      "panel",
      "survey",
      "questionnaire",
      "stata",
    ],
  },
  {
    task: "analyze",
    queries: ["meta分析", "元分析", "荟萃分析", "meta-analysis", "meta analysis"],
    terms: ["meta分析", "元分析", "meta-analysis", "meta analysis", "systematic review", "prisma"],
  },
  {
    task: "analyze",
    queries: [
      "生信",
      "生物信息",
      "单细胞",
      "转录组",
      "bioinformatics",
      "single-cell",
      "scrna",
    ],
    terms: [
      "生信",
      "生物信息",
      "单细胞",
      "转录组",
      "bioinformatics",
      "single-cell",
      "singlecell",
      "scrna",
      "rna-seq",
      "genomics",
    ],
  },
  {
    task: "compute",
    queries: [
      "数学建模",
      "数模",
      "美赛",
      "国赛",
      "math modeling",
      "mathematical modeling",
    ],
    terms: [
      "数学建模",
      "数模",
      "math modeling",
      "math-modeling",
      "mathematical modeling",
      "mathematical-modeling",
      "mathmodel",
      "cumcm",
      "mcm",
    ],
  },
  {
    task: "compute",
    queries: [
      "研究计算",
      "科研计算",
      "数值计算",
      "科学计算",
      "仿真",
      "分子模拟",
      "scientific computing",
      "simulation",
    ],
    terms: [
      "研究计算",
      "科研计算",
      "数值计算",
      "科学计算",
      "仿真",
      "scientific computing",
      "scientific-computing",
      "simulation",
      "numerical",
      "molecular",
    ],
  },
];

// 复合查询修饰词双向同义表（如“英文润色”“中文排版”“免安装综述”中的限定词）
const MODIFIER_GROUPS = [
  ["英文", "英语", "english"],
  ["中文", "汉语", "chinese", "cn"],
  ["顶刊", "顶会", "nature", "publication", "journal", "conference"],
  ["毕设", "毕业论文", "本科", "thesis", "dissertation", "undergraduate"],
  ["医学", "临床", "生医", "medical", "clinical", "biomedical", "pubmed"],
  ["经管", "经济", "金融", "economic", "economics", "finance", "ssci"],
  ["法学", "法律", "legal", "law"],
  ["免安装", "网页版", "零基础", "免命令行", "web", "prompt", "markdown-only", "claude.ai"],
];

const normalize = (query) => String(query || "").trim().toLowerCase();
const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const WORD_CHAR = "[\\p{L}\\p{N}_]";
const HAS_CJK_RE = /[\u4e00-\u9fff]/;

// 按长度降序排列意图词，用于识别无空格复合词（如“英文润色”“python配图”）
const COMPOUND_INTENT_KEYS = [
  ...new Set(groups.flatMap((g) => g.queries).filter((k) => k.length >= 2 && !/\s/.test(k))),
].sort((a, b) => b.length - a.length);

function modifierTermsFor(tok) {
  return MODIFIER_GROUPS.filter((g) => g.includes(tok)).flatMap((g) => g);
}

function isSafeCompoundSplit(left, right) {
  if (!left || !right) return false;
  // 禁止在纯拉丁字母/数字内部硬拆（防止腰斩英文单词如 reproduction -> reproduce + tion）
  const leftEndsAscii = /[a-z0-9]$/i.test(left);
  const rightStartsAscii = /^[a-z0-9]/i.test(right);
  if (leftEndsAscii && rightStartsAscii) return false;
  return HAS_CJK_RE.test(left) || HAS_CJK_RE.test(right);
}

/**
 * 将用户查询拆分为需要同时满足（AND）的语义子句：
 * 1. 已完整命中意图词表或含路径斜杠（如 owner/repo）时保持整串；
 * 2. 含空白符时按空白切分为多词组合（如“stata 回归”“python 配图”）；
 * 3. 短无空格中英/中文复合词（如“英文润色”“sci润色”“python画图”）切分为修饰词 + 意图词。
 */
export function splitSearchTokens(rawQuery) {
  const q = normalize(rawQuery);
  if (!q) return [];
  if (q.includes("/") || groups.some((g) => g.queries.includes(q))) {
    return [q];
  }
  if (/\s/.test(q)) {
    const parts = q.split(/\s+/).filter(Boolean);
    return parts.length > 1 ? parts : [q];
  }
  if (q.length >= 3 && q.length <= 12 && HAS_CJK_RE.test(q)) {
    for (const key of COMPOUND_INTENT_KEYS) {
      if (key.length >= q.length) continue;
      if (q.endsWith(key)) {
        const prefix = q.slice(0, q.length - key.length);
        if (isSafeCompoundSplit(prefix, key)) return [prefix, key];
      }
      if (q.startsWith(key)) {
        const suffix = q.slice(key.length);
        if (isSafeCompoundSplit(key, suffix)) return [key, suffix];
      }
    }
  }
  return [q];
}

function buildTermRegex(term) {
  return new RegExp(
    (/^[a-z0-9]/i.test(term) ? `(?<!${WORD_CHAR})` : "") +
      escape(term) +
      (/[a-z0-9]$/i.test(term) ? `(?!${WORD_CHAR})` : ""),
    "giu",
  );
}

function buildClausePatterns(tok, allowModifiers = false) {
  const aliases = [
    ...new Set([
      ...groups.filter((group) => group.queries.includes(tok)).flatMap((group) => group.terms),
      ...(allowModifiers ? modifierTermsFor(tok) : []),
    ]),
  ].filter((term) => term !== tok);
  return [new RegExp(escape(tok), "giu"), ...aliases.map(buildTermRegex)];
}

export function suggestedTaskIds(query) {
  const q = normalize(query);
  if (!q || q.includes("/")) return [];
  const tokens = splitSearchTokens(q);
  return [
    ...new Set(
      groups
        .filter((group) => group.queries.includes(q) || tokens.some((t) => group.queries.includes(t)))
        .map((group) => group.task),
    ),
  ];
}

export function createSearch(query) {
  const q = normalize(query);
  if (!q) {
    return {
      patterns: [],
      matches() {
        return true;
      },
    };
  }
  const tokens = splitSearchTokens(q);
  const isMulti = tokens.length > 1;
  const wholePattern = new RegExp(escape(q), "giu");
  const clausePatterns = tokens.map((tok) => buildClausePatterns(tok, isMulti));
  const patterns = isMulti
    ? [wholePattern, ...clausePatterns.flat()]
    : clausePatterns[0];

  const testAny = (regexes, text) =>
    regexes.some((pattern) => {
      pattern.lastIndex = 0;
      return pattern.test(text);
    });

  return {
    patterns,
    matches(text) {
      if (!isMulti) return testAny(patterns, text);
      wholePattern.lastIndex = 0;
      if (wholePattern.test(text)) return true;
      return clausePatterns.every((regexes) => testAny(regexes, text));
    },
  };
}
