import { ActionPopover } from "./ActionPopover";
import { ScopeSwitch } from "./ScopeSwitch";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { DISCIPLINES, disciplineCounts, disciplineFit, professionLabel, selectedDiscipline, uniqueRepositories } from "../disciplines";

const PREF_KEY = "ars-last-discipline";

function readSavedDiscipline() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREF_KEY) || "null");
    return raw && DISCIPLINES.some((d) => d.id === raw.id) ? raw : null;
  } catch {
    return null;
  }
}

export function DisciplineSelector({ items, visible, state, update }) {
  const zh = state.lang === "zh",
    lang = state.lang;
  const group = selectedDiscipline(state);
  const navigation = useRef(null);
  const [savedPref, setSavedPref] = useState(readSavedDiscipline);

  useLayoutEffect(() => {
    const list = navigation.current;
    if (!list || !matchMedia("(max-width:760px)").matches) return;
    const active = list.querySelector('[aria-pressed="true"]');
    if (active)
      list.scrollLeft +=
        active.getBoundingClientRect().left -
        list.getBoundingClientRect().left -
        (list.clientWidth - active.offsetWidth) / 2;
  }, [state.discipline]);

  const counts = disciplineCounts(items);

  // 自动记录用户主动选过的学科门类与当时数量，用于下次访问时提示上新
  useEffect(() => {
    if (!group) return;
    const next = { id: group.id, count: counts[group.id] || 0 };
    setSavedPref(next);
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, [group?.id, counts[group?.id]]);

  const majorCounts = group
    ? Object.fromEntries(
        group.majors.map((m) => [
          m.id,
          uniqueRepositories(items).filter(
            (i) => disciplineFit(i, { discipline: group.id, major: m.id }) === "specific",
          ).length,
        ]),
      )
    : {};
  const specific = visible.filter((i) => disciplineFit(i, state) === "specific").length;
  const common = visible.filter((i) => disciplineFit(i, state) === "common").length;
  const choose = (id) =>
    update((s) => ({
      ...s,
      discipline: id,
      major: "all",
      repo: null,
      ...(id === "all"
        ? s.sort === "fit"
          ? { sort: "rank" }
          : {}
        : s.sort === "rank"
          ? { sort: "fit" }
          : {}),
    }));

  const savedGroup = !group && savedPref ? DISCIPLINES.find((d) => d.id === savedPref.id) : null;
  const savedDelta = savedGroup
    ? Math.max(0, (counts[savedGroup.id] || 0) - (Number(savedPref.count) || 0))
    : 0;
  const savedWeeklyNew = savedGroup
    ? uniqueRepositories(items).filter(
        (i) =>
          i.new_this_week &&
          disciplineFit(i, { discipline: savedGroup.id, major: "all" }) === "specific",
      ).length
    : 0;

  return (
    <section className="discipline-selector" data-testid="discipline-selector" aria-labelledby="discipline-selector-title">
      {savedGroup && (
        <div className="returning-discipline-bar" data-testid="returning-discipline-hint">
          <span className="returning-discipline-copy">
            <span aria-hidden="true">👋</span>
            <span>
              {zh ? (
                <>
                  上次浏览 <strong>{savedGroup.zh}</strong>
                  {savedDelta > 0
                    ? ` · 距上次新增 +${savedDelta} 个本专业项目`
                    : savedWeeklyNew > 0
                      ? ` · 本周新收录 ${savedWeeklyNew} 个本专业项目`
                      : `（共 ${counts[savedGroup.id] || 0} 个本专业项目）`}
                </>
              ) : (
                <>
                  Last viewed <strong>{savedGroup.en}</strong>
                  {savedDelta > 0
                    ? ` · +${savedDelta} new since last visit`
                    : savedWeeklyNew > 0
                      ? ` · ${savedWeeklyNew} new this week`
                      : ` (${counts[savedGroup.id] || 0} projects)`}
                </>
              )}
            </span>
          </span>
          <span className="returning-discipline-actions">
            <button
              type="button"
              className="returning-discipline-apply"
              onClick={() => choose(savedGroup.id)}
            >
              {zh ? `切回${savedGroup.zh} ›` : `Switch to ${savedGroup.en} ›`}
            </button>
            <button
              type="button"
              className="returning-discipline-dismiss"
              aria-label={zh ? "忽略专业记忆提示" : "Dismiss"}
              onClick={() => {
                setSavedPref(null);
                try {
                  localStorage.removeItem(PREF_KEY);
                } catch {
                  /* ignore */
                }
              }}
            >
              ×
            </button>
          </span>
        </div>
      )}
      <div className="discipline-selector-heading">
        <div className="discipline-selector-title"><h2 id="discipline-selector-title">{group ? <>{zh ? "我是 " : "For "}<em>{professionLabel(state, lang)}</em>{zh ? (state.major === "all" ? " 类专业的学生" : " 专业的学生") : " students"}</> : (zh ? "按专业寻找科研 Skills" : "Choose your discipline")}</h2><ActionPopover label={zh ? "分类说明" : "About classification"} lang={lang}><p>{zh ? "专业归属依据项目官方文档，数量按仓库去重。尚未核验专业归属的项目可在“全部”中查看。" : "Discipline labels are based on official documentation and count unique repositories. Projects awaiting discipline review remain in All."}</p></ActionPopover></div>
        <div className="discipline-heading-meta">
          <span>{group ? (zh ? `当前结果 ${visible.length}：专业适用 ${specific} ＋ 通用 ${common}` : `Results ${visible.length}: ${specific} specialized + ${common} general`) : (zh ? "按学科或论文阶段快速锁定适用工具" : "Filter by discipline or research stage")}</span>
          {group && (
            <label className="discipline-common-toggle">
              <span>{zh ? "包含通用" : "Include general"}</span>
              <ScopeSwitch
                checked={state.includeCommon !== false}
                aria-label={zh ? "混排跨专业通用工具" : "Show cross-disciplinary tools"}
                onChange={(includeCommon) => update((s) => ({ ...s, includeCommon }))}
              />
            </label>
          )}
        </div>
      </div>
      <div ref={navigation} className="discipline-options" role="group" aria-label={zh ? "学科门类" : "Disciplines"}>
        <span className="discipline-row-label">{zh ? "学科门类" : "Discipline"}</span>
        <button type="button" data-discipline="all" aria-pressed={!group} onClick={() => choose("all")}>{zh ? "全部" : "All"}</button>
        {DISCIPLINES.map((d) => (
          <button key={d.id} type="button" data-discipline={d.id} className={counts[d.id] ? "" : "discipline-zero"} aria-pressed={state.discipline === d.id} onClick={() => choose(d.id)}>{d[lang]}<span aria-hidden="true">{counts[d.id]}</span></button>
        ))}
      </div>
      {group && <div className="discipline-majors" role="group" aria-label={zh ? "具体专业" : "Majors"}>
        <span className="discipline-row-label">{zh ? "具体专业" : "Major"}</span>
        <button data-major="all" aria-pressed={state.major === "all"} onClick={() => update((s) => ({ ...s, major: "all" }))}>{zh ? `全部${group.zh}` : `All ${group.en}`}</button>
        {group.majors.map((m) => <button key={m.id} data-major={m.id} className={majorCounts[m.id] ? "" : "discipline-zero"} aria-pressed={state.major === m.id} onClick={() => update((s) => ({ ...s, major: m.id }))}>{m[lang]}<span aria-hidden="true">{majorCounts[m.id]}</span></button>)}
      </div>}
      {group && !specific && <p className="discipline-empty-note">{zh ? "当前条件下，本站尚无已核验专业归属的项目。这不代表没有相关 Skills，可在“收录范围”开启通用科研 Skills，或推荐你发现的项目。" : "No projects with reviewed discipline labels match these filters yet. This does not mean no such Skills exist. Include general Skills or suggest a project."} <a href="https://github.com/RiceAI88/shushu-research-skills/issues/new?template=recommend-repo.yml" target="_blank" rel="noopener noreferrer">{zh ? "推荐项目 ↗" : "Suggest a project ↗"}</a></p>}
    </section>
  );
}
