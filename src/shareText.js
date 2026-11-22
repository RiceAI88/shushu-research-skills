// 生成适合课题组微信群、QQ 群与小红书分享的纯文本安利卡片与工具包文案

const SITE_DEFAULT_ORIGIN = "https://riceai985.cc";

function resolveBaseOrigin(origin) {
  if (origin && /^https?:\/\//.test(origin)) return origin.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return (window.location.origin + window.location.pathname).replace(/\/+$/, "");
  }
  return SITE_DEFAULT_ORIGIN;
}

function briefSummary(item, lang) {
  if (lang === "zh") {
    return (
      item?.curated_use_zh ||
      (item?.description || "").slice(0, 72) ||
      "开源科研辅助工具"
    );
  }
  return (
    item?.curated_use_en ||
    (item?.description || "").slice(0, 88) ||
    "Open-source academic research tool"
  );
}

/**
 * 单个项目的“同门安利卡片”文案
 */
export function formatShareCardText(
  item,
  { lang = "zh", origin = "", tasks = "", agents = "" } = {},
) {
  const base = resolveBaseOrigin(origin);
  const url = `${base}/#repo=${encodeURIComponent(item.repo)}`;
  const stars = Number(item.stars || 0).toLocaleString(
    lang === "zh" ? "zh-CN" : "en-US",
  );
  const summary = briefSummary(item, lang);
  if (lang === "zh") {
    const lines = [
      `🐹 科研好工具安利｜${item.repo}（⭐ ${stars}）`,
      `💡 一句话用途：${summary}`,
    ];
    if (tasks) lines.push(`🎯 适用场景：${tasks}`);
    if (agents) lines.push(`🤖 适用工具：${agents}`);
    lines.push(`👉 3 步安装与提示词案例：${url}`);
    return lines.join("\n");
  }
  const lines = [
    `🐹 Research Skill Pick | ${item.repo} (⭐ ${stars})`,
    `💡 Summary: ${summary}`,
  ];
  if (tasks) lines.push(`🎯 Tasks: ${tasks}`);
  if (agents) lines.push(`🤖 Compatible AI Agents: ${agents}`);
  lines.push(`👉 3-step setup & prompt examples: ${url}`);
  return lines.join("\n");
}

/**
 * 构建专属工具包分享链接（#pack=...）
 */
export function buildPackUrl(repos, { origin = "", title = "", lang = "zh" } = {}) {
  const cleanRepos = [...new Set((repos || []).filter(Boolean))].slice(0, 20);
  const base = resolveBaseOrigin(origin);
  if (!cleanRepos.length) return `${base}/`;
  const params = new URLSearchParams();
  params.set("pack", cleanRepos.join(","));
  const cleanTitle = String(title || "").trim().slice(0, 40);
  if (cleanTitle) params.set("packTitle", cleanTitle);
  if (lang === "en") params.set("lang", "en");
  return `${base}/#${params.toString()}`;
}

/**
 * 多项目的“课题组科研工具包”分享文案
 */
export function formatPackShareText(
  packItems,
  { lang = "zh", origin = "", title = "" } = {},
) {
  const list = (packItems || []).slice(0, 20);
  const url = buildPackUrl(
    list.map((i) => i.repo),
    { origin, title, lang },
  );
  if (lang === "zh") {
    const heading = title
      ? `📦 ${title}（共 ${list.length} 款开源科研工具）`
      : `📦 我的科研 Skills 精选清单（共 ${list.length} 款实用工具）`;
    const rows = list.slice(0, 8).map((item, idx) => {
      const name = item.repo.split("/").pop();
      const stars = Number(item.stars || 0).toLocaleString("zh-CN");
      return `${idx + 1}. ${name}（⭐ ${stars}）— ${briefSummary(item, "zh")}`;
    });
    if (list.length > 8) {
      rows.push(`…等共 ${list.length} 个项目`);
    }
    return [
      heading,
      ...rows,
      `👉 打开专属合集查看安装步骤与提示词：${url}`,
    ].join("\n");
  }
  const heading = title
    ? `📦 ${title} (${list.length} open-source research tools)`
    : `📦 My Research Skills Toolkit (${list.length} curated tools)`;
  const rows = list.slice(0, 8).map((item, idx) => {
    const name = item.repo.split("/").pop();
    const stars = Number(item.stars || 0).toLocaleString("en-US");
    return `${idx + 1}. ${name} (⭐ ${stars}) — ${briefSummary(item, "en")}`;
  });
  if (list.length > 8) {
    rows.push(`…and ${list.length - 8} more`);
  }
  return [heading, ...rows, `👉 Open toolkit & prompt examples: ${url}`].join(
    "\n",
  );
}
