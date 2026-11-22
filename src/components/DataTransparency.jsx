import { Reveal } from "./SiteMotion";
import { DISCIPLINES } from "../disciplines";
import { RESEARCH_TASKS } from "../domain";
import React from "react";

export function DataTransparency({ t, base, lang = "zh" }) {
  const zh = lang === "zh";
  return (
    <Reveal
      as="section"
      className="data-transparency"
      data-testid="data-transparency"
      aria-labelledby="transparencyHeading"
    >
      <h2 id="transparencyHeading">{t("transparencyTitle")}</h2>
      <p>
        <strong>{t("rankingBasis")}</strong> {t("rankingBasisCopy")}
      </p>
      <p>
        <strong>{t("dataSource")}</strong> {t("dataSourceCopy")}
      </p>
      <a href={base + "docs/methodology.md"}>{t("fullMethodology")}</a>
      <nav
        className="seo-topic-directory"
        data-testid="seo-topic-directory"
        aria-label={zh ? "学科与任务专题索引" : "Discipline & task directories"}
      >
        <div className="seo-topic-row">
          <strong>{zh ? "学科专题：" : "Disciplines:"}</strong>
          {DISCIPLINES.map((d) => (
            <a key={d.id} href={`${base}disciplines/${d.id}/`}>
              {d[lang] || d.zh}
            </a>
          ))}
        </div>
        <div className="seo-topic-row">
          <strong>{zh ? "任务专题：" : "Research tasks:"}</strong>
          {RESEARCH_TASKS.map((task) => (
            <a key={task.id} href={`${base}topics/${task.id}/`}>
              {t("task" + task.id[0].toUpperCase() + task.id.slice(1))}
            </a>
          ))}
        </div>
      </nav>
    </Reveal>
  );
}
