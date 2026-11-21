import React from "react";
import { Empty } from "antd";
import { THEME_TOKENS } from "../tokens";
export function Sparkline({ repo, history, width = 100, height = 28, label }) {
  const pad = 3;
  const points = (history?.series?.[repo] || [])
    .filter(
      (point) =>
        Number.isFinite(Date.parse(point.date)) &&
        Number.isFinite(point.stars) &&
        point.stars >= 0,
    )
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (!points.length)
    return (
      <svg
        className="mini-area-chart"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
      >
        <title>{label}</title>
        <line
          x1={pad}
          y1={height / 2}
          x2={width - pad}
          y2={height / 2}
          stroke="var(--prs-border)"
          strokeDasharray="3 3"
        />
      </svg>
    );
  const first = points[0],
    last = points.at(-1);
  const stars = points.map((p) => p.stars),
    min = Math.min(...stars),
    max = Math.max(...stars);
  const start = Date.parse(first.date),
    duration = Date.parse(last.date) - start;
  const coordinates = points.map((p) => [
    duration
      ? pad + ((Date.parse(p.date) - start) / duration) * (width - pad * 2)
      : width / 2,
    max === min
      ? height / 2
      : height - pad - ((p.stars - min) / (max - min)) * (height - pad * 2),
  ]);
  const line = coordinates.map((p) => p.join(",")).join(" ");
  const title = `${repo}: ${first.date} — ${last.date}, ${first.stars.toLocaleString()} → ${last.stars.toLocaleString()} Stars`;
  return (
    <svg
      className="mini-area-chart"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {points.length > 1 && (
        <>
          <polygon
            data-area-fill
            points={`${coordinates[0][0]},${height - pad} ${line} ${coordinates.at(-1)[0]},${height - pad}`}
            fill="var(--prs-primary)"
            fillOpacity="0.12"
          />
          <polyline
            points={line}
            fill="none"
            stroke="var(--prs-primary)"
            strokeWidth="1.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </>
      )}
      <circle
        cx={coordinates.at(-1)[0]}
        cy={coordinates.at(-1)[1]}
        r="2"
        fill="var(--prs-primary)"
      />
    </svg>
  );
}

export function ComparisonChart({ repos, history, theme = "light", t }) {
  // 复用统一设计令牌中的高区分度对比三色组（翠绿 / 天蓝 / 琥珀）
  const colors = (THEME_TOKENS[theme] || THEME_TOKENS.light).chartSeries;
  const dashes = [undefined, "7 4", "2 4"];
  const series = repos.map((repo) => {
    const points = (history?.series?.[repo] || [])
      .filter(
        (point) =>
          Number.isFinite(Date.parse(point.date)) &&
          Number.isFinite(point.stars) &&
          point.stars >= 0,
      )
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
    if (!points.length) return [];
    const base = points[0].stars || 1;
    return points.map((p) => ({
      date: p.date,
      time: Date.parse(p.date),
      stars: p.stars,
      pct: ((p.stars - base) / base) * 100,
    }));
  });
  const allPoints = series.flat();
  if (!allPoints.length)
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={t("noHistory")}
      />
    );
  const w = 640,
    h = 260,
    padLeft = 54,
    padRight = 24,
    padTop = 20,
    padBottom = 34;
  const values = allPoints.map((p) => p.pct);
  const min = Math.min(0, ...values),
    max = Math.max(0, ...values),
    range = max - min || 1;
  const times = allPoints.map((p) => p.time);
  const minTime = Math.min(...times),
    maxTime = Math.max(...times),
    timeRange = maxTime - minTime || 1;
  const x = (time) =>
    maxTime === minTime
      ? (padLeft + w - padRight) / 2
      : padLeft + ((time - minTime) / timeRange) * (w - padLeft - padRight);
  const y = (v) =>
    h - padBottom - ((v - min) / range) * (h - padTop - padBottom);
  const fmtPct = (v) => `${v > 0 ? "+" : ""}${Math.round(v * 10) / 10}%`;
  const startDate = new Date(minTime).toISOString().slice(0, 10);
  const endDate = new Date(maxTime).toISOString().slice(0, 10);
  const yTicks = [...new Set([max, 0, min])];
  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        role="img"
        aria-label={t("compareTitle")}
      >
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={padLeft}
              y1={y(tick)}
              x2={w - padRight}
              y2={y(tick)}
              stroke="var(--prs-border)"
              strokeDasharray={tick === 0 ? "4 4" : "2 3"}
            />
            <text
              x={padLeft - 8}
              y={y(tick) + 4}
              textAnchor="end"
              fontSize="11"
              fill="var(--prs-muted)"
            >
              {fmtPct(tick)}
            </text>
          </g>
        ))}
        <text
          x={padLeft}
          y={h - 10}
          textAnchor="start"
          fontSize="11"
          fill="var(--prs-muted)"
        >
          {startDate}
        </text>
        {endDate !== startDate && (
          <text
            x={w - padRight}
            y={h - 10}
            textAnchor="end"
            fontSize="11"
            fill="var(--prs-muted)"
          >
            {endDate}
          </text>
        )}
        {series.map((pts, index) => {
          const color = colors[index % colors.length];
          const dash = dashes[index % dashes.length];
          if (!pts.length) return null;
          const last = pts.at(-1);
          return (
            <g key={repos[index]}>
              {pts.length > 1 && (
                <polyline
                  points={pts.map((p) => `${x(p.time)},${y(p.pct)}`).join(" ")}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.2"
                  strokeDasharray={dash}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}
              <circle cx={x(last.time)} cy={y(last.pct)} r="3.5" fill={color}>
                <title>
                  {`${repos[index]} · ${last.date} · ${fmtPct(last.pct)} (${last.stars.toLocaleString()} Stars)`}
                </title>
              </circle>
            </g>
          );
        })}
      </svg>
      <div className="comparison-legend">
        {repos.map((repo, i) => (
          <span key={repo}>
            <i style={{ background: colors[i % colors.length] }} />
            {repo}
            {!series[i].length
              ? ` · ${t("noHistory")}`
              : ` (${fmtPct(series[i].at(-1).pct)})`}
          </span>
        ))}
      </div>
    </div>
  );
}
