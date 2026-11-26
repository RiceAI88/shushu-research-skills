import React from "react";
import { trackEvent } from "../analytics";
import zhi1keLogo from "../assets/zhi1ke-logo.png";

const RECHARGE_URL = "https://catfk.com/shop/1991";
const ZHI1KE_URL = "https://zhi1ke.com?pic=6PEB";

/**
 * 范式一首屏搜索框下方的同屏双联服务推荐卡：
 * - 左卡：本站自营 AI 订阅正规代充（ChatGPT / Claude / Gemini / Codex，不展示 catfk 域名）
 * - 右卡：严选学术合作 智一刻 AI 论文工作台
 * - 双卡 100% 首屏同屏直达，无需等待轮播切换，窄屏自动流式叠放
 */
export function HeroPosterAd({ lang = "zh", hidden = false }) {
  const zh = lang !== "en";
  if (hidden) return null;

  return (
    <aside
      className="hero-poster-wrap hero-dual-strip"
      aria-label={zh ? "赞助与自营服务推荐" : "Partner & official services"}
      data-testid="hero-poster-ad"
    >
      {/* 左卡：本站自营 AI 订阅正规代充 */}
      <a
        className="hero-dual-card is-warm"
        href={RECHARGE_URL}
        target="_blank"
        rel="sponsored noopener noreferrer"
        data-testid="poster-slide-recharge"
        onClick={() => trackEvent("click_recharge", { slot: "hero_dual" })}
      >
        <svg
          className="hero-dual-art"
          viewBox="0 0 560 110"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M320 120C385 52 452 88 532 18C552 0 568 6 580 -8V120H320Z"
            fill="currentColor"
            fillOpacity="0.08"
          />
          <path
            d="M290 116C368 44 456 84 548 4"
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeWidth="1.3"
          />
        </svg>

        <div className="hero-dual-body">
          <div className="hero-dual-top">
            <span className="hero-dual-badge is-warm">
              {zh ? "本站自营" : "Self-operated"}
            </span>
            <strong className="hero-dual-title">
              {zh ? "专业 AI 订阅正规代充" : "Official AI Subscription Top-up"}
            </strong>
            <span className="hero-dual-sep" aria-hidden="true">·</span>
            <span className="hero-dual-models">
              <span className="hero-dual-model">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 3a5 5 0 0 1 4.5 2.8A5 5 0 0 1 20 12.2a5 5 0 0 1-2.5 6.3A5 5 0 0 1 12 21a5 5 0 0 1-4.5-2.8A5 5 0 0 1 4 11.8a5 5 0 0 1 2.5-6.3A5 5 0 0 1 12 3Z" />
                  <circle cx="12" cy="12" r="2.6" />
                </svg>
                ChatGPT
              </span>
              <span className="hero-dual-model is-claude">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 2.5v19M5.3 5.3l13.4 13.4M2.5 12h19M5.3 18.7 18.7 5.3" />
                </svg>
                Claude
              </span>
              <span className="hero-dual-model is-gemini">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C12.4 7.3 16.7 11.6 22 12c-5.3.4-9.6 4.7-10 10-.4-5.3-4.7-9.6-10-10 5.3-.4 9.6-4.7 10-10Z" />
                </svg>
                Gemini
              </span>
              <span className="hero-dual-model">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <path d="m7.5 10 2.8 2.2-2.8 2.2m5 0h3.5" />
                </svg>
                Codex
              </span>
            </span>
          </div>
          <div className="hero-dual-sub">
            {zh ? (
              <>
                官方渠道自动发货 · 正规账单可查 · <em>支持科研报销开票</em>
              </>
            ) : (
              <>
                Instant auto-delivery · Official billing · <em>Invoices &amp; reimbursement</em>
              </>
            )}
          </div>
        </div>

        <span className="hero-dual-cta is-warm">
          {zh ? "立即选购 →" : "Top up →"}
        </span>
      </a>

      {/* 右卡：智一刻 AI 学术论文工作台 */}
      <a
        className="hero-dual-card is-jade"
        href={ZHI1KE_URL}
        target="_blank"
        rel="sponsored noopener noreferrer"
        data-testid="poster-slide-zhi1ke"
        onClick={() => trackEvent("click_zhi1ke", { slot: "hero_dual" })}
      >
        <svg
          className="hero-dual-art"
          viewBox="0 0 560 110"
          preserveAspectRatio="none"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M330 120C396 50 462 86 538 16C556 0 570 6 582 -6V120H330Z"
            fill="currentColor"
            fillOpacity="0.08"
          />
          <path
            d="M302 116C380 44 466 82 554 4"
            stroke="currentColor"
            strokeOpacity="0.17"
            strokeWidth="1.3"
          />
        </svg>

        <div className="hero-dual-body">
          <div className="hero-dual-top">
            <span className="hero-dual-badge is-jade">
              <img src={zhi1keLogo} alt="" width={14} height={11} decoding="async" />
              {zh ? "智一刻 AI" : "Zhi1ke AI"}
            </span>
            <strong className="hero-dual-title">
              {zh ? "从一个题目，到一篇论文初稿。" : "From a topic to a first draft."}
            </strong>
          </div>
          <div className="hero-dual-sub">
            {zh ? (
              <>
                毕业设计 · 开题综述 · 免费无限改稿 · <em>重复率AI率不达标直接退</em>
              </>
            ) : (
              <>
                Thesis &amp; literature studio · Free unlimited revisions · <em>Full refund guarantee</em>
              </>
            )}
          </div>
        </div>

        <span className="hero-dual-cta is-jade">
          {zh ? "免费生成提纲 →" : "Generate a free outline →"}
        </span>
      </a>
    </aside>
  );
}
