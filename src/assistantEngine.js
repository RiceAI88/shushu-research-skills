import {
  RESEARCH_STAGES,
  RESEARCH_TASKS,
  detectAgents,
  matchesResearchStage,
  matchesResearchTask,
} from "./domain.js";
import { DISCIPLINES, disciplineFit } from "./disciplines.js";
import { createSearch } from "./search.js";
import { installationFor } from "./practical.js";

// 默认线上 Worker 地址（可通过 window.__ARS_BOT_API 在测试或自定义环境中覆盖）
export const DEFAULT_BOT_API = "https://bot.riceai985.cc/api/chat";

const DISCIPLINE_HINTS = [
  { id: "medicine", re: /医学|临床|生信|生物信息|药学|护理|公卫|单细胞|基因|pubmed|meta分析|元分析|队列|病历|biomed|clinical|medical|genom|scrna/i },
  { id: "economics", re: /经济|金融|计量|实证|因果|面板数据|stata|did|双重差分|工具变量|ssci|回归|econom|finance|causal/i },
  { id: "management", re: /管理|商科|会计|营销|问卷|量表|spss|工商|社媒|传播|survey|business|marketing/i },
  { id: "law", re: /法学|法律|法条|判例|司法|合规|知识产权|legal|law/i },
  { id: "literature", re: /文学|语言学|外语|新闻|翻译|古文|人文|linguist|humanit/i },
  { id: "history", re: /历史|考古|古籍|史记|文献学|史料|histor|archaeolog/i },
  { id: "philosophy", re: /哲学|伦理|逻辑学|philosoph|ethic/i },
  { id: "education", re: /教育|师范|心理|课程|教学|心理学|educat|psycholog/i },
  { id: "agriculture", re: /农学|植物|动物|兽医|林学|土壤|生态|作物|agricult|plant|ecology/i },
  { id: "arts", re: /艺术|设计|建筑|音乐|视觉|art|design/i },
  { id: "science", re: /物理|化学|数学|统计|天文|地球|遥感|分子|仿真|数学建模|国赛|美赛|math|physic|chemi|gis/i },
  { id: "engineering", re: /计算机|人工智能|机器学习|深度学习|代码|机器人|材料|机械|土木|电子|通信|cs|llm|nlp|cv|pytorch/i },
];

const STAGE_HINTS = [
  { id: "undergrad", re: /本科|毕设|毕业论文|大四|课程论文|零基础|小白|入门|word|docx|排版|thesis|undergrad|beginner/i },
  { id: "proposal", re: /开题|综述|找文献|查文献|文献检索|文献管理|zotero|arxiv|pubmed|引文|literature|survey/i },
  { id: "figures", re: /画图|配图|绘图|架构图|流程图|图表|visio|origin|svg|figure|plot|diagram|chart/i },
  { id: "empirical", re: /实证|计量|问卷|统计|回归|stata|spss|did|数学建模|数据|econometric|regression|stats/i },
  { id: "slides", re: /组会|汇报|答辩|ppt|幻灯片|海报|poster|slide|presentation|deck/i },
  { id: "rebuttal", re: /润色|改写|降重|去ai|ai味|防御性|审稿|返修|投稿|语法|rebuttal|polish|proofread|review|humaniz/i },
];

const BEGINNER_RE = /不会(?:编程|代码|命令行)|零基础|小白|没装|网页版|不敲命令|纯文科|简单|省事|beginner|no[- ]?code|no[- ]?cli|web/i;

/**
 * 从全站收录库中毫秒级召回与学生提问最匹配的 Top K 真实 Skill 候选
 */
export function retrieveAssistantCandidates(query, items, limit = 8) {
  const clean = String(query || "").trim();
  const skills = (items || []).filter((i) => i.repository_kind === "skill");
  if (!clean) return skills.slice(0, limit);

  const matchedDisciplines = DISCIPLINE_HINTS.filter((d) => d.re.test(clean)).map((d) => d.id);
  const matchedStages = STAGE_HINTS.filter((s) => s.re.test(clean)).map((s) => s.id);
  const wantsBeginner = BEGINNER_RE.test(clean);

  // 分词检索辅助打分
  const tokens = clean
    .replace(/[，。？！、,.?!:：/]/g, " ")
    .split(/\s+/)
    .filter((tok) => tok.length >= 2)
    .slice(0, 6);
  const tokenSearches = tokens.map((tok) => createSearch(tok));
  const fullSearch = createSearch(clean);

  const scored = skills.map((item) => {
    let score = 0;
    const blob = [
      item.repo,
      item.curated_use_zh,
      item.curated_use_en,
      item.description,
      ...(item.topics || []),
    ].join(" ");

    // 1. 专业匹配加权
    for (const did of matchedDisciplines) {
      const fit = disciplineFit(item, { discipline: did, major: "all" });
      if (fit === "specific") score += 42;
      else if (fit === "common") score += 8;
    }

    // 2. 论文阶段急救场景匹配加权（精选锚点最高优先级）
    for (const sid of matchedStages) {
      const stage = RESEARCH_STAGES.find((s) => s.id === sid);
      if (!stage) continue;
      const featuredIdx = stage.featured?.indexOf(item.repo) ?? -1;
      if (featuredIdx !== -1) {
        score += 55 - featuredIdx * 3;
      } else if (matchesResearchStage(item, stage)) {
        score += 24;
      }
    }

    // 3. 关键词检索匹配
    if (fullSearch.matches(blob)) score += 30;
    for (const ts of tokenSearches) {
      if (ts.matches(blob)) score += 12;
    }

    // 4. 零门槛/新手友好度微调
    const inst = installationFor(item);
    if (wantsBeginner) {
      if (inst.mode === "command") score += 10;
      if (/claude\.ai|web|网页|docx|easyread|anti-defensive|humanizer/i.test(blob)) score += 12;
    }

    // 5. 社区认可度（对数平滑，避免大而全仓库无脑霸榜）
    score += Math.min(18, Math.log10(Math.max(10, item.stars || 10)) * 3.8);

    return { item, score, inst };
  });

  scored.sort((a, b) => b.score - a.score || (b.item.stars || 0) - (a.item.stars || 0));

  return scored.slice(0, limit).map(({ item, inst }) => {
    const matchedTaskIds = RESEARCH_TASKS.filter((t) => matchesResearchTask(item, t)).map(
      (t) => t.id,
    );
    return {
      item,
      repo: item.repo,
      stars: item.stars || 0,
      summary: item.curated_use_zh || item.description || "",
      summaryEn: item.curated_use_en || item.description || "",
      tasks: matchedTaskIds.join(", "),
      agents: detectAgents(item).slice(0, 3).join(", "),
      mode: inst.mode,
    };
  });
}

/**
 * 本地零成本智能回复生成器（当云端免费 API 未配置、离线或限流时无缝秒回）
 */
export function buildLocalAdvisorReply(query, candidates, lang = "zh") {
  const top = candidates.slice(0, 3);
  const wantsBeginner = BEGINNER_RE.test(query || "");
  const matchedDisc = DISCIPLINE_HINTS.find((d) => d.re.test(query || ""));
  const discObj = matchedDisc ? DISCIPLINES.find((d) => d.id === matchedDisc.id) : null;

  if (lang === "en") {
    const intro = discObj
      ? `Based on your **${discObj.en}** focus, here are the ${top.length} best-matched open-source Skills on our site:`
      : `Here are the ${top.length} best-matched open-source research Skills for your workflow:`;
    const bullets = top
      .map(
        (c, i) =>
          `${i + 1}. **${c.repo}** (★${c.stars.toLocaleString("en-US")}) — ${c.summaryEn}`,
      )
      .join("\n");
    const tip = wantsBeginner
      ? "\n\nTip: No CLI needed—open any pick below and expand **Use directly in Web AI chat** to paste its `SKILL.md` into ChatGPT, Claude, or DeepSeek."
      : "\n\nClick any card below to view its Before/After preview, setup guide, and ready-to-copy prompt.";
    return intro + "\n\n" + bullets + tip;
  }

  const intro = discObj
    ? `针对你的 **${discObj.zh}** 背景与需求，从本站实测收录库里为你挑了最契合的 ${top.length} 个工具：`
    : `结合你的科研场景，从本站收录库里为你筛出了最匹配的 ${top.length} 个高口碑 Skill：`;

  const bullets = top
    .map((c, idx) => {
      const modeTip =
        c.mode === "command"
          ? "支持一行命令安装"
          : "提供完整技能说明";
      return `${idx + 1}. **${c.repo}**（★${c.stars.toLocaleString("en-US")}）：${c.summary}（${modeTip}）。`;
    })
    .join("\n");

  const tip = wantsBeginner
    ? "\n\n💡 **零基础省事用法**：不用折腾命令行！直接点下方卡片打开详情，展开「在网页版 DeepSeek / Kimi / ChatGPT 直接用」，把仓库里的 `SKILL.md` 复制粘贴进网页对话框就能立刻用。"
    : "\n\n👇 点击下方任意卡片可直接打开**站内上手指南**（查看效果预览、复制安装命令与实战提示词），也可以一键打包这组工具清单。";

  return `${intro}\n\n${bullets}${tip}`;
}

/**
 * 从 AI 回复正文中提取被点名推荐的候选仓库（若未显式匹配则回退前 3 名）
 */
export function extractMentionedCandidates(replyText, candidates) {
  const lower = String(replyText || "").toLowerCase();
  const hit = candidates.filter((c) => {
    const full = c.repo.toLowerCase();
    const shortName = full.split("/")[1];
    return lower.includes(full) || (shortName && shortName.length >= 5 && lower.includes(shortName));
  });
  return (hit.length ? hit : candidates).slice(0, 3);
}

/**
 * 提问主入口：优先请求免费云端 AI（智谱主力 + 混元备胎），失败则零感降级本地顾问引擎
 */
export async function askShushuAssistant({ query, items, lang = "zh", apiEndpoint }) {
  const candidates = retrieveAssistantCandidates(query, items, 8);
  const endpoint =
    apiEndpoint ||
    (typeof window !== "undefined" && window.__ARS_BOT_API) ||
    DEFAULT_BOT_API;

  if (endpoint !== "local-only") {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9500);
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          lang,
          candidates: candidates.map((c) => ({
            repo: c.repo,
            stars: c.stars,
            summary: lang === "en" ? c.summaryEn : c.summary,
            tasks: c.tasks,
            mode: c.mode,
          })),
        }),
        signal: controller.signal,
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.reply) {
          const picks = extractMentionedCandidates(data.reply, candidates);
          return {
            reply: data.reply,
            picks,
            source: data.provider || "cloud-ai",
          };
        }
      }
    } catch {
      // 网络未连通或尚未部署 Worker 时静默切换至本地智能选型引擎
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    reply: buildLocalAdvisorReply(query, candidates, lang),
    picks: candidates.slice(0, 3),
    source: "local-advisor",
  };
}
