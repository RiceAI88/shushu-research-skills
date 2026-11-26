# 更新日志 · Changelog

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。数据型仓库的"功能"指榜单 / 脚本 / 可视化能力，而非仓库数据本身（数据每日自动更新）。

## 2026-11-26 · 首屏体积瘦身、子技能穿透搜索与免登录推荐弹窗

- **`history.js` 按需懒加载（首屏减负 537 KB）**：`render_data_js` 预计算 7 日历史基线布尔标记 `has_7d_baseline`，默认卡片流首屏不再阻塞下载 `data/history.js`，仅在切入「数据洞察 / 表格视图 / 对比弹窗」时按需异步加载。
- **首页搜索框千级子技能穿透检索**：输入关键词时自动按需挂载子技能索引，匹配大合集内子技能时卡片高亮展示「`🧩 命中子技能`」提示条，点开详情抽屉自动过滤定位到对应子技能。
- **免登录站内「推荐 Skill」弹窗（`RecommendSkillModal`）**：支持已收录仓库秒级去重直达、免登录一键提交（联动 Worker `/api/recommend`）与预填 GitHub Issue 双通道，提交后支持一键扫码进科研交流群。
- **全站代充文案对齐与死样式清理**：统一进站提示、鼠鼠 AI 与详情页代充说明为 `ChatGPT / Claude / Gemini / Codex`，清理废弃旧横幅组件及 360+ 行冗余样式。

## 2026-11-26 · 首屏带图海报轮播广告窗（改良版 1B）与月报双栏升级

- **首屏右上角流光丝带海报窗（`HeroPosterAd`）**：标题区采用「左标题 + 右侧矢量丝带海报」分栏，下排搜索框独占 100% 整行大宽度；内置「专业 AI 订阅正规代充（ChatGPT · Claude · Gemini · Codex）」与「智一刻 AI 学术写作工作台」双海报轮播及手动切页，彻底移除列表上方横幅，首排工具卡片进一步上提。
- **月度报告阅读页双栏升级**：`/reports/` 索引与各月度报告页升级为「主报告 + 右侧粘性目录 & 推荐服务」双栏阅读布局，窄屏自动流式堆叠。

## 2026-11-25 · 活跃维护筛选、官方课题组工具包与子技能目录预览

- **「仅看活跃维护」过滤开关**：筛选弹窗新增「仅看活跃维护（`#active=1`）」开关一键排除 `stale` 长期停更仓库，空结果时支持单步放宽。
- **官方精选「课题组工具包」快捷入口**：工具栏新增 5 套高频学科与场景官方精选工具包下拉菜单，一键加载 `#pack=` 专属清单支持整包收藏与同门转发。
- **多技能合集仓库子技能目录浏览器**：新增 `scripts/auto_extract_subskills.py`（接入每日定时任务增量同步 Git Tree `SKILL.md` 目录）与懒加载组件 `SubskillsExplorer`，详情抽屉支持实时搜索仓库内子技能、一键复制单子技能调用提示词并直达官方 `SKILL.md` 源码。

## 2026-11-25 · 提示词行内填空、最近浏览回溯与月报视觉升级

- **详情页提示词行内填空复制**：`SkillUsageGuide` 自动提取提示词中的可编辑占位符（自动跳过已填好的技能名称），支持点击橙色占位符或在填空栏输入文件名/课题，实时预览并一键复制去括号成品提示词。
- **「最近看过」回溯与窄屏悬浮避让**：打开项目详情时本地记录最近浏览的 12 个仓库，筛选弹窗与已选条件栏新增「最近看过（`#recent=1`）」快捷筛选并按最近浏览倒序展示；窄屏向下滚动出现“回到顶部”时自动收窄右下角桌宠底座，消除卡片遮挡。
- **月度报告 `/reports/` 视觉重制**：重写静态月报样式表 `assets/styles.css`（翡翠绿 + 鲜橙点缀 + 系统暗色自适应），升级月报索引卡片与增量高亮样式。

## 2026-11-25 · 检索引擎分词升级、AI 顾问多轮联动与学科自动提炼

- **分词与复合意图检索引擎**：升级 `src/search.js`，支持空格多词 AND 组合（如 `stata 回归`、`python 配图`、`zotero 笔记`）与无空格中英/中文复合词切分（如 `英文润色`、`python配图`），补齐流程图、跑实验、排版、Meta 分析等高频口语词，同时保留长句口语触发空结果交接 AI 顾问的机制。
- **空结果单步放宽与零结果埋点**：`EmptyResults` 新增“包含跨专业通用 Skills / 放宽到整个学科门类 / 切换到全部专业 / 取消免安装限制 / 不限 AI Agent”单步精准诊断按钮，并防抖上报 `search_empty` 事件沉淀搜索缺口。
- **鼠鼠 AI 多轮记忆与页面筛选感知**：`assistantEngine` 与 Cloudflare Worker 支持携带最近对话轮次与当前页面已选专业、任务、免安装筛选状态进行上下文加权推荐，并新增推荐结果一键打开横向对比弹窗。
- **未归类项目自动提炼流水线**：新增 `scripts/auto_enrich_disciplines.py` 并接入每日定时工作流 `update-rankings.yml`，自动拉取未归类 Skills 的官方 README（绑定 40 位 blob SHA 与原文摘录）区分学科专用与跨专业通用档案。

## 2026-11-25 · 配色减绿与鲜橙点缀

- **绿色收敛**：保留翡翠绿主色 `#0d9f6e`，但只用于品牌、选中态、主操作与链接；顶部公告条与页头去掉薄荷渐变，Hero 胶囊、KPI 图标、未选中 Tab 计数、"专业适用"标签、合作横幅等改为中性灰底。
- **鲜橙点缀**：新增 `--prs-warm` 系列令牌（亮色 `#f26a1b` / 暗色 `#ff7a1a`），用于增长数字、第 1/3 名奖牌、"支持本站"实心按钮、今日新增、标题下划线与合作徽章；图表第三系列色与分类色板中的第二种绿色替换为鲜橙；"近 7 日增长"条形图改为鲜橙（第一名实心，其余亮色为半透明橙、暗色为石板灰）。
- **详情页同步**：产出效果预览卡、安装命令块、国内镜像按钮、AI 代装 / 网页版指引、提示词卡片与合作提示条改为中性底；提示词中的待替换占位符改为鲜橙高亮。
- **清理写死颜色**：约 130 处写死的绿色 / 琥珀色 `rgba` 与 hex 统一替换为令牌变量（新增 `--prs-primary-rgb`、`--prs-warm-rgb`），全站移除琥珀 / 土黄色。
- **橙色控量与全站一致性**："支持本站"改为橙色描边；合作横幅只保留"全站推荐"一处橙色；标题关键词去掉下划线。表格视图"近 7 日"增长改为鲜橙、"命令安装"改为中性灰；对比弹窗中"推荐理由可能已过期"提醒改为鲜橙；专业路径弹窗的仓库名改为正文色、角色标签与步骤圆点中性化；新手引导示例框与筛选弹窗"免安装"圆点与全站统一。

## 2026-11-22 · 学生体验升级、全量中文导读与收录标准 2.0

### 学生易用性与校园分享

- **全量中文导读与自动兜底**：全站 **661** 个收录项目（429 个 Skills + 230 个科研相关项目）实现 **100%** 中文可读覆盖；采集脚本新增 `synthesize_chinese_use_fallback`，使后续每日新入榜的纯英文项目也能自动生成中文用途提示（人工精修词条优先）；官方文档核验的学科档案扩充至 **167** 个，Top 30 热门 Skills 全部配备专属实战提示词案例。
- **同门分享与课题组工具包（`#pack=`）**：详情抽屉新增“分享给同门”一键复制微信群/小红书友好安利文案；收藏夹新增“分享清单”生成 `#pack=` 专属合集链接与文案，同门打开后可浏览专属清单并一键全部收入收藏。
- **零命令行网页版 AI 指引与环境门槛标签**：详情抽屉顶部新增客观环境门槛小标签（纯规则文档、需本地 Python、需 R/Stata、需 GPU、按需自备外部 API Key）；为所有 Skill 提供复制 `SKILL.md` 到 DeepSeek / Kimi / Claude / ChatGPT 网页版直接使用的引导词与入门说明。
- **论文阶段急救场景速配（`#stage=`）**：首屏筛选区新增“本科毕设起步 / 开题文献综述 / 顶刊配图流程图 / 问卷与实证计量 / 组会 PPT 与海报 / 润色改写与返修” 6 大高频场景快捷筛选。
- **详情抽屉产出效果预览卡（`OutputPreviewCard`）**：面向 32 个高频旗舰项目（覆盖润色去防御性写作、顶刊 Python/Visio/Origin 配图、论文转 PPT/海报、中文毕业论文 Word 排版、实证计量与全流程科研套件），按需懒加载展示“修改前 vs 修改后”双栏对比或“输入材料 → 处理链路 → 典型产出文件”示意卡片。
- **20 个静态 SEO 学科与任务专题落地页**：构建阶段自动预生成 12 个学科门类页（`/disciplines/<id>/`）与 8 个科研任务页（`/topics/<id>/`），每页内置独立 `<title>`、`<meta description>`、自引用 `canonical`、真实筛选 Top 20 `ItemList` JSON-LD、`<noscript>` 排行与内部互链，并在客户端零闪烁水合对应筛选状态，同步纳入 `sitemap.xml`。
- **配色体系与视觉动线重构（UI/UX 2.0）**：统一三层筛选胶囊选中态色系；将“跨专业通用”降噪为中性石板灰标签以突出“专业适用”青绿高亮，移除榜首标题土黄色干扰；卡片将中文核心用途提升为第一阅读焦点、收敛 Star 字号并增加悬停“上手指南 ›”引导；首屏紧凑化 KPI 指标卡、无缝合并“学科 + 急救场景”定位工作台并替换为单色矢量图标、静默化空态今日新增条；详情抽屉升级为单行紧凑头部与左侧时间轴连线（Timeline Stepper）。
- **站内“鼠鼠 AI 选工具顾问”双模机器人**：右下角新增按需懒加载对话顾问（`ShushuAssistant` + `assistantEngine`），基于全站真实收录库进行本地多维 RAG 候选召回后，通过 Cloudflare Workers 安全网关（`bot.riceai985.cc`）调用免费大模型（智谱 `glm-4-flash` 主力 + 混元 `hunyuan-lite` 自动故障切换 + 本地智能顾问离线兜底），支持回复内一键点开仓库详情抽屉与一键打包 `#pack=` 推荐工具清单。

### 收录与发现

- **收录规模**：486 → 661 个仓库（Skills 304 → 429，科研相关项目 180 → 230），专业科研路径 7 → 10 条。
- **伪克隆去重与论文列表归位**：新增 `dedupe_unforked_clones` 自动剔除未走 Fork 按钮但照搬高星原仓简介的复制仓（如 `Tyche-MKR/scientific-agent-skills`），新增 `is_paper_collection_repo` 将纯论文阅读清单（如 `Awesome3DGS/3D-Gaussian-Splatting-Papers`）归入科研相关项目。
- **排除规则**：新增镜像仓库（`mirror of` / `auto-generated`）、留学申请材料、自媒体与短视频起号、社媒图文轮播营销、“一句话出论文”代写工具等非科研主用途排除，共移除 6 个已收录项目。
- **README 用途判定**：首段只有徽章墙或一句口号时，补读第一章节的非列表段落；匹配改用单词边界（`antithesis` 不再误判为 `thesis`）。由此找回 `AutoResearchClaw`、`feynman`、`paper-qa`、`awesome-ai-research-writing` 等种子名单内却被误拒的项目。
- **候选核验排序**：元数据同时带 Skill 与学术信号的候选优先读取 README，避免通用大仓库挤占每日预算。
- **搜索覆盖**：新增 30–99 Stars 分段；裸词“科研”“论文”收紧为带能力约束的组合；补充考古、兽医、遥感、学术海报、数学建模、古籍、法学、计量等检索式。

### 每日更新工作流

- **推送冲突**：采集耗时约 20 分钟，期间 `main` 若有新提交会导致推送被拒（`non-fast-forward`）。现改为提交后最多 3 次 `fetch + rebase` 重试，冲突无法自动解决时中止本次 rebase 再重试。
- **过期快照删除**：暂存路径交给 git pathspec 匹配，按 60 天保留期删除的历史快照能被正确提交。
- **API 配额**：push 日期未变的仓库沿用上期 `SKILL.md` 计数，每次约节省 450 次 GitHub API 请求。
- **告警闭环**：运行成功后自动关闭 `auto-update-failure` Issue。

### 前端与构建

- 首屏同步脚本 `data/rankings.js` 去除 10 个仅供采集使用的字段（660 KB → 565 KB）；部署包不再包含 21 MB 候选库与原始历史快照（49 MB → 7 MB）。
- 中文搜索补充 PPT/幻灯片、去 AI 味、文献综述、返修、数据分析、生信、数学建模、科研计算等意图词。
- 修复卡片对齐 E2E 测试在入场动画期间测量导致的偶发失败。

## v2.2 — 2026-09-27

从"发现"走向"信任与使用"：新增质量信号、月度报告、独立英文页与一批让榜单可以直接用的交互。

### 排名脚本与数据

- **`max_results` 100 → 150**：搜索翻页后收录量触及旧上限，放宽到 150。
- **`skills_count` 字段**：每日用 git trees API 统计每个仓库的 `SKILL.md` 数量（API 失败为 `null`，大仓库在 GitHub 截断树时为下界）——比 Stars 更贴近"实用性"的硬信号。
- **`stale` 字段**：超过 30 天无 push 且 7 天零 Star 增长的仓库标记为"疑似停更"（两条件同时满足才标记，保守策略）。
- **`verifies_citations` 字段**：按描述/主题关键词识别是否宣传"引用核验 / 零幻觉文献 / source validation"——文献与深研类仓库最关键的差异点。
- **月度报告**：`reports/YYYY-MM.html` 每月自动总结新收录、上升前 10、停滞与跌出仓库；历史月份页面一旦生成就冻结，不受 60 天快照回收影响。入口在 `reports/index.html`。
- 以上新字段均同步进 CSV；README / sitemap 新增 English Dashboard、月报入口。

### 可视化与交互（前端）

- **科研阶段导航**：分类条改为固定科研阶段顺序（① 深度研究 → ② 文献综述 → ③ 实验复现 → ④ 论文写作 → ⑤ 评审反馈 → ⑥ 学科专项 → ⑦ 综合），与真实科研流程对齐。
- **质量徽章**：表格 / 卡片 / 抽屉展示 `N skills`、`引用核验 ✓`、`疑似停更` 徽章；抽屉统计行新增 Skills 数。
- **一键复制安装命令**：抽屉内复制 `npx skills add owner/repo`（skills.sh 标准 CLI），把"看榜"变成"装上"。
- **详情深链**：抽屉状态写入 URL hash（`#repo=owner/name`），任意条目可分享直达。
- **增长对比**：勾选最多 3 个仓库（表格 / 卡片的 ⇄ 按钮），底部托盘 + 弹层叠加显示相对各自窗口起点的 Star 增长百分比曲线。
- **订阅入口前移**：头部新增 RSS 与月报按钮。
- **独立英文页 `/en/`**：英文为默认语言的完整镜像页（`hreflang` 双向标注、独立 canonical / OG / JSON-LD），主站保留中文优先 + 手动切换。
- **修复**：sparkline 与趋势色引用了不存在的 CSS 变量（`--ars-line` / `--ars-accent` / `--ars-trend-hot-fg`），颜色一直走无效回退，已改为真实 token（`--ars-rule` / `--ars-ember` / `--ars-teal` / `--ars-faint`）。

### 发布管道（CI/CD）

- **PR 推荐自动核验**：`verify-pr.yml` 在改动了 `config/ranking.json` 的 PR 上自动提取新增种子仓库，逐个调 GitHub API 核对收录标准（≥100★、非 fork、未归档），以表格评论贴到 PR（同 PR 更新而非新增评论）。

### 测试

- 新增 9 个测试（SKILL.md 计数、stale 判定、引用核验、月报渲染、字段输出），共 34/34 通过。

## v2.1 — 2026-09-27

工程质量与发布管道修复，全部改动有测试覆盖（29/29 通过）。

### 排名脚本与数据

- **榜单不再收录自身**：新增 `exclude_repositories` 配置（默认排除本仓库），排行榜不再把自己排进榜。
- **搜索翻页 + 限流退避**：每个查询最多抓 2 页（per_page 50 → 100），长尾仓库可被发现；`github_request` 对 403/429/5xx 按 `Retry-After` / 指数退避重试，查询间隔放宽以守住 Search API 30 次/分钟上限。
- **RSS 规范化**：`pubDate` / `lastBuildDate` 从 ISO 8601 改为 RSS 2.0 要求的 RFC-822 格式。
- **Sitemap 规范化**：移除 `#english` 锚点 URL（sitemap 协议不允许 fragment）。
- **数据脚本瘦身**：`rankings.js` / `history.js` 改用紧凑 JSON 分隔符（history.js 约 204KB → 约 70KB），并在 `index.html` 中以 `defer` 加载。

### 发布管道（CI/CD）

- **新增 PR CI**：`.github/workflows/ci.yml` 在 pull_request / push 时校验 JSON 并跑全部测试——此前 PR 没有任何机器验证。
- **update workflow 并发保护**：加 `concurrency` 组，避免手动触发与定时跑的 auto-commit 互相冲突。
- **失败通知去重**：连续失败时改为在已有 `auto-update-failure` issue 下追加评论，不再每天开新 issue。
- **Open Graph 封面 PNG 化**：CI 安装 `cairosvg` + Noto CJK 字体，每日把 `og-cover.svg` 栅格化为 `og-cover.png` 并提交（OG / Twitter 抓取器不渲染 SVG）；`index.html` 的 `og:image` / `twitter:image` 改指向 PNG。

### 杂项

- 移除 `renderTable` 中未使用的 `d30` 死代码；修复 `hashchange` 双重渲染；简化 `render_history_series` 中易误读的 `or/and` 复合条件；修正 TOC 渲染注释与实际排序不一致。
- 新增「反馈 / Bug 报告」issue 模板，并允许空白 issue。

## v2.0 — 2026-07-10

可视化重做 + 数据增强 + SEO 订阅。一次大版本升级，覆盖四个方向。

### 可视化与交互（前端）

- **设计系统**：完整 design token，明 / 暗双主题（手动切换 + `prefers-color-scheme`），渐变标题，表格数字等宽对齐。
- **双视图**：表格 + 响应式卡片网格（`auto-fill 300px`），视图状态持久化到 `localStorage`。
- **趋势 sparkline**：基于 `data/history.js` 在前端渲染内联 SVG 7d/30d 趋势曲线（无库）；无历史时降级为虚线。
- **详情抽屉**：点击任意行 / 卡片滑出右侧抽屉，展示完整元数据、topics、精准信号、适用 Agent、统计与外链。
- **收藏夹**：每行星标切换、"仅看收藏"过滤、计数徽章、导出为 JSON。
- **URL 状态分享**：`query/category/sort/view/lang/theme/favorites` 序列化进 `location.hash`，分享链接可复现视图。
- **键盘快捷键**：`/` 搜索 · `t` 主题 · `l` 语言 · `v` 视图 · `f` 收藏 · `Esc` 关闭。
- **统计概览条**：总 Stars、平均 Stars、近 7d 净增、最热仓库、分类分布 mini-bar。
- **无障碍**：跳转链接、`aria-pressed` / `aria-label`、`role=dialog`、sparkline `<title>`、`prefers-reduced-motion` 降级。

### 排名脚本与数据增强（后端）

- **丰富字段**：`rest_to_repo` 抽取 `forks_count` / `open_issues_count` / `size_kb` / `default_branch` / `has_issues` / `has_wiki` / `has_discussions` / `watchers_count` / `license`（key/name/spdx_id），并 surfacing 到每个 item。
- **30 天增量**：新增 `star_delta_30d`（30 天窗口，无更长历史时退化为 7d）。
- **历史聚合**：生成 `data/history.js`（紧凑的每仓库 `{date, stars}` 序列）供前端 sparkline。
- **信号扩充**：`SKILL_TERMS` 加 cursor / gemini / copilot / antigravity / cline / continue 等；`ACADEMIC_TERMS` 加 retrieval / grounding / systematic review / preprint / doi 及中文（综述 / 复现 / 审稿 / 引用 等）；`NEGATIVE_TERMS` 加 cheatsheet / game / fitness 等；分类关键词扩充（beamer / overleaf / physics / math / statistics / law / education 等）。
- **搜索查询**：新增 8 条查询（含中文 `科研 skill` / `论文 skill` / `文献综述 skill`）。
- **CSV**：新增 `language` / `license` / `forks` / `open_issues` / `star_delta_30d` 列。
- **测试**：新增 7 个测试（丰富字段、30d 增量、cursor 接受、cheatsheet 拒绝、历史序列），共 21/21 通过。

### SEO 与可发现性

- `robots.txt`、`sitemap.xml`（首页 + 数据端点 + 文档）、`feed.xml`（RSS 2.0，每日新收录 + 趋势上升）、`assets/og-cover.svg`（1200×630 每日封面）。
- `index.html`：Open Graph、Twitter Card、canonical、RSS 发现链接、sitemap 链接、内联 SVG favicon、JSON-LD `ItemList`。
- workflow `file_pattern` 覆盖所有新资产。

### 双语与文档

- i18n 补齐所有新增 UI 文案（视图 / 主题 / 收藏 / 快捷键 / 抽屉 / 统计 / 空状态）。
- README 特色列表与 English 段全面更新；新增 [更新日志](docs/changelog.md) 链接。
- `docs/methodology.md` 补 30 天窗口、`history.js`、数据字段、SEO 资产说明。
- `docs/discoverability.md` 更新 SEO 资产清单与 v2.0 Release 提示。
- `CONTRIBUTING.md` 新增"贡献前端样式 / 新视图"小节。
- Issue 模板新增"适用 Agent"多选。

## v1.0.0 — 2026-06-30

首个稳定版：21 个仓库、7 天趋势窗口、历史快照（60 天保留）、双语可视化、自动每日更新、GitHub Pages 部署、测试与贡献指南。
