import React from "react";
import { outputPreviewFor } from "../outputPreviewData";

export { outputPreviewFor };

// 详情抽屉产出效果预览卡：按需随 RepositoryDrawer 懒加载，不影响移动端首屏体积
export function OutputPreviewCard({ item, lang = "zh" }) {
  const preview = outputPreviewFor(item);
  if (!preview) return null;
  const zh = lang === "zh";
  const label = preview[`label_${lang}`] || preview.label_zh;
  const takeaway = preview[`takeaway_${lang}`] || preview.takeaway_zh;

  return (
    <div
      className={`output-preview-card preview-mode-${preview.mode}`}
      data-testid="output-preview-card"
      data-preview-mode={preview.mode}
    >
      <div className="output-preview-header">
        <span className="output-preview-title">
          <span aria-hidden="true">
            {preview.mode === "before_after" ? "✍️" : "🎯"}
          </span>
          <strong>{label}</strong>
        </span>
        <span className="output-preview-badge">
          {preview.isCurated
            ? zh
              ? "典型效果示意 · 依据官方文档"
              : "Workflow preview · From docs"
            : zh
              ? "典型场景示意 · 按任务类型匹配"
              : "Typical workflow · Task-matched"}
        </span>
      </div>

      {preview.mode === "before_after" ? (
        <div className="output-preview-diff">
          <div className="preview-pane preview-pane-before">
            <span className="preview-pane-tag">
              {zh ? "修改前 · 原稿常见写法" : "Before · Typical draft"}
            </span>
            <p>{preview[`before_${lang}`] || preview.before_zh}</p>
          </div>
          <div className="preview-pane preview-pane-after">
            <span className="preview-pane-tag">
              {zh ? "修改后 · 严谨学术表达" : "After · Academic prose"}
            </span>
            <p>{preview[`after_${lang}`] || preview.after_zh}</p>
          </div>
        </div>
      ) : (
        <div className="output-preview-pipeline">
          <div className="preview-io-row">
            <span className="preview-io-label">
              {zh ? "📥 输入材料" : "📥 Input"}
            </span>
            <span className="preview-io-value">
              {preview[`input_${lang}`] || preview.input_zh}
            </span>
          </div>
          <ol className="preview-steps-track">
            {(preview[`steps_${lang}`] || preview.steps_zh || []).map(
              (step, idx) => (
                <li key={idx}>
                  <span className="preview-step-idx">{idx + 1}</span>
                  <span>{step}</span>
                </li>
              ),
            )}
          </ol>
          <div className="preview-io-row preview-artifacts-row">
            <span className="preview-io-label">
              {zh ? "📦 典型产出" : "📦 Outputs"}
            </span>
            <div className="preview-artifact-list">
              {(preview.artifacts || []).map((file) => (
                <code key={file} className="preview-artifact-chip">
                  {file}
                </code>
              ))}
            </div>
          </div>
        </div>
      )}

      {takeaway && (
        <p className="output-preview-takeaway">
          <strong>{zh ? "核心价值：" : "Why it helps: "}</strong>
          {takeaway}
        </p>
      )}
    </div>
  );
}
