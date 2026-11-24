import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CloseOutlined } from "@ant-design/icons";
import qrImage from "../../assets/research-community-2026-11-30.jpg";
import { REPOSITORY_URL, beijingDay } from "../domain";

export const COMMUNITY_EVENT = "ars-open-community";
export const COMMUNITY_QR_VALID_UNTIL = "2026-11-30";

function resolveQrSrc() {
  if (
    typeof window !== "undefined" &&
    typeof window.__ARS_COMMUNITY_QR_URL === "string" &&
    window.__ARS_COMMUNITY_QR_URL.trim()
  ) {
    return window.__ARS_COMMUNITY_QR_URL.trim();
  }
  return qrImage;
}

let preloadedSrc = "";
// 悬停或触摸顶部入口按钮时提前预热 137KB 二维码图片，点击即出图
export function preloadCommunityQr() {
  if (typeof Image === "undefined") return;
  const src = resolveQrSrc();
  if (!src || preloadedSrc === src) return;
  preloadedSrc = src;
  const img = new Image();
  img.decoding = "async";
  img.src = src;
}

export function triggerCommunityDialog() {
  window.dispatchEvent(new CustomEvent(COMMUNITY_EVENT));
}

export default function CommunityDialog({ lang, openOnMount = false }) {
  const dialog = useRef(null);
  const imgRef = useRef(null);
  const qrSrc = resolveQrSrc();
  const [imgLoaded, setImgLoaded] = useState(false);

  useLayoutEffect(() => {
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth > 0) {
      setImgLoaded(true);
    }
  }, [qrSrc]);

  useLayoutEffect(() => {
    if (openOnMount && dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
  }, [openOnMount]);

  useEffect(() => {
    const open = () => {
      if (dialog.current && !dialog.current.open) {
        dialog.current.showModal();
      }
    };
    window.addEventListener(COMMUNITY_EVENT, open);
    return () => window.removeEventListener(COMMUNITY_EVENT, open);
  }, []);

  const zh = lang === "zh";
  const hasCustomQr = qrSrc !== qrImage;
  const qrExpired = !hasCustomQr && beijingDay() > COMMUNITY_QR_VALID_UNTIL;
  const title = zh ? "各专业科研 Skills 交流群" : "Research Skills Community";
  const loadingLabel = zh ? "正在加载群二维码…" : "Loading group QR code…";
  const modal = (
    <dialog
      ref={dialog}
      className="community-dialog"
      aria-labelledby="community-dialog-title"
      onClick={(event) => {
        if (event.target === dialog.current) {
          const box = dialog.current.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            dialog.current.close();
        }
      }}
    >
      <div className="community-dialog-heading">
        <h2 id="community-dialog-title">{title}</h2>
        <button
          type="button"
          aria-label={zh ? "关闭二维码" : "Close QR code"}
          onClick={() => dialog.current.close()}
        >
          <CloseOutlined aria-hidden="true" />
        </button>
      </div>
      <div className={`community-qr-stage${imgLoaded ? " is-loaded" : " is-loading"}`}>
        {!imgLoaded && (
          <div
            className="community-qr-skeleton"
            role="status"
            aria-busy="true"
            aria-label={loadingLabel}
          >
            <span>{loadingLabel}</span>
          </div>
        )}
        <img
          ref={imgRef}
          src={qrSrc}
          alt={
            zh
              ? "AI科研交流群1 微信入群二维码，11月30日前有效"
              : "WeChat group QR code, valid before November 30"
          }
          width="660"
          height="1024"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgLoaded(true)}
        />
      </div>
      <p>
        {qrExpired ? (
          zh ? (
            <>
              当前群二维码可能已过 7 天有效期，可前往{" "}
              <a
                href={`${REPOSITORY_URL}/issues/new?template=feedback.yml`}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub 反馈入口
              </a>{" "}
              获取最新入群码。
            </>
          ) : (
            <>
              This 7-day WeChat QR code may have expired. Request a refreshed invite via{" "}
              <a
                href={`${REPOSITORY_URL}/issues/new?template=feedback.yml`}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub Issues
              </a>
              .
            </>
          )
        ) : zh ? (
          "微信扫码加入，手机端可长按保存图片。"
        ) : (
          "Scan with WeChat, or save the image on your phone."
        )}
      </p>
    </dialog>
  );
  return typeof document !== "undefined"
    ? createPortal(modal, document.body)
    : modal;
}
