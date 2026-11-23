import outputPreviews from "../config/output-previews.json" with { type: "json" };

const PREVIEW_LOOKUP = new Map(
  Object.entries(outputPreviews).map(([repo, entry]) => [
    repo.toLowerCase(),
    { ...entry, isCurated: true },
  ]),
);

// 新收录及未手动配置项目的智能场景匹配模板（8 类使用前后对比 + 2 类交付流水线，确保全站 100% 覆盖）
const FALLBACK_TEMPLATES = [
  {
    id: "rebuttal",
    match: /\b(?:rebuttal|peer[- ]?review|reviewer|referee|submission|desk[- ]?reject)\b|审稿|返修|投稿/i,
    preview: {
      mode: "before_after",
      label_zh: "审稿意见回复与投稿自查改写示意",
      label_en: "Peer-review rebuttal & pre-submission check",
      before_zh:
        "Reviewer 2 根本没仔细看第 3 节，我们早就解释过参数设置了，而且返修期补做大规模实验完全不现实。",
      after_zh:
        "感谢审稿人指出第 3 节方法可读性问题。我们已在修订稿表 R1 补充单卡可复现的消融对比，并在第 3.2 节高亮标出超参数敏感度边界。",
      before_en:
        "Reviewer 2 missed Section 3 where parameters were already explained, and running extra large-scale experiments is unrealistic.",
      after_en:
        "We thank Reviewer 2 for pointing out clarity in Sec. 3. We added an ablation table (Table R1) and highlighted sensitivity bounds in Sec. 3.2.",
      takeaway_zh:
        "将防御性辩解转化为“礼貌致谢 + 新增实验证据编号 + 正文具体修订定位”的标准返修结构。",
      takeaway_en:
        "Converts defensive replies into polite acknowledgement, targeted evidence (Table R1), and exact manuscript locations.",
    },
  },
  {
    id: "humanizer",
    match: /\b(?:humaniz|anti[- ]?ai|aigc|polish|proofread|paraphras|prose)\b|降重|降ai|润色|改写|去ai味/i,
    preview: {
      mode: "before_after",
      label_zh: "去除 AI 模板套话与严谨学术润色示意",
      label_en: "De-templated academic prose polishing",
      before_zh:
        "在人工智能飞速发展的宏大背景下，本研究深入探讨了多模态融合的内在机制，不仅填补了研究空白，更为未来发展注入了强劲动力。",
      after_zh:
        "针对跨模态对齐在低资源医学影像上的退化问题，本文在 3 个公开胸片数据集（N = 18,420）上评估特征门控融合，使少样本召回率提升 6.4%。",
      before_en:
        "In the rapidly evolving era of AI, this study delves into multimodal fusion, not only filling a crucial gap but also paving the way for future advances.",
      after_en:
        "Evaluating gated cross-modal fusion across three chest X-ray cohorts (N = 18,420), our method improves few-shot recall by 6.4% under low-label regimes.",
      takeaway_zh:
        "删去“宏大背景下 / 深入探讨 / 注入强劲动力”等高频 AI 腔套话，用研究对象、样本量与量化指标说话。",
      takeaway_en:
        "Replaces LLM clichés and vague praise with concrete cohorts, sample sizes, and quantified improvements.",
    },
  },
  {
    id: "latex_format",
    match: /\b(?:latex|bibtex|typst|overleaf|docx|word[- ]template|typeset|thesis[- ]template)\b|排版|模板|格式/i,
    preview: {
      mode: "before_after",
      label_zh: "论文排版语法与图表交叉引用纠偏示意",
      label_en: "Manuscript typesetting & citation formatting",
      before_zh:
        "如图1所示，损失函数 L_total = log(p(y|x)) 在阈值 -0.5 处收敛，详见文献 [1] 的证明（见第 ?? 节）。",
      after_zh:
        "如图~\\ref{fig:curve} 所示，目标函数 $\\mathcal{L}_{\\mathrm{total}} = \\log p(y\\mid x)$ 在阈值 $-0.5$ 处收敛，详见 \\citet{smith2024}（第~\\ref{sec:proof} 节）。",
      before_en:
        "As shown in Fig.1, loss L_total = log(p(y|x)) converges at -0.5, see [1] in Section ??.",
      after_en:
        "As shown in Figure~\\ref{fig:curve}, $\\mathcal{L}_{\\mathrm{total}} = \\log p(y\\mid x)$ converges at $-0.5$; see \\citet{smith2024} (Section~\\ref{sec:proof}).",
      takeaway_zh:
        "统一处理正体数学算子、直立下标、不间断引用空格与高校/期刊模板样式规范，避免格式审查返工。",
      takeaway_en:
        "Standardizes math operators, non-breaking cross-references, citation macros, and university/journal style rules.",
    },
  },
  {
    id: "figures_slides",
    match: /\b(?:figure|plot|chart|diagram|illustration|poster|ppt|slide|beamer|matplotlib|ggplot|visio|mermaid)\b|绘图|配图|流程图|海报|组会/i,
    preview: {
      mode: "before_after",
      label_zh: "顶刊级科研图表与学术展示规范升级示意",
      label_en: "Publication-grade figure & layout refinement",
      before_zh:
        "默认高饱和红绿折线堆叠、图例遮挡数据点、字号忽大忽小，导出低清截图放大后边缘发虚。",
      after_zh:
        "切换色盲友好 Okabe-Ito 色板与统一 8pt Arial 字号，自动添加 95% 置信带并导出 300 DPI 可编辑 PDF/SVG 矢量图与复现脚本。",
      before_en:
        "Default neon red/green lines with overlapping legends, inconsistent font sizes, and blurry raster screenshots.",
      after_en:
        "Colorblind-safe Okabe-Ito palette, uniform 8pt Arial labels, shaded 95% CIs, and 300 DPI vector PDF/SVG with reproducible script.",
      takeaway_zh:
        "告别审美随缘的手工调图，用可复现代码一次性对齐顶刊双栏尺寸、色板与矢量输出标准。",
      takeaway_en:
        "Replaces ad-hoc manual tweaking with reproducible scripts matching journal column widths, safe palettes, and vector output.",
    },
  },
  {
    id: "citation_find",
    match: /\b(?:pubmed|arxiv|zotero|semantic[- ]scholar|openalex|crossref|citation|bibliograph|literature[- ]search)\b|找文献|检索|引文|查文献/i,
    preview: {
      mode: "before_after",
      label_zh: "可核验文献检索与防幻觉引文整理示意",
      label_en: "Verified literature search & anti-hallucination citations",
      before_zh:
        "直接问通用聊天 AI“给我推荐 5 篇相关英文文献”，结果混入多篇标题逼真但 DOI 不存在、作者张冠李戴的虚构论文。",
      after_zh:
        "联动学术数据库 API 检索近 3 年真实论文，逐条校验 DOI / 发表年份 / 期刊来源，并按方法流派生成可导入 Zotero 的对比表。",
      before_en:
        "Asking generic chat AI for references yields plausible-sounding but fabricated paper titles and non-existent DOIs.",
      after_en:
        "Queries live scholarly APIs, cross-checks DOIs/venues/years, and exports a method-grouped matrix ready for Zotero.",
      takeaway_zh:
        "用真实文献库元数据交叉核验替代大模型凭记忆编造，从源头杜绝开题与综述中的假引文风险。",
      takeaway_en:
        "Grounds every reference in live bibliographic metadata rather than LLM memory, preventing fabricated citations.",
    },
  },
  {
    id: "econ_stats",
    match: /\b(?:stata|econometric|causal|did|panel[- ]data|regression|spss|survey|meta[- ]analysis|r[- ]stats)\b|计量|实证|回归|问卷|因果/i,
    preview: {
      mode: "before_after",
      label_zh: "实证识别严谨表述与可复现回归示意",
      label_en: "Rigorous econometric & statistical reporting",
      before_zh:
        "只跑了一列简单 OLS 回归看到 p < 0.05，就直接下结论“证明数字化显著导致了企业绩效提升”，缺少稳健性与内生性讨论。",
      after_zh:
        "先完成缩尾与缺失值质控，控制个体—年份双向固定效应并报告城市层面聚类稳健标准误，同步输出平行趋势图与安慰剂检验代码。",
      before_en:
        "Claiming 'X causes Y' from a single naive OLS column (p < 0.05) without robustness checks or fixed effects.",
      after_en:
        "Runs winsorization & QC, two-way fixed effects with clustered SEs, plus event-study pre-trend and placebo scripts.",
      takeaway_zh:
        "把零散的统计命令规范化为“数据清洗 → 基准估计 → 稳健性/内生性检验 → 三线表导出”完整证据链。",
      takeaway_en:
        "Structures empirical work into auditable QC, baseline estimation, robustness checks, and publication tables.",
    },
  },
  {
    id: "bio_med",
    match: /\b(?:bioinformatic|genomic|scrna|single[- ]cell|protein|molecular|clinical|medical|drug|omics|ncbi)\b|生信|组学|单细胞|临床|医学|分子/i,
    preview: {
      mode: "deliverable",
      label_zh: "生物医学与组学标准化分析交付流程",
      label_en: "Biomedical & omics reproducible analysis pipeline",
      input_zh: "原始测序/表达矩阵、临床队列数据表或靶点序列文件",
      input_en: "Raw count matrix, clinical cohort table, or target sequences",
      steps_zh: [
        "样本质控过滤、批次效应校正与标准化",
        "差异分析 / 生存回归 / 通路富集检验",
        "导出可复现脚本、统计结果表与出版级配图",
      ],
      steps_en: [
        "Sample QC filtering, batch correction & normalization",
        "Differential, survival, or pathway enrichment tests",
        "Export reproducible scripts, summary tables & vector plots",
      ],
      artifacts: ["qc_pipeline.py", "stats_summary.csv", "figure_panel.pdf"],
      takeaway_zh:
        "固化生信与医学统计中的关键质控阈值和软件版本参数，避免脚本散乱导致结果无法复现。",
      takeaway_en:
        "Pins QC thresholds and package steps into clean scripts and figures ready for Methods sections.",
    },
  },
  {
    id: "paper_read",
    match: /\b(?:read|summariz|digest|translate|pdf|arxiv[- ]daily|radar|note)\b|读论文|精读|翻译|速读|日报/i,
    preview: {
      mode: "before_after",
      label_zh: "英文顶刊精读拆解与对比笔记示意",
      label_en: "Structured paper reading & synthesis",
      before_zh:
        "把整篇 PDF 丢给翻译软件通篇直译，专业术语翻得面目全非，读完 20 页还是说不清核心创新点和基线差异。",
      after_zh:
        "保留关键英文术语与公式符号，按“核心痛点 → 方法关键设计 → 主实验提升幅度 → 局限与可改进点”提炼成一页组会笔记。",
      before_en:
        "Raw full-text machine translation mangles domain terms and buries the core mechanism under 20 pages of prose.",
      after_en:
        "Extracts Problem → Key Mechanism & Equations → Quantified Gains vs. Baselines → Open Limitations into 1-page notes.",
      takeaway_zh:
        "跳过冗余背景套话，3 分钟抓住论文的方法增量、实验设置与可借鉴的切入点。",
      takeaway_en:
        "Cuts through boilerplate to surface methodological deltas, experimental setup, and follow-up ideas.",
    },
  },
  {
    id: "write_general",
    match: /\b(?:writ|draft|manuscript|outline|proposal|review|academic|paper|law|legal|history)\b|写作|论文|综述|开题|法学|人文/i,
    preview: {
      mode: "before_after",
      label_zh: "文献综述脉络归纳与学术论证改写示意",
      label_en: "Literature synthesis & structured argumentation",
      before_zh:
        "张三（2021）研究了方法 A，李四（2022）提出了方法 B，王五（2023）改进了方法 C……（按时间堆砌摘要，缺乏批判性对比）。",
      after_zh:
        "现有两阶段方法虽降低了检索延迟（Zhang, 2021; Li, 2022），但在长尾噪声样本上仍依赖静态阈值；Wang（2023）引入自适应门控，却未解决跨领域分布偏移问题。",
      before_en:
        "Smith (2021) studied A. Jones (2022) proposed B. Lee (2023) improved C... (chronological summary dump without synthesis).",
      after_en:
        "While two-stage pipelines cut latency (Smith, 2021; Jones, 2022), they rely on static thresholds under noise; Lee (2023) adapts gating yet leaves domain shift unresolved.",
      takeaway_zh:
        "把“谁做了什么”的读书报告流水账，升级为“方法演进脉络 + 共性瓶颈 + 本文切入点”的严谨学术论证。",
      takeaway_en:
        "Upgrades chronological summary lists into critical synthesis that naturally motivates your research gap.",
    },
  },
];

const DEFAULT_DELIVERABLE_PREVIEW = {
  mode: "deliverable",
  label_zh: "可复现科研工作流与实验交付示意",
  label_en: "Reproducible research workflow deliverables",
  input_zh: "课题研究需求、代码仓库或实验配置数据",
  input_en: "Research specification, codebase, or experimental dataset",
  steps_zh: [
    "解析任务规范、检查依赖环境与输入格式",
    "按 SKILL.md 标准步骤执行计算、实验或整理",
    "生成可复现脚本、结构化记录与核验报告",
  ],
  steps_en: [
    "Parse workflow spec, dependencies & input schema",
    "Execute standardized SKILL.md steps & checks",
    "Export reproducible scripts, logs & structured report",
  ],
  artifacts: ["workflow_run.py", "results_table.csv", "experiment_notes.md"],
  takeaway_zh:
    "将原本依赖个人经验的零散操作固化为可复查、可复用的标准科研执行步骤。",
  takeaway_en:
    "Turns ad-hoc manual steps into a structured, repeatable research workflow.",
};

export function outputPreviewFor(item) {
  if (!item?.repo) return null;
  const key = String(item.repo).toLowerCase();
  if (PREVIEW_LOOKUP.has(key)) return PREVIEW_LOOKUP.get(key);
  const corpus = [
    item.repo,
    item.description,
    item.curated_use_zh,
    item.category?.id,
    item.category?.zh,
    item.category?.en,
    ...(Array.isArray(item.topics) ? item.topics : []),
  ]
    .filter(Boolean)
    .join(" ");
  for (const tpl of FALLBACK_TEMPLATES) {
    if (tpl.match.test(corpus)) {
      return { ...tpl.preview, isCurated: false };
    }
  }
  return { ...DEFAULT_DELIVERABLE_PREVIEW, isCurated: false };
}
