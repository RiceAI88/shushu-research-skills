import { GrowthValue } from "./ProjectFacts";
import React, { useEffect } from "react";
import { Table, Tag, Tooltip } from "antd";
import { PlatformTags, SummaryText } from "./PracticalInfo";
import { InstallationActions } from "./InstallationActions";
import { isWebAiReady, orderedSceneLabelsFor, safeExternalUrl } from "../domain";
import { installMetricFor } from "../practical";
import { fitLabels } from "../projectFacts";
import { Sparkline } from "./TrendCharts";

function SceneTags({ item, t, activeTask }) {
  const labels = orderedSceneLabelsFor(item, t, activeTask);
  if (!labels.length)
    return <span className="scene-unclassified">{t("sceneUnclassified")}</span>;
  return (
    <div className="scene-tags">
      <Tag>{labels[0]}</Tag>
      {labels.length > 1 && (
        <Tooltip
          title={labels.slice(1).join(" · ")}
          trigger={["hover", "focus"]}
        >
          <span
            className="scene-overflow"
            tabIndex={0}
            aria-label={labels.slice(1).join(" · ")}
          >
            +{labels.length - 1}
          </span>
        </Tooltip>
      )}
    </div>
  );
}

function TableInlineBadges({ item, state }) {
  const zh = state.lang === "zh";
  const fit = fitLabels(item, state);
  const webReady = isWebAiReady(item);
  const fitBadge =
    fit?.kind === "specific" && fit.labels?.length ? (
      <span
        className="discipline-card-fit fit-specific table-fit-pill"
        title={fit.labels.join(" / ")}
      >
        {zh ? "专业适用" : "Fit"} · {fit.labels[0]}
        {fit.labels.length > 1 ? ` +${fit.labels.length - 1}` : ""}
      </span>
    ) : state.discipline && state.discipline !== "all" && fit?.kind === "common" ? (
      <span className="discipline-card-fit fit-common table-fit-pill">
        {zh ? "跨专业通用" : "General"}
      </span>
    ) : null;

  const metaBadge = webReady ? (
    <span
      className="table-web-pill"
      title={
        zh
          ? "免安装 · 打开网页版 DeepSeek / Kimi / ChatGPT 复制即可直用"
          : "Zero-install · Works directly in Web AI chat"
      }
    >
      {zh ? "网页直用" : "Web AI"}
    </span>
  ) : item.skills_count > 0 ? (
    <span className="table-skill-count">
      {item.skills_count}
      {item.skills_count_complete === false ? "+" : ""}{" "}
      {item.skills_count === 1 && item.skills_count_complete !== false
        ? "skill"
        : "skills"}
    </span>
  ) : null;

  if (!fitBadge && !metaBadge) return null;
  return (
    <span className="table-inline-badges">
      {fitBadge}
      {metaBadge}
    </span>
  );
}

export default function RepositoryTable({
  onReady,
  state,
  update,
  t,
  fmt,
  link,
  actions,
  history,
  generatedAt,
  ...props
}) {
  useEffect(() => {
    onReady?.("table");
  }, [onReady]);
  const sortHeading = (label, sort, accessible) => (
    <button
      type="button"
      className="table-sort"
      aria-label={accessible}
      aria-pressed={
        state.sort === sort || (sort === "stars" && state.sort === "rank")
      }
      onClick={() => update((s) => ({ ...s, sort }))}
    >
      {label}
      <span aria-hidden="true">
        {state.sort === sort || (sort === "stars" && state.sort === "rank")
          ? " ↓"
          : " ↕"}
      </span>
    </button>
  );
  const columns = [
    {
      title: "#",
      dataIndex: "rank",
      width: 68,
      render: (rank, item) => (
        <span className="card-rank-group">
          <span
            className={`card-rank${rank <= 3 ? ` medal-rank medal-${rank}` : ""}`}
          >
            {String(rank).padStart(2, "0")}
          </span>
          {item.new_today && (
            <Tooltip title={t("dailyBadge")} trigger={["hover", "focus"]}>
              <span className="daily-new-badge" tabIndex={0}>
                {t("newShort")}
              </span>
            </Tooltip>
          )}
        </span>
      ),
    },
    {
      title: t("repo"),
      key: "repo",
      width: 356,
      render: (_, item) => (
        <div className="table-repository">
          <div className="table-repo-head">
            {link(item)}
            <TableInlineBadges item={item} state={state} />
          </div>
          <div className="table-description-line">
            <SummaryText
              item={item}
              t={t}
              query={state.query}
              lang={state.lang}
            />
            {item.stale && (
              <Tooltip
                title={t("staleReason")}
                trigger={["hover", "focus", "click"]}
              >
                <span
                  data-testid="stale-tag"
                  className="table-maintenance"
                  tabIndex={0}
                  onClick={(event) => event.stopPropagation()}
                >
                  {t("staleTag")}
                </span>
              </Tooltip>
            )}
          </div>
        </div>
      ),
    },
    {
      title: t("drAgent"),
      key: "platforms",
      width: 184,
      render: (_, item) => <PlatformTags item={item} t={t} compact />,
    },
    {
      title: t("installation"),
      key: "installation",
      width: 158,
      render: (_, item) => (
        <InstallationActions item={item} lang={state.lang} t={t} compact />
      ),
    },
    {
      title: t("sceneHeading"),
      key: "scene",
      width: 132,
      render: (_, item) => (
        <SceneTags item={item} t={t} activeTask={state.task} />
      ),
    },
    {
      title: sortHeading("Stars", "stars", t("rankByStars")),
      key: "stars",
      width: 104,
      align: "right",
      render: (_, item) => (
        <div className="reference-metrics table-metrics">
          <span className="table-stars">{fmt(item.stars)}</span>
          <Sparkline
            repo={item.repo}
            history={history}
            label={t("noHistory")}
          />
        </div>
      ),
    },
    {
      title: sortHeading(t("shortInstalls"), "installs", t("sortInstallsAction")),
      key: "installs",
      width: 96,
      align: "right",
      render: (_, item) => {
        const info = installMetricFor(item, state.lang);
        if (!info) return <span className="table-installs is-empty">—</span>;
        return (
          <Tooltip title={info.tooltip}>
            <span className="table-installs" data-testid="table-installs">
              <strong>{info.compact}</strong>
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: sortHeading(t("shortDelta7"), "delta7", t("sortDelta7Action")),
      key: "delta7",
      width: 108,
      align: "right",
      render: (_, item) => (
        <span
          className={`table-growth${item.star_delta_7d ? "" : " no-growth"}`}
        >
          <GrowthValue {...{ item, history, generatedAt, fmt }} lang={state.lang} />
        </span>
      ),
    },
    {
      title: t("actions"),
      key: "actions",
      width: 110,
      fixed: "right",
      render: (_, item) => (
        <div className="table-row-actions">
          {actions(item)}
          <a
            className="repository-external"
            href={safeExternalUrl(item.url) || undefined}
            target="_blank"
            rel="noreferrer"
            aria-label={`${t("drOpenRepo")} ${item.repo}`}
            title="GitHub"
            onClick={(event) => event.stopPropagation()}
          >
            ↗
          </a>
        </div>
      ),
    },
  ];
  return <Table {...props} columns={columns} />;
}
