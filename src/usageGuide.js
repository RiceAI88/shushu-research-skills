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
