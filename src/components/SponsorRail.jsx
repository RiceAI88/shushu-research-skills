import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { trackEvent } from "../analytics";

const ZHI1KE_URL = "https://zhi1ke.com?pic=6PEB";
const RECHARGE_URL = "https://catfk.com/shop/1991";

/**
 * 超宽屏右侧留白区「推荐服务」侧栏：
 * - 仅在 ≥1760px 且高度足够时由 CSS 展示，同时隐藏列表内横幅，避免重复曝光
 * - 顶部位置自动对齐榜单区（.ranking-section）上沿并在滚动时吸顶于 96px，首屏 Hero 区保持对称留白，滚到底部页脚前自动淡出
 * - 通过 Portal 挂到 body，避免祖先 transform 动画导致 fixed 定位偏移
 */
export function SponsorRail({ lang = "zh", onOpenCommunity }) {
  const zh = lang !== "en";
  const [mounted, setMounted] = useState(false);
  const [railState, setRailState] = useState({ visible: false, top: 112 });

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return undefined;

    let rafId = 0;
    const syncPosition = () => {
      rafId = 0;
      if (window.innerWidth < 1760 || window.innerHeight < 760) {
        setRailState((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }
      const section = document.querySelector(".ranking-section");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      // 榜单顶部进入视口下半区后显现，底部滚过视口中上部时淡出避让页脚
      const inView = rect.top < window.innerHeight - 140 && rect.bottom > 420;
      const nextTop = Math.round(Math.max(92, rect.top));
      setRailState((prev) =>
        prev.visible === inView && Math.abs(prev.top - nextTop) < 2
          ? prev
          : { visible: inView, top: nextTop },
      );
    };

    const scheduleSync = () => {
      if (!rafId) rafId = window.requestAnimationFrame(syncPosition);
    };

    syncPosition();
    window.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync, { passive: true });
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
    };
  }, []);

  if (!mounted || typeof document === "undefined") return null;
  const { visible, top } = railState;

  const cards = [
    {
      key: "zhi1ke",
      tag: zh ? "全站推荐" : "Featured",
      warm: true,
      domain: "zhi1ke.com",
      title: zh ? "智一刻 AI · 学术写作工作台" : "Zhi1ke AI · Academic Writing",
      desc: zh
        ? "从一个题目到一篇论文初稿：开题、综述、正文图表、降 AI 率一站完成。"
        : "From a topic to a first draft: proposal, review, figures and AIGC checks.",
      note: zh ? "免费无限改稿 · 不达标直接退" : "Free revisions · Refund guarantee",
      cta: zh ? "免费生成提纲 →" : "Free outline →",
      href: ZHI1KE_URL,
      onClick: () => trackEvent("click_zhi1ke", { slot: "side_rail" }),
    },
    {
      key: "recharge",
      tag: zh ? "自营直充" : "Our service",
      domain: "catfk.com",
      title: zh ? "GPT / Codex 正规代充" : "GPT / Codex Top-up",
      desc: zh
        ? "有账单 · 可开发票报销，同时支持本站持续维护。"
        : "Billing records and invoices; also supports this site's upkeep.",
      cta: zh ? "前往选购 →" : "View service →",
      href: RECHARGE_URL,
      onClick: () => trackEvent("click_recharge", { slot: "side_rail" }),
    },
    {
      key: "community",
      tag: zh ? "交流群" : "Community",
      domain: "riceai985.cc",
      title: zh ? "各专业科研交流群" : "Research community",
      desc: zh
        ? "同门互助、工具实测、每周新 Skill 速递。"
        : "Peer help, tool reviews and weekly new Skills.",
      cta: zh ? "扫码加群 →" : "Join group →",
      action: () => onOpenCommunity?.("side_rail"),
    },
  ];

  return createPortal(
    <aside
      className={`sponsor-rail${visible ? " is-visible" : ""}`}
      style={{ top: `${top}px` }}
      aria-label={zh ? "推荐服务" : "Recommended services"}
      aria-hidden={visible ? undefined : "true"}
      data-testid="sponsor-rail"
    >
      <div className="sponsor-rail-head">
        <span>{zh ? "推荐服务" : "Recommended"}</span>
        <span>{zh ? "自营 / 严选" : "Curated"}</span>
      </div>
      {cards.map((card) => (
        <section key={card.key} className="sponsor-rail-card">
          <div className="sponsor-rail-meta">
            <span className={`sponsor-rail-tag${card.warm ? " is-warm" : ""}`}>{card.tag}</span>
            {card.domain && <span className="sponsor-rail-domain">{card.domain}</span>}
          </div>
          <h3>{card.title}</h3>
          <p>{card.desc}</p>
          {card.note && <p className="sponsor-rail-note">{card.note}</p>}
          {card.href ? (
            <a
              className="sponsor-rail-cta"
              href={card.href}
              target="_blank"
              rel="sponsored noopener noreferrer"
              tabIndex={visible ? undefined : -1}
              onClick={card.onClick}
            >
              {card.cta}
            </a>
          ) : (
            <button
              type="button"
              className="sponsor-rail-cta is-ghost"
              tabIndex={visible ? undefined : -1}
              onClick={card.action}
            >
              {card.cta}
            </button>
          )}
        </section>
      ))}
    </aside>,
    document.body,
  );
}
