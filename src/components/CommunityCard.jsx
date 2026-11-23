import React, { useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CloseOutlined } from "@ant-design/icons";
import qrImage from "../../assets/research-community-2026-11-30.jpg";

export const COMMUNITY_EVENT = "ars-open-community";

export function triggerCommunityDialog() {
  window.dispatchEvent(new CustomEvent(COMMUNITY_EVENT));
}

export default function CommunityDialog({ lang, openOnMount = false }) {
  const dialog = useRef(null);
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
  const title = zh ? "各专业科研 Skills 交流群" : "Research Skills Community";
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
      <img
        src={qrImage}
        alt={
          zh
            ? "AI科研交流群1 微信入群二维码，11月30日前有效"
            : "WeChat group QR code, valid before November 30"
        }
        width="660"
        height="1024"
        loading="lazy"
        decoding="async"
      />
      <p>
        {zh
          ? "微信扫码加入，手机端可长按保存图片。"
          : "Scan with WeChat, or save the image on your phone."}
      </p>
    </dialog>
  );
  return typeof document !== "undefined"
    ? createPortal(modal, document.body)
    : modal;
}
