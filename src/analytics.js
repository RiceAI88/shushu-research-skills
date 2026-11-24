const SITE_URL = "https://riceai985.cc/";
export const CLARITY_PROJECT_ID = "zihqusczc3";
export const LA_ID = "3RvWxo8gzUw6CRfi";
export const LA_CK = "3RvWxo8gzUw6CRfi";

let started = false;

export function startAnalytics() {
  const site = new URL(SITE_URL);
  if (
    started ||
    location.origin !== site.origin ||
    !location.pathname.startsWith(site.pathname) ||
    navigator.webdriver
  ) {
    return;
  }
  started = true;

  // 保留进站时的原始落地路径与推广参数（如 utm_source），避免后续哈希筛选覆盖
  const entryURL = location.pathname + location.search;

  // 1. Microsoft Clarity（录屏回放 + 点击/滚动热力图 + 转化事件标记）
  if (CLARITY_PROJECT_ID) {
    window.clarity =
      window.clarity ||
      function () {
        (window.clarity.q = window.clarity.q || []).push(arguments);
      };
    window.clarity("set", "entry_url", entryURL);
    if (document.referrer) {
      window.clarity("set", "entry_referrer", document.referrer);
    }
    const clarityScript = document.createElement("script");
    clarityScript.async = true;
    clarityScript.defer = true;
    clarityScript.src = `https://www.clarity.ms/tag/${CLARITY_PROJECT_ID}`;
    clarityScript.dataset.clarityId = CLARITY_PROJECT_ID;
    document.head.append(clarityScript);
  }

  // 2. 51LA V6 国内流量与事件统计（配置 LA_ID 后自动生效）
  if (LA_ID) {
    const laScript = document.createElement("script");
    laScript.id = "LA_COLLECT";
    laScript.async = true;
    laScript.charset = "UTF-8";
    laScript.src = "https://sdk.51.la/js-sdk-pro.min.js";
    laScript.addEventListener(
      "load",
      () => {
        try {
          window.LA?.init({
            id: LA_ID,
            ck: LA_CK || LA_ID,
            autoTrack: true,
            hashMode: false,
          });
        } catch {
          /* 统计初始化异常绝不阻断正常浏览 */
        }
      },
      { once: true },
    );
    document.head.append(laScript);
  }
}

// 统一上报核心转化点击与工具复制行为（同时支持 Clarity 会话事件筛选与 51LA 事件报表）
export function trackEvent(name, data = {}) {
  if (typeof window === "undefined" || navigator.webdriver || !name) return;
  try {
    if (typeof window.clarity === "function") {
      window.clarity("event", name);
      for (const [k, v] of Object.entries(data || {})) {
        if (v !== undefined && v !== null && v !== "") {
          window.clarity("set", `${name}_${k}`, String(v));
        }
      }
    }
    if (window.LA?.track) {
      window.LA.track(name, data);
    }
  } catch {
    /* ignore */
  }
}
