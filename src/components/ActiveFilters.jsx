import { professionLabel } from "../disciplines";
import React from "react";
import { Button } from "antd";
import { CloseOutlined } from "@ant-design/icons";
import { AGENT_PLATFORMS, RESEARCH_STAGES } from "../domain";
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
export const resets = {
  query: "",
  task: "all",
  category: "all",
  discipline: "all",
  major: "all",
  stage: "",
  pack: [],
  packTitle: "",
  agent: "all",
  favOnly: false,
  recentOnly: false,
  activeOnly: false,
  webReady: false,
  newOnly: false,
  todayOnly: "",
};
export function ActiveFilters({ state, update, t, empty, onShareFavorites }) {
  const conditions = [];
  if (state.pack?.length)
    conditions.push([
      "pack",
      state.lang === "zh"
        ? `分享清单（${state.pack.length}）`
        : `Shared pack (${state.pack.length})`,
    ]);
  if (state.discipline && state.discipline !== "all") conditions.push(["discipline", professionLabel(state,state.lang)]);
  if (state.stage) {
    const activeStage = RESEARCH_STAGES.find((s) => s.id === state.stage);
    conditions.push(["stage", activeStage?.[state.lang] || state.stage]);
  }
  if (state.webReady)
    conditions.push([
      "webReady",
      state.lang === "zh" ? "免安装 · 网页直用" : "Zero-install · Web AI",
    ]);
  if (state.query.trim())
    conditions.push(["query", t("filterSearch") + state.query.trim()]);
  if (state.task !== "all") conditions.push(["task", t(taskKeys[state.task])]);
  if (state.agent !== "all")
    conditions.push([
      "agent",
      AGENT_PLATFORMS.find((a) => a.id === state.agent)?.label || state.agent,
    ]);
  if (state.todayOnly)
    conditions.push([
      "todayOnly",
      t(state.todayOnly === "skill" ? "dailySkills" : "dailyRelated"),
    ]);
  if (state.newOnly) conditions.push(["newOnly", t("statNewWeek")]);
  if (state.favOnly) conditions.push(["favOnly", t("favoritesOnly")]);
  if (state.recentOnly) conditions.push(["recentOnly", t("recentOnly")]);
  if (state.activeOnly) conditions.push(["activeOnly", t("activeOnly")]);
  // 当来源控件隐藏在弹窗中或不可见时，即使仅有单一筛选条件也保留可见状态与一键清除入口。
  const needsReset =
    Boolean(state.pack?.length) ||
    Boolean(state.stage) ||
    state.newOnly ||
    state.agent !== "all" ||
    state.favOnly ||
    state.recentOnly ||
    state.activeOnly ||
    (state.section === "insights" && state.todayOnly);
  if (!conditions.length || (conditions.length === 1 && !empty && !needsReset))
    return null;
  return (
    <section
      className="active-filters"
      data-testid="active-filters"
      aria-label={t("activeFilters")}
    >
      <div className="active-filter-list">
        <span className="muted">{t("activeFilters")}</span>
        {conditions.map(([key, label]) => (
          <Button
            key={key}
            size="small"
            className="active-filter-chip"
            data-filter-key={key}
            aria-label={t("removeFilter") + label}
            onClick={() => update((s) => ({ ...s, [key]: resets[key], ...(key === "pack" ? { packTitle: "" } : {}), ...(key === "discipline" ? {major:"all", ...(s.sort === "fit" ? {sort:"rank"} : {})} : {}) }))}
          >
            <span className="active-filter-label">{label}</span>
            <CloseOutlined aria-hidden="true" />
          </Button>
        ))}
        {onShareFavorites && (
          <Button
            size="small"
            type="primary"
            ghost
            data-testid="active-share-favorites"
            onClick={onShareFavorites}
          >
            {state.lang === "zh"
              ? `📦 一键分享收藏工具包 (${state.favorites.length})`
              : `📦 Share toolkit (${state.favorites.length})`}
          </Button>
        )}
        <Button
          size="small"
          type="link"
          onClick={() => update((s) => ({ ...s, ...resets, ...(s.sort === "fit" ? {sort:"rank"} : {}) }))}
        >
          {t("clearFilters")}
        </Button>
      </div>
      {empty && <p className="muted">{t("relaxFilters")}</p>}
    </section>
  );
}
