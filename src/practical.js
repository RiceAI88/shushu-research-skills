import reviewedUsage from "../config/project-usage.json" with {type:"json"};
import editorial from "../config/editorial.json" with { type: "json" };
import installCounts from "../config/install-counts.json" with { type: "json" };
import { safeExternalUrl } from "./domain.js";
export const EDITORIAL_CONTENT = editorial;
export const UPDATE_RUNS_URL =
  "https://api.github.com/repos/RiceAI88/shushu-research-skills/actions/workflows/update-rankings.yml/runs?branch=main&per_page=1";

const CATEGORY_CATALOG = {
  "paper-writing": { id: "paper-writing", zh: "论文写作", en: "Paper Writing" },
  "discipline-specific": { id: "discipline-specific", zh: "学科专项", en: "Discipline Specific" },
  "deep-research": { id: "deep-research", zh: "深度研究", en: "Deep Research" },
  "peer-review": { id: "peer-review", zh: "评审反馈", en: "Peer Review" },
  "general-research": { id: "general-research", zh: "综合研究", en: "General Research" },
  "literature-review": { id: "literature-review", zh: "文献综述", en: "Literature Review" },
  "experiment-reproducibility": { id: "experiment-reproducibility", zh: "实验复现", en: "Experiments" },
};

const TREND_CATALOG = {
  hot: { id: "hot", zh: "热门上升", en: "Hot" },
  rising: { id: "rising", zh: "持续增长", en: "Rising" },
  steady: { id: "steady", zh: "稳定", en: "Steady" },
};

const INTERNAL_SIGNAL_RE = /^(?:admission:|missing_|readme_|negative:|trusted_seed$)/i;

// 过滤仅供后端准入审计使用的内部信号，保留对学生可读的领域/平台特征词
export function filterPublicSignals(signals) {
  if (!Array.isArray(signals)) return [];
  return signals.filter(
    (s) => typeof s === "string" && s.trim() && !INTERNAL_SIGNAL_RE.test(s.trim()),
  );
}

export function installationFor(item, content = EDITORIAL_CONTENT) {
  const entry = content.installations?.[item.repo];
  const rawSourceUrl =
    typeof entry?.source_url === "string" && entry.source_url.startsWith("~")
      ? `https://github.com/${item.repo}${entry.source_url.slice(1)}`
      : entry?.source_url;
  const source = entry?.reviewed_at && safeExternalUrl(rawSourceUrl);
  const command =
    typeof entry?.command === "string" && entry.command.trim()
      ? entry.command
      : null;
  const fallbackUrl =
    safeExternalUrl(item.url) ||
    (item.repo ? `https://github.com/${item.repo}` : "https://github.com");
  return source
    ? {
        ...entry,
        command,
        mode: command
          ? "command"
          : ["manual", "reference"].includes(entry.mode)
            ? entry.mode
            : "docs",
        source_url: source,
      }
    : {
        mode: "docs",
        command: null,
        source_url: fallbackUrl + "#readme",
      };
}
// 紧凑格式化真实安装/下载数字（如 325125 -> 325.1k）
export function formatCompactCount(n) {
  const val = Number(n) || 0;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (val >= 10_000) return `${(val / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(val);
}

export function getInstallCount(item) {
  if (Number.isFinite(item?.install_count) && item.install_count > 0) {
    return item.install_count;
  }
  const pair = installCounts?.repos?.[String(item?.repo || "").toLowerCase()];
  return Array.isArray(pair) && Number.isFinite(pair[0]) ? pair[0] : 0;
}

export function installMetricFor(item, lang = "zh") {
  const pair = installCounts?.repos?.[String(item?.repo || "").toLowerCase()];
  const count =
    Number.isFinite(item?.install_count) && item.install_count > 0
      ? item.install_count
      : Array.isArray(pair)
        ? Number(pair[0]) || 0
        : 0;
  const source =
    item?.install_source || (Array.isArray(pair) ? String(pair[1] || "") : "");
  if (!count || count <= 0) return null;
  const zh = lang === "zh";
  const exact = new Intl.NumberFormat(zh ? "zh-CN" : "en-US").format(count);
  const compact = formatCompactCount(count);
  const label = zh ? "下载量" : "Downloads";
  if (source === "skills_cli") {
    const detail = zh
      ? `${exact} 次（Skills CLI 官方统计）`
      : `${exact} (verified via Skills CLI)`;
    return {
      count,
      compact,
      source,
      label,
      detail,
      tooltip: zh ? `下载量：${detail}` : `Downloads: ${detail}`,
    };
  }
  if (source === "pypi_30d") {
    const detail = zh
      ? `${exact} 次（PyPI 官方近 30 天）`
      : `${exact} (PyPI last 30 days)`;
    return {
      count,
      compact,
      source,
      label,
      detail,
      tooltip: zh ? `下载量：${detail}` : `Downloads: ${detail}`,
    };
  }
  if (source === "npm_30d") {
    const detail = zh
      ? `${exact} 次（npm 官方近 30 天）`
      : `${exact} (npm last 30 days)`;
    return {
      count,
      compact,
      source,
      label,
      detail,
      tooltip: zh ? `下载量：${detail}` : `Downloads: ${detail}`,
    };
  }
  const detail = zh
    ? `${exact} 次（GitHub Releases 累计）`
    : `${exact} (GitHub Releases total)`;
  return {
    count,
    compact,
    source: source || "github_releases",
    label,
    detail,
    tooltip: zh ? `下载量：${detail}` : `Downloads: ${detail}`,
  };
}

export function enrichItem(item, content = EDITORIAL_CONTENT) {
  const category =
    typeof item.category === "string"
      ? CATEGORY_CATALOG[item.category] || {
          id: item.category,
          zh: item.category,
          en: item.category,
        }
      : item.category;
  const trend =
    typeof item.trend === "string"
      ? TREND_CATALOG[item.trend] || {
          id: item.trend,
          zh: item.trend,
          en: item.trend,
        }
      : item.trend;
  const license =
    typeof item.license === "string"
      ? item.license
        ? {
            spdx_id: item.license === "Other" ? "NOASSERTION" : item.license,
            name: item.license,
          }
        : undefined
      : item.license;
  return {
    refresh_status: "fresh",
    stale: false,
    verifies_citations: false,
    skills_count_complete: true,
    first_seen_is_baseline: false,
    homepage: "",
    language: "",
    topics: [],
    ...item,
    url: item.url || (item.repo ? `https://github.com/${item.repo}` : ""),
    category,
    trend,
    license,
    precision_signals: filterPublicSignals(item.precision_signals),
    agents: content.platforms?.[item.repo] || item.agents || [],
    platforms_reviewed: Object.hasOwn(content.platforms || {}, item.repo),
    documented_platform_names: reviewedUsage[item.repo]?.platform_names || [],
    install_count: getInstallCount(item),
    install_source:
      item.install_source ||
      installCounts?.repos?.[String(item.repo || "").toLowerCase()]?.[1] ||
      "",
  };
}
export function editorialPicks(visibleItems, content = EDITORIAL_CONTENT) {
  const byRepo = new Map(visibleItems.map((item) => [item.repo, item]));
  return (content.featured || [])
    .filter((pick) => byRepo.has(pick.repo))
    .map((pick) => ({ ...pick, item: byRepo.get(pick.repo) }));
}
export function classifyUpdateRun(run, generatedAt) {
  if (!run || !Number.isInteger(run.id)) return { kind: "unknown" };
  const url = safeExternalUrl(run.html_url);
  const base = {
    url,
    runId: run.id,
    startedAt: run.run_started_at,
    finishedAt: run.updated_at,
  };
  if (
    ["queued", "in_progress", "waiting", "pending", "requested"].includes(
      run.status,
    )
  )
    return { ...base, kind: "running" };
  if (run.status !== "completed") return { ...base, kind: "unknown" };
  if (run.conclusion === "success") {
    const generated = Date.parse(generatedAt),
      started = Date.parse(run.run_started_at);
    return {
      ...base,
      kind:
        Number.isFinite(generated) &&
        Number.isFinite(started) &&
        generated >= started
          ? "success"
          : "publishing",
    };
  }
  if (
    [
      "failure",
      "cancelled",
      "timed_out",
      "action_required",
      "startup_failure",
    ].includes(run.conclusion)
  )
    return { ...base, kind: "failure" };
  return { ...base, kind: "unknown" };
}

export function reviewedInstallSnapshot(item, details={}) {
  const explicit=safeExternalUrl(details.source_snapshot_url);
  if(explicit) return explicit;
  return /^[a-f0-9]{40}$/.test(details.source_commit||'') ? installationFor(item).source_url.replace(/\/blob\/[^/]+\//, `/blob/${details.source_commit}/`) : null;
}
