import { DisciplineEvidence } from "./DisciplineEvidence";
import React, { useEffect, useRef } from "react";
import installationDetails from "../../config/installation-details.json";
import { Button, Descriptions, Drawer, Space, Tag } from "antd";
import { ExportOutlined } from "@ant-design/icons";
import {
  AGENT_PLATFORMS,
  sceneLabelsFor,
  detectAgents,
  REPOSITORY_URL,
  safeExternalUrl,
} from "../domain";
import { QualityBadges, RepositoryActions } from "./RepositoryViews";
import { useFeedback } from "./FeedbackProvider";
import { copyText } from "../clipboard";
import { formatShareCardText } from "../shareText";
import { SummaryText } from "./PracticalInfo";
import { InstallationRequirements } from "./InstallationRequirements";
import { SkillUsageGuide } from "./SkillUsageGuide";
export function RepositoryDrawer({
  item,
  items,
  state,
  update,
  toggleCompare,
  onOpenGuide,
  t,
  fmt,
}) {
  const contentRef = useRef(null);
  const position = items.findIndex((entry) => entry.repo === item?.repo);
  useEffect(() => {
    const body = contentRef.current?.closest(".ant-drawer-body");
    if (body) body.scrollTop = 0;
    contentRef.current?.querySelectorAll("details[open]").forEach((details) => {
      details.open = false;
    });
  }, [item?.repo]);
  const navigate = (offset) => {
    const target = position >= 0 && items[position + offset];
    if (target) update((previous) => ({ ...previous, repo: target.repo }));
  };
  useEffect(() => {
    if (!item) return;
    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target?.closest?.('input,select,textarea,pre,[contenteditable="true"]')) return;
      if (event.key === "ArrowLeft" && position > 0) {
        event.preventDefault();
        navigate(-1);
      } else if (event.key === "ArrowRight" && position >= 0 && position < items.length - 1) {
        event.preventDefault();
        navigate(1);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item?.repo, position, items.length]);
  const message = useFeedback();
  const copy = async (text) => {
    try {
      await copyText(text);
      message.success(t("toastCopied"));
    } catch {
      message.error(t("copyFailed"));
    }
  };
  const category = item ? sceneLabelsFor(item, t).join(" · ") : "";
  const agentNames = item
    ? detectAgents(item).map(
        (id) => AGENT_PLATFORMS.find((a) => a.id === id)?.label || id,
      )
    : [];
  const delta = item?.star_delta_7d || 0;
  const markdown = item
    ? `| ${item.rank} | [${item.repo}](${item.url}) | ${item.stars.toLocaleString()}${delta ? ` (${delta > 0 ? "+" : ""}${delta})` : ""} | ${category} | ${agentNames.join(" · ") || t("agentGeneral")} | ${item.last_push_date || ""} |`
    : "";
  const sharePeerCard = async () => {
    if (!item) return;
    const text = formatShareCardText(item, {
      lang: state.lang,
      tasks: category,
      agents: agentNames.slice(0, 4).join(" / "),
    });
    try {
      await copyText(text);
      message.success(
        state.lang === "zh"
          ? "已复制安利文案，可直接粘贴到微信群或小红书"
          : "Recommendation card copied to clipboard",
      );
    } catch {
      message.error(t("copyFailed"));
    }
  };
  const feedback = item
    ? `${REPOSITORY_URL}/issues/new?title=${encodeURIComponent("Information issue: " + item.repo)}&body=${encodeURIComponent(`Repository: **${item.repo}** (${item.url})\n\nIncorrect or outdated information:\n\nSuggested correction and source:\n`)}`
    : "";
  const details = item
    ? [
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
              {item.precision_signals?.length
                ? item.precision_signals.map((signal) => (
                    <Tag key={signal}>{signal}</Tag>
                  ))
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
      ]
    : [];
  return (
    <Drawer
      title={
        item ? (
          <div className="drawer-header-wrap">
            <div className="drawer-eyebrow">
              {t("drEyebrow")} #{item.rank}
              {category && ` · ${category}`}
            </div>
            <div className="drawer-title-bar">
              <span className="drawer-repo">{item.repo}</span>
              <nav className="detail-navigation" aria-label={t("drBrowse")}>
                <Button
                  size="small"
                  data-testid="detail-previous"
                  disabled={position <= 0}
                  onClick={() => navigate(-1)}
                >
                  {t("drPrevious")}
                </Button>
                <span
                  className="detail-position"
                  data-testid="detail-position"
                  aria-live="polite"
                >
                  {position >= 0
                    ? `${position + 1} / ${items.length}`
                    : t("drOutsideResults")}
                </span>
                <Button
                  size="small"
                  data-testid="detail-next"
                  disabled={position < 0 || position >= items.length - 1}
                  onClick={() => navigate(1)}
                >
                  {t("drNext")}
                </Button>
              </nav>
            </div>
          </div>
        ) : (
          ""
        )
      }
      open={Boolean(item)}
      onClose={() => update((s) => ({ ...s, repo: null }))}
      size={640}
      className="repository-drawer"
      footer={
        item ? (
          <div className="drawer-footer-actions">
            <div className="drawer-primary-actions">
              <RepositoryActions
                {...{ item, state, update, toggleCompare, t }}
                labels
                context="detail"
              />
              <Button
                data-testid="share-peer-btn"
                onClick={sharePeerCard}
              >
                {state.lang === "zh" ? "分享给同门" : "Share pick"}
              </Button>
              <Button
                icon={<ExportOutlined aria-hidden="true" />}
                href={safeExternalUrl(item.url) || undefined}
                target="_blank"
                rel="noreferrer"
              >
                {t("drOpenRepo")}
              </Button>
              <details className="drawer-more-actions">
                <summary aria-label={t("moreActions")}>···</summary>
                <div className="drawer-action-menu">
                  {safeExternalUrl(item.homepage) && (
                    <a
                      href={safeExternalUrl(item.homepage)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("drHomepage")}
                    </a>
                  )}
                  <button type="button" onClick={() => copy(markdown)}>
                    {t("drCopyMd")}
                  </button>
                  <a href={feedback} target="_blank" rel="noreferrer">
                    {t("drFeedback")}
                  </a>
                </div>
              </details>
            </div>
          </div>
        ) : null
      }
    >
      {item && (
        <div ref={contentRef} className="drawer-content" key={item.repo}>
          <SummaryText item={item} t={t} lang={state.lang} full />
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
      )}
    </Drawer>
  );
}
