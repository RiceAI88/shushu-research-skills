# 鼠鼠 AI 选工具助手 · Cloudflare Workers 免费部署指南

本站已内置双模 **「鼠鼠 AI 选工具顾问」**（[ShushuAssistant.jsx](../src/components/ShushuAssistant.jsx) + [assistantEngine.js](../src/assistantEngine.js)）：
- **未部署或离线时**：自动使用浏览器端本地智能选型引擎（0 延迟、0 成本、立即可用）；
- **完成下方 3 分钟配置后**：自动启用云端 **智谱 `glm-4-flash`（主力免费） + 腾讯混元 `hunyuan-lite`（备胎免费）** 大模型自然对话。

> [!CAUTION]
> 切勿将任何明文 `API Key` 写入前端源码或提交到 GitHub 仓库。所有密钥必须仅存放在 Cloudflare Workers 后台的加密 Secret 中。

---

## 3 分钟网页端部署步骤（无需本地命令行）

1. **创建 Worker**
   - 登录 [Cloudflare 控制台](https://dash.cloudflare.com/) → 左侧点击 **Compute (Workers) → Workers & Pages** → 点击 **Create** → 选择 **Create Worker**（名字可填 `shushu-bot`）→ 点击 **Deploy**。
   - 点击右上角 **Edit code**，将仓库内 [scripts/shushu-bot-worker.js](../scripts/shushu-bot-worker.js) 的全部代码复制粘贴覆盖进去，点击右上角 **Deploy** 保存。

2. **填入加密 API Key（Variables and Secrets）**
   - 返回该 Worker 详情页 → 点击顶部 **Settings** → 找到 **Variables and Secrets** → 点击 **Add**：
     - 类型选 **Secret**，名称填 `ZHIPU_API_KEY`，值粘贴你的智谱开放平台 Key；
     - （可选备胎）再点 **Add**，类型选 **Secret**，名称填 `HUNYUAN_API_KEY`，值粘贴在 `https://console.cloud.tencent.com/hunyuan/start` 创建的混元 OpenAI 兼容 Key。

3. **一键绑定自定义子域名（让国内校园网/手机直连可用）**
   - 在同一个 **Settings** 页面找到 **Domains & Routes** → 点击 **Add** → 选择 **Custom Domain**；
   - 输入 `bot.riceai985.cc` 并保存（因为 `riceai985.cc` 已在 Cloudflare 解析，系统会自动配好 DNS 与免费 HTTPS 证书，约 30 秒生效）。

完成后打开 `https://riceai985.cc/` 点击右下角 **「AI 选工具」** 即可体验智谱 `GLM-4-Flash` 实时对话推荐！
