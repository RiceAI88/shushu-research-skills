import React from "react";
import { Reveal } from "./SiteMotion";
import logo from "../assets/zhi1ke-logo.png";

const destination = "https://zhi1ke.com?pic=6PEB";

export function Zhi1keAd({ t, lang = "zh" }) {
  const zh = lang !== "en";
  return (
    <Reveal
      as="aside"
      className="sponsor-banner sponsor-banner-jade"
      aria-label="智一刻 AI"
      data-testid="zhi1ke-ad"
    >
      <div className="sponsor-main">
        <div className="sponsor-brand-row">
          <span className="sponsor-brand">
            <span className="sponsor-logo-pill">
              <img src={logo} alt="" width={22} height={16} decoding="async" />
            </span>
            <strong>智一刻 AI</strong>
            <span className="sponsor-subbrand">
              {zh ? "学术写作工作台" : "Academic Writing Studio"}
            </span>
          </span>
          <span className="sponsor-global">{t("globalPromotion")}</span>
        </div>

        <p className="sponsor-copy">
          <strong>{t("sponsorHeadline")}</strong> {t("sponsorDescription")}
        </p>

        <div className="sponsor-guarantees">
          <span className="sponsor-badge sponsor-badge-jade">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9" />
              <path d="M13.5 2.8v3.1h-3.1" />
            </svg>
            <span>{t("sponsorGuaranteeRevise")}</span>
          </span>
          <span className="sponsor-badge sponsor-badge-amber">
            <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M8 1.8 13 3.8v4c0 3.2-2.1 5.4-5 6.4-2.9-1-5-3.2-5-6.4v-4L8 1.8Z" />
              <path d="m5.7 8.1 1.6 1.6 3.1-3.2" />
            </svg>
            <span>{t("sponsorGuaranteeRefund")}</span>
          </span>
        </div>
      </div>

      <div className="sponsor-side">
        <div className="sponsor-workbench" aria-hidden="true">
          <div className="sponsor-workbench-top">
            <span className="sponsor-workbench-title">
              <i className="sponsor-workbench-dot" />
              {zh ? "全流程交付闭环" : "End-to-End Workflow"}
            </span>
            <span className="sponsor-workbench-stat">
              {zh ? "支持高校格式模板" : "University Templates"}
            </span>
          </div>
          <div className="sponsor-workbench-grid">
            <span><em>01</em>{zh ? "毕业设计(论文)" : "Thesis & Code"}</span>
            <span><em>02</em>{zh ? "开题 / 文献综述" : "Proposal & Review"}</span>
            <span><em>03</em>{zh ? "万字正文与图表" : "Draft & Figures"}</span>
            <span><em>04</em>{zh ? "降AI率 / 重复率" : "AIGC & Check"}</span>
          </div>
        </div>

        <a
          className="sponsor-cta"
          href={destination}
          target="_blank"
          rel="sponsored noopener noreferrer"
        >
          <span>{t("sponsorAction")}</span>
          <span className="sponsor-cta-arrow" aria-hidden="true">↗</span>
        </a>
      </div>
    </Reveal>
  );
}
