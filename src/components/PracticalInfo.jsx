import React from "react";
import { SearchHighlight } from "./SearchHighlight";
import { Button, Space, Tag, Tooltip } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { AGENT_PLATFORMS, detectAgents, safeExternalUrl } from "../domain";
import { EDITORIAL_CONTENT, installationFor } from "../practical";
import { useFeedback } from "./FeedbackProvider";
import { copyText } from "../clipboard";
const HAS_CHINESE_RE = /[\u4e00-\u9fff]/;

export function SummaryText({ item, t, query = "", full = false, lang = "" }) {
  const showCuratedZh =
    lang === "zh" &&
    Boolean(item.curated_use_zh) &&
    !HAS_CHINESE_RE.test(item.description || "");
  return (
    <div
      className={`practical-description${showCuratedZh ? " has-curated-use" : ""}`}
    >
      {showCuratedZh && (
        <div
          className="curated-use-line"
          data-testid="card-cn-summary"
          title={full ? undefined : item.curated_use_zh}
        >
          <SearchHighlight text={item.curated_use_zh} query={query} />
        </div>
      )}
      <p
        className={full ? "description-full" : "description-clamp"}
        title={full ? undefined : item.description}
      >
        <SearchHighlight
          text={item.description || t("noDescription")}
          query={query}
        />
      </p>
    </div>
  );
}
export function dedupePlatformLabels(rawLabels) {
  const unique = [];
  const seenCompact = new Set();
  for (const label of rawLabels) {
    const clean = String(label || "").trim();
    if (!clean) continue;
    // 归一化空格、连字符与下划线，避免 "Claude Code" 与 "claude-code" 重复出现
    const compactKey = clean.toLowerCase().replace(/[-_\s]+/g, "");
    if (!compactKey || seenCompact.has(compactKey)) continue;
    seenCompact.add(compactKey);
    unique.push(clean);
  }
  // Drop shorter generic labels when a more specific official name is already present
  // (e.g. "Gemini" when "Gemini CLI" is listed, or "Antigravity" when "Google Antigravity" is listed).
  return unique.filter((label) => {
    const lower = label.toLowerCase().replace(/[-_]+/g, " ");
    return !unique.some((other) => {
      const otherLower = other.toLowerCase().replace(/[-_]+/g, " ");
      if (otherLower === lower || otherLower.length <= lower.length) return false;
      return (
        otherLower.startsWith(lower + " ") ||
        otherLower.endsWith(" " + lower)
      );
    });
  });
}
export function PlatformTags({ item, t, compact = false }) {
  const agents = detectAgents(item);
  const labels = dedupePlatformLabels([
    ...agents.map(
      (id) => AGENT_PLATFORMS.find((agent) => agent.id === id)?.label || id,
    ),
    ...(item.documented_platform_names || []),
  ]);
  if (compact) {
    const pairText = labels.slice(0, 2).join(" · ");
    const shownCount =
      labels.length >= 2 && pairText.length > 20 ? 1 : Math.min(2, labels.length);
    const overflow = labels.length - shownCount;
    return (
      <Tooltip title={labels.join(" · ") || t("platformUnspecifiedHint")}>
        <span className="card-platforms">
          {labels.slice(0, shownCount).join(" · ") || t("agentGeneral")}
          {overflow > 0 && ` +${overflow}`}
        </span>
      </Tooltip>
    );
  }
  const verified = Boolean(EDITORIAL_CONTENT.platforms[item.repo]);
  return (
    <Tooltip
      title={t(
        !labels.length
          ? "platformUnspecifiedHint"
          : verified
            ? "platformDocumented"
            : "platformInferred",
      )}
    >
      <Space size={[4, 4]} wrap className="platform-tags">
        {labels.length ? (
          labels.map((label) => (
            <Tag key={label}>
              {label}
            </Tag>
          ))
        ) : (
          <Tag>{t("agentGeneral")}</Tag>
        )}
      </Space>
    </Tooltip>
  );
}
export function InstallationMode({ item, t, short = false, cardEntry = false }) {
  if (cardEntry) {
    return (
      <Tag
        className="install-mode install-mode-entry"
        data-testid="installation-mode"
      >
        {t("installPendingShort")}
      </Tag>
    );
  }
  const installation = installationFor(item);
  const label = t(
    {
      command: "installCommandMode",
      manual: "installManualMode",
      docs: "installUnknownMode",
      reference: "installReferenceMode",
    }[installation.mode],
  );
  return (
    <Tooltip title={label}>
      <Tag
        className={`install-mode install-mode-${installation.mode}`}
        data-testid="installation-mode"
        tabIndex={0}
      >
        {short
          ? t(
              {
                command: "installShortCommand",
                manual: "installShortManual",
                docs: "installPendingShort",
                reference: "installShortReference",
              }[installation.mode],
            )
          : label}
      </Tag>
    </Tooltip>
  );
}

export function CopyInstallButton({
  item,
  t,
  iconOnly = false,
  primary = false,
}) {
  const installation = installationFor(item);
  const message = useFeedback();
  if (!installation.command) return null;
  return (
    <Tooltip title={t("copyInstall")}>
      <Button
        type={primary ? "primary" : iconOnly ? "text" : "default"}
        size="small"
        icon={<CopyOutlined aria-hidden="true" />}
        aria-label={t("copyInstall")}
        data-install={item.repo}
        onClick={async (event) => {
          event.stopPropagation();
          try {
            await copyText(installation.command);
            message.success(t("toastCopiedInstall"));
          } catch {
            message.error(t("copyFailed"));
          }
        }}
      >
        {!iconOnly && t("copyInstall")}
      </Button>
    </Tooltip>
  );
}
