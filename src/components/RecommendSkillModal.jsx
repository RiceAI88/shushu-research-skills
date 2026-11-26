import React, { useMemo, useState } from "react";
import { Modal } from "antd";
import { DISCIPLINES } from "../disciplines.js";
import { parseGitHubRepoInput } from "../domain.js";
import { DEFAULT_BOT_API } from "../assistantEngine.js";
import { trackEvent } from "../analytics.js";

const REPOSITORY_ISSUES_URL =
  "https://github.com/RiceAI88/shushu-research-skills/issues/new";

/**
 * 免登录站内推荐开源科研 Skill 弹窗（支持已收录秒查、免翻墙一键提交与预填 GitHub Issue 双通道）
 */
export default function RecommendSkillModal({
  open,
  onClose,
  items = [],
  lang = "zh",
  onOpenRepo,
  onOpenCommunity,
}) {
  const zh = lang !== "en";
  const [repoInput, setRepoInput] = useState("");
  const [discipline, setDiscipline] = useState("all");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedRepo, setSubmittedRepo] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const parsedSlug = useMemo(() => parseGitHubRepoInput(repoInput), [repoInput]);
  const existingItem = useMemo(() => {
    if (!parsedSlug) return null;
    const target = parsedSlug.toLowerCase();
    return items.find((it) => String(it.repo || "").toLowerCase() === target) || null;
  }, [items, parsedSlug]);

  const resetAndClose = () => {
    setErrorMsg("");
    setSubmittedRepo("");
    onClose?.();
  };

  const buildIssueUrl = (slug) => {
    const target = slug || parsedSlug || "";
    const discObj = DISCIPLINES.find((d) => d.id === discipline);
    const discLabel = discObj ? discObj.zh : "跨专业通用";
    const params = new URLSearchParams({
      template: "recommend-repo.yml",
      title: target ? `[Recommend] ${target}` : "[Recommend] 推荐科研 Skill",
      body: [
        `### GitHub 仓库地址`,
        target ? `https://github.com/${target}` : "",
        "",
        `### 适用学科`,
        discLabel,
        "",
        `### 一句话推荐理由`,
        reason.trim() || "科研实用开源 Skill",
      ].join("\n"),
    });
    return `${REPOSITORY_ISSUES_URL}?${params.toString()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!parsedSlug) {
      setErrorMsg(
        zh
          ? "请输入有效的 GitHub 仓库链接或 owner/repo（例如 K-Dense-AI/scientific-agent-skills）"
          : "Please enter a valid GitHub URL or owner/repo slug.",
      );
      return;
    }
    setErrorMsg("");
    setSubmitting(true);
    trackEvent("submit_skill", { repo: parsedSlug, discipline });

    try {
      const baseApi =
        (typeof window !== "undefined" && window.__ARS_BOT_API) || DEFAULT_BOT_API;
      const endpoint = baseApi.replace(/\/api\/chat\/?$/, "/api/recommend");
      if (endpoint && endpoint !== "local-only") {
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify({
            repo: parsedSlug,
            discipline,
            reason: reason.trim().slice(0, 240),
          }),
        }).catch(() => {});
      }
      try {
        const key = "ars-submitted-skills";
        const prev = JSON.parse(window.localStorage?.getItem(key) || "[]");
        const next = [
          { repo: parsedSlug, discipline, at: new Date().toISOString().slice(0, 10) },
          ...(Array.isArray(prev) ? prev.filter((x) => x?.repo !== parsedSlug) : []),
        ].slice(0, 20);
        window.localStorage?.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore storage restrictions */
      }
      setSubmittedRepo(parsedSlug);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={resetAndClose}
      footer={null}
      centered
      width={480}
      title={zh ? "推荐开源科研 Skill" : "Suggest a Research Skill"}
      destroyOnHidden
    >
      {submittedRepo ? (
        <div className="recommend-skill-done" data-testid="recommend-skill-done">
          <p className="recommend-done-badge">
            {zh ? "✅ 已收到你的推荐！" : "✅ Submission received!"}
          </p>
          <p className="recommend-done-desc">
            {zh ? (
              <>
                已记录仓库 <strong>{submittedRepo}</strong>，每日自动巡检流水线将核验其{" "}
                <code>SKILL.md</code> 与维护状态后纳入榜单。
              </>
            ) : (
              <>
                Recorded <strong>{submittedRepo}</strong> for automated verification and indexing.
              </>
            )}
          </p>
          <div className="recommend-done-actions">
            {onOpenCommunity && (
              <button
                type="button"
                className="recommend-btn-primary"
                onClick={() => {
                  resetAndClose();
                  onOpenCommunity("recommend_modal");
                }}
              >
                {zh ? "💬 扫码进交流群看收录进度" : "💬 Join community for updates"}
              </button>
            )}
            <a
              className="recommend-btn-ghost"
              href={buildIssueUrl(submittedRepo)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {zh ? "同步到 GitHub Issue（选填）↗" : "Also open GitHub Issue ↗"}
            </a>
          </div>
        </div>
      ) : (
        <form
          className="recommend-skill-form"
          data-testid="recommend-skill-modal"
          onSubmit={handleSubmit}
        >
          <p className="recommend-form-hint">
            {zh
              ? "无需登录 GitHub 即可直接提交；站内每日巡检会自动核验仓库质量与安装方式。"
              : "No GitHub login required. Submissions are verified by our daily pipeline."}
          </p>

          <label className="recommend-field">
            <span>{zh ? "GitHub 仓库链接或名称 *" : "GitHub URL or owner/repo *"}</span>
            <input
              type="text"
              value={repoInput}
              data-testid="recommend-repo-input"
              placeholder="https://github.com/owner/repo 或 owner/repo"
              onChange={(e) => {
                setRepoInput(e.target.value);
                if (errorMsg) setErrorMsg("");
              }}
              autoFocus
            />
          </label>

          {existingItem && (
            <div className="recommend-existing-alert" data-testid="recommend-existing-hit">
              <span>
                {zh
                  ? `🎉 本站已收录 ${existingItem.repo}（★${Number(existingItem.stars || 0).toLocaleString("en-US")}）！`
                  : `🎉 ${existingItem.repo} is already indexed on site!`}
              </span>
              <button
                type="button"
                onClick={() => {
                  const target = existingItem.repo;
                  resetAndClose();
                  onOpenRepo?.(target);
                }}
              >
                {zh ? "直接查看上手指南 ›" : "Open guide ›"}
              </button>
            </div>
          )}

          <label className="recommend-field">
            <span>{zh ? "最适用的学科方向（选填）" : "Primary discipline (optional)"}</span>
            <select
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
            >
              <option value="all">{zh ? "跨专业通用" : "Cross-disciplinary"}</option>
              {DISCIPLINES.map((d) => (
                <option key={d.id} value={d.id}>
                  {zh ? d.zh : d.en}
                </option>
              ))}
            </select>
          </label>

          <label className="recommend-field">
            <span>{zh ? "一句话推荐理由 / 解决什么痛点（选填）" : "Why is it useful? (optional)"}</span>
            <input
              type="text"
              maxLength={160}
              value={reason}
              placeholder={
                zh
                  ? "例如：零命令行即可把 Zotero 文献批注转成综述初稿…"
                  : "e.g. Converts Zotero annotations into structured literature reviews…"
              }
              onChange={(e) => setReason(e.target.value)}
            />
          </label>

          {errorMsg && <p className="recommend-error">{errorMsg}</p>}

          <div className="recommend-form-actions">
            <button
              type="submit"
              className="recommend-btn-primary"
              data-testid="recommend-submit-btn"
              disabled={submitting || Boolean(existingItem)}
            >
              {submitting
                ? zh
                  ? "正在提交…"
                  : "Submitting…"
                : zh
                  ? "免登录一键提交"
                  : "Submit directly"}
            </button>
            <a
              className="recommend-btn-ghost"
              href={buildIssueUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              {zh ? "去 GitHub Issue 提交 ↗" : "Open GitHub Issue ↗"}
            </a>
          </div>
        </form>
      )}
    </Modal>
  );
}
