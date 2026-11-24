import { reviewedInstallSnapshot } from "../practical";
import React from "react";
import { Modal, Tag, Tooltip } from "antd";
import { ComparisonChart } from "./TrendCharts";
import { PlatformTags } from "./PracticalInfo";
import { InstallationActions } from "./InstallationActions";
import { EditorialReviewNotice } from "./EditorialReviewNotice";
import {
  RESEARCH_TASKS,
  matchesResearchTask,
  safeExternalUrl,
} from "../domain";
import { installationFor } from "../practical";
import { deriveSetupThresholds } from "../usageGuide";
import installationDetails from "../../config/installation-details.json";
const labels = {
  analyze:"taskAnalyze",
  compute:"taskCompute",
  find: "taskFind",
  read: "taskRead",
  write: "taskWrite",
  figures: "taskFigures",
  reproduce: "taskReproduce",
  review: "taskReview",
};
export default function ComparisonDialog({
  open,
  onClose,
  onRemove,
  onOpenRepo,
  repos,
  items = [],
  lang = "zh",
  theme = "light",
  history,
  t,
}) {
  const fmt = (value) =>
    new Intl.NumberFormat(lang === "zh" ? "zh-CN" : "en-US").format(value || 0);
  const selected = repos
    .map((repo) => items.find((item) => item.repo === repo))
    .filter(Boolean);
  const rows = [
    [
      "compareTasks",
      (item) => {
        const tasks = RESEARCH_TASKS.filter((task) =>
          matchesResearchTask(item, task),
        );
        return tasks.length
          ? tasks.map((task) => <Tag key={task.id}>{t(labels[task.id])}</Tag>)
          : t("compareUnknown");
      },
    ],
    ["agentLabel", (item) => <PlatformTags item={item} t={t} />],
    [
      "installation",
      (item) => (
        <>
          <InstallationActions item={item} lang={lang} t={t} />
          <EditorialReviewNotice repo={item.repo} t={t} lang={lang} />
        </>
      ),
    ],
    [
      "installEnvironment",
      (item) => {
        const curatedEnv = installationDetails[item.repo]?.[`environment_${lang}`];
        if (curatedEnv) return curatedEnv;
        const thresholds = deriveSetupThresholds(
          item,
          installationFor(item),
          installationDetails[item.repo],
          lang,
        );
        if (!thresholds.length) return t("compareUnknown");
        return (
          <div className="comparison-thresholds" data-testid="comparison-thresholds">
            {thresholds.map((b) => (
              <span
                key={b.id}
                className={`threshold-pill threshold-${b.tone || "easy"}`}
              >
                {b.label}
              </span>
            ))}
          </div>
        );
      },
    ],
    [
      "installDependencies",
      (item) =>
        installationDetails[item.repo]?.[`dependencies_${lang}`] ||
        t("compareUnknown"),
    ],
    [
      "compareMaintenance",
      (item) => (
        <>
          <Tooltip title={t("staleReason")}>
            <Tag color={item.stale ? "red" : undefined}>
              {item.stale
                ? t("staleTag")
                : item.last_push_date
                  ? t("compareNotFlagged")
                  : t("compareUnknown")}
            </Tag>
          </Tooltip>
          <div className="muted">
            {t("compareLastPush")}: {item.last_push_date || "—"}
          </div>
        </>
      ),
    ],
    [
      "docsChecked",
      (item) => {
        const install = installationFor(item),
          snapshot = reviewedInstallSnapshot(item, installationDetails[item.repo]);
        return install.reviewed_at ? (
          <>
            {install.reviewed_at}
            {snapshot && (
              <div>
                <a
                  href={snapshot}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("installSnapshot")} ↗
                </a>
              </div>
            )}
          </>
        ) : (
          t("compareUnknown")
        );
      },
    ],
  ];
  return (
    <Modal
      title={t("compareTitle")}
      open={open}
      onCancel={onClose}
      footer={null}
      width={1080}
    >
      <p className="muted">{t("compareTasksHint")}</p>
      <div
        className="comparison-scroll"
        tabIndex={0}
        role="region"
        aria-label={t("compareTitle")}
      >
        <table
          className="comparison-matrix"
          style={{ minWidth: 150 + selected.length * 250 }}
        >
          <thead>
            <tr>
              <th scope="col">{t("compareTitle")}</th>
              {selected.map((item) => {
                const license =
                  item.license?.spdx_id && item.license.spdx_id !== "NOASSERTION"
                    ? item.license.spdx_id
                    : item.license?.name || "";
                const delta = item.star_delta_7d || 0;
                return (
                  <th scope="col" key={item.repo}>
                    <div className="comparison-col-header">
                      <a
                        href={
                          safeExternalUrl(item.url) ||
                          `https://github.com/${item.repo}`
                        }
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.repo} ↗
                      </a>
                      {onRemove && (
                        <button
                          type="button"
                          className="comparison-remove-btn"
                          aria-label={
                            lang === "zh"
                              ? `从对比移除 ${item.repo}`
                              : `Remove ${item.repo} from comparison`
                          }
                          onClick={() => onRemove(item.repo)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="comparison-col-metrics">
                      <span>★ {fmt(item.stars)}</span>
                      {delta !== 0 && (
                        <span className="comparison-col-delta">
                          {lang === "zh" ? "7日 " : "7d "}
                          {delta > 0 ? "+" : ""}
                          {fmt(delta)}
                        </span>
                      )}
                      {license && <span>{license}</span>}
                    </div>
                    {lang === "zh" && item.curated_use_zh && (
                      <div className="comparison-col-summary">
                        {item.curated_use_zh}
                      </div>
                    )}
                    {onOpenRepo && (
                      <button
                        type="button"
                        className="comparison-open-guide-btn"
                        data-testid="comparison-open-guide"
                        onClick={() => onOpenRepo(item.repo)}
                      >
                        {lang === "zh"
                          ? "查看 3 步安装与提示词 ›"
                          : "Setup & prompt guide ›"}
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map(([key, render]) => (
              <tr key={key} data-compare-field={key}>
                <th scope="row">{t(key)}</th>
                {selected.map((item) => (
                  <td key={item.repo}>{render(item)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h3>{t("compareGrowth")}</h3>
      <p className="muted">{t("compareHint")}</p>
      <ComparisonChart repos={repos} history={history} theme={theme} t={t} />
    </Modal>
  );
}
