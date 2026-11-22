import requirements from "../../config/installation-details.json" with { type: "json" };
import React, { useEffect, useRef, useState } from "react";
import paths from "../../config/research-paths.json" with { type: "json" };
import { installationFor } from "../practical";
import { detectAgents, AGENT_PLATFORMS } from "../domain";
import { copyText } from "../clipboard";
import { useFeedback } from "./FeedbackProvider";
import { classifyInstallLocation, usagePromptFor } from "../usageGuide";

export default function BeginnerGuide({
  initialSection = "basics",
  lang,
  items,
  onClose,
  onOpenRepo,
}) {
  const zh = lang === "zh";
  const [section, setSection] = useState(initialSection);
  const [activePath, setActivePath] = useState("all");
  const [copiedKey, setCopiedKey] = useState("");
  const [failedKey, setFailedKey] = useState("");
  const timerRef = useRef(null);
  const scrollBodyRef = useRef(null);
  const message = useFeedback();

  useEffect(() => () => clearTimeout(timerRef.current), []);

  // 切换 Tab 时将内容滚动区回到顶部
  const switchSection = (next) => {
    setSection(next);
    if (scrollBodyRef.current) scrollBodyRef.current.scrollTop = 0;
  };

  const close = onClose;
  const byRepo = new Map(items.map((i) => [i.repo, i]));

  const handleCopy = async (key, text, successLabel) => {
    try {
      await copyText(text);
      setFailedKey("");
      setCopiedKey(key);
      message.success(successLabel);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopiedKey(""), 2000);
    } catch {
      setFailedKey(key);
      message.error(
        zh ? "复制失败，请手动选择文本" : "Copy failed; please select manually",
      );
    }
  };

  const visiblePaths =
    activePath === "all"
      ? paths
      : paths.filter((path) => path.id === activePath);

  return (
    <div className="guide-shell">
      <div className="guide-tabs">
        <button
          type="button"
          aria-pressed={section === "basics"}
          onClick={() => switchSection("basics")}
        >
          {zh ? "30 秒看懂 Skill" : "Skills in 30 seconds"}
        </button>
        <button
          type="button"
          aria-pressed={section === "paths"}
          onClick={() => switchSection("paths")}
        >
          {zh ? "专业科研路径" : "Discipline research paths"}
        </button>
      </div>

      <div ref={scrollBodyRef} className="guide-scroll-body">
        {section === "basics" ? (
          <section className="guide-basics">
            <h3>{zh ? "Skill 是什么？" : "What is a Skill?"}</h3>
            <p>
              {zh
                ? "可以把它理解为给 AI Agent（如 Claude Code、Cursor、Codex、Antigravity 等能读本地文件、运行命令的 AI 工具）的一份“专业任务说明书”：提前写好了科研步骤、格式规范与工具调用规则。装好之后，你只需要用自然语言下达需求，它就会按规范帮你完成文献调研、论文润色、科研绘图或数据分析。"
                : "A Skill is a reusable set of task instructions for an AI Agent (local AI tools like Claude Code, Cursor, Codex, or Antigravity that can read files and run commands). Once installed, you simply ask in plain language."}
            </p>
            <div
              className="guide-flow-cards"
              aria-label={zh ? "3 步上手流程" : "3-step quick start"}
            >
              <div className="guide-flow-card">
                <span className="guide-flow-step">STEP 1</span>
                <strong>{zh ? "选一个 AI Agent" : "Pick one AI Agent"}</strong>
                <p>
                  {zh
                    ? "如 Claude Code、Cursor、Codex、Antigravity 或 Gemini CLI，只需装其中一个即可，不必全部安装。"
                    : "Choose one compatible AI Agent such as Claude Code, Cursor, Codex, Antigravity, or Gemini CLI."}
                </p>
              </div>
              <div className="guide-flow-card">
                <span className="guide-flow-step">STEP 2</span>
                <strong>
                  {zh ? "安装科研 Skill" : "Install a research Skill"}
                </strong>
                <p>
                  {zh
                    ? "点开任意卡片查看命令是在电脑终端还是 AI Agent 对话框输入；不熟命令行可直接复制“让 AI 帮你装”提示词。"
                    : "Open any card to see whether to run the command in your terminal or AI Agent chat—or copy the AI-assisted setup prompt."}
                </p>
              </div>
              <div className="guide-flow-card">
                <span className="guide-flow-step">STEP 3</span>
                <strong>
                  {zh ? "在论文目录发第一句话" : "Send your first prompt"}
                </strong>
                <p>
                  {zh
                    ? "进入你的论文或实验数据文件夹，直接复制详情页里的“提示词案例”，把【】替换成你的文件或课题即可。"
                    : "Open your paper or data folder, copy the prompt example from the detail drawer, and swap in your file or topic."}
                </p>
              </div>
            </div>
            <div className="guide-web-fallback" data-testid="guide-web-fallback">
              <strong>
                {zh
                  ? "💡 没装命令行工具 / 没有海外账号？网页版 AI 照样直接用！"
                  : "💡 No CLI tool installed yet? Use Skills in any Web AI chat!"}
              </strong>
              <p>
                {zh
                  ? "许多文献综述、论文润色、审稿回复类 Skill 的核心就是一份开源的 SKILL.md 规范文档。即使你只用网页版 DeepSeek、Kimi、豆包、Claude 或 ChatGPT，只需点开卡片详情中的“在网页版 AI 直接用”，把仓库里的 SKILL.md 复制粘贴进对话框，就能立即获得同款学术规范效果。"
                  : "Many writing, literature review, and peer-review Skills are plain Markdown rulebooks (SKILL.md). Even without a CLI agent, open 'Use directly in Web AI chat' inside any Skill drawer, paste SKILL.md into Claude, ChatGPT, or DeepSeek web chat, and start right away."}
              </p>
            </div>
            <div className="guide-demo-box">
              <div className="guide-demo-title">
                {zh
                  ? "真实使用效果示例（以科研绘图 Skill 为例）"
                  : "Real usage example (scientific plotting Skill)"}
              </div>
              <div className="guide-demo-msg guide-demo-user">
                <span>{zh ? "你发送：" : "You ask:"}</span>
                <p>
                  {zh
                    ? "“请使用 scientific-figure-making 技能，将当前目录的 metrics.csv 画成双栏分组柱状图（含误差棒），输出 Python 代码并导出 300 DPI PDF。”"
                    : "“Use scientific-figure-making to plot metrics.csv as a double-column grouped bar chart with error bars and export Python code + 300 DPI PDF.”"}
                </p>
              </div>
              <div className="guide-demo-msg guide-demo-ai">
                <span>{zh ? "AI 自动完成：" : "AI delivers:"}</span>
                <p>
                  {zh
                    ? "自动按顶刊字号与色盲友好配色编写脚本 → 本地运行生成高清矢量 PDF → 附上可修改的参数说明。"
                    : "Follows journal typography & colorblind-safe styling → runs the script locally → outputs vector PDF plus editable parameters."}
                </p>
              </div>
            </div>
            <h3>
              {zh ? "先准备哪些工具与注意事项？" : "What to prepare & 3 things to know"}
            </h3>
            <ul>
              <li>
                {zh
                  ? "环境与依赖：部分技能还依赖 Node.js、Python、uv 或外部 API，详情页第 1 步会直接列出已核对要求。"
                  : "Prerequisites: some skills also need Node.js, Python, uv, or API keys—checked requirements appear in Step 1 of the drawer."}
              </li>
              <li>
                {zh
                  ? "费用透明：开源 Skill 本身免费，但背后的大模型订阅、API 或外部服务可能单独收费。"
                  : "Costs: open-source Skills are free, while underlying LLM subscriptions, APIs, or external services may charge separately."}
              </li>
              <li>
                {zh
                  ? "学术严谨：先用公开小材料试跑，AI 生成的文献引用、统计数值与图表务必人工核验后再用于正式论文。"
                  : "Verify outputs: test on a small sample first and always verify generated citations, statistics, and figures."}
              </li>
            </ul>
            <button
              type="button"
              className="guide-primary"
              onClick={() => switchSection("paths")}
            >
              {zh ? "按专业看看怎么用 →" : "Explore research paths →"}
            </button>
          </section>
        ) : (
          <section className="guide-paths">
            <p className="guide-paths-intro">
              {zh
                ? "按你的专业和当前科研阶段挑选步骤，不必全部安装。点击项目可打开详情查看完整 3 步上手指南；核对文档不代表已在你的设备上实测。"
                : "Pick only the steps you need for your discipline and stage. Click any Skill to open its full 3-step guide; documentation review is not a test on your device."}
            </p>
            <div
              className="path-filter-bar"
              role="group"
              aria-label={zh ? "按专业筛选路径" : "Filter paths by discipline"}
            >
              <button
                type="button"
                className="path-filter-chip"
                aria-pressed={activePath === "all"}
                onClick={() => setActivePath("all")}
              >
                {zh ? `全部路径 (${paths.length})` : `All paths (${paths.length})`}
              </button>
              {paths.map((path) => (
                <button
                  key={path.id}
                  type="button"
                  className="path-filter-chip"
                  aria-pressed={activePath === path.id}
                  onClick={() => setActivePath(path.id)}
                >
                  {path[`title_${lang}`]}
                </button>
              ))}
            </div>
            <div
              className={`research-path-grid${visiblePaths.length === 1 ? " is-single" : ""}`}
            >
              {visiblePaths.map((path) => {
                const steps = path.steps.filter((step) => byRepo.has(step.repo));
                return (
                  <article key={path.id} data-research-path={path.id}>
                    <header className="path-card-header">
                      <div>
                        <h3>{path[`title_${lang}`]}</h3>
                        <span className="path-audience-pill">
                          {path[`audience_${lang}`]}
                        </span>
                      </div>
                      <span className="path-step-badge">
                        {zh ? `${steps.length} 步` : `${steps.length} steps`}
                      </span>
                    </header>
                    <ol className="path-stepper">
                      {steps.map((step, stepIndex) => {
                        const item = byRepo.get(step.repo);
                        const installation = installationFor(item);
                        const location = classifyInstallLocation(
                          installation,
                          lang,
                        );
                        const example = usagePromptFor(item, lang);
                        const platforms = [
                          ...new Set([
                            ...detectAgents(item).map(
                              (id) =>
                                AGENT_PLATFORMS.find((a) => a.id === id)
                                  ?.label || id,
                            ),
                            ...(item.documented_platform_names || []),
                          ]),
                        ];
                        const cmdKey = `${path.id}-${step.repo}-cmd`;
                        const promptKey = `${path.id}-${step.repo}-prompt`;
                        const [owner, name] = item.repo.split("/");
                        return (
                          <li key={step.repo} className="path-step-item">
                            <span
                              className="path-step-dot"
                              aria-hidden="true"
                            >
                              {stepIndex + 1}
                            </span>
                            <div className="path-step-content">
                              <strong className="path-step-task">
                                {step[`task_${lang}`]}
                              </strong>
                              <button
                                type="button"
                                className="guide-project"
                                onClick={() => {
                                  close();
                                  onOpenRepo(item.repo);
                                }}
                              >
                                <span className="guide-project-meta">
                                  <span className="guide-project-name">
                                    {name || item.repo}
                                  </span>
                                  {owner && (
                                    <span className="guide-project-owner">
                                      {owner}
                                    </span>
                                  )}
                                </span>
                                <span className="guide-project-cta">
                                  {zh ? "查看上手指南 ↗" : "Guide ↗"}
                                </span>
                              </button>
                              <details className="path-step-details">
                                <summary>
                                  {zh
                                    ? "展开安装命令与提示词案例"
                                    : "Install command & prompt example"}
                                </summary>
                                <div className="path-step-details-body">
                                  <p>
                                    <strong>
                                      {zh ? "适用 AI Agent：" : "AI Agent: "}
                                    </strong>
                                    {platforms.join(" / ") ||
                                      (zh ? "见项目说明" : "See project docs")}
                                  </p>
                                  <p className="path-location-line">
                                    <span>{location.badge}</span>
                                  </p>
                                  {installation[`context_${lang}`] && (
                                    <p>{installation[`context_${lang}`]}</p>
                                  )}
                                  <p>
                                    <strong>
                                      {zh ? "环境：" : "Environment: "}
                                    </strong>
                                    {requirements[item.repo]?.[
                                      `environment_${lang}`
                                    ] ||
                                      (zh
                                        ? "见官方说明"
                                        : "See official documentation")}
                                  </p>
                                  <p>
                                    <strong>
                                      {zh ? "依赖：" : "Dependencies: "}
                                    </strong>
                                    {requirements[item.repo]?.[
                                      `dependencies_${lang}`
                                    ] ||
                                      (zh
                                        ? "见官方说明"
                                        : "See official documentation")}
                                  </p>
                                  {installation.command && (
                                    <div className="path-command-box">
                                      <pre>{installation.command}</pre>
                                      <button
                                        type="button"
                                        className="path-action-btn"
                                        onClick={() =>
                                          handleCopy(
                                            cmdKey,
                                            installation.command,
                                            zh
                                              ? "已复制安装命令"
                                              : "Install command copied",
                                          )
                                        }
                                      >
                                        {copiedKey === cmdKey
                                          ? zh
                                            ? "已复制命令"
                                            : "Copied"
                                          : zh
                                            ? "复制安装命令"
                                            : "Copy command"}
                                      </button>
                                    </div>
                                  )}
                                  <div className="path-prompt-box">
                                    <div className="path-prompt-heading">
                                      <span>
                                        {zh
                                          ? "✨ 本步提示词案例"
                                          : "✨ Prompt example"}
                                      </span>
                                      <button
                                        type="button"
                                        className="path-action-btn"
                                        onClick={() =>
                                          handleCopy(
                                            promptKey,
                                            example.prompt,
                                            zh
                                              ? "已复制提示词案例"
                                              : "Prompt copied",
                                          )
                                        }
                                      >
                                        {copiedKey === promptKey
                                          ? zh
                                            ? "已复制提示词"
                                            : "Copied"
                                          : zh
                                            ? "复制提示词"
                                            : "Copy prompt"}
                                      </button>
                                    </div>
                                    <p className="path-prompt-quote">
                                      {example.prompt}
                                    </p>
                                  </div>
                                  <div className="path-step-links">
                                    <a
                                      href={installation.source_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {zh
                                        ? "官方安装说明 ↗"
                                        : "Official instructions ↗"}
                                    </a>
                                    {installation.reviewed_at && (
                                      <small>
                                        {zh ? "文档核对：" : "Reviewed: "}
                                        {installation.reviewed_at}
                                      </small>
                                    )}
                                  </div>
                                  {(failedKey === cmdKey ||
                                    failedKey === promptKey) && (
                                    <p role="status">
                                      {zh
                                        ? "复制失败，请手动选择复制。"
                                        : "Copy failed; please select manually."}
                                    </p>
                                  )}
                                </div>
                              </details>
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
