import React, { useEffect, useRef, useState } from "react";
import { askShushuAssistant } from "../assistantEngine.js";
import { HamsterMascot } from "./HamsterMascot.jsx";
import { trackEvent } from "../analytics.js";

const QUICK_QUESTIONS = {
  zh: [
    "本科毕设不会敲命令行，写论文和 Word 排版用哪个？",
    "经管研究生做 DID 因果识别与 Stata 实证推荐哪几个？",
    "想画顶刊统计配图和可编辑 Visio 架构图怎么选？",
    "医学科研查 PubMed、精读英文文献和写综述配什么？",
  ],
  en: [
    "Undergraduate thesis starter with no CLI setup?",
    "Best Skills for econometrics, DID, and Stata tables?",
    "Publication-ready plots and editable architecture diagrams?",
    "Biomedical PubMed search and literature synthesis workflow?",
  ],
};

const SESSION_CHAT_KEY = "ars-shushu-chat-v1";

function loadSessionMessages() {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.sessionStorage?.getItem(SESSION_CHAT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-12) : [];
  } catch {
    return [];
  }
}

// 根据最近一轮提问生成保留学科上下文的一键追问胶囊
function buildFollowUpChips(messages, lang = "zh") {
  const zh = lang === "zh";
  const userMsgs = messages.filter((m) => m.role === "user");
  const baseTopic = String(userMsgs[0]?.text || "").slice(0, 64);
  const lastUser = String(userMsgs[userMsgs.length - 1]?.text || "");
  if (!baseTopic) return [];

  const chips = [];
  if (!/免命令行|网页版|不会敲命令|零基础|no[- ]?cli|web/i.test(lastUser)) {
    chips.push({
      label: zh ? "🟢 只要免命令行网页版能用的" : "🟢 Zero-CLI / Web AI only",
      query: zh
        ? `${baseTopic}，要求零基础免命令行、网页版 AI 直接能用`
        : `${baseTopic}, zero-CLI and usable directly in Web AI`,
    });
  }
  if (!/润色|去ai|降重|polish|humaniz/i.test(lastUser)) {
    chips.push({
      label: zh ? "✍️ 配套推荐论文润色降 AI 味工具" : "✍️ Add academic polishing Skills",
      query: zh
        ? `${baseTopic}，顺便推荐学术论文润色、去除 AI 味与排版工具`
        : `${baseTopic}, plus academic writing polish and formatting Skills`,
    });
  } else {
    chips.push({
      label: zh ? "📊 配套推荐顶刊配图与流程图工具" : "📊 Add figure & diagram Skills",
      query: zh
        ? `${baseTopic}，顺便推荐顶刊统计配图与架构流程图工具`
        : `${baseTopic}, plus publication plots and architecture diagram Skills`,
    });
  }
  return chips.slice(0, 2);
}

// 轻量渲染回复中的 **加粗** 与 `代码` 标记
function renderFormattedLine(line) {
  const tokens = String(line || "").split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return tokens.map((tok, i) => {
    if (tok.startsWith("**") && tok.endsWith("**")) {
      return <strong key={i}>{tok.slice(2, -2)}</strong>;
    }
    if (tok.startsWith("`") && tok.endsWith("`")) {
      return <code key={i}>{tok.slice(1, -1)}</code>;
    }
    return <React.Fragment key={i}>{tok}</React.Fragment>;
  });
}

export default function ShushuAssistant({
  open,
  onClose,
  items,
  lang = "zh",
  initialQuery = "",
  onConsumeInitialQuery,
  onOpenRepo,
  onApplyPack,
}) {
  const zh = lang === "zh";
  const verifiedFloor = Math.max(
    420,
    Math.floor(
      ((items || []).filter((i) => i.repository_kind === "skill").length || 460) / 10,
    ) * 10,
  );
  const [rendered, setRendered] = useState(open);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(loadSessionMessages);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const prefersReduced =
    typeof window !== "undefined" &&
    Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    if (open) {
      setRendered(true);
      return undefined;
    }
    if (!rendered) return undefined;
    if (prefersReduced) {
      setRendered(false);
      return undefined;
    }
    const timer = setTimeout(() => setRendered(false), 195);
    return () => clearTimeout(timer);
  }, [open, rendered, prefersReduced]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = setTimeout(() => inputRef.current?.focus(), 60);
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      if (messages.length === 0) {
        window.sessionStorage?.removeItem(SESSION_CHAT_KEY);
      } else {
        window.sessionStorage?.setItem(
          SESSION_CHAT_KEY,
          JSON.stringify(messages.slice(-12)),
        );
      }
    } catch {
      /* ignore quota / privacy mode */
    }
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!open || !initialQuery || loading) return;
    const pending = String(initialQuery).trim();
    onConsumeInitialQuery?.();
    if (pending) {
      submitQuestion(pending, "", "empty_search");
    }
  }, [open, initialQuery, loading]);

  if (!open && (!rendered || prefersReduced)) return null;
  const isClosing = !open;
  const followUps = !loading && messages.length > 0 ? buildFollowUpChips(messages, lang) : [];

  const submitQuestion = async (rawText, displayLabel = "", mode = "custom") => {
    const q = String(rawText ?? input).trim();
    if (!q || loading) return;
    const shown = String(displayLabel || q).trim();
    setInput("");
    trackEvent("ask_shushu", { mode: rawText ? mode : "custom" });
    setMessages((prev) => [...prev, { role: "user", text: shown }]);
    setLoading(true);
    try {
      const res = await askShushuAssistant({ query: q, items, lang });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: res.reply,
          picks: res.picks || [],
          source: res.source,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      className={`shushu-bot-panel${isClosing ? " is-closing" : " is-open"}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="shushu-bot-title"
      data-testid="shushu-bot-panel"
    >
      <header className="shushu-bot-header">
        <div className="shushu-bot-brand">
          <span className="shushu-bot-avatar shushu-bot-mascot-avatar" aria-hidden="true">
            <HamsterMascot mode={loading ? "thinking" : "idle"} size={42} />
          </span>
          <div>
            <h2 id="shushu-bot-title">
              {zh ? "鼠鼠 AI 选工具顾问" : "Hamster AI Skill Advisor"}
            </h2>
            <span>
              {zh
                ? `基于本站 ${verifiedFloor}+ 真实收录库推荐 · 零幻觉编造`
                : `Grounded in ${verifiedFloor}+ verified Skills on site`}
            </span>
          </div>
        </div>
        <div className="shushu-bot-header-actions">
          {messages.length > 0 && (
            <button
              type="button"
              className="shushu-bot-icon-btn"
              onClick={() => setMessages([])}
              title={zh ? "清空对话" : "Clear chat"}
            >
              {zh ? "清空" : "Clear"}
            </button>
          )}
          <button
            type="button"
            className="shushu-bot-close"
            aria-label={zh ? "关闭选工具助手" : "Close AI advisor"}
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </header>

      <div ref={listRef} className="shushu-bot-body">
        {messages.length === 0 ? (
          <div className="shushu-bot-welcome">
            <p>
              {zh
                ? "告诉我你的【专业 + 想做的科研任务 + 是否习惯用命令行】，我直接帮你挑最省事的 2～3 个 Skill："
                : "Tell me your discipline, research task, and whether you prefer zero-CLI tools:"}
            </p>
            <div className="shushu-bot-starters">
              {(QUICK_QUESTIONS[lang] || QUICK_QUESTIONS.zh).map((q) => (
                <button
                  key={q}
                  type="button"
                  className="shushu-bot-starter-btn"
                  onClick={() => submitQuestion(q, "", "starter")}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="shushu-bot-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`shushu-msg shushu-msg-${msg.role}`}
                data-testid={`shushu-msg-${msg.role}`}
              >
                <div className="shushu-msg-bubble">
                  {String(msg.text || "")
                    .split("\n")
                    .filter((line) => line.trim() !== "")
                    .map((line, lineIdx) => (
                      <p key={lineIdx}>{renderFormattedLine(line)}</p>
                    ))}
                </div>
                {msg.role === "assistant" && msg.picks?.length > 0 && (
                  <div className="shushu-msg-picks">
                    {msg.picks.map((pick) => (
                      <button
                        key={pick.repo}
                        type="button"
                        className="shushu-pick-card"
                        data-testid="shushu-pick-card"
                        onClick={() => {
                          trackEvent("open_shushu_pick", { repo: pick.repo });
                          onOpenRepo?.(pick.repo);
                        }}
                      >
                        <div className="shushu-pick-main">
                          <strong>{pick.repo.split("/")[1]}</strong>
                          <span className="shushu-pick-stars">
                            ★ {Number(pick.stars || 0).toLocaleString("en-US")}
                          </span>
                        </div>
                        <p>{zh ? pick.summary : pick.summaryEn}</p>
                        <span className="shushu-pick-cta">
                          {zh ? "查看上手指南 ›" : "Open guide ›"}
                        </span>
                      </button>
                    ))}
                    {msg.picks.length >= 2 && onApplyPack && (
                      <button
                        type="button"
                        className="shushu-pack-btn"
                        data-testid="shushu-apply-pack"
                        onClick={() => {
                          onApplyPack(
                            msg.picks.map((p) => p.repo),
                            zh ? "鼠鼠推荐组合" : "AI Recommended Pack",
                          );
                          onClose();
                        }}
                      >
                        {zh
                          ? `📦 在页面中集中查看这 ${msg.picks.length} 个推荐工具`
                          : `📦 View these ${msg.picks.length} picks as a toolkit`}
                      </button>
                    )}
                  </div>
                )}
                {msg.role === "assistant" &&
                  idx === messages.length - 1 &&
                  followUps.length > 0 && (
                    <div className="shushu-followups" data-testid="shushu-followups">
                      {followUps.map((chip) => (
                        <button
                          key={chip.label}
                          type="button"
                          className="shushu-followup-chip"
                          onClick={() => submitQuestion(chip.query, chip.label, "followup")}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            ))}
            {loading && (
              <div className="shushu-msg shushu-msg-assistant">
                <div className="shushu-msg-bubble shushu-msg-loading">
                  <span className="table-loading-spinner" aria-hidden="true" />
                  <span>
                    {zh
                      ? "鼠鼠正在检索收录库并对比适用门槛…"
                      : "Matching verified Skills for your workflow…"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <a
        className="shushu-bot-promo"
        data-testid="shushu-bot-promo"
        href="https://catfk.com/shop/1991"
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={() => trackEvent("click_recharge", { slot: "assistant" })}
      >
        <span className="shushu-bot-promo-main">
          <span className="shushu-bot-promo-dot" aria-hidden="true" />
          <strong>
            {zh ? "本站自营 · GPT / Codex 正规代充" : "Official GPT / Codex Top-up"}
          </strong>
          <em>{zh ? "有账单 · 可开发票报销" : "Invoices available"}</em>
        </span>
        <span className="shushu-bot-promo-cta">
          {zh ? "去看看 ↗" : "Details ↗"}
        </span>
      </a>

      <form
        className="shushu-bot-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          submitQuestion();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          maxLength={240}
          placeholder={
            zh
              ? "例如：临床医学研一，不会编程，想做 Meta 分析…"
              : "e.g. Economics grad student writing DID regressions…"
          }
          aria-label={zh ? "向鼠鼠提问选工具" : "Ask Hamster AI advisor"}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={!input.trim() || loading}>
          {zh ? "发送" : "Ask"}
        </button>
      </form>
    </section>
  );
}
