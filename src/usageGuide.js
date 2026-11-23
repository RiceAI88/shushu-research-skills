import usageExamples from "../config/usage-examples.json" with { type: "json" };
import { RESEARCH_TASKS, matchesResearchTask } from "./domain.js";

// 通用科研任务首试提示词模板（当项目暂无专属案例时按任务自动匹配）
const TASK_PROMPT_TEMPLATES = {
  find: {
    scenario_zh: "文献检索与选题调研",
    scenario_en: "Literature search & scoping",
    prompt_zh:
      "请使用刚安装的【{name}】技能，围绕研究主题【你的具体课题关键词】检索近 3 年高相关英文与中文文献，按研究方法分类整理成表格，列出每篇论文的核心问题、方法亮点与可核验的标题/年份/DOI。",
    prompt_en:
      "Using the newly installed [{name}] skill, search recent high-relevance papers (past 3 years) on [your specific research topic], group them by methodology into a table, and include verifiable titles, years, and DOIs.",
    output_zh: "产出按方法归类的文献清单与研究脉络表（请逐条核验原始出处）。",
    output_en:
      "Produces a method-grouped literature table (verify every citation against original sources).",
  },
  read: {
    scenario_zh: "论文精读与笔记整理",
    scenario_en: "Paper reading & synthesis",
    prompt_zh:
      "请使用【{name}】技能精读当前目录下的论文【paper.pdf】，用结构化方式总结：1）核心研究问题与假设；2）方法流程与关键公式；3）主要实验结论与数据；4）方法局限及可进一步探索的方向。",
    prompt_en:
      "Use the [{name}] skill to read [paper.pdf] in this folder and summarize: (1) research question and hypothesis, (2) methodology, (3) key quantitative results, and (4) limitations and open questions.",
    output_zh: "快速生成可用于组会汇报或文献综述的精读笔记。",
    output_en:
      "Generates structured reading notes ready for lab meetings or literature reviews.",
  },
  write: {
    scenario_zh: "论文写作与学术润色",
    scenario_en: "Academic writing & polishing",
    prompt_zh:
      "请使用【{name}】技能审阅当前目录下的草稿【draft.tex / draft.md】，重点优化逻辑衔接与学术表达规范，严格保留所有实验数据与引用标签，并以“原句 → 修改建议 → 原因”的对照格式输出。",
    prompt_en:
      "Use the [{name}] skill to polish [draft.tex / draft.md] in this folder for academic clarity and logical flow while preserving all numbers and citations, showing original vs. revised sentences with brief reasons.",
    output_zh: "输出逐段对照的学术润色建议，不擅自改动你的实验结论。",
    output_en:
      "Provides side-by-side academic edits without altering your empirical findings.",
  },
  figures: {
    scenario_zh: "科研绘图与论文配图",
    scenario_en: "Scientific plotting & figures",
    prompt_zh:
      "请使用【{name}】技能读取当前目录下的【results.csv】，绘制一张适合期刊投稿的高清对比图（使用色盲友好配色、清晰坐标轴标签与图例），输出可复现绘图代码并保存为 PDF / SVG 矢量图。",
    prompt_en:
      "Use the [{name}] skill on [results.csv] in this folder to create a publication-quality figure with colorblind-safe colors and clean labels, outputting reproducible plotting code plus PDF/SVG.",
    output_zh: "生成可直接嵌入论文的矢量插图与可二次修改的绘图脚本。",
    output_en:
      "Generates editable plotting scripts and vector figures ready for manuscripts.",
  },
  analyze: {
    scenario_zh: "科研数据分析与统计检验",
    scenario_en: "Data analysis & statistics",
    prompt_zh:
      "请使用【{name}】技能分析当前目录下的【dataset.csv】：先检查缺失值与异常值，再根据数据分布选择合适的假设检验方法对比各组差异，输出统计结果汇总表与完整可复现分析代码。",
    prompt_en:
      "Use the [{name}] skill to analyze [dataset.csv] in this folder: check missing values and outliers, choose appropriate statistical tests across groups, and output a summary table with reproducible code.",
    output_zh: "产出数据质控报告、显著性统计检验结果与可复现脚本。",
    output_en:
      "Produces data quality checks, statistical test summaries, and reproducible scripts.",
  },
  compute: {
    scenario_zh: "科学计算与模型仿真",
    scenario_en: "Scientific computing & modeling",
    prompt_zh:
      "请使用【{name}】技能，针对问题【简述你的方程/模型与边界条件】搭建最小可运行数值仿真脚本，输出关键参数扫描结果，并验证数值收敛性与稳定性。",
    prompt_en:
      "Use the [{name}] skill to build a minimal runnable simulation script for [describe your model and boundary conditions], sweep key parameters, and check numerical convergence.",
    output_zh: "生成结构清晰的计算仿真代码、参数验证结果与可视化输出。",
    output_en:
      "Delivers clean simulation code, parameter sweep outputs, and convergence checks.",
  },
  reproduce: {
    scenario_zh: "实验复现与消融设计",
    scenario_en: "Experiment reproduction & ablation",
    prompt_zh:
      "请使用【{name}】技能检查当前目录下的实验代码与配置文件，列出复现所需依赖清单、固定随机种子，并帮我规划一组对比基线与关键模块的消融实验运行脚本。",
    prompt_en:
      "Use the [{name}] skill to audit experiment code and configs in this folder, list exact dependencies, enforce deterministic seeds, and prepare runnable baseline and ablation scripts.",
    output_zh: "产出环境复现检查表、基线运行指令与消融实验脚本。",
    output_en:
      "Produces a reproduction checklist, pinned environment steps, and ablation scripts.",
  },
  review: {
    scenario_zh: "模拟审稿与返修回复",
    scenario_en: "Peer review & rebuttal",
    prompt_zh:
      "请使用【{name}】技能以目标期刊审稿人的视角通读【manuscript.pdf】，按“主要问题（Major）/ 次要问题（Minor）”列出可能被质疑的方法漏洞、实验缺失与表述不清之处，并给出逐条修改建议。",
    prompt_en:
      "Use the [{name}] skill to review [manuscript.pdf] like a strict journal referee, grouping methodological gaps and clarity issues into Major and Minor comments with concrete revision advice.",
    output_zh: "输出模拟审稿意见清单与投稿前自查修改路线图。",
    output_en:
      "Generates mock peer-review comments and a prioritized pre-submission revision checklist.",
  },
  general: {
    scenario_zh: "科研工作流试运行",
    scenario_en: "Research workflow quick test",
    prompt_zh:
      "请先确认【{name}】技能已成功加载，并简要列出它包含哪些子技能或核心功能；然后用当前目录里的一小段公开示例材料，带我完成一次最小化试运行。",
    prompt_en:
      "Confirm that the [{name}] skill is loaded, briefly list its sub-skills or capabilities, and walk me through a minimal test run using a small public sample in this folder.",
    output_zh: "快速确认 Skill 已生效，并直观看到它支持哪些具体科研操作。",
    output_en:
      "Verifies the skill is active and shows its exact capabilities on a small sample.",
  },
};

/**
 * 识别安装命令的执行位置，帮助学生分清“电脑终端”与“AI Agent 对话框内”
 */
export function classifyInstallLocation(installation, lang = "zh") {
  const zh = lang === "zh";
  if (installation.mode === "reference") {
    return {
      kind: "reference",
      badge: zh ? "📖 在线资料导航" : "📖 Reference resource",
      hint: zh
        ? "该项目属于资料集合或参考文档，无需命令行安装，直接打开仓库按目录查阅即可。"
        : "This repository is a reference directory rather than an installable package—open it directly to browse.",
    };
  }
  const command = (installation.command || "").trim();
  if (command) {
    const firstLine = command.split("\n")[0].trim();
    if (firstLine.startsWith("/")) {
      return {
        kind: "host-chat",
        badge: zh ? "💬 在 AI Agent 对话框内输入" : "💬 Run inside AI Agent chat",
        hint: zh
          ? "打开支持斜杠命令的 AI Agent（如 Claude Code）后，直接粘贴到对话框中回车执行。"
          : "Open your compatible AI Agent (e.g. Claude Code) and paste this slash command directly into the chat input.",
      };
    }
    if (
      /\$\(pwd\)|cp\s+-r\s+skills\/|^\.\//.test(command) ||
      (command.includes("ln -s") && !command.includes("git clone"))
    ) {
      return {
        kind: "repo-terminal",
        badge: zh
          ? "📂 先下载仓库，再在仓库目录终端执行"
          : "📂 Clone repo first, then run in terminal",
        hint: zh
          ? "请先将此 GitHub 仓库下载（git clone）到本地并 cd 进入项目根目录，再在终端执行下方命令。"
          : "Clone this repository locally and cd into its root folder first, then run the command below in your terminal.",
      };
    }
    return {
      kind: "terminal",
      badge: zh
        ? "💻 在电脑终端执行（Terminal / PowerShell）"
        : "💻 Run in system terminal (Terminal / PowerShell)",
      hint: zh
        ? "打开 macOS 终端、Windows PowerShell 或 VS Code 集成终端，粘贴下方命令回车执行。"
        : "Open macOS Terminal, Windows PowerShell, or the VS Code terminal and run the command below.",
    };
  }
  if (installation.mode === "manual") {
    return {
      kind: "manual",
      badge: zh ? "📋 按官方步骤手动配置" : "📋 Manual setup via docs",
      hint: zh
        ? "需按官方文档复制技能文件或配置参数；不熟悉命令行可直接用下方“让 AI 帮你装”提示词。"
        : "Follow the official docs to place skill files or config; or copy the AI-assisted setup prompt below.",
    };
  }
  return {
    kind: "docs",
    badge: zh ? "📄 查看官方文档或让 AI 帮你装" : "📄 Follow official docs or ask AI",
    hint: zh
      ? "本站尚未提炼单行命令，你可以直接查看官方 README，或复制下方提示词让 AI 助手读文档帮你完成安装。"
      : "No single-line command is verified yet—open the official README or copy the prompt below so your AI assistant installs it for you.",
  };
}

/**
 * 生成诚实、通用的“让 AI 助手阅读官方文档帮你安装”提示词
 */
export function aiInstallPromptFor(item, installation, lang = "zh") {
  const url = installation?.source_url || item?.url || `https://github.com/${item?.repo}`;
  if (lang === "zh") {
    return `请先阅读 GitHub 仓库 ${item.repo} 的官方文档（${url}），告诉我本地需要准备哪些依赖环境，然后按官方步骤帮我安装配置好这个科研 Skill。装好后请确认它已生效，并告诉我第一步该怎么测试。`;
  }
  return `Please read the official documentation for ${item.repo} (${url}), tell me what local dependencies are required, and install/configure this research Skill following the official steps. Once installed, verify it is active and show me a quick test.`;
}

/**
 * 获取“装完怎么用”的实战提示词案例：优先匹配专属案例，否则按科研任务自动生成
 */
export function usagePromptFor(item, lang = "zh") {
  const zh = lang === "zh";
  const shortName = String(item?.repo || "").split("/").pop() || "skill";
  const curated = usageExamples[item?.repo];
  if (curated) {
    return {
      isCurated: true,
      scenario: curated[zh ? "scenario_zh" : "scenario_en"],
      prompt: curated[zh ? "prompt_zh" : "prompt_en"],
      output: curated[zh ? "output_zh" : "output_en"],
    };
  }
  const matchedTask = RESEARCH_TASKS.find((task) =>
    matchesResearchTask(item, task),
  );
  const template =
    TASK_PROMPT_TEMPLATES[matchedTask?.id] || TASK_PROMPT_TEMPLATES.general;
  return {
    isCurated: false,
    scenario: template[zh ? "scenario_zh" : "scenario_en"],
    prompt: template[zh ? "prompt_zh" : "prompt_en"].replaceAll(
      "{name}",
      shortName,
    ),
    output: template[zh ? "output_zh" : "output_en"],
  };
}

/**
 * 基于公开元数据与已核验安装说明，提炼诚实的环境门槛小标签（绝不凭空臆测）
 */
export function deriveSetupThresholds(
  item,
  installation = {},
  detailsInfo = {},
  lang = "zh",
) {
  const zh = lang === "zh";
  const badges = [];
  const langName = String(item?.language || "");
  const envText = `${detailsInfo?.environment_zh || ""} ${detailsInfo?.environment_en || ""}`;
  const depText = `${detailsInfo?.dependencies_zh || ""} ${detailsInfo?.dependencies_en || ""}`;
  const cmdText = String(installation?.command || "");
  const combined = `${envText} ${depText} ${cmdText} ${(item?.topics || []).join(" ")}`;

  if (installation?.mode === "reference") {
    badges.push({
      id: "reference",
      tone: "easy",
      label: zh ? "🟢 在线查阅 · 免装环境" : "🟢 Zero-install reference",
    });
    return badges;
  }

  const needsGpu = /\b(?:gpu|cuda|nvidia|vram|isaac[- ]sim)\b/i.test(combined);
  const needsPython =
    langName === "Python" ||
    langName === "Jupyter Notebook" ||
    /\b(?:python\s*3|pip\s+install|uv\s+(?:pip|run|tool)|conda|pytorch)\b/i.test(combined);
  const needsR =
    langName === "R" || /\b(?:rscript|cran|bioconductor|stata)\b/i.test(combined);
  const needsNodeCli = /\b(?:npx\s+|npm\s+install|nodejs|node\.js)\b/i.test(combined);
  const isPureDocSkill =
    item?.repository_kind === "skill" &&
    !needsGpu &&
    !needsPython &&
    !needsR &&
    (!langName || ["Markdown", "TeX", "HTML"].includes(langName));

  if (isPureDocSkill) {
    badges.push({
      id: "web-friendly",
      tone: "easy",
      label: zh
        ? "🟢 纯规则文档 · 网页版 AI 也可直用"
        : "🟢 Prompt rules · Works in Web AI chat",
    });
  } else if (needsGpu) {
    badges.push({
      id: "gpu",
      tone: "heavy",
      label: zh ? "🖥️ 需本地或云端 GPU" : "🖥️ Requires GPU environment",
    });
  } else if (needsPython) {
    badges.push({
      id: "python",
      tone: "medium",
      label: zh ? "🐍 需本地 Python 环境" : "🐍 Local Python environment",
    });
  } else if (needsR) {
    badges.push({
      id: "stats-env",
      tone: "medium",
      label: zh ? "📊 需 R / Stata 统计环境" : "📊 R / Stata environment",
    });
  } else if (needsNodeCli) {
    badges.push({
      id: "node-cli",
      tone: "easy",
      label: zh ? "📦 支持 npx / 终端快速安装" : "📦 Quick npx / CLI install",
    });
  } else if (item?.repository_kind === "skill") {
    badges.push({
      id: "skill-md",
      tone: "easy",
      label: zh
        ? "📄 含 SKILL.md · 支持网页版 AI 借鉴"
        : "📄 Has SKILL.md · Reusable in Web AI",
    });
  }

  if (
    /\b(?:api[_ -]?key|openai_api|anthropic_api|gemini_api|serpapi|tavily|semantic[- ]scholar[- ]api|zotero[- ]api)\b|外部\s*API|自备\s*API/i.test(
      combined,
    )
  ) {
    badges.push({
      id: "api-key",
      tone: "warn",
      label: zh ? "🔑 按需自备外部 API Key" : "🔑 External API key optional/needed",
    });
  }

  return badges;
}

// 各科研任务的免 GitHub 网页版 AI 核心执行规范（解决校园网打不开 GitHub 的痛点）
const DIRECT_WEB_RULES = {
  find: {
    zh: [
      "仅列出来源可核验的真实学术论文（提供准确英文/中文标题、作者、年份、期刊/会议名，不确定 DOI 时明确标注“待核实”而非编造）",
      "按研究流派或方法路线分组归纳，并提炼每篇文献解决的核心痛点与局限性",
      "在末尾总结当前研究空白（Research Gap）及 2～3 个可切入的选题方向",
    ],
    en: [
      "Cite only verifiable papers (exact title, authors, year, venue; mark uncertain DOIs explicitly instead of fabricating)",
      "Group studies by methodological lineage and summarize each paper's core contribution and limitation",
      "Conclude with concrete research gaps and 2–3 actionable scoping angles",
    ],
  },
  read: {
    zh: [
      "严格区分“原文明确实验数据”与“延伸推论”，保留关键公式符号与评价指标数值",
      "按【核心问题与假设 → 方法机制拆解 → 主实验与消融结论 → 局限性与启发】四段式输出",
      "将专业术语保留英文原词对照，避免生硬机翻导致概念失真",
    ],
    en: [
      "Strictly separate explicit empirical findings from interpretation, preserving notation and metric values",
      "Structure into: Problem & Hypothesis → Mechanism → Main & Ablation Results → Limitations",
      "Keep key technical terms precise for lab-meeting or review synthesis",
    ],
  },
  write: {
    zh: [
      "剔除“总而言之/值得注意的是/delves into/paving the way”等高频 AI 套话与空泛形容词，使用克制、量化的学术句式",
      "严禁篡改原稿中的实验数值、样本量、统计显著性与引用标签（如 \\cite{}）",
      "输出【原句 → 严谨改写建议 → 修改理由】三列对照，便于逐句审阅采纳",
    ],
    en: [
      "Eliminate LLM clichés ('delves into', 'in the realm of', vague superlatives) in favor of bounded, quantified claims",
      "Never alter empirical numbers, sample sizes, p-values, or citation keys",
      "Present side-by-side Original → Revised → Rationale entries for author review",
    ],
  },
  figures: {
    zh: [
      "采用色盲友好学术配色（如 Okabe-Ito / Nature 低饱和色板），无衬线字体（Arial / Helvetica），去除多余背景网格线",
      "输出完整可独立运行的 Python（Matplotlib/Seaborn）或 R（ggplot2）脚本，默认导出 300 DPI PDF/SVG 矢量格式",
      "明确标注坐标轴物理量与单位、误差棒含义（SD / SEM / 95% CI）及子图排版尺寸",
    ],
    en: [
      "Use colorblind-safe Okabe-Ito palettes, clean Arial/Helvetica typography, and minimal chartjunk",
      "Output self-contained Python (Matplotlib/Seaborn) or R (ggplot2) code exporting 300 DPI PDF/SVG vector files",
      "Specify axis units, error-bar definitions (SD / SEM / 95% CI), and journal column dimensions",
    ],
  },
  analyze: {
    zh: [
      "先输出数据质控步骤（样本量、缺失值、异常值与正态性/同方差检验），再匹配统计或计量模型",
      "汇报效应量、标准误/置信区间与精确 p 值，避免把简单相关性直接表述为因果结论",
      "提供带完整注释与固定随机种子的 Python / R / Stata 可复现分析代码",
    ],
    en: [
      "Audit sample size, missingness, outliers, and distributional assumptions before model estimation",
      "Report effect sizes, standard errors / CIs, and exact p-values without overclaiming causality",
      "Provide commented, seed-pinned Python / R / Stata code",
    ],
  },
  compute: {
    zh: [
      "明确列出控制方程、初始/边界条件、量纲单位与离散化参数设置",
      "编写模块化可运行数值计算脚本，并包含网格/步长收敛性与数值稳定性自检",
      "输出关键物理量/指标随参数变化的汇总表与可视化绘图代码",
    ],
    en: [
      "State governing equations, boundary conditions, units, and discretization parameters explicitly",
      "Provide modular runnable simulation code with step-size / convergence sanity checks",
      "Include parameter-sweep summary outputs and diagnostic plot code",
    ],
  },
  reproduce: {
    zh: [
      "梳理完整的依赖版本、随机种子固定项、数据预处理顺序与训练/评估超参数清单",
      "拆分出最小可运行基线（Baseline）命令与逐模块消融实验（Ablation）对照表",
      "指出常见复现偏差来源（数据泄漏、评测切分不一致、精度设置等）及排查方法",
    ],
    en: [
      "Pin package versions, random seeds, preprocessing order, and evaluation hyperparameters",
      "Separate minimal baseline commands from systematic ablation configurations",
      "Highlight common reproduction pitfalls (leakage, split mismatch, precision) and checks",
    ],
  },
  review: {
    zh: [
      "按顶会/SCI 期刊审稿标准，区分决定录用的【核心硬伤 Major】与【表达细节 Minor】",
      "若撰写 Rebuttal 回复信，采用“礼貌致谢 → 定位审稿人关切 → 补充证据/实验编号 → 正文修订位置”结构",
      "保持客观建设性语气，对短期无法补跑的实验诚实说明边界与替代验证方案",
    ],
    en: [
      "Separate Major methodological/empirical flaws from Minor presentation issues",
      "For rebuttals, follow: Polite acknowledgement → Core answer → New evidence/table ref → Manuscript diff location",
      "Maintain a constructive tone and state honest scope boundaries where new runs are infeasible",
    ],
  },
};

/**
 * 为不装命令行或打不开 GitHub 的学生生成“免进 GitHub 一键直接粘贴可用”的完整网页版指令
 */
export function directWebPromptFor(item, lang = "zh") {
  const zh = lang === "zh";
  const shortName = String(item?.repo || "").split("/").pop() || "Skill";
  const matchedTask = RESEARCH_TASKS.find((task) =>
    matchesResearchTask(item, task),
  );
  const taskId = matchedTask?.id || "write";
  const rules = (DIRECT_WEB_RULES[taskId] || DIRECT_WEB_RULES.write)[zh ? "zh" : "en"];
  const example = usagePromptFor(item, lang);
  const summary = zh
    ? item?.curated_use_zh || item?.description || example.scenario
    : item?.description || example.scenario;
  const numbered = rules.map((r, i) => `${i + 1}. ${r}`).join("\n");

  if (zh) {
    return `请你现在扮演开源科研技能【${shortName}】（核心定位：${summary}）的专业学术助手，严格遵循以下学术执行规范协助我完成任务：\n${numbered}\n\n---\n我的具体科研需求（请按上述规范直接输出结果或可运行代码）：\n${example.prompt}`;
  }
  return `Act as a specialized academic research assistant modeled on the open-source skill "${shortName}" (focus: ${summary}). Follow these execution rules strictly:\n${numbered}\n\n---\nMy research task (deliver structured academic output or runnable code directly):\n${example.prompt}`;
}

/**
 * 判断详情抽屉中是否展示温和的场景化帮扶入口（Codex/GPT 环境准备 & 论文提纲免折腾备选）
 */
export function drawerSupportHintsFor(item, installation = {}, thresholds = []) {
  const isReference = installation?.mode === "reference";
  const agents = Array.isArray(item?.agents) ? item.agents : [];
  const needsAgentAccess =
    !isReference &&
    (item?.repository_kind === "skill" ||
      agents.some((a) => ["codex", "claude-code", "cursor"].includes(a)) ||
      thresholds.some((b) => b.id === "api-key"));
  const isPaperWritingFlow =
    !isReference &&
    RESEARCH_TASKS.some(
      (task) =>
        ["find", "read", "write", "review"].includes(task.id) &&
        matchesResearchTask(item, task),
    );
  return { needsAgentAccess, isPaperWritingFlow };
}

/**
 * 为不装命令行的学生生成“粘贴 SKILL.md 到网页版 DeepSeek / Kimi / ChatGPT”的引导词
 */
export function webChatPromptFor(item, lang = "zh") {
  const shortName = String(item?.repo || "").split("/").pop() || "Skill";
  const example = usagePromptFor(item, lang);
  if (lang === "zh") {
    return `我将把开源科研项目 ${shortName} 的 SKILL.md 规范粘贴在下方。请你严格按照这份规范中的步骤、格式和学术严谨性要求扮演科研助手（若规范中涉及本地命令行脚本，请改为直接输出可运行代码或文字结果）。\n\n【此处粘贴你从仓库 SKILL.md 复制的内容】\n\n---\n我的具体科研需求：\n${example.prompt}`;
  }
  return `Below I am pasting the SKILL.md instructions from the open-source research skill "${shortName}". Please follow its workflow, structure, and academic rigor strictly (if a step mentions running local CLI scripts, output runnable code or direct text instead).\n\n[Paste the contents of SKILL.md from the repository here]\n\n---\nMy research task:\n${example.prompt}`;
}
