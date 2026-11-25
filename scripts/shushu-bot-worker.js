/**
 * 科研鼠鼠 · AI 选工具助手 Cloudflare Worker 安全中转网关
 *
 * 特性：
 * 1. 零账单安全锁：服务端硬编码仅调用免费模型（智谱 glm-4-flash 主力 + 腾讯混元 hunyuan-lite 备胎自动切换），
 *    忽略任何客户端传入的 model 参数，物理杜绝误调收费模型。
 * 2. 密钥隔离：API Key 仅存于 Cloudflare Workers 加密环境变量（Variables and Secrets）：
 *    - ZHIPU_API_KEY   （必填：智谱开放平台 API Key）
 *    - HUNYUAN_API_KEY （选填：腾讯混元 OpenAI 兼容接口 sk-... Key，配置后自动作为 429 限流备胎）
 * 3. 域名白名单与基础防刷：仅允许 riceai985.cc 及本地调试域名调用，单 IP 每分钟限频保护。
 */

const ALLOWED_ORIGINS = new Set([
  "https://riceai985.cc",
  "https://www.riceai985.cc",
  "http://127.0.0.1:4173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://localhost:5173",
]);

// 轻量内存级单实例限流（每 IP 每分钟最多 12 次提问，按过期与最早键渐进淘汰，避免整体清空失效）
const MAX_IP_BUCKETS = 2000;
const RATE_WINDOW_MS = 60_000;
const ipBuckets = new Map();
export function checkRateLimit(ip, now = Date.now()) {
  const record = ipBuckets.get(ip);
  if (!record || now - record.start > RATE_WINDOW_MS) {
    if (ipBuckets.size >= MAX_IP_BUCKETS && !ipBuckets.has(ip)) {
      for (const [k, v] of ipBuckets) {
        if (now - v.start > RATE_WINDOW_MS) ipBuckets.delete(k);
      }
      while (ipBuckets.size >= MAX_IP_BUCKETS) {
        const oldestKey = ipBuckets.keys().next().value;
        if (oldestKey === undefined) break;
        ipBuckets.delete(oldestKey);
      }
    }
    ipBuckets.delete(ip);
    ipBuckets.set(ip, { start: now, count: 1 });
    return true;
  }
  if (record.count >= 12) return false;
  record.count += 1;
  return true;
}

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.has(origin)) return true;
  return /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(origin);
}

function corsHeaders(origin) {
  const allow = isAllowedOrigin(origin) ? origin : "https://riceai985.cc";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const SYSTEM_PROMPT_ZH = `你是“科研鼠鼠 · Skills 导航站（riceai985.cc）”的站内 AI 选工具学长顾问（名字叫“科研鼠鼠”）。
请根据学生的提问意图灵活回应：

1. 【寒暄 / 问名字 / 闲聊 / 非科研问题】：如果学生只是打招呼、问你是谁、调侃或问与学术科研/写作/数据分析/编程工具无关的问题，请用亲切俏皮的“科研鼠鼠”学长口吻简短回应（80字以内），并引导他说出【专业 + 卡住的科研环节】，此时【不要强行推荐任何仓库】！
2. 【科研痛点与选工具咨询】：根据学生的【专业背景、科研阶段痛点、是否习惯用命令行】，从下方提供的【本站真实收录候选仓库列表】中挑选最合适的 2～3 个开源科研 Skill 推荐：
   - 严禁编造：只能推荐候选列表中真实存在的仓库（写出完整 owner/repo 名称），绝不编造列表外的仓库。
   - 真诚实用：先用一句话回应场景，再分 2～3 点说明推荐哪个 owner/repo、解决什么问题、上手门槛如何（如零命令行同学可直接复制 SKILL.md 到网页版 DeepSeek/Kimi/ChatGPT 使用）。
   - 简明易读：总字数控制在 220 字以内，语气自然像同门师兄师姐。`;

const SYSTEM_PROMPT_EN = `You are "Research Hamster (科研鼠鼠)", the AI Skill advisor for riceai985.cc.
1. If the user is just greeting, asking your name, or chatting off-topic (unrelated to research, writing, coding, or data tools), reply warmly in under 60 words and invite them to share their discipline + research bottleneck—do NOT force repository recommendations.
2. When the user asks about academic workflows or tools, recommend the best 2–3 open-source Skills ONLY from the provided candidate list using exact owner/repo names (never invent repos), keep it under 150 words, and mention zero-CLI Web AI usage (copying SKILL.md) if they prefer no CLI.`;

async function callOpenAICompatible({ endpoint, apiKey, model, messages, timeoutMs = 11000 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model, // 服务端锁死免费模型名
        messages,
        temperature: 0.4,
        max_tokens: 450,
        stream: false,
      }),
      signal: controller.signal,
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 160)}`);
    }
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Empty model response");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);
    if (request.method !== "POST" || (url.pathname !== "/api/chat" && url.pathname !== "/")) {
      return Response.json(
        { ok: true, service: "shushu-bot-worker", status: "ready" },
        { status: 200, headers },
      );
    }

    if (!isAllowedOrigin(origin)) {
      return Response.json({ error: "Origin not allowed" }, { status: 403, headers });
    }

    const clientIp = request.headers.get("CF-Connecting-IP") || "anon";
    if (!checkRateLimit(clientIp)) {
      return Response.json(
        { error: "提问太快啦，请稍等几秒再试" },
        { status: 429, headers },
      );
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400, headers });
    }

    const query = String(payload?.query || "").trim().slice(0, 300);
    const lang = payload?.lang === "en" ? "en" : "zh";
    const pageContext = String(payload?.pageContext || "").trim().slice(0, 80);
    const priorHistory = Array.isArray(payload?.history)
      ? payload.history
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.trim(),
          )
          .slice(-4)
          .map((m) => ({
            role: m.role,
            content: m.content.trim().slice(0, 240),
          }))
      : [];
    const candidates = Array.isArray(payload?.candidates)
      ? payload.candidates.slice(0, 8)
      : [];

    if (!query || !candidates.length) {
      return Response.json({ error: "Missing query or candidates" }, { status: 400, headers });
    }

    const candidateText = candidates
      .map(
        (c, idx) =>
          `${idx + 1}. ${c.repo} (★${c.stars || 0}) | 用途: ${c.summary || ""} | 任务: ${c.tasks || ""} | 安装: ${c.mode || ""}${c.webReady ? " | 免命令行网页可用" : ""}`,
      )
      .join("\n");

    const contextLine = pageContext
      ? lang === "en"
        ? `Active page filters: ${pageContext}\n`
        : `学生当前页面筛选上下文：${pageContext}\n`
      : "";

    const messages = [
      {
        role: "system",
        content: lang === "en" ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_ZH,
      },
      ...priorHistory,
      {
        role: "user",
        content:
          lang === "en"
            ? `${contextLine}Student question: ${query}\n\nCandidate Skills on site:\n${candidateText}`
            : `${contextLine}学生提问：${query}\n\n本站真实候选仓库列表：\n${candidateText}`,
      },
    ];

    const providers = [];
    if (env.ZHIPU_API_KEY) {
      providers.push({
        name: "zhipu-glm-4-flash",
        endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
        apiKey: env.ZHIPU_API_KEY,
        model: "glm-4-flash",
      });
    }
    if (env.HUNYUAN_API_KEY) {
      providers.push({
        name: "tencent-hunyuan-lite",
        endpoint: "https://api.hunyuan.cloud.tencent.com/v1/chat/completions",
        apiKey: env.HUNYUAN_API_KEY,
        model: "hunyuan-lite",
      });
    }

    if (!providers.length) {
      return Response.json({ error: "No API key configured" }, { status: 503, headers });
    }

    let lastError = "";
    for (const provider of providers) {
      try {
        const reply = await callOpenAICompatible({
          endpoint: provider.endpoint,
          apiKey: provider.apiKey,
          model: provider.model,
          messages,
        });
        return Response.json(
          { reply, provider: provider.name },
          { status: 200, headers },
        );
      } catch (err) {
        lastError = `${provider.name}: ${err?.message || err}`;
      }
    }

    return Response.json(
      { error: "Upstream busy", detail: lastError },
      { status: 502, headers },
    );
  },
};
