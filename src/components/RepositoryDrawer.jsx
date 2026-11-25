import { DisciplineEvidence } from "./DisciplineEvidence";
import React, { useEffect, useMemo, useRef } from "react";
import installationDetails from "../../config/installation-details.json";
import { Descriptions, Space, Tag } from "antd";
import { RESEARCH_TASKS, matchesResearchTask } from "../domain";
import { DISCIPLINES, disciplineFit } from "../disciplines";
import { trackEvent } from "../analytics";
import { QualityBadges } from "./RepositoryViews";
import { filterPublicSignals } from "../practical";
import { SummaryText } from "./PracticalInfo";
import { InstallationRequirements } from "./InstallationRequirements";
import { SkillUsageGuide } from "./SkillUsageGuide";
import { SubskillsExplorer } from "./SubskillsExplorer";

export function RepositoryDrawer({
  item,
  items,
  allItems = items,
  state,
  update,
  onOpenGuide,
  t,
  fmt,
}) {
  const contentRef = useRef(null);
  const similarSkills = useMemo(() => {
    if (!item) return [];
    const itemTasks = RESEARCH_TASKS.filter((task) =>
      matchesResearchTask(item, task),
    );
    const itemDiscs = DISCIPLINES.filter(
      (d) => disciplineFit(item, { discipline: d.id, major: "all" }) === "specific",
    ).map((d) => d.id);
    const pool = (allItems || items).filter(
      (c) => c.repository_kind === "skill" && c.repo !== item.repo && !c.stale,
    );
    return pool
      .map((cand) => {
        let score = 0;
        for (const task of itemTasks) {
          if (matchesResearchTask(cand, task)) score += 32;
        }
        for (const did of itemDiscs) {
          if (disciplineFit(cand, { discipline: did, major: "all" }) === "specific") {
            score += 26;
          }
        }
        const webFriendly =
          !cand.language || ["Markdown", "TeX", "HTML"].includes(cand.language);
        if (webFriendly) score += 8;
        score += Math.min(14, Math.log10(Math.max(10, cand.stars || 10)) * 3.2);
        return { cand, score, webFriendly };
      })
      .filter((x) => x.score >= 28)
      .sort((a, b) => b.score - a.score || (b.cand.stars || 0) - (a.cand.stars || 0))
      .slice(0, 3);
  }, [item, allItems, items]);

  useEffect(() => {
    const body = contentRef.current?.closest(".ant-drawer-body");
    if (body) body.scrollTop = 0;
    contentRef.current?.querySelectorAll("details[open]").forEach((details) => {
      details.open = false;
    });
  }, [item?.repo]);

  if (!item) return null;

  const delta = item.star_delta_7d || 0;
  const publicSignals = filterPublicSignals(item.precision_signals);
  const details = [
    {
      key: "topics",
      label: t("drTopics"),
      children: (
        <Space size={[4, 4]} wrap>
          {item.topics?.length
            ? item.topics.map((topic) => <Tag key={topic}>{topic}</Tag>)
            : "—"}
        </Space>
      ),
    },
    {
      key: "signals",
      label: t("drSignals"),
      children: (
        <Space size={[4, 4]} wrap>
          {publicSignals.length
            ? publicSignals.map((signal) => <Tag key={signal}>{signal}</Tag>)
            : "—"}
        </Space>
      ),
    },
    { key: "forks", label: t("drForks"), children: fmt(item.forks) },
    {
      key: "issues",
      label: t("drIssues"),
      children: fmt(item.open_issues),
    },
    {
      key: "language",
      label: t("drLanguage"),
      children: item.language || "—",
    },
    {
      key: "created",
      label: t("drCreated"),
      children: item.created_date || "—",
    },
    {
      key: "delta30",
      label: t("drDelta30d"),
      children: fmt(item.star_delta_30d ?? item.star_delta_7d ?? 0),
    },
  ];

  return (
    <div ref={contentRef} className="drawer-content" key={item.repo}>
      <SummaryText item={item} t={t} lang={state.lang} full />
      <SubskillsExplorer item={item} lang={state.lang} />
      <SkillUsageGuide
        item={item}
        lang={state.lang}
        t={t}
        detailsInfo={installationDetails[item.repo]}
        onOpenGuide={onOpenGuide}
      />
      <dl className="drawer-health">
        <div>
          <dt>Stars</dt>
          <dd>{fmt(item.stars)}</dd>
        </div>
        <div>
          <dt>{t("shortDelta7")}</dt>
          <dd>{delta ? `${delta > 0 ? "+" : ""}${fmt(delta)}` : "—"}</dd>
        </div>
        <div>
          <dt>{t("drPushed")}</dt>
          <dd>
            <time dateTime={item.last_push_date}>
              {item.last_push_date || "—"}
            </time>
          </dd>
        </div>
        <div>
          <dt>{t("drLicense")}</dt>
          <dd title={item.license?.name}>
            {item.license?.spdx_id && item.license.spdx_id !== "NOASSERTION"
              ? item.license.spdx_id
              : item.license?.name || "—"}
          </dd>
        </div>
      </dl>
      <DisciplineEvidence item={item} state={state} />
      {similarSkills.length > 0 && (
        <section
          className="drawer-alternatives"
          data-testid="drawer-alternatives"
          aria-label={
            state.lang === "zh" ? "同场景高分替代推荐" : "Similar verified Skills"
          }
        >
          <div className="drawer-alternatives-head">
            <h4>
              {state.lang === "zh"
                ? "🧭 同场景高分替代推荐"
                : "🧭 Similar Verified Skills"}
            </h4>
            <span>
              {state.lang === "zh"
                ? "当前配置偏复杂？可一键切换同方向热门方案"
                : "Switch to another verified Skill for the same workflow"}
            </span>
          </div>
          <div className="drawer-alternatives-grid">
            {similarSkills.map(({ cand, webFriendly }) => (
              <button
                key={cand.repo}
                type="button"
                className="drawer-alt-card"
                data-testid="drawer-alt-card"
                onClick={() => {
                  trackEvent("click_drawer_alternative", {
                    from: item.repo,
                    to: cand.repo,
                  });
                  update((s) => ({ ...s, repo: cand.repo }));
                }}
              >
                <div className="drawer-alt-top">
                  <strong>{cand.repo.split("/").pop()}</strong>
                  <span className="drawer-alt-meta">
                    {webFriendly && (
                      <em>
                        {state.lang === "zh" ? "免安装 · 网页直用" : "Zero-install · Web AI"}
                      </em>
                    )}
                    <span>★ {fmt(cand.stars)}</span>
                  </span>
                </div>
                <p>
                  {(state.lang === "zh" && cand.curated_use_zh) ||
                    cand.description ||
                    t("noDescription")}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
      <details className="drawer-more">
        <summary>{t("moreRepositoryDetails")}</summary>
        <InstallationRequirements
          item={item}
          lang={state.lang}
          t={t}
          detailsInfo={installationDetails[item.repo]}
        />
        <QualityBadges item={item} t={t} />
        <Descriptions column={1} bordered size="small" items={details} />
      </details>
    </div>
  );
}
