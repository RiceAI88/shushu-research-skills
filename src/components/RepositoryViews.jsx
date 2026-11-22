import { ProjectFacts, GrowthValue } from "./ProjectFacts";
import { Zhi1keAd } from "./Zhi1keAd";
import { CommunityCard } from "./CommunityCard";
import { EmptyResults } from "./EmptyResults";
import { SearchHighlight } from "./SearchHighlight";
import { Panel } from "./Panel";
import React, { lazy, useEffect, useState } from "react";
import { Button, Space, Tag, Tooltip } from "antd";
import { StarFilled, StarOutlined, SwapOutlined } from "@ant-design/icons";
import {
  PlatformTags,
  SummaryText,
  InstallationMode,
  CopyInstallButton,
} from "./PracticalInfo";
import { useFeedback } from "./FeedbackProvider";
import { DeferredFeature } from "./DeferredFeature";
const RepositoryTable = lazy(() => import("./RepositoryTable"));
import { safeExternalUrl } from "../domain";
export function QualityBadges({
  item,
  t,
  compact = false,
  statusOnly = false,
}) {
  const typeLabel =
    item.skills_count > 0
      ? `${item.skills_count}${item.skills_count_complete === false ? "+" : ""} ${item.skills_count === 1 && item.skills_count_complete !== false ? "skill" : "skills"}`
      : t(
          item.repository_kind === "related"
            ? "projectRelated"
            : "projectUnknown",
        );
  if (compact)
    return (
      <Tooltip title={t("projectTypeHelp")}>
        <span className="card-project-type">{typeLabel}</span>
      </Tooltip>
    );
  return (
    <Space size={[4, 4]} wrap>
      {item.new_today && !statusOnly && (
        <Tooltip title={t("dailyBadge")} trigger={["hover", "focus"]}>
          <Tag className="daily-new-badge" tabIndex={0}>
            {t("newShort")}
          </Tag>
        </Tooltip>
      )}
      {!statusOnly && (
        <Tooltip title={t("projectTypeHelp")}>
          <Tag>{typeLabel}</Tag>
        </Tooltip>
      )}
      {item.refresh_status === "pending" && (
        <Tooltip title={t("metadataPendingHelp")}>
          <Tag color="warning">{t("metadataPending")}</Tag>
        </Tooltip>
      )}
      {item.verifies_citations && (
        <Tag className="warm-tag">{t("citeCheck")} ✓</Tag>
      )}
      {item.stale && (
        <Tooltip title={t("staleReason")} trigger={["hover", "focus", "click"]}>
          <Tag
            className="stale-tag"
            data-testid="stale-tag"
            tabIndex={0}
            onClick={(event) => event.stopPropagation()}
          >
            {t("staleTag")}
          </Tag>
        </Tooltip>
      )}
    </Space>
  );
}
export function RepositoryActions({
  item,
  state,
  update,
  toggleCompare,
  t,
  labels = false,
  context = "ranking",
}) {
  const message = useFeedback();
  const favorite = state.favorites.includes(item.repo),
    compared = state.compare.includes(item.repo);
  return (
    <Space size={0} className="repository-actions">
      <Tooltip title={t("favoriteAction")}>
        <Button
          type="text"
          size="small"
          icon={
            favorite ? (
              <StarFilled aria-hidden="true" />
            ) : (
              <StarOutlined aria-hidden="true" />
            )
          }
          aria-label={`${t("favoriteAction")} ${item.repo}`}
          aria-pressed={favorite}
          data-testid={`${context === "detail" ? "detail-" : ""}favorite-${item.repo}`}
          style={{ color: favorite ? "var(--prs-primary)" : undefined }}
          onClick={(e) => {
            e.stopPropagation();
            message.success(t(favorite ? "favoriteRemoved" : "favoriteSaved"));
            update((s) => ({
              ...s,
              favorites: favorite
                ? s.favorites.filter((r) => r !== item.repo)
                : [...s.favorites, item.repo],
            }));
          }}
        >
          {labels && t("favoriteAction")}
        </Button>
      </Tooltip>
      <Tooltip title={t("compareTray")}>
        <Button
          type="text"
          size="small"
          icon={<SwapOutlined aria-hidden="true" />}
          aria-label={`${t("compareTray")} ${item.repo}`}
          aria-pressed={compared}
          data-compare={item.repo}
          onClick={(e) => {
            e.stopPropagation();
            toggleCompare(item.repo);
          }}
        >
          {labels && t("compareTray")}
        </Button>
      </Tooltip>
    </Space>
  );
}
function TableLoadingFallback({ lang }) {
  const zh = lang === "zh";
  return (
    <div
      className="table-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="table-loading-skeleton"
    >
      <div className="table-loading-indicator">
        <span className="table-loading-spinner" aria-hidden="true" />
        <span>{zh ? "正在切换列表视图…" : "Switching to table view…"}</span>
      </div>
      <div className="table-loading-rows" aria-hidden="true">
        {Array.from({ length: 6 }, (_, idx) => (
          <div key={idx} className="table-loading-row">
            <span className="skel-block skel-rank" />
            <div className="skel-repo-col">
              <span className="skel-block skel-title" />
              <span className="skel-block skel-sub" />
            </div>
            <span className="skel-block skel-pill" />
            <span className="skel-block skel-pill" />
            <span className="skel-block skel-metric" />
          </div>
        ))}
      </div>
    </div>
  );
}
export function RepositoryViews({
  generatedAt,
  items,
  allItems = items,
  filterHeight,
  onReady,
  state,
  update,
  toggleCompare,
  t,
  fmt,
  history,
}) {
  // 桌面 3 列展示 6 张后插入，平板 2 列或移动端单列展示 4 张后插入，避免移动端刚看 2 张就被大区块打断
  const adSlotCount = () =>
    matchMedia("(min-width: 1100px)").matches ? 6 : 4;
  const [adAfter, setAdAfter] = useState(adSlotCount);
  useEffect(() => {
    const wide = matchMedia("(min-width: 1100px)"),
      medium = matchMedia("(min-width: 600px)");
    const sync = () => setAdAfter(adSlotCount());
    wide.addEventListener("change", sync);
    medium.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      medium.removeEventListener("change", sync);
    };
  }, []);
  useEffect(() => {
    if (state.view === "card" || !items.length) onReady?.(state.view);
  }, [state.view, items.length, onReady]);
  const resultKey = JSON.stringify([
    state.query,
    state.task,
    state.category,
    state.agent,
    state.sort,
    state.favOnly,
    state.newOnly,
    state.todayOnly,
    items.map((item) => item.repo),
  ]);
  const [batch, setBatch] = useState({ key: resultKey, limit: 30 });
  const limit = batch.key === resultKey ? batch.limit : 30;
  const selectedIndex = items.findIndex((item) => item.repo === state.repo);
  const shown = Math.max(limit, Math.ceil((selectedIndex + 1) / 30) * 30);
  useEffect(() => {
    setBatch((previous) => {
      const nextLimit = Math.max(
        previous.key === resultKey ? previous.limit : 30,
        Math.ceil((selectedIndex + 1) / 30) * 30,
      );
      return previous.key === resultKey && previous.limit === nextLimit
        ? previous
        : { key: resultKey, limit: nextLimit };
    });
  }, [resultKey, selectedIndex]);
  const entries = items.slice(0, shown);
  const more = shown < items.length && (
    <div className="ranking-load-more">
      <span role="status">
        {t("showingResults")} {entries.length} / {items.length}
      </span>
      <Button
        data-testid="load-more"
        onClick={() => setBatch({ key: resultKey, limit: shown + 30 })}
      >
        {t("loadMore")}
      </Button>
    </div>
  );
  const actions = (item) => (
    <RepositoryActions
      {...{ item, state, update, toggleCompare, t }}
      labels={false}
    />
  );
  const open = (item) => update((s) => ({ ...s, repo: item.repo }));
  const link = (item) => (
    <a
      href={safeExternalUrl(item.url) || undefined}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="repo-name"
      title={item.repo}
    >
      <SearchHighlight text={item.repo} query={state.query} />
    </a>
  );
  if (!items.length)
    return (
      <>
        <EmptyResults items={allItems} state={state} update={update} t={t} />
        <div className="partner-support-block partner-support-compact">
          <CommunityCard lang={state.lang} />
        </div>
      </>
    );
  if (state.view === "card")
    return (
      <>
        <div className="repository-grid">
          {entries.map((item, index) => (
            <React.Fragment key={item.repo}>
              <Panel
                data-testid="repo-card"
                animated
                motionOrder={index % 3}
                className="repository-card"
                tabIndex={0}
                onClick={() => open(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.target === e.currentTarget)
                    open(item);
                }}
              >
                <div className="card-top">
                  <div className="card-rank-group">
                    <span
                      className={`card-rank${item.rank <= 3 ? ` medal-rank medal-${item.rank}` : ""}`}
                    >
                      {String(item.rank).padStart(2, "0")}
                    </span>
                    {item.new_today && (
                      <Tooltip
                        title={t("dailyBadge")}
                        trigger={["hover", "focus"]}
                      >
                        <span
                          className="daily-new-badge"
                          tabIndex={0}
                          aria-label={t("dailyBadge")}
                        >
                          {t("newShort")}
                        </span>
                      </Tooltip>
                    )}
                    <InstallationMode item={item} t={t} short cardEntry />
                  </div>
                  <div
                    className={`card-actions${state.favorites.includes(item.repo) || state.compare.includes(item.repo) ? " has-selection" : ""}`}
                  >
                    {actions(item)}
                    <CopyInstallButton item={item} t={t} iconOnly />
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
                </div>
                <div className="card-title-row">
                  <span className="repository-owner">
                    {item.repo.split("/")[0]}
                  </span>
                  <button
                    type="button"
                    className="repo-name repo-title"
                    aria-label={item.repo}
                    onClick={(event) => {
                      event.stopPropagation();
                      open(item);
                    }}
                  >
                    <SearchHighlight
                      text={item.repo.split("/").slice(1).join("/")}
                      query={state.query}
                    />
                  </button>
                </div>
                <div className="card-key-metrics">
                  <div>
                    <strong>{fmt(item.stars)}</strong>
                    <span>Stars</span>
                  </div>
                  <div
                    className={`card-growth${item.star_delta_7d ? "" : " no-growth"}`}
                  >
                    <GrowthValue {...{item,history,generatedAt,fmt}} lang={state.lang} withPeriod />
                  </div>
                </div>
                <SummaryText item={item} t={t} query={state.query} lang={state.lang} />
                <ProjectFacts {...{item,state,t}} />
                <div
                  className="card-info-footer"
                  data-guide-cue={state.lang === "zh" ? "上手指南 ›" : "Guide ›"}
                >
                  <PlatformTags item={item} t={t} compact />
                  {item.inactive90 ? (
                    <span
                      className="card-maintenance"
                      title={item.last_push_date}
                    >
                      {t("inactive90")}
                    </span>
                  ) : (
                    <QualityBadges item={item} t={t} compact />
                  )}
                </div>
              </Panel>
              {index === Math.min(adAfter, entries.length) - 1 && (
                <div className="partner-support-block">
                  <div className="partner-support-header">
                    <div className="partner-support-heading">
                      <span className="partner-support-title">
                        <span className="partner-shield-icon" aria-hidden="true">
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </span>
                        <strong>
                          {state.lang === "zh"
                            ? "合作伙伴与社群支持"
                            : "Partner & Community Support"}
                        </strong>
                      </span>
                      <span className="partner-support-subtitle">
                        {state.lang === "zh"
                          ? "感谢合作伙伴与各专业科研社群支持本站的长期维护与每日更新。"
                          : "Thanks to our partners and research communities for supporting daily updates."}
                      </span>
                    </div>
                    <span className="partner-thanks-pill" aria-hidden="true">
                      <span className="partner-thanks-dot">♥</span>
                      <span>
                        <strong>THANKS</strong>
                        <em>{state.lang === "zh" ? "感谢支持" : "Supported"}</em>
                      </span>
                    </span>
                  </div>
                  <div className="partner-support-grid">
                    <Zhi1keAd t={t} />
                    <CommunityCard lang={state.lang} />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        {more}
      </>
    );
  return (
    <>
      <DeferredFeature
        t={t}
        loadingFallback={<TableLoadingFallback lang={state.lang} />}
      >
        <RepositoryTable
          onReady={onReady}
          className="ranking-table"
          rowKey="repo"
          {...{ state, update, t, fmt, history, generatedAt, link, actions }}
          badges={(item) => <QualityBadges item={item} t={t} />}
          dataSource={entries}
          pagination={false}
          scroll={{ x: 1220 }}
          tableLayout="fixed"
          sticky={{ offsetHeader: filterHeight }}
          size="middle"
          onRow={(item) => ({
            "data-repo": item.repo,
            tabIndex: 0,
            onClick: (e) => {
              if (!e.target.closest("button,a")) open(item);
            },
            onKeyDown: (e) => {
              if (e.key === "Enter" && e.target === e.currentTarget) open(item);
            },
          })}
        />
      </DeferredFeature>
      {more}
      <div className="partner-support-block partner-support-compact">
        <CommunityCard lang={state.lang} />
      </div>
    </>
  );
}
