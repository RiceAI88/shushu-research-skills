# 前端开发

前端采用 React + Vite + Ant Design。Node.js 需要 22.12 或更高版本。

```bash
npm ci
npm run dev
```

开发地址为 Vite 输出地址根路径 `/`，英文页为其 `en/` 子路径。

```bash
npm run build
npm test
python3 -m unittest discover -s tests -v
npx playwright install chromium
npm run test:e2e
```

前端单元测试使用 Node test runner；产物测试在构建后检查下载、SEO、月报与多入口。浏览器测试使用 Playwright，默认自动启动生产预览服务。用 `SITE_URL=https://riceai985.cc/ npm run test:e2e` 可验证线上版本。

构建输出在 `dist/`，该目录不提交到 Git。Pages 工作流执行 `npm ci` 和 `npm run build`，只部署 `dist/`。Python 每日更新脚本仍维护根目录中的榜单与历史数据，自动提交后触发 Pages 重新构建。前端通过静态数据文件读取榜单；不调用需要令牌的 GitHub API。

`src/domain.js` 保存任务匹配、筛选排序和旧状态兼容逻辑；`src/i18n.js` 是双语文案；`src/App.jsx` 管理状态、布局与 Ant Design 主题；`src/components/` 包含榜单、详情和趋势组件。

所有新界面使用 Ant Design 的 `ConfigProvider`，主色为 `#0d9f6e`（翡翠绿主题），字体为既定系统字体栈。原 `assets/styles.css` 仅用于保留的静态月报，首页使用打包后的 `src/indigo.css`。

### 配色规范（翡翠绿 + 鲜橙点缀）

颜色统一定义在 `src/styles/tokens.css`（CSS 变量）与 `src/tokens.js`（Ant Design 与图表），两处保持一致。新增样式**不要写死颜色值**，请使用令牌：

| 用途 | 令牌 | 亮色 / 暗色 |
|---|---|---|
| 品牌主色：选中态、主操作按钮、链接 | `--prs-primary` | `#0d9f6e` / `#34d399` |
| 主色半透明（描边、浅底） | `rgb(var(--prs-primary-rgb) / <透明度>)` | — |
| 鲜橙点缀：实心色块（按钮、奖牌） | `--prs-warm` | `#f26a1b` / `#ff7a1a` |
| 鲜橙点缀：文字（增长数字等） | `--prs-warm-strong` | `#ea580c` / `#ff8a3d` |
| 鲜橙浅底（仅限提示词占位符等小面积） | `--prs-warm-tint` | `#fff1e8` / 16% 透明橙 |
| 中性浅底 / 标签底 | `--prs-bg` / `--prs-tag-bg` | — |

用色原则：

- **绿色只用于品牌、选中态、主操作和链接**，不要再用于大面积背景、普通标签和装饰描边；未选中的图标、计数、次要按钮一律使用中性灰。
- **鲜橙只做少量点缀**：增长数字、前三名奖牌、"支持本站"、今日新增、提示词占位符、合作徽章。鲜橙要用实心色块或鲜亮文字，避免冲淡成奶油色大底（会显得像琥珀色）。
- **不使用琥珀 / 土黄色**（如 `#f59e0b`、`#fef3c7`），需要暖色时统一用 `--prs-warm*` 令牌。

收藏、对比和偏好继续使用原 `ars-*` localStorage 键，分享链接沿用既有 hash 参数。迁移不要求清理浏览器数据。
