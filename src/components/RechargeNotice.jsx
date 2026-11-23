import {Modal} from 'antd';
import React, { useEffect, useRef, useState } from "react";
import { CloseOutlined, ArrowUpOutlined } from "@ant-design/icons";

export const NOTICE_STORAGE_KEY = "prs-recharge-notice-shown-v2";
export const NOTICE_INTERVAL_MS = 12 * 60 * 60 * 1000;

// Returns true when the entry notice has not been shown in the last 12 hours,
// and records the current time so the next visit within the window is quiet.
export function claimNoticeSlot(storage, now = Date.now()) {
  try {
    const last = Number(storage?.getItem(NOTICE_STORAGE_KEY));
    if (Number.isFinite(last) && last > 0 && now - last >= 0 && now - last < NOTICE_INTERVAL_MS)
      return false;
    storage?.setItem(NOTICE_STORAGE_KEY, String(now));
  } catch {
    // Storage blocked: fall back to showing the notice.
  }
  return true;
}

export const NOTICE_DELAY_MS = 12000;

export function RechargeNotice({ lang, busy = false, immediate = false }) {
  const [open,setOpen] = useState(false);
  const [ready,setReady] = useState(false);
  const busyRef = useRef(busy);
  busyRef.current = busy;
  const zh = lang === "zh";
  const canShowNow = () => {
    if (busyRef.current) return false;
    const active = document.activeElement;
    if (active && active.closest?.('input,textarea,select,[contenteditable="true"]'))
      return false;
    if (document.querySelector("dialog[open]")) return false;
    return true;
  };
  const tryOpen = () => {
    let storage = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    if (claimNoticeSlot(storage)) setOpen(true);
  };
  useEffect(() => {
    const delay = immediate
      ? 0
      : typeof window !== "undefined" && Number.isFinite(window.__ARS_NOTICE_DELAY_MS)
        ? window.__ARS_NOTICE_DELAY_MS
        : NOTICE_DELAY_MS;
    const trigger = () => {
      if (canShowNow()) {
        tryOpen();
      } else {
        // 用户正忙（正在输入或查看抽屉/弹窗），暂缓至空闲后再决定展示
        setReady(true);
      }
    };
    if (delay <= 0) {
      trigger();
      return undefined;
    }
    const timer = window.setTimeout(trigger, delay);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!ready || open || busy) return;
    const check = () => {
      if (canShowNow()) {
        setReady(false);
        tryOpen();
      }
    };
    const timer = window.setTimeout(check, 600);
    window.addEventListener("focusout", check);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focusout", check);
    };
  }, [ready, open, busy]);
  const close = () => setOpen(false);
  return (
    <Modal
      open={open}
      onCancel={close}
      footer={null}
      closable={false}
      title={<span className="sr-only">{zh ? "GPT 正规代充" : "GPT top-up service"}</span>}
      centered
      width={440}
      rootClassName="recharge-modal"
      aria-labelledby="recharge-notice-title"
      aria-describedby="recharge-notice-description"
      styles={{
        header: { display: "none" },
        container: {
          padding: 28,
          borderRadius: 20,
          border: "1px solid var(--prs-border)",
          background: "var(--prs-panel)",
        },
      }}
    >
      <div className="recharge-notice">
        <div className="recharge-notice-top">
          <span className="recharge-notice-badge">
            <span className="recharge-notice-dot" aria-hidden="true" />
            {zh ? "本站自营服务" : "Our own service"}
          </span>
          <button
            type="button"
            className="recharge-notice-close"
            onClick={close}
            aria-label={zh ? "关闭代充提示" : "Close top-up notice"}
          >
            <CloseOutlined aria-hidden="true" />
          </button>
        </div>
        <div className="recharge-notice-header-row">
          <h2 id="recharge-notice-title" tabIndex={-1} autoFocus>
            {zh ? "GPT 正规代充" : "GPT top-up service"}
          </h2>
          <p className="recharge-notice-invoice">
            {zh ? "可开发票" : "Invoices available"}
          </p>
        </div>
        <p id="recharge-notice-description">
          {zh
            ? "自营 GPT / Codex 代充服务，有账单、可开发票。需要代充的朋友，可以了解一下，也支持本站持续维护。"
            : "Self-operated GPT / Codex top-ups with billing records and invoices. Explore the service and support this site's upkeep."}
        </p>
        <div className="recharge-notice-tags" aria-hidden="true">
          <span>{zh ? "✓ 正规账单可查" : "✓ Official billing"}</span>
          <span>{zh ? "✓ 支持科研报销" : "✓ Reimbursement ready"}</span>
          <span>{zh ? "✓ 维护开源导航" : "✓ Supports this directory"}</span>
        </div>
        <div className="recharge-notice-actions">
          <a
            href="https://catfk.com/shop/1991"
            target="_blank"
            rel="sponsored noopener noreferrer"
            onClick={close}
          >
            {zh ? "查看代充服务" : "View top-up service"}{" "}
            <ArrowUpOutlined rotate={45} aria-hidden="true" />
          </a>
          <button type="button" onClick={close}>
            {zh ? "继续浏览" : "Continue browsing"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
