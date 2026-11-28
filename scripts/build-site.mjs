import { cp, mkdir, copyFile, readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const PUBLIC_DATA_FILES = new Set([
  "rankings.json",
  "rankings.csv",
  "rankings.js",
  "history.js",
]);
await cp("reports", "dist/reports", { recursive: true });
await mkdir("dist/data", { recursive: true });
for (const entry of await readdir("data", { withFileTypes: true })) {
  if (entry.isFile() && PUBLIC_DATA_FILES.has(entry.name)) {
    await copyFile(`data/${entry.name}`, `dist/data/${entry.name}`);
  }
}
await mkdir("dist/docs", { recursive: true });
for (const file of await readdir("docs"))
  if (file.endsWith(".md")) await copyFile(`docs/${file}`, `dist/docs/${file}`);
await mkdir("dist/assets", { recursive: true });
for (const file of [
  "styles.css",
  "og-cover.svg",
  "og-cover.png",
  "og-cover-en.svg",
  "og-cover-en.png",
  "hero.svg",
  "favicon.png",
  "hamster-logo.png",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "shushu-mascot.svg",
])
  await copyFile(`assets/${file}`, `dist/assets/${file}`);
for (const file of [
  "feed.xml",
  "sitemap.xml",
  "robots.txt",
  "CONTRIBUTING.md",
  "LICENSE",
  "CNAME",
])
  await copyFile(file, `dist/${file}`);
console.log("Public data, reports, SEO and supporting assets copied to dist.");

// Crawlers and no-JavaScript readers receive the current ranking at build time.
const { safeExternalUrl, filterItems, restoreState } = await import("../src/domain.js");
const { DISCIPLINES, disciplineFit } = await import("../src/disciplines.js");
const ranking = JSON.parse(await readFile("data/rankings.json", "utf8"));

// Save clean Vite-built zh HTML template before mutating dist/index.html
const rawZhTemplate = await readFile("dist/index.html", "utf8");

// Pages caches fixed data URLs for ten minutes. Version each script by content
// so a newly deployed page cannot reuse data from the previous deployment.
const dataVersions = {};
for (const script of ["rankings", "history"]) {
  dataVersions[script] = createHash("sha256")
    .update(await readFile(`dist/data/${script}.js`))
    .digest("hex")
    .slice(0, 12);
}
const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const VALID_REPO_SLUG = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const hasStaticSkillPage = (item) =>
  item?.repository_kind === "skill" &&
  VALID_REPO_SLUG.test(String(item.repo || "")) &&
  !String(item.repo || "").includes("..");

const defaultItems = filterItems(ranking.items, restoreState(null, "", {}, ranking.items));
const top = defaultItems.slice(0, 20);
for (const [file, lang] of [
  ["index.html", "zh"],
  ["en/index.html", "en"],
]) {
  const path = `dist/${file}`;
  let html = await readFile(path, "utf8");
  for (const [script, version] of Object.entries(dataVersions)) {
    html = html.replace(`data/${script}.js"`, `data/${script}.js?v=${version}"`);
  }
  const url = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)[1];
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: lang === "zh" ? "科研鼠鼠 · Skills 导航站" : "Research Hamster · Skills Directory",
    description: lang === "zh"
      ? "面向本科生与研究生，按专业和科研任务查找 GitHub 开源 Skills，覆盖文献检索、论文阅读、写作、绘图与数据分析，提供安装指引。"
      : "Find GitHub research Skills for undergraduate and postgraduate students by discipline and research task, with installation guidance for literature search, reading, writing, figures and data analysis.",
    url,
    numberOfItems: defaultItems.length,
    itemListElement: top.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.repo,
      url:
        lang === "zh" && hasStaticSkillPage(item)
          ? `https://riceai985.cc/skills/${item.repo}/`
          : safeExternalUrl(item.url) || undefined,
    })),
  };
  const json = JSON.stringify(schema).replace(/</g, "\\u003c");
  html = html.replace(
    /(<script type="application\/ld\+json" id="ld-json">)[\s\S]*?(<\/script>)/,
    (_, open, close) => open + json + close,
  );
  const title =
    lang === "zh"
      ? "科研鼠鼠 · Skills 导航站 · 默认 Skills 榜单前 20 名"
      : "Research Hamster · Skills Directory · Default Skills Top 20";
  const hint =
    lang === "zh"
      ? "按 GitHub Stars 排序，默认仅展示 Skills。启用 JavaScript 可按专业、任务和平台筛选，查看安装指引与增长趋势。"
      : "Ranked by GitHub Stars; Skills only by default. Enable JavaScript to browse by discipline, task and platform, with installation guidance and growth trends.";
  const list = top
    .map((item) => {
      const ghUrl = escapeHtml(safeExternalUrl(item.url) || "#");
      if (lang === "zh" && hasStaticSkillPage(item)) {
        return `<li><a href="/skills/${escapeHtml(item.repo)}/">${escapeHtml(item.repo)}</a>（<a href="${ghUrl}">GitHub</a>）<p>${escapeHtml(item.curated_use_zh || item.description)}</p></li>`;
      }
      return `<li><a href="${ghUrl}">${escapeHtml(item.repo)}</a><p>${escapeHtml(item.description)}</p></li>`;
    })
    .join("");
  const extraNav =
    lang === "zh"
      ? `<p><a href="/llms.txt">AI 搜索引擎索引 (llms.txt)</a> · <a href="/llms-full.txt">完整收录库索引 (llms-full.txt)</a></p>`
      : `<p><a href="/llms.txt">AI Search Index (llms.txt)</a> · <a href="/llms-full.txt">Full Skill Catalog (llms-full.txt)</a></p>`;
  html = html.replace(
    /<noscript\s*>[\s\S]*?<\/noscript\s*>/,
    () =>
      `<noscript><section><h1>${title}</h1><p>${hint}</p><ol>${list}</ol>${extraNav}</section></noscript>`,
  );
  const cover = `og-cover${lang === "en" ? "-en" : ""}.png`;
  const coverVersion = createHash("sha256").update(await readFile(`dist/assets/${cover}`)).digest("hex").slice(0, 12);
  html = html.replaceAll(`assets/${cover}"`, `assets/${cover}?v=${coverVersion}"`);
  await writeFile(path, html);
}

// Generate 20 static SEO topic & discipline landing pages (/disciplines/<id>/ and /topics/<id>/)
const SITE_ORIGIN = "https://riceai985.cc";
const zhCoverVersion = createHash("sha256")
  .update(await readFile("dist/assets/og-cover.png"))
  .digest("hex")
  .slice(0, 12);

const TOPIC_SEO_SPECS = [
  {
    id: "find",
    label: "找文献",
    title: "文献检索与开题综述开源 AI Skills 推荐｜科研鼠鼠导航站",
    h1: "文献检索与开题综述开源 AI Skills 榜单",
    description:
      "面向大学生与研究生，精选支持 PubMed、arXiv、Semantic Scholar、Zotero 与引文交叉核验的开源文献检索 AI Skills，提供一键安装与开题提示词。",
    keywords:
      "文献检索 Skill, 开题文献综述, Zotero AI, arXiv 检索, PubMed 检索, Semantic Scholar, Claude Code, Codex, 科研工具",
  },
  {
    id: "read",
    label: "读论文",
    title: "读论文、英文文献翻译与精读笔记 AI Skills 推荐｜科研鼠鼠导航站",
    h1: "读论文与文献精读开源 AI Skills 榜单",
    description:
      "精选面向英文文献双语精读、公式方法拆解、多篇文献对比矩阵与 Zotero 笔记整理的 GitHub 开源 AI Skills，帮助本硕博学生高效啃透顶会顶刊论文。",
    keywords:
      "读论文 AI, 英文文献翻译, 论文精读笔记, Zotero 文献分析, 科研阅读 Skill, Claude Code, Codex",
  },
  {
    id: "write",
    label: "写论文",
    title: "学术论文写作、润色降 AI 味与 LaTeX/Word 排版 Skills 推荐｜科研鼠鼠导航站",
    h1: "学术论文写作、润色与排版开源 AI Skills 榜单",
    description:
      "精选面向中英文学术论文初稿组织、去除防御性与 AI 腔表达、语法润色及高校毕业论文 Word / LaTeX 排版的开源 AI Skills，附实战提示词案例。",
    keywords:
      "论文写作 Skill, 学术论文润色, 去除 AI 味, 防御性写作, LaTeX 排版, 毕业论文 Word 排版, Claude Code, Codex",
  },
  {
    id: "figures",
    label: "科研绘图",
    title: "科研绘图、顶刊配图与流程图开源 AI Skills 推荐｜科研鼠鼠导航站",
    h1: "科研绘图与顶刊配图开源 AI Skills 榜单",
    description:
      "精选支持 Nature/顶会风格 Python/R 统计图表、模型架构图、学术海报及 Visio / Origin 可编辑配图生成的开源 AI Skills，解决论文画图难题。",
    keywords:
      "科研绘图 Skill, 顶刊配图, 论文架构图, Visio 流程图 AI, Origin 绘图, Python 论文画图, PaperBanana, figures4papers",
  },
  {
    id: "reproduce",
    label: "实验复现",
    title: "实验复现、基准测试与自动化科研 AI Skills 推荐｜科研鼠鼠导航站",
    h1: "实验复现与代码基准测试开源 AI Skills 榜单",
    description:
      "精选面向论文代码审计、消融实验规划、随机种子可复现性核查与端到端自主实验工作流的 GitHub 开源 AI Skills，助力高效推进课题实验。",
    keywords:
      "实验复现 Skill, 论文代码复现, 消融实验, 自动化科研 Agent, 机器学习实验管理, Claude Code, Codex",
  },
  {
    id: "review",
    label: "投稿审稿",
    title: "投稿自查、模拟审稿与 Rebuttal 返修回复 AI Skills 推荐｜科研鼠鼠导航站",
    h1: "投稿自查与审稿返修（Rebuttal）开源 AI Skills 榜单",
    description:
      "精选支持投稿前方法论漏洞自查、顶会期刊模拟审稿评议与审稿意见逐条 Rebuttal 回复撰写的开源 AI Skills，提升论文录用率。",
    keywords:
      "论文审稿 Skill, Rebuttal 回复信, 投稿前自查, 模拟同行评审, 论文返修, Peer Review AI Skill",
  },
  {
    id: "analyze",
    label: "数据分析",
    title: "实证计量、问卷统计与生物信息数据分析 AI Skills 推荐｜科研鼠鼠导航站",
    h1: "科研数据分析、实证计量与生信统计开源 AI Skills 榜单",
    description:
      "精选支持 Stata / R / Python 回归因果推断、问卷量表分析、元分析（Meta-analysis）与单细胞基因组学分析的开源 AI Skills，服务社科与理工医实证研究。",
    keywords:
      "实证计量 Skill, Stata AI, 问卷数据分析, 因果推断, 单细胞生信分析, R 语言统计, 科研数据分析",
  },
  {
    id: "compute",
    label: "研究计算",
    title: "科学计算、数学建模与数值仿真开源 AI Skills 推荐｜科研鼠鼠导航站",
    h1: "科学计算、数学建模与仿真开源 AI Skills 榜单",
    description:
      "精选支持美赛/国赛数学建模全流程、物理分子动力学模拟、符号推导与 GPU 仿真实验的 GitHub 开源 AI Skills，提供环境配置与调用指引。",
    keywords:
      "数学建模 AI Skill, 国赛美赛建模, 科学计算, 分子模拟, 数值仿真, MathModelAgent, IsaacLab",
  },
];

const landingPages = [
  ...DISCIPLINES.map((d) => {
    const majors = (d.majors || []).map((m) => m.zh);
    const majorsShort = majors.slice(0, 3).join("、");
    const majorsAll = majors.join("、");
    const initialHash = `#discipline=${d.id}&sort=fit`;
    const state = restoreState(null, initialHash, {}, ranking.items);
    const matched = filterItems(ranking.items, state);
    const specificCount = matched.filter(
      (item) => disciplineFit(item, { discipline: d.id, major: "all" }) === "specific",
    ).length;
    return {
      slug: `disciplines/${d.id}`,
      navLabel: `${d.zh}专业`,
      initialHash,
      matched,
      title: `${d.zh}专业科研 AI Skills 推荐榜单（${majorsShort}）｜科研鼠鼠导航站`,
      h1: `${d.zh}类专业开源科研 AI Skills 推荐榜单`,
      description: `面向${d.zh}门类（${majorsAll}）本科生与研究生，收录 ${specificCount} 个本专业适用项目及共 ${matched.length} 个可用开源科研 AI Skills，按专业匹配度与 GitHub Stars 排序，附安装方式与提示词案例。`,
      keywords: `${d.zh}科研工具, ${majors.join(", ")}, 毕业论文, 学术 AI Skills, Claude Code, Codex, 科研鼠鼠`,
    };
  }),
  ...TOPIC_SEO_SPECS.map((spec) => {
    const initialHash = `#task=${spec.id}`;
    const state = restoreState(null, initialHash, {}, ranking.items);
    const matched = filterItems(ranking.items, state);
    return {
      slug: `topics/${spec.id}`,
      navLabel: spec.label,
      initialHash,
      matched,
      title: spec.title,
      h1: spec.h1,
      description: `${spec.description}（当前共收录 ${matched.length} 个相关开源 Skills）`,
      keywords: spec.keywords,
    };
  }),
];

const crossNavLinks = landingPages
  .map(
    (p) =>
      `<a href="/${escapeHtml(p.slug)}/">${escapeHtml(p.navLabel)}</a>`,
  )
  .join(" · ");

for (const page of landingPages) {
  let html = rawZhTemplate;
  for (const [script, version] of Object.entries(dataVersions)) {
    html = html.replace(`data/${script}.js"`, `data/${script}.js?v=${version}"`);
  }
  html = html.replaceAll(
    `assets/og-cover.png"`,
    `assets/og-cover.png?v=${zhCoverVersion}"`,
  );

  const canonicalUrl = `${SITE_ORIGIN}/${page.slug}/`;
  // Remove root-level hreflang alternates so sub-pages self-canonicalize cleanly
  html = html.replace(/\s*<link\b[^>]*\bhreflang="[^"]+"[^>]*>/g, "");
  html = html.replace(
    /<link\b[^>]*\brel="canonical"[^>]*>/,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
  );
  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtml(page.title)}</title>`,
  );
  html = html.replace(
    /<meta\b[^>]*\bname="description"[^>]*>/,
    `<meta name="description" content="${escapeHtml(page.description)}" />`,
  );
  html = html.replace(
    /<meta\b[^>]*\bname="keywords"[^>]*>/,
    `<meta name="keywords" content="${escapeHtml(page.keywords)}" />`,
  );
  html = html.replace(
    /<meta\b[^>]*\bproperty="og:url"[^>]*>/,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
  );
  html = html.replace(
    /<meta\b[^>]*\bproperty="og:title"[^>]*>/,
    `<meta property="og:title" content="${escapeHtml(page.title)}" />`,
  );
  html = html.replace(
    /<meta\b[^>]*\bproperty="og:description"[^>]*>/,
    `<meta property="og:description" content="${escapeHtml(page.description)}" />`,
  );
  html = html.replace(
    /<meta\b[^>]*\bname="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${escapeHtml(page.title)}" />`,
  );
  html = html.replace(
    /<meta\b[^>]*\bname="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`,
  );

  const topMatched = page.matched.slice(0, 20);
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: page.h1,
    description: page.description,
    url: canonicalUrl,
    numberOfItems: page.matched.length,
    itemListElement: topMatched.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.repo,
      description: item.curated_use_zh || item.description || undefined,
      url: hasStaticSkillPage(item)
        ? `${SITE_ORIGIN}/skills/${item.repo}/`
        : safeExternalUrl(item.url) || undefined,
    })),
  };
  const json = JSON.stringify(schema).replace(/</g, "\\u003c");
  html = html.replace(
    /(<script type="application\/ld\+json" id="ld-json">)[\s\S]*?(<\/script>)/,
    (_, open, close) => open + json + close,
  );

  const listHtml = topMatched
    .map((item) => {
      const zhSummary = item.curated_use_zh
        ? `<strong>${escapeHtml(item.curated_use_zh)}</strong> — `
        : "";
      const ghUrl = escapeHtml(safeExternalUrl(item.url) || "#");
      const primaryHref = hasStaticSkillPage(item)
        ? `/skills/${escapeHtml(item.repo)}/`
        : ghUrl;
      const ghSuffix = hasStaticSkillPage(item)
        ? ` · <a href="${ghUrl}">GitHub</a>`
        : "";
      return `<li><a href="${primaryHref}">${escapeHtml(item.repo)}</a>（★${Number(item.stars || 0).toLocaleString("en-US")}${ghSuffix}）<p>${zhSummary}${escapeHtml(item.description || "")}</p></li>`;
    })
    .join("");

  html = html.replace(
    /<noscript\s*>[\s\S]*?<\/noscript\s*>/,
    () =>
      `<noscript><section><h1>${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.description)}</p><ol>${listHtml}</ol><nav aria-label="全站科研专题导航"><p><a href="/">返回科研鼠鼠 · Skills 导航站总榜</a> · ${crossNavLinks}</p></nav></section></noscript>`,
  );

  const bootScript = `<script>window.__ARS_INITIAL_HASH=${JSON.stringify(page.initialHash)};window.__ARS_CUSTOM_TITLE=${JSON.stringify(page.title)};</script>`;
  html = html.replace(
    /(<script\b[^>]*\bsrc="\/data\/rankings\.js)/,
    `${bootScript}\n    $1`,
  );

  if (!html.includes(`rel="canonical" href="${escapeHtml(canonicalUrl)}"`)) {
    throw new Error(`Failed to inject canonical URL for ${page.slug}`);
  }
  if (!html.includes("window.__ARS_INITIAL_HASH=")) {
    throw new Error(`Failed to inject initial landing state for ${page.slug}`);
  }

  const outDir = `dist/${page.slug}`;
  await mkdir(outDir, { recursive: true });
  await writeFile(`${outDir}/index.html`, html);
}
console.log(`Generated ${landingPages.length} static SEO discipline & topic landing pages.`);

// 为全部已验证 Skill（上限 600）生成独立静态 SEO 落地页 (/skills/<owner>/<repo>/)，承接长尾名称检索并打通站内内链闭环
const seoSkillItems = ranking.items
  .filter((item) => hasStaticSkillPage(item))
  .slice(0, 600);

for (let idx = 0; idx < seoSkillItems.length; idx++) {
  const item = seoSkillItems[idx];
  let html = rawZhTemplate;
  for (const [script, version] of Object.entries(dataVersions)) {
    html = html.replace(`data/${script}.js"`, `data/${script}.js?v=${version}"`);
  }
  html = html.replaceAll(
    `assets/og-cover.png"`,
    `assets/og-cover.png?v=${zhCoverVersion}"`,
  );

  const slug = `skills/${item.repo}`;
  const canonicalUrl = `${SITE_ORIGIN}/${slug}/`;
  const shortName = item.repo.split("/").pop();
  const zhUse = item.curated_use_zh || "开源学术科研 AI Skill";
  const starsText = Number(item.stars || 0).toLocaleString("en-US");
  const agentsText =
    Array.isArray(item.agents) && item.agents.length > 0
      ? item.agents.join(" / ")
      : "Claude Code / Codex / 网页版 AI";
  const pageTitle = `${shortName}（${item.repo}）：${zhUse}｜安装教程与用法 · 科研鼠鼠`;
  const rawDesc = `${item.repo}（★${starsText}）：${zhUse}。支持 ${agentsText}，提供三步安装命令、免命令行网页版 AI 用法与科研提示词案例。${item.description || ""}`;
  const pageDesc = rawDesc.slice(0, 155);
  const pageKeywords = `${shortName}, ${item.repo}, ${zhUse}, 科研 Skill, 安装教程, 怎么用, Claude Code, Codex, 科研鼠鼠`;
  const initialHash = `#repo=${encodeURIComponent(item.repo)}`;

  html = html.replace(/\s*<link\b[^>]*\bhreflang="[^"]+"[^>]*>/g, "");
  html = html.replace(
    /<link\b[^>]*\brel="canonical"[^>]*>/,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
  );
  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    `<title>${escapeHtml(pageTitle)}</title>`,
  );
  html = html.replace(
    /<meta\b[^>]*\bname="description"[^>]*>/,
    `<meta name="description" content="${escapeHtml(pageDesc)}" />`,
  );
  html = html.replace(
    /<meta\b[^>]*\bname="keywords"[^>]*>/,
    `<meta name="keywords" content="${escapeHtml(pageKeywords)}" />`,
  );
  html = html.replace(
    /<meta\b[^>]*\bproperty="og:url"[^>]*>/,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
  );
  html = html.replace(
    /<meta\b[^>]*\bproperty="og:title"[^>]*>/,
    `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`,
  );
  html = html.replace(
    /<meta\b[^>]*\bproperty="og:description"[^>]*>/,
    `<meta property="og:description" content="${escapeHtml(pageDesc)}" />`,
  );
  html = html.replace(
    /<meta\b[^>]*\bname="twitter:title"[^>]*>/,
    `<meta name="twitter:title" content="${escapeHtml(pageTitle)}" />`,
  );
  html = html.replace(
    /<meta\b[^>]*\bname="twitter:description"[^>]*>/,
    `<meta name="twitter:description" content="${escapeHtml(pageDesc)}" />`,
  );

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareSourceCode",
    name: item.repo,
    url: canonicalUrl,
    codeRepository: safeExternalUrl(item.url) || undefined,
    description: pageDesc,
    programmingLanguage: item.language || "Markdown",
    license:
      item.license?.spdx_id && item.license.spdx_id !== "NOASSERTION"
        ? item.license.spdx_id
        : undefined,
  };
  const json = JSON.stringify(schema).replace(/</g, "\\u003c");
  html = html.replace(
    /(<script type="application\/ld\+json" id="ld-json">)[\s\S]*?(<\/script>)/,
    (_, open, close) => open + json + close,
  );

  // 相邻同榜单静态 Skill 互链，确保全量项目页形成无孤岛网状爬虫路径
  const peerLinks = Array.from({ length: Math.min(6, Math.max(0, seoSkillItems.length - 1)) }, (_, offset) => {
    const peer = seoSkillItems[(idx + offset + 1) % seoSkillItems.length];
    return `<a href="/skills/${escapeHtml(peer.repo)}/">${escapeHtml(peer.repo)}</a>`;
  }).join(" · ");

  html = html.replace(
    /<noscript\s*>[\s\S]*?<\/noscript\s*>/,
    () =>
      `<noscript><article><h1>${escapeHtml(item.repo)} — ${escapeHtml(zhUse)}</h1><p>GitHub Stars：${escapeHtml(starsText)} · 适用平台：${escapeHtml(agentsText)}</p><p>${escapeHtml(item.description || "")}</p><p><a href="${escapeHtml(safeExternalUrl(item.url) || "#")}">访问 GitHub 原仓库</a> · <a href="/">返回科研鼠鼠 · Skills 导航站总榜</a></p><p>更多已验证科研 Skills：${peerLinks}</p><nav aria-label="全站科研专题导航"><p>${crossNavLinks}</p></nav></article></noscript>`,
  );

  const bootScript = `<script>window.__ARS_INITIAL_HASH=${JSON.stringify(initialHash)};window.__ARS_CUSTOM_TITLE=${JSON.stringify(pageTitle)};</script>`;
  html = html.replace(
    /(<script\b[^>]*\bsrc="\/data\/rankings\.js)/,
    `${bootScript}\n    $1`,
  );

  const outDir = `dist/${slug}`;
  await mkdir(outDir, { recursive: true });
  await writeFile(`${outDir}/index.html`, html);
}
console.log(`Generated ${seoSkillItems.length} static SEO skill detail pages.`);

// 生成独立静态 SEO 教程页（/guides/ 与 /guides/<slug>/），与 content/guides/*.md 自动同步
const guideFiles = (await readdir("content/guides")).filter(
  (f) => f.endsWith(".md") && !/^readme\.md$/i.test(f),
);
const guideEntries = [];
for (const gf of guideFiles) {
  const rawMd = await readFile(`content/guides/${gf}`, "utf8");
  const fmMatch = rawMd.replace(/\r\n/g, "\n").match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) continue;
  const meta = {};
  for (const ln of fmMatch[1].split("\n")) {
    const idx = ln.indexOf(":");
    if (idx > 0) meta[ln.slice(0, idx).trim()] = ln.slice(idx + 1).trim();
  }
  if (meta.slug && meta.title) {
    guideEntries.push({ ...meta, order: Number(meta.order) || 99, body: fmMatch[2].trim() });
  }
}
guideEntries.sort((a, b) => a.order - b.order);

const renderGuideSeoPage = async ({ outSubdir, pageTitle, pageDesc, initialHash, h1, bodyText }) => {
  let html = await readFile("dist/index.html", "utf8");
  const canonicalUrl = `${SITE_ORIGIN}/${outSubdir ? `${outSubdir}/` : ""}`;
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(pageTitle)}</title>`);
  html = html.replace(
    /<meta\b[^>]*\bname="description"[^>]*>/,
    `<meta name="description" content="${escapeHtml(pageDesc)}" />`,
  );
  html = html.replace(
    /<link\b[^>]*\brel="canonical"[^>]*>/,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
  );
  html = html.replace(
    /<meta\b[^>]*\bproperty="og:url"[^>]*>/,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
  );
  html = html.replace(
    /<meta\b[^>]*\bproperty="og:title"[^>]*>/,
    `<meta property="og:title" content="${escapeHtml(pageTitle)}" />`,
  );
  html = html.replace(
    /<meta\b[^>]*\bproperty="og:description"[^>]*>/,
    `<meta property="og:description" content="${escapeHtml(pageDesc)}" />`,
  );
  const guideNav = guideEntries
    .map((g) => `<li><a href="/guides/${escapeHtml(g.slug)}/">${escapeHtml(g.title)}</a></li>`)
    .join("");
  html = html.replace(
    /<noscript\s*>[\s\S]*?<\/noscript\s*>/,
    () =>
      `<noscript><article><h1>${escapeHtml(h1)}</h1><p>${escapeHtml(pageDesc)}</p><pre>${escapeHtml(bodyText.slice(0, 1800))}</pre><ul>${guideNav}</ul><p><a href="/">返回科研鼠鼠 · Skills 导航站总榜</a></p></article></noscript>`,
  );
  const bootScript = `<script>window.__ARS_INITIAL_HASH=${JSON.stringify(initialHash)};window.__ARS_CUSTOM_TITLE=${JSON.stringify(pageTitle)};</script>`;
  html = html.replace(/(<script\b[^>]*\bsrc="\/data\/rankings\.js)/, `${bootScript}\n    $1`);
  await mkdir(`dist/${outSubdir}`, { recursive: true });
  await writeFile(`dist/${outSubdir}/index.html`, html);
};

await renderGuideSeoPage({
  outSubdir: "guides",
  pageTitle: "科研 AI Agent 零基础装机与 Skills 教程专栏｜科研鼠鼠导航站",
  pageDesc: "面向本硕博科研人员，详解 Google Antigravity、Claude Code、OpenAI Codex CLI 与 Cursor 的零基础安装、账号配置与学术 Skills 挂载实战。",
  initialHash: "#section=guides",
  h1: "科研 AI Agent 零基础装机与 Skills 实战专栏",
  bodyText: guideEntries.map((g) => `${g.title}：${g.summary || ""}`).join("\n"),
});
for (const g of guideEntries) {
  await renderGuideSeoPage({
    outSubdir: `guides/${g.slug}`,
    pageTitle: `${g.title}｜科研鼠鼠 Agent 装机教程`,
    pageDesc: g.summary || g.title,
    initialHash: `#section=guides&guide=${encodeURIComponent(g.slug)}`,
    h1: g.title,
    bodyText: g.body,
  });
}
console.log(`Generated ${guideEntries.length + 1} static SEO Agent guide pages.`);

// 生成标准 /llms.txt 与 /llms-full.txt，方便 DeepSeek、Kimi、Perplexity、ChatGPT Search 等大模型检索引用
const generatedDay = String(ranking.metadata?.generated_at || "").slice(0, 10) || "latest";
const disciplineLines = DISCIPLINES.map(
  (d) =>
    `- [${d.zh}专业科研 AI Skills (${d.en})](${SITE_ORIGIN}/disciplines/${d.id}/): 覆盖 ${(d.majors || []).map((m) => m.zh).join("、")}`,
).join("\n");
const topicLines = TOPIC_SEO_SPECS.map(
  (spec) => `- [${spec.label}：${spec.h1}](${SITE_ORIGIN}/topics/${spec.id}/): ${spec.description}`,
).join("\n");
const top50Lines = seoSkillItems
  .slice(0, 50)
  .map((item, i) => {
    const stars = Number(item.stars || 0).toLocaleString("en-US");
    const summary = item.curated_use_zh || item.description || "开源学术科研 AI Skill";
    const agents = Array.isArray(item.agents) && item.agents.length > 0 ? item.agents.join("/") : "通用 Agent";
    return `${i + 1}. [${item.repo}](${SITE_ORIGIN}/skills/${item.repo}/) (★${stars} · ${agents}): ${summary}`;
  })
  .join("\n");

const llmsTxt = `# 科研鼠鼠 · Skills 导航站 (Research Hamster · Academic AI Skills Directory)

> 面向本科生、研究生与科研人员，收录并每日更新 ${seoSkillItems.length} 个经过核验的 GitHub 开源学术科研 AI Skills（支持 Claude Code、Codex、Gemini CLI、Cursor、OpenCode 及免命令行网页版 AI），覆盖 12 大学科门类与文献检索、论文精读、学术写作润色、科研绘图、数据分析、科学计算、实验复现、投稿审稿全流程。数据快照日期：${generatedDay}。

## 核心入口与结构化数据
- [中文总榜首页](${SITE_ORIGIN}/): 按 12 大学科、8 大科研任务与论文阶段筛选全部科研 Skills
- [English Directory](${SITE_ORIGIN}/en/): Bilingual directory of verified open-source academic research AI Skills
- [完整大模型索引 (llms-full.txt)](${SITE_ORIGIN}/llms-full.txt): 全部 ${seoSkillItems.length} 个已验证科研 Skills 的完整说明、星标、适用平台与专属教程页链接
- [JSON 榜单数据接口](${SITE_ORIGIN}/data/rankings.json): 每日自动更新的结构化仓库元数据
- [RSS 订阅源](${SITE_ORIGIN}/feed.xml): 新收录科研 Skills 动态订阅

## 按 12 大学科门类查找
${disciplineLines}

## 按 8 大科研任务查找
${topicLines}

## 热门验证科研 Skills Top 50
${top50Lines}
`;

const fullCatalogLines = seoSkillItems
  .map((item, i) => {
    const stars = Number(item.stars || 0).toLocaleString("en-US");
    const delta = item.star_delta_7d ? ` (7d ${item.star_delta_7d > 0 ? "+" : ""}${item.star_delta_7d})` : "";
    const zhSummary = item.curated_use_zh || item.description || "";
    const enSummary = item.description || "";
    const agents = Array.isArray(item.agents) && item.agents.length > 0 ? item.agents.join(", ") : "Claude Code, Codex, Web AI";
    return `### ${i + 1}. ${item.repo}
- 教程与提示词页: ${SITE_ORIGIN}/skills/${item.repo}/
- GitHub 仓库: ${safeExternalUrl(item.url) || `https://github.com/${item.repo}`}
- Stars: ${stars}${delta} | 语言: ${item.language || "Markdown"} | 适用平台: ${agents}
- 中文用途: ${zhSummary}
- English Description: ${enSummary}`;
  })
  .join("\n\n");

const llmsFullTxt = `# 科研鼠鼠 · Skills 导航站 — 全量已验证科研 AI Skills 索引 (llms-full.txt)

> 收录总数：${seoSkillItems.length} 个经过核验的开源学术科研 AI Skills · 更新日期：${generatedDay} · 主站：${SITE_ORIGIN}/

${fullCatalogLines}
`;

await writeFile("dist/llms.txt", llmsTxt);
await writeFile("dist/llms-full.txt", llmsFullTxt);
console.log(`Generated dist/llms.txt and dist/llms-full.txt (${seoSkillItems.length} verified skills).`);

// 生成 Web App Manifest，优化手机/iPad“添加到主屏幕”与桌面快捷应用图标体验
const webManifest = {
  name: "科研鼠鼠 · Skills 导航站",
  short_name: "科研鼠鼠",
  description:
    "面向大学生与研究生，按专业和科研任务查找经过核验的 GitHub 开源科研 AI Skills。",
  start_url: "/",
  scope: "/",
  display: "standalone",
  background_color: "#f8fafc",
  theme_color: "#0d9f6e",
  icons: [
    {
      src: "/assets/favicon.png",
      sizes: "64x64",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/assets/hamster-logo.png",
      sizes: "128x128",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/assets/icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/assets/icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/assets/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
};
await writeFile(
  "dist/manifest.webmanifest",
  JSON.stringify(webManifest, null, 2) + "\n",
);

// 生成智能容错 404.html：自动纠正大小写/简写路径至对应抽屉或学科页，其余路径展示品牌化导航兜底页
const disciplineNavPills = DISCIPLINES.map(
  (d) => `<a class="pill" href="/disciplines/${escapeHtml(d.id)}/">${escapeHtml(d.zh)}</a>`,
).join("");

const notFoundHtml = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <meta name="theme-color" content="#0d9f6e" />
    <title>页面未找到 · 科研鼠鼠 Skills 导航站</title>
    <link rel="icon" type="image/png" href="/assets/favicon.png" />
    <script>
      (function () {
        try {
          var p = location.pathname.replace(/\\/+$/, "");
          var skillMatch = p.match(/^\\/skills\\/([A-Za-z0-9_.-]+\\/[A-Za-z0-9_.-]+)$/i);
          if (skillMatch) {
            location.replace("/#repo=" + encodeURIComponent(skillMatch[1]));
            return;
          }
          var discMatch = p.match(/^\\/(medicine|economics|management|law|literature|history|philosophy|education|agriculture|arts|science|engineering)$/i);
          if (discMatch) {
            location.replace("/disciplines/" + discMatch[1].toLowerCase() + "/");
            return;
          }
          var topicMatch = p.match(/^\\/(find|read|write|figures|reproduce|review|analyze|compute)$/i);
          if (topicMatch) {
            location.replace("/topics/" + topicMatch[1].toLowerCase() + "/");
            return;
          }
        } catch (e) {}
      })();
    </script>
    <style>
      :root { color-scheme: light dark; --bg: #f8fafc; --panel: #ffffff; --text: #0f172a; --muted: #64748b; --border: #e2e8f0; --primary: #0d9f6e; --tint: #ecfdf5; }
      @media (prefers-color-scheme: dark) {
        :root { --bg: #0b1120; --panel: #111827; --text: #f1f5f9; --muted: #94a3b8; --border: #1e293b; --primary: #10b981; --tint: rgba(16,185,129,0.14); }
      }
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif; }
      main { max-width: 560px; width: 100%; padding: 32px 28px; border-radius: 20px; background: var(--panel); border: 1px solid var(--border); box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08); text-align: center; }
      img { display: block; margin: 0 auto 12px; }
      h1 { margin: 0 0 8px; font-size: 20px; }
      p { margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: var(--muted); }
      form { display: flex; gap: 8px; margin-bottom: 18px; }
      input { flex: 1; height: 38px; padding: 0 14px; border-radius: 999px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font: inherit; font-size: 13.5px; outline: none; }
      input:focus { border-color: var(--primary); }
      button, .home-btn { height: 38px; padding: 0 18px; border-radius: 999px; border: 0; background: var(--primary); color: #fff; font: inherit; font-size: 13.5px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
      .pills { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin-bottom: 20px; }
      .pill { padding: 4px 11px; border-radius: 999px; border: 1px solid var(--border); color: var(--muted); text-decoration: none; font-size: 12.5px; }
      .pill:hover { border-color: var(--primary); color: var(--primary); background: var(--tint); }
    </style>
  </head>
  <body>
    <main>
      <img src="/assets/shushu-mascot.svg" width="76" height="76" alt="科研鼠鼠" />
      <h1>这个链接好像迷路啦（404）</h1>
      <p>可能是项目仓库改名或网址拼写有误。你可以直接搜科研需求，或按学科返回总榜：</p>
      <form onsubmit="event.preventDefault();var q=this.q.value.trim();location.href=q?'/#q='+encodeURIComponent(q):'/';">
        <input name="q" type="search" placeholder="输入你的科研任务，例如：文献综述 / 顶刊配图 / Stata…" aria-label="搜索科研 Skills" />
        <button type="submit">搜索</button>
      </form>
      <div class="pills">${disciplineNavPills}</div>
      <a class="home-btn" href="/">返回科研鼠鼠总榜首页</a>
    </main>
  </body>
</html>
`;
await writeFile("dist/404.html", notFoundHtml);
console.log("Generated dist/manifest.webmanifest and smart dist/404.html.");
