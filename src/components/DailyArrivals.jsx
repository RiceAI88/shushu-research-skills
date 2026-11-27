import { matchesDiscipline } from "../disciplines";
import { Reveal } from "./SiteMotion";
import React from "react";
import { Button } from "antd";

export function DailyArrivals({ items, state, update, t }) {
  const scoped = items.filter((item) => matchesDiscipline(item, state));
  const skills = scoped.filter(
    (item) => item.new_today && item.repository_kind === "skill",
  );
  const related = scoped.filter(
    (item) => item.new_today && item.repository_kind === "related",
  );
  const weeklySkills = scoped
    .filter((item) => item.new_this_week && item.repository_kind === "skill")
    .sort((a, b) => (b.star_delta_7d || 0) - (a.star_delta_7d || 0) || b.stars - a.stars);

  const choose = (kind) =>
    update((s) => ({
      ...s,
      query: "",
      task: "all",
      category: "all",
      agent: "all",
      favOnly: false,
      newOnly: false,
      includeRelated: kind === "related" ? true : s.includeRelated,
      todayOnly: s.todayOnly === kind ? "" : kind,
    }));

  const zh = state.lang === "zh";
  const showWeeklyFallback =
    !skills.length && !related.length && !state.todayOnly && weeklySkills.length > 0;

  if (showWeeklyFallback) {
    return (
      <Reveal
        as="section"
        className="daily-arrivals daily-arrivals-weekly"
        data-testid="daily-arrivals"
        aria-labelledby="daily-arrivals-title"
      >
        <div className="daily-arrivals-heading">
          <div className="daily-arrivals-title">
            <h2 id="daily-arrivals-title">
              {zh ? "本周新上榜 Skills" : "New This Week"}{" "}
              <strong>{weeklySkills.length}</strong>
              <span className="sr-only" data-testid="daily-skill-count">
                0
              </span>
            </h2>
            <span>
              {state.discipline && state.discipline !== "all"
                ? zh
                  ? "当前专业 · 近 7 日新收录精选"
                  : "Selected discipline · Added in the last 7 days"
                : zh
                  ? "全站 · 近 7 日新收录热门项目"
                  : "All disciplines · Popular new additions this week"}
            </span>
          </div>
          <div className="daily-arrivals-actions">
            <Button
              type="text"
              size="small"
              className="daily-arrivals-link"
              data-testid="weekly-skills-fallback"
              aria-pressed={Boolean(state.newOnly)}
              onClick={() =>
                update((s) => ({
                  ...s,
                  todayOnly: "",
                  newOnly: !s.newOnly,
                }))
              }
            >
              {state.newOnly && <span aria-hidden="true">←</span>}
              <span>
                {state.newOnly
                  ? t("dailyShowAll")
                  : zh
                    ? `查看全部 ${weeklySkills.length}`
                    : `View all ${weeklySkills.length}`}
              </span>
              {!state.newOnly && <span aria-hidden="true">→</span>}
            </Button>
          </div>
        </div>
        <div className="daily-arrivals-list">
          {weeklySkills.slice(0, 3).map((item) => (
            <button
              type="button"
              key={item.repo}
              className="daily-arrival-entry"
              aria-label={item.repo}
              onClick={() => update((s) => ({ ...s, repo: item.repo }))}
            >
              <strong>{item.repo}</strong>
              <span>
                {(zh && item.curated_use_zh) ||
                  item.description ||
                  t("noDescription")}
              </span>
            </button>
          ))}
        </div>
      </Reveal>
    );
  }

  const isQuiet = !skills.length && !related.length && !state.todayOnly;
  return (
    <Reveal
      as="section"
      className={`daily-arrivals${isQuiet ? " daily-arrivals-quiet" : ""}`}
      data-testid="daily-arrivals"
      aria-labelledby="daily-arrivals-title"
    >
      <div className="daily-arrivals-heading">
        <div className="daily-arrivals-title">
          <h2 id="daily-arrivals-title">
            {t("dailySkills")}{" "}
            <strong data-testid="daily-skill-count">{skills.length}</strong>
          </h2>
          <span>
            {skills.length && state.discipline && state.discipline !== "all"
              ? zh
                ? "当前专业 · 本站首次收录 · 北京时间"
                : "Selected discipline · First listed here · Beijing time"
              : t(skills.length ? "dailyScope" : "dailyEmpty")}
          </span>
        </div>
        <div className="daily-arrivals-actions">
          {related.length > 0 && (
            <Button
              type="text"
              data-testid="today-related-filter"
              aria-pressed={state.todayOnly === "related"}
              onClick={() => choose("related")}
            >
              {t("dailyRelated")} {related.length}
            </Button>
          )}
          <Button
            type="text"
            size="small"
            className="daily-arrivals-link"
            data-testid="today-skills-filter"
            disabled={!skills.length && state.todayOnly !== "skill"}
            aria-pressed={state.todayOnly === "skill"}
            onClick={() => choose("skill")}
          >
            {state.todayOnly === "skill" && <span aria-hidden="true">←</span>}
            <span>{t(state.todayOnly === "skill" ? "dailyShowAll" : "dailyView")}</span>
            {state.todayOnly !== "skill" && <span aria-hidden="true">→</span>}
          </Button>
        </div>
      </div>
      {skills.length ? (
        <div className="daily-arrivals-list">
          {skills.slice(0, 3).map((item) => (
            <button
              type="button"
              key={item.repo}
              className="daily-arrival-entry"
              aria-label={item.repo}
              onClick={() => update((s) => ({ ...s, repo: item.repo }))}
            >
              <strong>{item.repo}</strong>
              <span>
                {(zh && item.curated_use_zh) ||
                  item.description ||
                  t("noDescription")}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </Reveal>
  );
}
