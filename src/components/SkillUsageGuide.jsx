import React, { useEffect, useRef, useState } from "react";
import { Button } from "antd";
import { CheckOutlined, CopyOutlined, RobotOutlined } from "@ant-design/icons";
import { installationFor } from "../practical";
import {
  aiInstallPromptFor,
  applyPromptPlaceholders,
  classifyInstallLocation,
  deriveSetupThresholds,
  directWebPromptFor,
  drawerSupportHintsFor,
  extractEditablePlaceholders,
  usagePromptFor,
  webChatPromptFor,
} from "../usageGuide";
import { AGENT_PLATFORMS, safeExternalUrl } from "../domain";
import { trackEvent } from "../analytics";
import { PlatformTags } from "./PracticalInfo";
import { InstallationActions } from "./InstallationActions";
import { OutputPreviewCard } from "./OutputPreviewCard";
import { useFeedback } from "./FeedbackProvider";
import { copyText } from "../clipboard";

// 将提示词中的【占位符】或 [placeholder] 高亮；可编辑槽位支持点击聚焦输入框并实时预览替换结果
function renderPromptWithPlaceholders(text, editableSet, slotValues = {}, onFocusToken) {
  const parts = String(text || "").split(/(【[^】]+】|\[[^\]]+\])/g);
  return parts.map((part, index) => {
    if (!/^(?:【[^】]+】|\[[^\]]+\])$/.test(part)) {
      return <React.Fragment key={index}>{part}</React.Fragment>;
    }
    if (editableSet?.has(part) && onFocusToken) {
      const filled = String(slotValues[part] ?? "").trim();
      return (
        <button
          key={index}
          type="button"
          className={`prompt-placeholder is-editable${filled ? " is-filled" : ""}`}
          onClick={() => onFocusToken(part)}
          title={filled ? part : undefined}
        >
          {filled || part}
        </button>
      );
    }
    return (
      <mark key={index} className="prompt-placeholder">
        {part}
      </mark>
    );
  });
}

export function SkillUsageGuide({
  item,
  lang,
  t,
  preferredAgent = "all",
  preferWebReady = false,
  detailsInfo = {},
  onOpenGuide,
}) {
  const zh = lang === "zh";
  const message = useFeedback();
  const [copiedKey, setCopiedKey] = useState("");
  const [slotValues, setSlotValues] = useState({});
  const slotInputRefs = useRef({});
  useEffect(() => {
    setSlotValues({});
  }, [item?.repo, lang]);

  const installation = installationFor(item);
  const location = classifyInstallLocation(installation, lang);
  const aiInstallPrompt = aiInstallPromptFor(item, installation, lang);
  const directWebPrompt = directWebPromptFor(item, lang);
  const webPrompt = webChatPromptFor(item, lang);
  const thresholds = deriveSetupThresholds(item, installation, detailsInfo, lang);
  const supportHints = drawerSupportHintsFor(item, installation, thresholds);
  const example = usagePromptFor(item, lang);
  const editableSlots = extractEditablePlaceholders(example.prompt, item);
  const editableTokenSet = new Set(editableSlots.map((s) => s.token));
  const filledUsagePrompt = applyPromptPlaceholders(example.prompt, slotValues);
  const hasFilledSlot = editableSlots.some((s) => String(slotValues[s.token] ?? "").trim());
  const isReference = installation.mode === "reference";
  const repoUrl = safeExternalUrl(item?.url);
  const envText = detailsInfo[`environment_${lang}`];
  const depText = detailsInfo[`dependencies_${lang}`];
  const rawCmd = String(installation?.command || "").trim();
  const mirrorCmd =
    /^(?:npx|npm)\s+/i.test(rawCmd) && !/--registry/i.test(rawCmd)
      ? rawCmd.replace(/^(npx|npm)\s+/i, "$1 --registry=https://registry.npmmirror.com ")
      : /^(?:pip3?|uv\s+pip)\s+install\s+/i.test(rawCmd) && !/(?:\s-i\s|--index-url)/i.test(rawCmd)
        ? `${rawCmd} -i https://pypi.tuna.tsinghua.edu.cn/simple`
        : "";

  const handleCopy = async (key, text, successMsg) => {
    try {
      await copyText(text);
      setCopiedKey(key);
      message.success(successMsg);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? "" : current));
      }, 2000);
    } catch {
      message.error(t("copyFailed"));
    }
  };

  return (
    <section
      className="usage-guide-flow"
      data-testid="skill-usage-guide"
      aria-label={zh ? "快速上手指南" : "Quick start guide"}
    >
      {/* 第 1 步：准备 AI Agent 与运行环境 */}
      <div className="usage-step drawer-module-card">
        <div className="usage-step-header">
          <span className="usage-step-num" aria-hidden="true">
            1
          </span>
          <h3>{zh ? "准备 AI Agent 与环境" : "Prepare AI Agent & environment"}</h3>
          {onOpenGuide && (
            <button
              type="button"
              className="usage-guide-link"
              onClick={onOpenGuide}
            >
              {zh ? "没用过 AI Agent？30 秒看懂 ›" : "New to AI Agents? 30s guide ›"}
            </button>
          )}
        </div>
        <div className="usage-step-body">
          {thresholds.length > 0 && (
            <div
              className="setup-threshold-strip"
              data-testid="setup-thresholds"
              aria-label={zh ? "环境与使用门槛提示" : "Setup threshold hints"}
            >
              {thresholds.map((badge) => (
                <span
                  key={badge.id}
                  className={`threshold-pill threshold-${badge.tone}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
          {preferredAgent && preferredAgent !== "all" && (
            <div className="preferred-agent-banner" data-testid="preferred-agent-banner">
              <span>
                {zh
                  ? `✓ 已匹配你当前筛选的「${AGENT_PLATFORMS.find((a) => a.id === preferredAgent)?.label || preferredAgent}」环境`
                  : `✓ Matched to your selected "${AGENT_PLATFORMS.find((a) => a.id === preferredAgent)?.label || preferredAgent}" environment`}
              </span>
            </div>
          )}
          <div className="drawer-platforms">
            <span>{t("drAgent")}</span>
            <PlatformTags item={item} t={t} />
          </div>
          {(envText || depText) && (
            <div className="usage-prereq-box">
              {envText && (
                <p>
                  <strong>{zh ? "运行环境：" : "Environment: "}</strong>
                  {envText}
                </p>
              )}
              {depText && (
                <p>
                  <strong>{zh ? "前置依赖：" : "Dependencies: "}</strong>
                  {depText}
                </p>
              )}
            </div>
          )}
          {supportHints.needsAgentAccess && (
            <p className="usage-support-tip" data-testid="drawer-recharge-tip">
              <span aria-hidden="true">💡</span>
              <span>
                {zh
                  ? "还没有 ChatGPT / Claude / Gemini / Codex 额度或海外卡？可查看 "
                  : "Need GPT / Claude / Gemini / Codex access or an invoice? See "}
                <a
                  href="https://catfk.com/shop/1991"
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  onClick={() =>
                    trackEvent("click_recharge", {
                      slot: "drawer_setup",
                      repo: item?.repo,
                    })
                  }
                >
                  {zh
                    ? "本站自营正规代充（支持开发票报销）↗"
                    : "official top-up (invoices available) ↗"}
                </a>
              </span>
            </p>
          )}
        </div>
      </div>

      {/* 第 2 步：执行安装（含执行位置标注 + 让 AI 帮你装兜底） */}
      <div className="usage-step drawer-module-card">
        <div className="usage-step-header">
          <span className="usage-step-num" aria-hidden="true">
            2
          </span>
          <h3>
            {isReference
              ? zh
                ? "查阅官方资料"
                : "Browse official resource"
              : zh
                ? "安装到你的 AI Agent"
                : "Install into your AI Agent"}
          </h3>
        </div>
        <div className="usage-step-body">
          {installation.command ? (
            <div className={`install-location-banner location-${location.kind}`}>
              <span className="install-location-badge">{location.badge}</span>
              <p>{location.hint}</p>
            </div>
          ) : (
            <p className="install-doc-concise">
              {zh
                ? "暂未提炼单行命令，可查阅官方说明或复制下方提示词让 AI 自动安装："
                : "No single-line command yet—check official docs or let AI install it below:"}
            </p>
          )}
          <InstallationActions
            item={item}
            lang={lang}
            t={t}
            details
            hideExtras
          />
          {mirrorCmd && (
            <div className="campus-mirror-tip" data-testid="campus-mirror-tip">
              <span>
                {zh
                  ? "⚡ 校园网终端下载慢？可用国内镜像源一键安装："
                  : "⚡ Slow network? Copy mirror-accelerated command:"}
              </span>
              <button
                type="button"
                className="campus-mirror-copy"
                onClick={() =>
                  handleCopy(
                    "mirror-cmd",
                    mirrorCmd,
                    zh ? "已复制国内镜像源加速命令" : "Mirror command copied",
                  )
                }
              >
                {copiedKey === "mirror-cmd"
                  ? zh
                    ? "✓ 已复制加速命令"
                    : "✓ Copied"
                  : zh
                    ? "复制国内源加速命令"
                    : "Copy mirror command"}
              </button>
            </div>
          )}
          {!isReference && (
            <details className="ai-install-helper">
              <summary>
                <RobotOutlined aria-hidden="true" />
                <span>
                  {zh
                    ? "不会敲命令或想省事？复制一句话让 AI 帮你装"
                    : "Skip manual setup? Copy a prompt so AI installs it for you"}
                </span>
              </summary>
              <div className="ai-install-helper-body">
                <p className="usage-prompt-text">{aiInstallPrompt}</p>
                <Button
                  size="small"
                  icon={
                    copiedKey === "ai-install" ? (
                      <CheckOutlined aria-hidden="true" />
                    ) : (
                      <CopyOutlined aria-hidden="true" />
                    )
                  }
                  data-copy-ai-install={item.repo}
                  onClick={() =>
                    handleCopy(
                      "ai-install",
                      aiInstallPrompt,
                      zh
                        ? "已复制“让 AI 帮你装”提示词"
                        : "AI-assisted install prompt copied",
                    )
                  }
                >
                  {copiedKey === "ai-install"
                    ? zh
                      ? "已复制，直接粘贴给 AI 即可"
                      : "Copied—paste into your AI Agent"
                    : zh
                      ? "复制让 AI 帮你装"
                      : "Copy AI install prompt"}
                </Button>
              </div>
            </details>
          )}
          {!isReference && item.repository_kind === "skill" && (
            <details
              className="ai-install-helper web-ai-helper"
              data-testid="web-ai-helper"
              open={preferWebReady || undefined}
            >
              <summary>
                <span aria-hidden="true">🌐</span>
                <span>
                  {zh
                    ? "没装命令行或打不开 GitHub？网页版 DeepSeek / Kimi / ChatGPT 直接用"
                    : "No CLI or GitHub blocked? Use directly in Web AI chat"}
                </span>
              </summary>
              <div className="ai-install-helper-body">
                <p className="web-ai-steps">
                  {zh
                    ? "⚡ 免进 GitHub 极速用法（校园网推荐）：直接复制下方提炼好的完整科研规范指令，粘贴进 DeepSeek / Kimi / Claude / Gemini 即可开用："
                    : "⚡ Zero-GitHub instant mode: copy the complete structured research prompt below and paste it straight into any Web AI chat:"}
                </p>
                <p className="usage-prompt-text">
                  {renderPromptWithPlaceholders(directWebPrompt)}
                </p>
                <div className="web-ai-actions">
                  <Button
                    size="small"
                    className="web-ai-primary-btn"
                    icon={
                      copiedKey === "direct-web" ? (
                        <CheckOutlined aria-hidden="true" />
                      ) : (
                        <CopyOutlined aria-hidden="true" />
                      )
                    }
                    data-testid="copy-direct-web-prompt"
                    onClick={() => {
                      trackEvent("copy_direct_web_prompt", { repo: item?.repo });
                      handleCopy(
                        "direct-web",
                        directWebPrompt,
                        zh
                          ? "已复制免 GitHub 完整网页版指令"
                          : "Complete Web AI prompt copied",
                      );
                    }}
                  >
                    {copiedKey === "direct-web"
                      ? zh
                        ? "已复制，去网页版 AI 粘贴即可"
                        : "Copied—paste into Web AI"
                      : zh
                        ? "一键复制完整指令（免开 GitHub）"
                        : "Copy complete prompt (no GitHub needed)"}
                  </Button>
                  <Button
                    size="small"
                    icon={
                      copiedKey === "web-ai" ? (
                        <CheckOutlined aria-hidden="true" />
                      ) : (
                        <CopyOutlined aria-hidden="true" />
                      )
                    }
                    data-testid="copy-web-ai-prompt"
                    onClick={() =>
                      handleCopy(
                        "web-ai",
                        webPrompt,
                        zh
                          ? "已复制网页版 AI 引导词"
                          : "Web AI wrapper prompt copied",
                      )
                    }
                  >
                    {copiedKey === "web-ai"
                      ? zh
                        ? "已复制引导词"
                        : "Copied"
                      : zh
                        ? "复制 SKILL.md 拼接引导词"
                        : "Copy SKILL.md wrapper"}
                  </Button>
                  {repoUrl && (
                    <a
                      className="web-ai-repo-link"
                      href={repoUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {zh ? "去仓库找 SKILL.md ↗" : "Find SKILL.md in repo ↗"}
                    </a>
                  )}
                </div>
              </div>
            </details>
          )}
        </div>
      </div>

      {/* 第 3 步：装完怎么用（直接可抄的提示词案例） */}
      {!isReference && (
        <div className="usage-step usage-step-highlight drawer-module-card">
          <div className="usage-step-header">
            <span className="usage-step-num" aria-hidden="true">
              3
            </span>
            <h3>
              {zh
                ? "装完怎么用：提示词案例"
                : "How to use: Prompt example"}
            </h3>
            <span className="usage-scenario-tag">{example.scenario}</span>
          </div>
          <div className="usage-step-body">
            <p className="usage-how-intro">
              {zh
                ? "打开你的 AI Agent 并进入论文或实验数据目录，直接发送下面这段话（把高亮【】替换成你的文件名或课题）："
                : "Open your AI Agent in your paper or data folder and send the prompt below (replace highlighted [brackets] with your own files or topic):"}
            </p>
            <div
              className="usage-prompt-card"
              data-testid="usage-prompt-example"
            >
              <div className="usage-prompt-card-top">
                <span className="usage-prompt-kind">
                  {example.isCurated
                    ? zh
                      ? "✨ 本项目实战示例"
                      : "✨ Tailored example"
                    : zh
                      ? "📝 科研场景示范模板"
                      : "📝 Research prompt template"}
                </span>
                <Button
                  size="small"
                  className="usage-copy-prompt-btn"
                  icon={
                    copiedKey === "usage-prompt" ? (
                      <CheckOutlined aria-hidden="true" />
                    ) : (
                      <CopyOutlined aria-hidden="true" />
                    )
                  }
                  data-copy-prompt={item.repo}
                  onClick={() =>
                    handleCopy(
                      "usage-prompt",
                      filledUsagePrompt,
                      hasFilledSlot
                        ? zh
                          ? "已复制替换后的专属提示词"
                          : "Customized prompt copied"
                        : zh
                          ? "已复制提示词案例"
                          : "Prompt example copied",
                    )
                  }
                >
                  {copiedKey === "usage-prompt"
                    ? zh
                      ? "已复制"
                      : "Copied"
                    : zh
                      ? "复制提示词"
                      : "Copy prompt"}
                </Button>
              </div>
              <p className="usage-prompt-text">
                {renderPromptWithPlaceholders(
                  example.prompt,
                  editableTokenSet,
                  slotValues,
                  (tok) => slotInputRefs.current[tok]?.focus(),
                )}
              </p>
              {editableSlots.length > 0 && (
                <div className="usage-prompt-slots" data-testid="usage-prompt-slots">
                  <span className="usage-prompt-slots-label">
                    {zh ? "✏️ 填入自动替换：" : "✏️ Fill to replace:"}
                  </span>
                  {editableSlots.map((slot) => (
                    <input
                      key={slot.token}
                      ref={(el) => {
                        slotInputRefs.current[slot.token] = el;
                      }}
                      type="text"
                      className="prompt-slot-input"
                      data-testid="prompt-slot-input"
                      maxLength={100}
                      value={slotValues[slot.token] || ""}
                      placeholder={slot.inner}
                      aria-label={slot.inner}
                      onChange={(e) =>
                        setSlotValues((prev) => ({
                          ...prev,
                          [slot.token]: e.target.value,
                        }))
                      }
                    />
                  ))}
                  {hasFilledSlot && (
                    <button
                      type="button"
                      className="prompt-slot-reset"
                      onClick={() => setSlotValues({})}
                    >
                      {zh ? "清空" : "Reset"}
                    </button>
                  )}
                </div>
              )}
              <div className="usage-prompt-output">
                <strong>{zh ? "预期产出：" : "Expected output: "}</strong>
                <span>{example.output}</span>
              </div>
            </div>
            <p className="usage-verify-tip">
              {zh
                ? "提示：首次使用建议先拿一小份公开示例材料试跑；AI 生成的文献引用、统计数值与代码结果请务必自行核验。"
                : "Tip: Test on a small public sample first, and always verify generated citations, statistics, and code."}
            </p>
            {supportHints.isPaperWritingFlow && (
              <div className="usage-zhi1ke-tip" data-testid="drawer-zhi1ke-tip">
                <span aria-hidden="true">✨</span>
                <span>
                  {zh
                    ? "赶时间不想自己折腾环境？可用合作工作台 "
                    : "Short on time? Try partner studio "}
                  <a
                    href="https://zhi1ke.com?pic=6PEB"
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    onClick={() =>
                      trackEvent("click_zhi1ke", {
                        slot: "drawer_writing",
                        repo: item?.repo,
                      })
                    }
                  >
                    {zh
                      ? "智一刻 AI 一键生成开题与论文初稿（免费无限改稿 · 不达标直接退）↗"
                      : "Zhi1ke AI for instant outlines & first drafts (free unlimited revisions) ↗"}
                  </a>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <OutputPreviewCard item={item} lang={lang} />
    </section>
  );
}
