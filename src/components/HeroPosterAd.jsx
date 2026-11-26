import React, { useEffect, useState } from "react";
import { trackEvent } from "../analytics";
import zhi1keLogo from "../assets/zhi1ke-logo.png";

const RECHARGE_URL = "https://catfk.com/shop/1991";
const ZHI1KE_URL = "https://zhi1ke.com?pic=6PEB";
const ROTATE_MS = 6500;

/**
 * 首屏标题右侧高辨识度带图海报广告窗（改良版 1B）：
 * - 内置矢量流光丝带底纹插画与平台矢量图标（ChatGPT / Claude / Gemini / Codex + 智一刻工作台），视网膜屏无损清晰且零额外图片请求阻塞
 * - 支持双业务自动柔和轮播 + 顶部指示器手动秒切（悬停/聚焦自动暂停，遵循系统减弱动态效果偏好）
 */
export function HeroPosterAd({ lang = "zh", hidden = false }) {
  const zh = lang !== "en";
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || hidden || typeof window === "undefined") return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % 2);
    }, ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [paused, hidden]);

  if (hidden) return null;

  const isRecharge = activeIdx === 0;

  return (
    <aside
      className="hero-poster-wrap"
      aria-label={zh ? "赞助与自营服务推荐" : "Partner & official services"}
      data-testid="hero-poster-ad"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="hero-poster-topbar">
        <span className={`hero-poster-kicker${isRecharge ? " is-warm" : " is-jade"}`}>
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11.5 3.2 5.6 6H3.2A1.2 1.2 0 0 0 2 7.2v1.6A1.2 1.2 0 0 0 3.2 10h1.1l1.1 3.2h1.7L6.2 10l5.3 2.8V3.2Z" />
            <path d="M13.5 5.8a2.8 2.8 0 0 1 0 4.4" />
          </svg>
          <span>
            {isRecharge
              ? zh
                ? "赞助 · 本站自营"
                : "Partner · Official Top-up"
              : zh
                ? "严选合作 · 学术工作台"
                : "Featured · Academic Studio"}
          </span>
        </span>

        <div
          className="hero-poster-dots"
          role="tablist"
          aria-label={zh ? "切换推荐海报" : "Switch featured poster"}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeIdx === 0}
            aria-label={zh ? "查看 AI 订阅代充海报" : "Show AI subscription top-up"}
            className={`hero-poster-dot${activeIdx === 0 ? " is-active is-warm" : ""}`}
            data-testid="poster-tab-recharge"
            onClick={() => setActiveIdx(0)}
          />
          <button
            type="button"
            role="tab"
            aria-selected={activeIdx === 1}
            aria-label={zh ? "查看智一刻 AI 海报" : "Show Zhi1ke AI studio"}
            className={`hero-poster-dot${activeIdx === 1 ? " is-active is-jade" : ""}`}
            data-testid="poster-tab-zhi1ke"
            onClick={() => setActiveIdx(1)}
          />
        </div>
      </div>

      {isRecharge ? (
        <a
          key="recharge"
          className="hero-poster-card is-warm"
          href={RECHARGE_URL}
          target="_blank"
          rel="sponsored noopener noreferrer"
          data-testid="poster-slide-recharge"
          onClick={() => trackEvent("click_recharge", { slot: "hero_poster" })}
        >
          {/* 暖橙流光丝带矢量海报底图 */}
          <svg
            className="hero-poster-art"
            viewBox="0 0 600 164"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M235 178C308 92 392 142 486 44C532 -4 576 10 616 -16V178H235Z"
              fill="currentColor"
              fillOpacity="0.11"
            />
            <path
              d="M196 172C288 76 402 136 514 14"
              stroke="currentColor"
              strokeOpacity="0.24"
              strokeWidth="1.5"
            />
            <path
              d="M258 186C346 104 432 150 548 34"
              stroke="currentColor"
              strokeOpacity="0.14"
              strokeWidth="1.2"
            />
            <circle cx="468" cy="34" r="2.5" fill="currentColor" fillOpacity="0.34" />
            <circle cx="526" cy="68" r="2" fill="currentColor" fillOpacity="0.24" />
            <circle cx="412" cy="92" r="1.8" fill="currentColor" fillOpacity="0.22" />
          </svg>

          <div className="hero-poster-main">
            <div className="hero-poster-headline">
              {zh ? "专业 AI 订阅正规代充" : "Official AI Subscription Top-up"}
            </div>
            <div className="hero-poster-brands">
              <span className="hero-poster-origin is-warm">
                {zh ? "鼠鼠自营" : "Self-operated"}
              </span>
              <span className="hero-poster-sep" aria-hidden="true">|</span>
              <span className="hero-poster-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M12 3a5 5 0 0 1 4.5 2.8A5 5 0 0 1 20 12.2a5 5 0 0 1-2.5 6.3A5 5 0 0 1 12 21a5 5 0 0 1-4.5-2.8A5 5 0 0 1 4 11.8a5 5 0 0 1 2.5-6.3A5 5 0 0 1 12 3Z" />
                  <circle cx="12" cy="12" r="2.6" />
                </svg>
                ChatGPT
              </span>
              <span className="hero-poster-chip is-claude">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" aria-hidden="true">
                  <path d="M12 2.5v19M5.3 5.3l13.4 13.4M2.5 12h19M5.3 18.7 18.7 5.3" />
                </svg>
                Claude
              </span>
              <span className="hero-poster-chip is-gemini">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C12.4 7.3 16.7 11.6 22 12c-5.3.4-9.6 4.7-10 10-.4-5.3-4.7-9.6-10-10 5.3-.4 9.6-4.7 10-10Z" />
                </svg>
                Gemini
              </span>
              <span className="hero-poster-chip">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="3" />
                  <path d="m7.5 10 2.8 2.2-2.8 2.2m5 0h3.5" />
                </svg>
                Codex
              </span>
            </div>
            <div className="hero-poster-sub">
              {zh ? (
                <>
                  自助下单 · 正规账单可查 · <em>可开发票科研报销</em>
                </>
              ) : (
                <>
                  Self-service · Official billing · <em>Invoices available</em>
                </>
              )}
            </div>
          </div>

          <div className="hero-poster-aside">
            <div className="hero-poster-domain-group">
              <span className="hero-poster-eyebrow">
                {zh ? "官方渠道 · 自动发货" : "Official · Auto"}
              </span>
              <strong className="hero-poster-domain">catfk.com</strong>
            </div>
            <span className="hero-poster-cta is-warm">
              {zh ? "立即选购 →" : "Top up →"}
            </span>
          </div>
        </a>
      ) : (
        <a
          key="zhi1ke"
          className="hero-poster-card is-jade"
          href={ZHI1KE_URL}
          target="_blank"
          rel="sponsored noopener noreferrer"
          data-testid="poster-slide-zhi1ke"
          onClick={() => trackEvent("click_zhi1ke", { slot: "hero_poster" })}
        >
          {/* 翠绿流光丝带矢量海报底图 */}
          <svg
            className="hero-poster-art"
            viewBox="0 0 600 164"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M245 178C322 88 408 136 496 40C542 -6 580 12 616 -12V178H245Z"
              fill="currentColor"
              fillOpacity="0.11"
            />
            <path
              d="M210 172C302 76 414 130 526 12"
              stroke="currentColor"
              strokeOpacity="0.22"
              strokeWidth="1.5"
            />
            <path
              d="M272 186C358 104 440 148 556 32"
              stroke="currentColor"
              strokeOpacity="0.13"
              strokeWidth="1.2"
            />
            <circle cx="484" cy="34" r="2.5" fill="currentColor" fillOpacity="0.32" />
            <circle cx="538" cy="64" r="2" fill="currentColor" fillOpacity="0.24" />
          </svg>

          <div className="hero-poster-main">
            <div className="hero-poster-headline">
              {zh ? "从一个题目，到一篇论文初稿。" : "From a topic to a first draft."}
            </div>
            <div className="hero-poster-brands">
              <span className="hero-poster-origin is-jade">
                <img src={zhi1keLogo} alt="" width={16} height={12} decoding="async" />
                智一刻 AI
              </span>
              <span className="hero-poster-sep" aria-hidden="true">|</span>
              <span className="hero-poster-chip">
                {zh ? "毕业设计" : "Thesis"}
              </span>
              <span className="hero-poster-chip">
                {zh ? "开题综述" : "Literature"}
              </span>
              <span className="hero-poster-chip">
                {zh ? "降重降AIGC" : "AIGC Check"}
              </span>
            </div>
            <div className="hero-poster-sub">
              {zh ? (
                <>
                  免费无限改稿 · <em>重复率AI率不达标直接退</em>
                </>
              ) : (
                <>
                  Free unlimited revisions · <em>Full refund guarantee</em>
                </>
              )}
            </div>
          </div>

          <div className="hero-poster-aside">
            <div className="hero-poster-domain-group">
              <span className="hero-poster-eyebrow">
                {zh ? "学术写作工作台" : "Writing Studio"}
              </span>
              <strong className="hero-poster-domain">zhi1ke.com</strong>
            </div>
            <span className="hero-poster-cta is-jade">
              {zh ? "免费生成提纲 →" : "Generate a free outline →"}
            </span>
          </div>
        </a>
      )}
    </aside>
  );
}
