import React, { useState } from "react";
import { Button } from "antd";
import { CheckOutlined, CopyOutlined, RobotOutlined } from "@ant-design/icons";
import { installationFor } from "../practical";
import {
  aiInstallPromptFor,
  classifyInstallLocation,
  deriveSetupThresholds,
  usagePromptFor,
  webChatPromptFor,
} from "../usageGuide";
import { safeExternalUrl } from "../domain";
import { PlatformTags, InstallationActions } from "./PracticalInfo";
import { useFeedback } from "./FeedbackProvider";
import { copyText } from "../clipboard";

// 将提示词中的【占位符】或 [placeholder] 高亮，方便学生一眼看出替换位置
function renderPromptWithPlaceholders(text) {
  const parts = String(text || "").split(/(【[^】]+】|\[[^\]]+\])/g);
  return parts.map((part, index) =>
    /^(?:【[^】]+】|\[[^\]]+\])$/.test(part) ? (
      <mark key={index} className="prompt-placeholder">
        {part}
      </mark>
    ) : (
      <React.Fragment key={index}>{part}</React.Fragment>
    ),
  );
}

export function SkillUsageGuide({
  item,
  lang,
  t,
  detailsInfo = {},
  onOpenGuide,
}) {
  const zh = lang === "zh";
  const message = useFeedback();
  const [copiedKey, setCopiedKey] = useState("");
  const installation = installationFor(item);
  const location = classifyInstallLocation(installation, lang);
  const aiInstallPrompt = aiInstallPromptFor(item, installation, lang);
  const webPrompt = webChatPromptFor(item, lang);
  const thresholds = deriveSetupThresholds(item, installation, detailsInfo, lang);
  const example = usagePromptFor(item, lang);
  const isReference = installation.mode === "reference";
  const repoUrl = safeExternalUrl(item?.url);
  const envText = detailsInfo[`environment_${lang}`];
  const depText = detailsInfo[`dependencies_${lang}`];

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

      {/* 第 1 步：准备 AI Agent 与运行环境 */}
      <div className="usage-step">
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
        </div>
      </div>

      {/* 第 2 步：执行安装（含执行位置标注 + 让 AI 帮你装兜底） */}
      <div className="usage-step">
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
          <div className={`install-location-banner location-${location.kind}`}>
            <span className="install-location-badge">{location.badge}</span>
            <p>{location.hint}</p>
          </div>
          <InstallationActions
            item={item}
            lang={lang}
            t={t}
            details
            hideExtras
          />
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
            >
              <summary>
                <span aria-hidden="true">🌐</span>
                <span>
                  {zh
                    ? "没装命令行工具？在网页版 DeepSeek / Kimi / ChatGPT 直接用"
                    : "No CLI tool installed? Use directly in Web AI chat"}
                </span>
              </summary>
              <div className="ai-install-helper-body">
                <p className="web-ai-steps">
                  {zh
                    ? "1）进入项目 GitHub 仓库打开 SKILL.md（或在 skills/ 目录下选一个子技能 .md 文件）复制内容；2）打开任意网页版 AI，复制下方引导词并粘贴 SKILL.md 即可直接使用："
                    : "1) Open SKILL.md (or a sub-skill .md under skills/) in the GitHub repo and copy its text; 2) Paste it with the wrapper prompt below into any Web AI chat:"}
                </p>
                <p className="usage-prompt-text">{webPrompt}</p>
                <div className="web-ai-actions">
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
                        ? "复制网页版引导词"
                        : "Copy Web AI prompt"}
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
        <div className="usage-step usage-step-highlight">
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
                      example.prompt,
                      zh ? "已复制提示词案例" : "Prompt example copied",
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
                {renderPromptWithPlaceholders(example.prompt)}
              </p>
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
          </div>
        </div>
      )}
    </section>
  );
}
