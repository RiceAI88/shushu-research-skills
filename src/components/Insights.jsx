import { DisciplineCounts, DisciplineCoverage } from "./DisciplineInsights";
import React, { useEffect, useMemo, useState } from "react";
import { Empty, Select, Tooltip } from "antd";
import { buildInsightData, createColorMaps } from "../insights";
import { THEME_TOKENS } from "../tokens";
import {
  AGENT_PLATFORMS,
  FONT_FAMILY,
  RESEARCH_TASKS,
  detectAgents,
  matchesResearchTask,
  sceneLabelsFor,
} from "../domain";
import { ChartBoundary } from "./ChartBoundary";

const chartLabels = {
  zh: {
    insightTrendNote: "窗口内增长最快的 3 个项目",
    insightGrowthNote: "近 7 日新增 Stars 最高的 5 个仓库 · 不随历史窗口切换",
    insightScatterNote:
      "Stars × 近 7 日变化 · 对数刻度（零值保留） · 点击查看仓库",
    comparisonNote: "已选比较仓库 · 相对窗口内各自起点",
    dataSince: "数据自",
    historyDetails: "数据与排名说明",
    categoryTooltip: "场景",
    historyProvenance: "2026-10-24 前的快照来自原项目；只绘制已有数据。",
    noGrowth: "当前范围没有正增长记录。",
    viewChartData: "查看数据与仓库详情",
    insightBaseline: "起点",
    insightSingleSnapshot: "仅一次快照",
    insightBaselineNote:
      "起点为各仓库窗口内首个非零快照，日期可能不同；缺失日期不补值。增长率=(末次Stars−起点Stars)/起点Stars；至少两次有效快照优先，再按增长率降序、仓库名排序。零起点之前不计算增长率。",
  },
  en: {
    insightTrendNote:
      "Top 3 by window growth · at least two valid observations first",
    insightGrowthNote:
      "Top 5 by 7-day Stars gained · independent of history window",
    insightScatterNote: "Stars (log) × 7-day change · click to view repository",
    comparisonNote:
      "Selected comparisons · relative to each baseline in this window",
    dataSince: "Data since",
    historyDetails: "Data and ranking details",
    categoryTooltip: "Research tasks",
    historyProvenance:
      "Snapshots before 2026-10-24 come from the original project; only recorded data is plotted.",
    noGrowth: "No positive growth in this selection.",
    viewChartData: "View data and repository details",
    insightBaseline: "Baseline",
    insightSingleSnapshot: "Single observation",
    insightBaselineNote:
      "Each baseline is its first non-zero snapshot in this window; dates may differ. No missing dates are filled. Growth = (last Stars − baseline Stars) / baseline Stars. Rank series with at least two valid observations first, then growth descending and repository name. Growth before a positive baseline is undefined.",
  },
};

const compactFmt = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function ChartFrame({ title, note, action, id, children, t, hidden = false }) {
  return (
    <article
      className={`insight-panel insight-${id}`}
      data-testid={`insight-${id}`}
      id={`insight-panel-${id}`}
      hidden={hidden}
      aria-labelledby={`insight-title-${id}`}
    >
      <div className="insight-panel-heading">
        <div className="trend-title-row">
          <h3 id={`insight-title-${id}`}>{title}</h3>
          {action}
        </div>
        {note && <p>{note}</p>}
      </div>
      {!hidden && (
        <ChartBoundary fallback={t("chartUnavailable")}>
          {children}
        </ChartBoundary>
      )}
    </article>
  );
}

function NoData({ text }) {
  return (
    <div className="chart-empty">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={text} />
    </div>
  );
}

// 响应式轻量水平柱状图（替代 @ant-design/plots Bar，零重型运行时依赖）
function HorizontalBarSvg({
  rows,
  height,
  padLeft,
  padRight = 64,
  maxValue,
  entering = false,
  muted,
  getLabel,
  getValue,
  getRightText,
  getFill,
  getTitle,
  onSelect,
}) {
  const W = 640;
  const padTop = 14;
  const padBottom = 14;
  const innerW = Math.max(80, W - padLeft - padRight);
  const innerH = Math.max(40, height - padTop - padBottom);
  const step = rows.length ? innerH / rows.length : innerH;
  const barH = Math.min(16, Math.max(10, step * 0.52));
  const safeMax = Math.max(1, maxValue);

  return (
    <svg
      className={`insight-svg${entering ? " is-entering" : ""}`}
      viewBox={`0 0 ${W} ${height}`}
      width="100%"
      height={height}
      style={{ display: "block", fontFamily: FONT_FAMILY }}
    >
      {rows.map((row, idx) => {
        const val = Math.max(0, Number(getValue(row)) || 0);
        const bw = val > 0 ? Math.max(4, (val / safeMax) * innerW) : 2;
        const cy = padTop + step * (idx + 0.5);
        const by = cy - barH / 2;
        return (
          <g key={row.id || row.repo || idx}>
            <text
              x={padLeft - 10}
              y={cy}
              dy="0.35em"
              textAnchor="end"
              fill={muted}
              fontSize="12"
            >
              {getLabel(row)}
            </text>
            <rect
              className="element"
              x={padLeft}
              y={by}
              width={bw}
              height={barH}
              rx={4}
              fill={getFill(row, idx)}
              style={{
                cursor: "pointer",
                transformOrigin: `${padLeft}px ${cy}px`,
              }}
              onClick={() => onSelect?.(row)}
            >
              <title>{getTitle(row)}</title>
            </rect>
            <text
              x={padLeft + bw + 7}
              y={cy}
              dy="0.35em"
              textAnchor="start"
              fill={muted}
              fontSize="11.5"
            >
              {getRightText(row)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// 响应式多序列相对增长折线图（原生矢量渲染，自带终点标签防重叠）
function TrendLineSvg({
  trends,
  trendRepos,
  trendRange,
  trendTicks,
  muted,
  grid,
  percent,
  fmt,
  baselineLabel,
  onOpenRepo,
}) {
  const W = 680;
  const H = 280;
  const padL = 54;
  const padR = 132;
  const padT = 16;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const valid = trends.filter((p) => Number.isFinite(p.growthPercent));
  const times = valid.map((p) => p.time);
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const spanT = maxT - minT;

  const vals = valid.map((p) => p.growthPercent);
  let minY = Math.min(...vals);
  let maxY = Math.max(...vals);
  if (minY === maxY) {
    minY -= 5;
    maxY += 5;
  } else {
    const pad = (maxY - minY) * 0.1;
    minY -= pad;
    maxY += pad;
  }

  const toX = (tVal) =>
    spanT > 0 ? padL + ((tVal - minT) / spanT) * plotW : padL + plotW / 2;
  const toY = (vVal) => padT + (1 - (vVal - minY) / (maxY - minY)) * plotH;

  const yTicks = Array.from({ length: 5 }, (_, i) => minY + ((maxY - minY) * i) / 4);
  const dashPatterns = [undefined, "7 4", "2 4"];

  const seriesList = trendRepos
    .map((item, idx) => {
      const pts = valid
        .filter((p) => p.repo === item.repo)
        .sort((a, b) => a.time - b.time);
      if (!pts.length) return null;
      const last = pts[pts.length - 1];
      return {
        repo: item.repo,
        shortName: item.repo.split("/").pop(),
        color: trendRange[idx] || trendRange[0],
        dash: dashPatterns[idx],
        pts,
        last,
        lastX: toX(last.time),
        lastY: toY(last.growthPercent),
        labelY: toY(last.growthPercent),
      };
    })
    .filter(Boolean);

  // 简易垂直错位，避免多条曲线终点仓库名重叠
  const sortedLabels = [...seriesList].sort((a, b) => a.labelY - b.labelY);
  for (let i = 1; i < sortedLabels.length; i++) {
    if (sortedLabels[i].labelY - sortedLabels[i - 1].labelY < 14) {
      sortedLabels[i].labelY = Math.min(
        H - padB + 4,
        sortedLabels[i - 1].labelY + 14,
      );
    }
  }

  return (
    <svg
      className="insight-svg"
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      style={{ display: "block", fontFamily: FONT_FAMILY }}
    >
      {yTicks.map((yv, idx) => {
        const y = toY(yv);
        return (
          <g key={idx}>
            <line
              x1={padL}
              y1={y}
              x2={W - padR}
              y2={y}
              stroke={grid}
              strokeDasharray="2 3"
            />
            <text
              x={padL - 8}
              y={y}
              dy="0.35em"
              textAnchor="end"
              fill={muted}
              fontSize="11.5"
            >
              {`${Math.round(yv * 10) / 10}%`}
            </text>
          </g>
        );
      })}
      {trendTicks.map((tv) => {
        const x = toX(tv);
        return (
          <text
            key={tv}
            x={x}
            y={H - 10}
            textAnchor="middle"
            fill={muted}
            fontSize="11.5"
          >
            {new Date(tv).toISOString().slice(5, 10)}
          </text>
        );
      })}
      {seriesList.map((s) => (
        <g key={s.repo}>
          <path
            className="element"
            d={s.pts
              .map(
                (p, idx) =>
                  `${idx === 0 ? "M" : "L"}${toX(p.time).toFixed(1)},${toY(p.growthPercent).toFixed(1)}`,
              )
              .join(" ")}
            fill="none"
            stroke={s.color}
            strokeWidth="2"
            strokeDasharray={s.dash}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ cursor: "pointer" }}
            onClick={() => onOpenRepo?.(s.repo)}
          />
          <circle
            cx={s.lastX}
            cy={s.lastY}
            r="3.2"
            fill={s.color}
            style={{ cursor: "pointer" }}
            onClick={() => onOpenRepo?.(s.repo)}
          >
            <title>
              {`${s.repo} (${s.last.date}): ${percent(s.last.growthPercent)} · ${fmt(s.last.stars)} Stars | ${baselineLabel}: ${s.last.baselineDate} (${fmt(s.last.baselineStars)} Stars)`}
            </title>
          </circle>
          <text
            x={s.lastX + 7}
            y={s.labelY}
            dy="0.35em"
            textAnchor="start"
            fill={muted}
            fontSize="10.5"
            style={{ cursor: "pointer" }}
            onClick={() => onOpenRepo?.(s.repo)}
          >
            {s.shortName}
          </text>
        </g>
      ))}
    </svg>
  );
}

// 响应式对数散点图（Stars 对数 × 近 7 日增量）
function LogScatterSvg({
  scatterData,
  scatterDomain,
  scatterTicks,
  growthTicks,
  dark,
  muted,
  grid,
  fmt,
  signed,
  categoryTooltipLabel,
  growthLabel,
  onOpenRepo,
}) {
  const W = 680;
  const H = 300;
  const padL = 54;
  const padR = 24;
  const padT = 18;
  const padB = 38;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const logMinX = Math.log10(Math.max(1, scatterDomain[0]));
  const logMaxX = Math.log10(Math.max(10, scatterDomain[1]));
  const spanX = Math.max(1, logMaxX - logMinX);

  const yVals = [0, ...growthTicks, ...scatterData.map((d) => d.growthLog)];
  let minY = Math.min(...yVals);
  let maxY = Math.max(...yVals);
  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  } else {
    maxY += (maxY - minY) * 0.08;
  }

  const toX = (stars) =>
    padL +
    ((Math.log10(Math.max(1, stars || 1)) - logMinX) / spanX) * plotW;
  const toY = (gLog) => padT + (1 - (gLog - minY) / (maxY - minY)) * plotH;

  const dotColor = dark ? "#34D399" : "#0D9F6E";
  const highlightLabels = scatterData
    .filter((d) => d.highlight)
    .map((datum) => {
      const cx = toX(datum.stars);
      const cy = toY(datum.growthLog);
      const alignEnd = cx > W - 140;
      return {
        repo: datum.repo,
        shortName: datum.repo.split("/").pop(),
        x: alignEnd ? cx - 6 : cx + 6,
        y: Math.max(padT + 10, cy - 7),
        alignEnd,
      };
    })
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < highlightLabels.length; i++) {
    if (highlightLabels[i].y - highlightLabels[i - 1].y < 13) {
      highlightLabels[i].y = Math.min(
        H - padB - 6,
        highlightLabels[i - 1].y + 13,
      );
    }
  }

  return (
    <svg
      className="insight-svg"
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      style={{ display: "block", fontFamily: FONT_FAMILY }}
    >
      {growthTicks.map((gy, idx) => {
        const y = toY(gy);
        const rawVal = Math.sign(gy) * Math.round(10 ** Math.abs(gy) - 1);
        return (
          <g key={idx}>
            <line
              x1={padL}
              y1={y}
              x2={W - padR}
              y2={y}
              stroke={grid}
              strokeDasharray="2 3"
            />
            <text
              x={padL - 8}
              y={y}
              dy="0.35em"
              textAnchor="end"
              fill={muted}
              fontSize="11.5"
            >
              {compactFmt.format(rawVal)}
            </text>
          </g>
        );
      })}
      {scatterTicks.map((sx) => {
        const x = toX(sx);
        return (
          <text
            key={sx}
            x={x}
            y={H - 18}
            textAnchor="middle"
            fill={muted}
            fontSize="11.5"
          >
            {compactFmt.format(sx)}
          </text>
        );
      })}
      <text
        x={padL + plotW / 2}
        y={H - 3}
        textAnchor="middle"
        fill={muted}
        fontSize="11"
      >
        Stars (log)
      </text>
      {scatterData.map((datum) => {
        const cx = toX(datum.stars);
        const cy = toY(datum.growthLog);
        return (
          <circle
            key={datum.repo}
            className="element"
            cx={cx}
            cy={cy}
            r={datum.highlight ? 4.2 : 2.6}
            fill={dotColor}
            fillOpacity={datum.highlight ? 0.95 : 0.26}
            stroke={dotColor}
            strokeWidth="0.6"
            style={{ cursor: "pointer" }}
            onClick={() => onOpenRepo?.(datum.repo)}
          >
            <title>
              {`${datum.repo} · ${categoryTooltipLabel}: ${datum.sceneLabel} · Stars: ${fmt(datum.stars)} · ${growthLabel}: ${signed(datum.growth)}`}
            </title>
          </circle>
        );
      })}
      {highlightLabels.map((lbl) => (
        <text
          key={`lbl-${lbl.repo}`}
          x={lbl.x}
          y={lbl.y}
          textAnchor={lbl.alignEnd ? "end" : "start"}
          fill={muted}
          fontSize="10"
          pointerEvents="none"
        >
          {lbl.shortName}
        </text>
      ))}
    </svg>
  );
}

export default function Insights({
  items,
  allItems,
  professionItems = items,
  scopeControl,
  hideHeading = false,
  history,
  generatedAt,
  state,
  update,
  t: translate,
}) {
  const t = (key) => chartLabels[state.lang][key] || translate(key);
  const [isMobile, setIsMobile] = useState(
    () => matchMedia("(max-width: 760px)").matches,
  );
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const query = matchMedia("(max-width: 760px)");
    const change = () => setIsMobile(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  const showAdditional = expanded;
  const [reducedMotion, setReducedMotion] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReducedMotion(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const [entering, setEntering] = useState(() => !reducedMotion);
  useEffect(() => {
    if (!entering || reducedMotion) {
      setEntering(false);
      return undefined;
    }
    const timer = setTimeout(() => setEntering(false), 760);
    return () => clearTimeout(timer);
  }, [entering, reducedMotion]);

  const [days, setDays] = useState(60);
  const selectedTrends = useMemo(
    () =>
      (state.compare || [])
        .map((repo) => allItems.find((item) => item.repo === repo))
        .filter(Boolean),
    [allItems, state.compare],
  );
  const data = useMemo(
    () => buildInsightData(items, history, generatedAt, days, selectedTrends),
    [items, history, generatedAt, days, selectedTrends],
  );
  const colors = useMemo(() => createColorMaps(allItems), [allItems]);
  const dark = state.theme === "dark";
  const themeTokens = THEME_TOKENS[state.theme] || THEME_TOKENS.light;
  const muted = themeTokens.textSecondary;
  const grid = themeTokens.border;

  const fmt = (value) =>
    new Intl.NumberFormat(state.lang === "zh" ? "zh-CN" : "en-US").format(
      value,
    );
  const signed = (value) => (value > 0 ? "+" : "") + fmt(value);
  const percent = (value) =>
    (value > 0 ? "+" : "") +
    new Intl.NumberFormat(state.lang === "zh" ? "zh-CN" : "en-US", {
      maximumFractionDigits: 1,
    }).format(value) +
    "%";
  const short = (value) =>
    String(value).length > (isMobile ? 16 : 24)
      ? String(value).slice(0, isMobile ? 15 : 23) + "…"
      : String(value);

  const open = (repo) => {
    if (repo && allItems.some((i) => i.repo === repo))
      update((s) => ({ ...s, repo }));
  };
  const category = (id) =>
    update((s) => ({
      ...s,
      task: s.task === id ? "all" : id,
      category: "all",
    }));

  const latest = new Map(data.trends.map((p) => [p.repo, p]));
  const trendRange = themeTokens.chartSeries;
  const hasTrend = data.trends.some((point) =>
    Number.isFinite(point.growthPercent),
  );
  const recordedDates = data.trends.map((p) => p.date).sort();
  const trendStart = Date.parse(recordedDates[0] + "T00:00:00Z");
  const trendEnd = Date.parse(recordedDates.at(-1) + "T00:00:00Z");
  const trendTicks = Number.isFinite(trendStart)
    ? [
        ...new Set([
          trendStart,
          Math.round((trendStart + trendEnd) / 2 / 86400000) * 86400000,
          trendEnd,
        ]),
      ]
    : [];

  const starValues = data.scatter.map((item) => item.stars);
  const minExponent = Math.floor(Math.log10(Math.min(...starValues, Infinity)));
  const maxExponent = Math.max(
    minExponent + 1,
    Math.ceil(Math.log10(Math.max(...starValues, 1))),
  );
  const scatterDomain = starValues.length
    ? [10 ** minExponent, 10 ** maxExponent]
    : [1, 10];
  const scatterTicks = starValues.length
    ? Array.from(
        { length: maxExponent - minExponent + 1 },
        (_, index) => 10 ** (minExponent + index),
      )
    : [1, 10];

  const taskKeys = {
    analyze: "taskAnalyze",
    compute: "taskCompute",
    find: "taskFind",
    read: "taskRead",
    write: "taskWrite",
    figures: "taskFigures",
    reproduce: "taskReproduce",
    review: "taskReview",
  };
  const categories = RESEARCH_TASKS.map((task) => ({
    id: task.id,
    label: t(taskKeys[task.id]),
    count: items.filter((item) => matchesResearchTask(item, task)).length,
  })).sort((a, b) => b.count - a.count);

  const agentStats = useMemo(() => {
    const counts = Object.fromEntries(AGENT_PLATFORMS.map((p) => [p.id, 0]));
    let generalCount = 0;
    for (const item of items) {
      const matched = detectAgents(item);
      if (!matched.length) generalCount += 1;
      for (const id of matched) {
        if (id in counts) counts[id] += 1;
      }
    }
    const list = AGENT_PLATFORMS.map((p) => ({
      id: p.id,
      label: p.label,
      count: counts[p.id] || 0,
    }))
      .filter((p) => p.count > 0 || state.agent === p.id)
      .sort((a, b) => b.count - a.count);
    return {
      list,
      generalCount,
      max: Math.max(1, ...list.map((p) => p.count)),
    };
  }, [items, state.agent]);

  const signedLog = (value) =>
    Math.sign(value) * Math.log10(1 + Math.abs(value));
  const scatterData = data.scatter.map((point) => ({
    ...point,
    growthLog: signedLog(point.growth),
    sceneLabel:
      sceneLabelsFor(
        items.find((item) => item.repo === point.repo),
        t,
      ).join(" · ") || "—",
  }));
  const growthMin = Math.min(0, ...data.scatter.map((point) => point.growth));
  const growthMax = Math.max(10, ...data.scatter.map((point) => point.growth));
  const growthTicks = [
    -100000, -10000, -1000, -100, -10, 0, 10, 100, 1000, 10000, 100000,
  ]
    .filter((value) => value >= growthMin && value <= growthMax * 1.2)
    .map(signedLog);
  const categoryMax = Math.max(0, ...categories.map((c) => c.count));
  const growthBarMax = Math.max(1, ...data.growth.map((d) => d.growth || 0));

  return (
    <section
      className={hideHeading ? "insights-body" : "insights"}
      data-testid={hideHeading ? undefined : "insights"}
      aria-labelledby="insights-heading"
    >
      {!hideHeading && (
        <div className="insights-heading">
          <div>
            <h2 id="insights-heading">{t("insightsTitle")}</h2>
            <p>
              {t("insightsScope")}{" "}
              <b data-testid="insight-count">{items.length}</b> {t("repos")}
            </p>
          </div>
          <div className="insights-actions">{scopeControl}</div>
        </div>
      )}
      <div className="insights-top">
        <ChartFrame
          id="growth"
          title={t("insightGrowth")}
          note={t("insightGrowthNote")}
          t={t}
        >
          {data.growth.length ? (
            <>
              <div
                className="plot-host"
                role="img"
                aria-label={t("insightGrowth")}
              >
                <HorizontalBarSvg
                  rows={data.growth}
                  height={300}
                  padLeft={isMobile ? 128 : 190}
                  padRight={72}
                  maxValue={growthBarMax}
                  entering={entering && !reducedMotion}
                  muted={muted}
                  getLabel={(d) => short(String(d.repo).split("/").pop())}
                  getValue={(d) => d.growth}
                  getRightText={(d) => signed(d.growth)}
                  getFill={(d, idx) =>
                    // 增长语义统一用鲜橙：第一名实心；其余亮色用半透明橙，暗色用石板灰（避免橙色叠深底发褐）
                    idx === 0
                      ? themeTokens.warm
                      : dark
                        ? "#475569"
                        : `${themeTokens.warm}73`
                  }
                  getTitle={(d) =>
                    `${d.repo} · ${t("insightGrowth")}: ${signed(d.growth)}`
                  }
                  onSelect={(d) => open(d.repo)}
                />
              </div>
              <div className="chart-keyboard-controls">
                {data.growth.map((item) => (
                  <button
                    key={item.repo}
                    data-growth-repo={item.repo}
                    onClick={() => open(item.repo)}
                  >
                    <span
                      title={`${item.repo}${latest.has(item.repo) ? " · " + latest.get(item.repo).date : ""}`}
                    >
                      {item.repo}
                    </span>
                    <b style={{ color: colors.repos[item.repo] }}>
                      {signed(item.growth)}
                    </b>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <NoData text={t("noGrowth")} />
          )}
        </ChartFrame>
        <DisciplineCounts
          items={professionItems}
          state={state}
          update={update}
        />
      </div>
      <DisciplineCoverage
        items={professionItems}
        state={state}
        update={update}
        t={t}
      />
      <details
        className="more-chart-details"
        data-testid="more-charts"
        open={expanded}
        onToggle={(event) => setExpanded(event.currentTarget.open)}
      >
        <summary>
          {state.lang === "zh"
            ? "更多图表：相对增长、规模与场景分布"
            : "More charts: growth trends, scale and task distribution"}
        </summary>
        {expanded && (
          <>
            <div className="legacy-chart-controls">
              <label className="history-window">
                <span>
                  {state.lang === "zh" ? "增长曲线窗口" : "Trend window"}
                </span>
                <Select
                  aria-label={t("historyWindow")}
                  value={days}
                  onChange={setDays}
                  options={[30, 60, 90].map((value) => ({
                    value,
                    label: `${value} ${t("days")}`,
                  }))}
                />
              </label>
            </div>
            <div className="legacy-category-chart">
              <ChartFrame
                id="categories"
                title={t("sceneDistribution")}
                note={t("sceneDistributionHelp")}
                t={t}
              >
                {categories.length ? (
                  <>
                    <div
                      className="plot-host"
                      role="img"
                      aria-label={t("sceneDistribution")}
                    >
                      <HorizontalBarSvg
                        rows={categories}
                        height={Math.max(150, categories.length * 27 + 30)}
                        padLeft={
                          isMobile
                            ? state.lang === "zh"
                              ? 86
                              : 120
                            : state.lang === "zh"
                              ? 116
                              : 168
                        }
                        padRight={48}
                        maxValue={
                          categoryMax + Math.max(4, Math.ceil(categoryMax * 0.2))
                        }
                        muted={muted}
                        getLabel={(c) => c.label}
                        getValue={(c) => c.count}
                        getRightText={(c) => String(c.count)}
                        getFill={(c) =>
                          state.task === c.id
                            ? dark
                              ? "#34D399"
                              : "#0D9F6E"
                            : dark
                              ? "#475569"
                              : "#CBD5E1"
                        }
                        getTitle={(c) => `${c.label}: ${c.count} ${t("repos")}`}
                        onSelect={(c) => category(c.id)}
                      />
                    </div>
                    <div className="chart-keyboard-controls category-filter-controls">
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          data-chart-category={c.id}
                          onClick={() => category(c.id)}
                          aria-pressed={state.task === c.id}
                        >
                          <i
                            style={{ background: dark ? "#34D399" : "#0D9F6E" }}
                          />
                          <span>{c.label}</span>
                          <b>{c.count}</b>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <NoData text={t("empty")} />
                )}
              </ChartFrame>
              <article
                className="insight-panel discipline-count-chart"
                data-testid="insight-agents"
              >
                <h3>
                  {state.lang === "zh"
                    ? "AI Agent 平台适配分布"
                    : "Compatible AI Agent Platforms"}
                </h3>
                <p className="discipline-chart-note">
                  {state.lang === "zh"
                    ? "点击任一平台可直接筛选项目；单个 Skill 可同时兼容多个 Agent"
                    : "Click any platform to filter; one Skill can support multiple Agents"}
                </p>
                {agentStats.list.length ? (
                  <>
                    <div className="discipline-bar-list">
                      {agentStats.list.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          data-chart-agent={p.id}
                          aria-pressed={state.agent === p.id}
                          onClick={() =>
                            update((s) => ({
                              ...s,
                              agent: s.agent === p.id ? "all" : p.id,
                            }))
                          }
                        >
                          <span>{p.label}</span>
                          <i>
                            <b
                              style={{
                                width: `${(p.count / agentStats.max) * 100}%`,
                                opacity:
                                  state.agent !== "all" && state.agent !== p.id
                                    ? 0.45
                                    : 1,
                              }}
                            />
                          </i>
                          <strong>{fmt(p.count)}</strong>
                        </button>
                      ))}
                    </div>
                    {agentStats.generalCount > 0 && (
                      <p className="discipline-chart-note">
                        {state.lang === "zh"
                          ? `另有 ${fmt(agentStats.generalCount)} 个通用规范项目支持直接复制到网页版 AI 或任意兼容 Agent 使用。`
                          : `Plus ${fmt(agentStats.generalCount)} general-spec repositories usable across Web AI and standard Agents.`}
                      </p>
                    )}
                  </>
                ) : (
                  <NoData text={t("empty")} />
                )}
              </article>
            </div>
            <div className="insights-bottom" hidden={!showAdditional}>
              <ChartFrame
                id="trend"
                hidden={!showAdditional}
                title={t("insightTrend")}
                note={t(
                  selectedTrends.length ? "comparisonNote" : "insightTrendNote",
                )}
                t={t}
              >
                <div className="trend-legend">
                  {data.trendRepos.map((item, index) => (
                    <button key={item.repo} onClick={() => open(item.repo)}>
                      <i
                        style={{
                          borderColor: trendRange[index],
                          borderStyle:
                            index === 1
                              ? "dashed"
                              : index === 2
                                ? "dotted"
                                : "solid",
                        }}
                      />
                      {short(item.repo.split("/").pop())}
                    </button>
                  ))}
                </div>
                <div className="chart-keyboard-controls">
                  {data.trendRepos.map((item) => (
                    <button key={item.repo} onClick={() => open(item.repo)}>
                      {item.repo} · {latest.get(item.repo)?.date || "—"} ·{" "}
                      {Number.isFinite(latest.get(item.repo)?.growthPercent)
                        ? percent(latest.get(item.repo).growthPercent)
                        : "—"}
                    </button>
                  ))}
                </div>
                {hasTrend ? (
                  <div
                    className="plot-host"
                    role="img"
                    aria-label={t("insightTrend")}
                  >
                    <TrendLineSvg
                      trends={data.trends}
                      trendRepos={data.trendRepos}
                      trendRange={trendRange}
                      trendTicks={trendTicks}
                      muted={muted}
                      grid={grid}
                      percent={percent}
                      fmt={fmt}
                      baselineLabel={t("insightBaseline")}
                      onOpenRepo={open}
                    />
                  </div>
                ) : (
                  <NoData text={t("noHistory")} />
                )}
                <p className="chart-footnote">
                  {recordedDates.length > 0 && (
                    <span>
                      {t("dataSince")} {recordedDates[0]}{" "}
                    </span>
                  )}
                  <Tooltip
                    title={`${t("historyProvenance")} ${t("insightBaselineNote")}`}
                  >
                    <button
                      className="chart-help"
                      aria-label={t("historyDetails")}
                    >
                      ?
                    </button>
                  </Tooltip>
                </p>
              </ChartFrame>
              <ChartFrame
                id="scatter"
                hidden={!showAdditional}
                title={t("insightScatter")}
                note={t("insightScatterNote")}
                t={t}
              >
                {data.scatter.length ? (
                  <>
                    <div
                      className="plot-host"
                      role="img"
                      aria-label={t("insightScatter")}
                    >
                      <LogScatterSvg
                        scatterData={scatterData}
                        scatterDomain={scatterDomain}
                        scatterTicks={scatterTicks}
                        growthTicks={growthTicks}
                        dark={dark}
                        muted={muted}
                        grid={grid}
                        fmt={fmt}
                        signed={signed}
                        categoryTooltipLabel={t("categoryTooltip")}
                        growthLabel={t("insightGrowth")}
                        onOpenRepo={open}
                      />
                    </div>
                    <div className="scatter-legend">
                      <span>
                        <i
                          style={{ background: dark ? "#34D399" : "#0D9F6E" }}
                        />
                        {state.lang === "zh"
                          ? "深色：近 7 日增长前 3 · 浅色：其他项目"
                          : "Dark: top 3 by 7-day growth · Faint: other projects"}
                      </span>
                    </div>
                    <details className="chart-data">
                      <summary>{t("viewChartData")}</summary>
                      <div className="chart-data-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>{t("repo")}</th>
                              <th>Stars</th>
                              <th>{t("insightGrowth")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.scatter.map((item) => (
                              <tr key={item.repo}>
                                <td>
                                  <button onClick={() => open(item.repo)}>
                                    {item.repo}
                                  </button>
                                </td>
                                <td>{fmt(item.stars)}</td>
                                <td>{signed(item.growth)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </>
                ) : (
                  <NoData text={t("empty")} />
                )}
              </ChartFrame>
            </div>
          </>
        )}
      </details>
    </section>
  );
}
