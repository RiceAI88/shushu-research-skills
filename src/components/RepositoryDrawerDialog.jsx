import React, { lazy, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button, Drawer } from "antd";
import { ExportOutlined } from "@ant-design/icons";
import {
  AGENT_PLATFORMS,
  REPOSITORY_URL,
  detectAgents,
  safeExternalUrl,
  sceneLabelsFor,
} from "../domain";
import { RepositoryActions } from "./RepositoryViews";
import { useFeedback } from "./FeedbackProvider";
import { copyText } from "../clipboard";
import { DeferredFeature } from "./DeferredFeature";
import { OverlaySkeleton } from "./OverlaySkeleton";

let drawerChunkPromise = null;

// 预热详情内容块（悬停卡片时触发，复用同一 Promise 避免重复请求）
export function preloadRepositoryDrawer() {
  if (!drawerChunkPromise) {
    drawerChunkPromise = import("./RepositoryDrawer").then((module) => ({
      default: module.RepositoryDrawer,
    }));
  }
  return drawerChunkPromise;
}

const RepositoryDrawerBody = lazy(preloadRepositoryDrawer);

// 外层 Drawer 壳在点击瞬间 0ms 滑出，重体积用法指南与学科证据未就绪时展示骨架屏
export function RepositoryDrawerDialog({
  item,
  items,
  allItems = items,
  state,
  update,
  toggleCompare,
  onQuickCompare,
  onOpenGuide,
  t,
  fmt,
}) {
  const [retained, setRetained] = useState(item || null);
  useLayoutEffect(() => {
    if (item) setRetained(item);
  }, [item]);

  const activeItem = item || retained;
  const position = items.findIndex((entry) => entry.repo === activeItem?.repo);
  const navigate = (offset) => {
    const target = position >= 0 && items[position + offset];
    if (target) update((previous) => ({ ...previous, repo: target.repo }));
  };

  useEffect(() => {
    if (!item) return undefined;
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

  const category = activeItem ? sceneLabelsFor(activeItem, t).join(" · ") : "";
  const agentNames = activeItem
    ? detectAgents(activeItem).map(
        (id) => AGENT_PLATFORMS.find((a) => a.id === id)?.label || id,
      )
    : [];
  const delta = activeItem?.star_delta_7d || 0;
  const markdown = activeItem
    ? `| ${activeItem.rank} | [${activeItem.repo}](${activeItem.url}) | ${activeItem.stars.toLocaleString()}${delta ? ` (${delta > 0 ? "+" : ""}${delta})` : ""} | ${category} | ${agentNames.join(" · ") || t("agentGeneral")} | ${activeItem.last_push_date || ""} |`
    : "";

  const sharePeerCard = async () => {
    if (!activeItem) return;
    try {
      const { formatShareCardText } = await import("../shareText");
      const text = formatShareCardText(activeItem, {
        lang: state.lang,
        tasks: category,
        agents: agentNames.slice(0, 4).join(" / "),
      });
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

  const feedback = activeItem
    ? `${REPOSITORY_URL}/issues/new?title=${encodeURIComponent("Information issue: " + activeItem.repo)}&body=${encodeURIComponent(`Repository: **${activeItem.repo}** (${activeItem.url})\n\nIncorrect or outdated information:\n\nSuggested correction and source:\n`)}`
    : "";

  return (
    <Drawer
      title={
        activeItem ? (
          <div className="drawer-header-wrap">
            <div className="drawer-top-meta">
              <div className="drawer-eyebrow">
                <span className="drawer-rank-pill">#{activeItem.rank}</span>
                {category && <span>{category}</span>}
              </div>
              <nav className="detail-navigation" aria-label={t("drBrowse")}>
                <Button
                  size="small"
                  type="text"
                  aria-label={t("drPrevious")}
                  data-testid="detail-previous"
                  disabled={position <= 0}
                  onClick={() => navigate(-1)}
                >
                  <span aria-hidden="true">‹ </span>
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
                  type="text"
                  aria-label={t("drNext")}
                  data-testid="detail-next"
                  disabled={position < 0 || position >= items.length - 1}
                  onClick={() => navigate(1)}
                >
                  {t("drNext")}
                  <span aria-hidden="true"> ›</span>
                </Button>
              </nav>
            </div>
            <div className="drawer-title-bar">
              <span className="drawer-repo">
                <span className="drawer-repo-owner">
                  {activeItem.repo.split("/")[0]}/
                </span>
                <strong className="drawer-repo-name">
                  {activeItem.repo.split("/").slice(1).join("/")}
                </strong>
              </span>
            </div>
          </div>
        ) : (
          ""
        )
      }
      open={Boolean(item)}
      onClose={() => update((s) => ({ ...s, repo: null }))}
      afterOpenChange={(open) => {
        if (!open) setRetained(null);
      }}
      size={640}
      className="repository-drawer"
      footer={
        activeItem ? (
          <div className="drawer-footer-actions">
            <div className="drawer-primary-actions">
              <RepositoryActions
                item={activeItem}
                state={state}
                update={update}
                toggleCompare={toggleCompare}
                t={t}
                labels
                context="detail"
              />
              <Button data-testid="share-peer-btn" onClick={sharePeerCard}>
                {state.lang === "zh" ? "分享给同门" : "Share pick"}
              </Button>
              <Button
                icon={<ExportOutlined aria-hidden="true" />}
                href={safeExternalUrl(activeItem.url) || undefined}
                target="_blank"
                rel="noreferrer"
              >
                {t("drOpenRepo")}
              </Button>
              <details className="drawer-more-actions">
                <summary aria-label={t("moreActions")}>···</summary>
                <div className="drawer-action-menu">
                  {safeExternalUrl(activeItem.homepage) && (
                    <a
                      href={safeExternalUrl(activeItem.homepage)}
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
      {activeItem && (
        <DeferredFeature
          t={t}
          loadingFallback={<OverlaySkeleton kind="drawer" lang={state.lang} />}
        >
          <RepositoryDrawerBody
            item={activeItem}
            items={items}
            allItems={allItems}
            state={state}
            update={update}
            onQuickCompare={onQuickCompare}
            onOpenGuide={onOpenGuide}
            t={t}
            fmt={fmt}
          />
        </DeferredFeature>
      )}
    </Drawer>
  );
}
