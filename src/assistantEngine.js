import {
  RESEARCH_STAGES,
  RESEARCH_TASKS,
  detectAgents,
  isWebAiReady,
  matchesResearchStage,
  matchesResearchTask,
} from "./domain.js";
import { DISCIPLINES, disciplineFit, professionLabel } from "./disciplines.js";
import { createSearch } from "./search.js";
import { installationFor } from "./practical.js";

// 默认线上 Worker 地址（可通过 window.__ARS_BOT_API 在测试或自定义环境中覆盖）
export const DEFAULT_BOT_API = "https://bot.riceai985.cc/api/chat";

const DISCIPLINE_HINTS = [
  { id: "medicine", re: /医学|临床|生信|生物信息|药学|护理|公卫|单细胞|基因|pubmed|meta分析|元分析|队列|病历|\b(?:biomed|clinical|medical|genomics?|scrna)\b/i },
  { id: "economics", re: /经济|金融|计量|实证|因果|面板数据|stata|\bdid\b|双重差分|工具变量|ssci|回归|\b(?:econom\w*|finance|causal)\b/i },
  { id: "management", re: /管理|商科|会计|营销|问卷|量表|spss|工商|社媒|传播|\b(?:survey|business|marketing)\b/i },
  { id: "law", re: /法学|法律|法条|判例|司法|合规|知识产权|\b(?:legal|law)\b/i },
  { id: "literature", re: /文学|语言学|外语|新闻|翻译|古文|人文|\b(?:linguist\w*|humanit\w*)\b/i },
  { id: "history", re: /历史|考古|古籍|史记|文献学|史料|\b(?:histor\w*|archaeolog\w*)\b/i },
  { id: "philosophy", re: /哲学|伦理|逻辑学|\b(?:philosoph\w*|ethics?)\b/i },
  { id: "education", re: /教育|师范|心理|课程|教学|心理学|\b(?:educat\w*|psycholog\w*)\b/i },
  { id: "agriculture", re: /农学|植物|动物|兽医|林学|土壤|生态|作物|\b(?:agricult\w*|plant|ecology)\b/i },
  { id: "arts", re: /艺术|设计|建筑|音乐|视觉|\b(?:arts?|design)\b/i },
  { id: "science", re: /物理|化学|数学|统计|天文|地球|遥感|分子|仿真|数学建模|国赛|美赛|\b(?:math\w*|physic\w*|chemi\w*|gis)\b/i },
  { id: "engineering", re: /计算机|人工智能|机器学习|深度学习|代码|机器人|材料|机械|土木|电子|通信|\b(?:cs|llm|nlp|cv|pytorch)\b/i },
];

const STAGE_HINTS = [
  { id: "undergrad", re: /本科|毕设|毕业论文|大四|课程论文|零基础|小白|入门|word|docx|排版|\b(?:thesis|undergrad\w*|beginner)\b/i },
  { id: "proposal", re: /开题|综述|找文献|查文献|文献检索|文献管理|zotero|arxiv|pubmed|引文|\b(?:literature|survey)\b/i },
  { id: "figures", re: /画图|配图|绘图|架构图|流程图|图表|visio|origin|svg|\b(?:figures?|plots?|diagrams?|charts?)\b/i },
  { id: "empirical", re: /实证|计量|问卷|统计|回归|stata|spss|\bdid\b|数学建模|数据|\b(?:econometric\w*|regression|stats?)\b/i },
  { id: "slides", re: /组会|汇报|答辩|ppt|幻灯片|海报|\b(?:posters?|slides?|presentations?|decks?)\b/i },
  { id: "rebuttal", re: /润色|改写|降重|去\s*ai|aigc|ai\s*味|防御性|审稿|返修|投稿|语法|\b(?:rebuttal|polish\w*|proofread\w*|review|humaniz\w*)\b/i },
];

const BEGINNER_RE = /不会(?:编程|代码|命令行)|零基础|小白|没装|网页版|不敲命令|免安装|免命令|纯文科|简单|省事|\b(?:beginner|no[- ]?code|no[- ]?cli|web)\b/i;

const RESEARCH_WORKFLOW_RE = /论文|学术|科研|课题|实验|文献|期刊|顶刊|引文|引用|综述|开题|毕设|答辩|组会|审稿|投稿|返修|润色|改写|降重|去\s*ai|aigc|语法|翻译|排版|画图|配图|绘图|流程图|架构图|统计|实证|计量|回归|问卷|访谈|质性|田野|扎根|数据|代码|编程|复现|精读|阅读|笔记|写作|专利|基金|国自然|社科基金|本子|标书|latex|bibtex|overleaf|zotero|pubmed|arxiv|stata|spss|python|matlab|r语言|origin|visio|mermaid|markdown|claude\s*code|codex|cursor|opencode|deepseek|kimi|chatgpt|\b(?:paper|thesis|manuscript|literature|citation|plot|figure|diagram|dataset|benchmark|grant|qualitative|academic|research)\b/i;

const TOOL_SEEKING_RE = /推荐|哪个|哪款|哪几个|好用|热门|必装|排行|神器|有哪些|怎么选|选哪个|配什么|用什么|找个|求个|有没有|\b(?:recommend\w*|which|best|top|popular|tools?|skills?)\b/i;

const FOLLOWUP_QUERY_RE = /哪个|哪一个|这里面|上面|这几个|第一个|第二个|第三个|还有(?:别的|其他|吗)|换一批|其他的|免安装|不用.*命令|网页|免费|中文|英文|区别|对比|好装|简单|\b(?:which one|any other|more|difference|without cli|free|compare)\b/i;

/**
 * 判断输入是否包含明确的学术/科研工具诉求
 */
export function hasResearchIntent(query) {
  const clean = String(query || "").trim();
  if (!clean) return false;
  return (
    DISCIPLINE_HINTS.some((d) => d.re.test(clean)) ||
    STAGE_HINTS.some((s) => s.re.test(clean)) ||
    RESEARCH_WORKFLOW_RE.test(clean)
  );
}

/**
 * 识别纯寒暄、身份询问、网站用法咨询、调侃或完全无关闲聊，直接毫秒级自然回复且不强塞工具卡片
 */
export function matchConversationalIntent(query, lang = "zh", context = {}) {
  const clean = String(query || "").trim();
  if (!clean) return null;
  const zh = lang === "zh";

  // 1. 明确询问身份 / 名字 / 底层模型
  if (
    /^(?:嘿|嗨|你好[,，\s]*)?(?:你叫什么(?:名字)?|你叫啥|你是谁(?:呀|啊)?|你是什么(?:模型|大模型|ai|助手|机器人|东西)?|你用的什么(?:模型|大模型)|怎么称呼你?|鼠鼠是谁|介绍一下你(?:自己)?|who are you|what(?:'s| is) your name)\s*[？?！!。.~～]*$/i.test(
      clean,
    )
  ) {
    return {
      intent: "identity",
      reply: zh
        ? "我叫**科研鼠鼠** 🐹！是本站的 AI 选工具学长～\n我熟读了站里收录的 **460+ 个真实开源科研 Skill**，专门帮大家按专业挑工具、避开停更老项目，绝不瞎编不存在的仓库。\n\n直接告诉我你的**专业 + 卡住的科研环节**（比如：「经管硕士想做 DID 实证」、「本科生不会代码想给论文降 AI 味」），我马上帮你挑最省事的 2～3 个！"
        : "I'm **Research Hamster (科研鼠鼠)** 🐹—your AI Skill advisor on this site!\nI'm grounded in **460+ verified open-source research Skills** indexed here, helping you pick practical tools by discipline without hallucinating fake repos.\n\nTell me your **field + current bottleneck** (e.g., \"econometrics DID in Stata\" or \"undergrad thesis formatting without CLI\"), and I'll shortlist the best 2–3 Skills!",
    };
  }

  // 2. 询问什么是 Skill / 网站怎么用
  if (
    /^(?:请问[,，\s]*)?(?:什么是\s*skills?|skills?\s*是什么(?:意思|东西)?|这(?:个)?网站(?:是干嘛的?|怎么用|有什么用)|本站怎么用|怎么(?:安装|使用|导入)\s*skills?|what (?:is|are) (?:a )?skills?|how (?:do i|to) use this (?:site|website))\s*[？?！!。.~～]*$/i.test(
      clean,
    )
  ) {
    return {
      intent: "skill_faq",
      reply: zh
        ? "简单说，**科研 Skill** 就是研究者整理好的「AI 专用科研工作流（`SKILL.md` 规则说明 + 自动化脚本）」🐹：\n- **零代码用法**：点开站里带 **「免安装 · 网页直用」** 的卡片，一键复制站内生成好的提示词，粘贴进网页版 **DeepSeek / Kimi / ChatGPT** 就能直接干活！\n- **命令行用法**：如果你装了 Claude Code、Codex 或 Cursor，复制一行命令就能把整套技能装进本地。\n\n告诉我你的专业或正在写的论文环节，我先给你挑两个最好上手的试试？"
        : "In short, a **Research Skill** is a reusable AI workflow (`SKILL.md` instructions + optional scripts) built for academic tasks 🐹:\n- **Zero-CLI**: Open any card badged **Zero-install · Web AI**, copy the ready-made prompt, and paste it straight into **ChatGPT, Claude, or DeepSeek** on the web.\n- **CLI Agents**: Copy a one-line command to install it into Claude Code, Codex, or Cursor.\n\nTell me your discipline or paper stage, and I'll pick 2–3 easy starters for you!",
    };
  }

  // 3. 询问能力范围（你能干嘛）
  if (
    /^(?:嘿|嗨|你好[,，\s]*)?(?:你能(?:干嘛|干什么|做什么|帮我做什么|帮什么忙)|你会(?:干嘛|干什么|做什么|什么)|你有什么用|怎么问你|你是干嘛的|what can you do|how can you help(?: me)?)\s*[？?！!。.~～]*$/i.test(
      clean,
    )
  ) {
    return {
      intent: "capabilities",
      reply: zh
        ? "我可以帮你省掉去 GitHub 大海捞针的时间 🐹：\n1. **按学科精准挑工具**：覆盖经管、医学、生信、计算机、理工、人文社科 13 个学科，自动过滤长期停更项目。\n2. **区分上手门槛**：不会敲命令行？我可以只挑能复制进 **DeepSeek / Kimi / ChatGPT** 网页版直用的 Skill。\n3. **多工具同台对比**：挑出候选后点「⚖️ 横向对比参数」，一眼看清该选谁。\n\n直接告诉我：**你学什么专业、最近最头疼论文哪一步？**"
        : "Here's how I can save you hours of GitHub searching 🐹:\n1. **Discipline-matched picks** across 13 academic fields while filtering out stale repos.\n2. **Zero-CLI filtering** for Skills you can paste straight into Web ChatGPT / Claude / DeepSeek.\n3. **Side-by-side comparison** of candidate Skills.\n\nJust tell me **your major + which research step you're stuck on**!",
    };
  }

  // 4. 纯打招呼
  if (
    /^(?:你好(?:呀|啊|哇)?|您好|嗨+|哈喽|早上好|中午好|下午好|晚上好|在吗|在不在|有人吗|鼠鼠(?:你好|在吗|出来)?|hi+|hello+|hey+|yo)\s*[？?！!。.~～]*$/i.test(
      clean,
    )
  ) {
    return {
      intent: "greeting",
      reply: zh
        ? "嗨！我是**科研鼠鼠** 🐹～今天论文推进到哪一步啦？\n你可以直接跟我说具体痛点，比如：\n- **查文献写综述** / **英文文献精读**\n- **Stata / Python / R 跑实证与统计**\n- **画顶刊配图与可编辑流程图**\n- **中英文润色、降 AI 味、Word / LaTeX 排版**\n\n说下你的专业和需求，我帮你挑最顺手的工具！"
        : "Hi there! I'm **Research Hamster** 🐹—which part of your paper are you working on today?\nAsk me about **literature review**, **Stata/Python/R data analysis**, **publication figures**, or **manuscript polishing & formatting**, and I'll match the best open-source Skills for you!",
    };
  }

  // 5. 道谢 / 夸奖 / 道别
  if (
    /^(?:谢谢(?:你|鼠鼠|啦|哈|学长)?|多谢|感谢|太棒了|真棒|牛(?:逼|啊|的)?|好使|好用|厉害|棒棒哒|辛苦了?|再见|拜拜|886?|thanks?(?: a lot)?|thank you|thx|awesome|bye+)\s*[！!。.~～]*$/i.test(
      clean,
    )
  ) {
    return {
      intent: "gratitude",
      reply: zh
        ? "不客气呀！祝你实验一次跑通、论文顺利 Accept 🐹✨ 写论文遇到新卡点随时再来喊我～"
        : "You're very welcome! Wishing you smooth experiments and quick paper acceptances 🐹✨ Ping me anytime you hit a new bottleneck!",
    };
  }

  // 6. 吐槽 / 调侃 / 表情符号 / 纯测试词（如“傻的？鼠鼠”“哈哈”“？？？”）
  if (
    /^(?:你?(?:是不是|怎么这么)?傻(?:的|瓜|子|不傻|呀|吗)?|笨(?:蛋|死了)?|智障|人工智障|呆子?|蠢|胡说八道|答非所问|哈哈+|嘿嘿+|呵呵+|呜呜+|666+|233+|\?+|？+|!+|！+|。+|\.+|嗯+|哦+|啊+|额+|测试(?:一下)?|test|123+|aaa+)\s*(?:鼠鼠)?\s*[？?！!。.~～]*$/i.test(
      clean,
    )
  ) {
    return {
      intent: "banter",
      reply: zh
        ? "吱！刚才脑子打结了一下下 🐹💦 闲聊我确实不太灵光，但**找开源科研工具**我是认真的！\n不信你拿具体需求考考我——比如「本科毕设不会敲命令行怎么排版」、「医学查 PubMed 写综述用哪个」、「想画顶刊配图怎么选」？"
        : "Squeak! My hamster brain tangled for a second on small talk 🐹💦—but picking **open-source research tools** is my specialty!\nTry testing me with a real bottleneck like \"undergrad thesis formatting without CLI\" or \"PubMed literature synthesis\"!",
    };
  }

  // 7. 完全无关的生活闲聊（不含任何科研词、选工具词，也不是承接上文的追问）
  const hasPriorResearch = Array.isArray(context?.history)
    ? context.history.some(
        (m) => m && m.role === "user" && hasResearchIntent(m.text),
      )
    : false;
  if (
    !hasResearchIntent(clean) &&
    !TOOL_SEEKING_RE.test(clean) &&
    !BEGINNER_RE.test(clean) &&
    !(hasPriorResearch && FOLLOWUP_QUERY_RE.test(clean))
  ) {
    return {
      intent: "off_topic",
      reply: zh
        ? "鼠鼠只懂啃瓜子和挑**科研开源工具**哈哈 🐹～生活百科不是我的强项，但如果你在写论文或做实验，直接告诉我你的**专业 + 具体环节**（比如：查文献、跑实证、画配图、英文润色、排版），我马上帮你从收录库里精准筛选！"
        : "I only know sunflower seeds and **open-source research Skills** 🐹! Tell me your **discipline + research task** (literature review, data analysis, plotting, polishing, or formatting), and I'll find the best-matched tools on site!",
    };
  }

  return null;
}

/**
 * 提炼用户在页面上已激活的筛选上下文摘要（用于检索加权与云端模型提示）
 */
export function summarizePageContext(pageState, lang = "zh") {
  if (!pageState || typeof pageState !== "object") return "";
  const zh = lang === "zh";
  const parts = [];
  if (pageState.discipline && pageState.discipline !== "all") {
    parts.push(professionLabel(pageState, lang));
  }
  if (pageState.stage) {
    const st = RESEARCH_STAGES.find((s) => s.id === pageState.stage);
    if (st) parts.push((zh ? st.zh : st.en).replace(/^[^\p{L}\p{N}]+\s*/u, ""));
  }
  if (pageState.task && pageState.task !== "all") {
    parts.push(pageState.task);
  }
  if (pageState.webReady) {
    parts.push(zh ? "免安装/网页版直用" : "Zero-install Web AI");
  }
  if (pageState.agent && pageState.agent !== "all") {
    parts.push(pageState.agent);
  }
  return parts.join(" · ");
}

/**
 * 从全站收录库中毫秒级召回与学生提问最匹配的 Top K 真实 Skill 候选
 * 支持结合多轮对话历史（history）与当前页面已选筛选（pageState）做上下文感知加权
 */
export function retrieveAssistantCandidates(query, items, limit = 8, context = {}) {
  const clean = String(query || "").trim();
  const skills = (items || []).filter((i) => i.repository_kind === "skill");
  if (!clean) return skills.slice(0, limit);

  const priorUserTexts = Array.isArray(context?.history)
    ? context.history
        .filter((m) => m && m.role === "user" && typeof m.text === "string")
        .map((m) => m.text.trim())
        .filter((txt) => txt && !matchConversationalIntent(txt, "zh"))
        .slice(-2)
    : [];
  const pageState = context?.pageState || null;
  const combinedContext = [...priorUserTexts, clean].join(" ");

  // 当前提问优先识别学科与阶段；若当前是短追问（未显式点名学科），则继承上文或页面已选专业
  const directDisciplines = DISCIPLINE_HINTS.filter((d) => d.re.test(clean)).map((d) => d.id);
  const historyDisciplines = directDisciplines.length
    ? []
    : DISCIPLINE_HINTS.filter((d) => d.re.test(combinedContext)).map((d) => d.id);
  const pageDiscipline =
    !directDisciplines.length &&
    pageState?.discipline &&
    pageState.discipline !== "all"
      ? [pageState.discipline]
      : [];
  const matchedDisciplines = [
    ...new Set([...directDisciplines, ...historyDisciplines, ...pageDiscipline]),
  ];

  const directStages = STAGE_HINTS.filter((s) => s.re.test(clean)).map((s) => s.id);
  const fallbackStages = directStages.length
    ? []
    : STAGE_HINTS.filter((s) => s.re.test(combinedContext)).map((s) => s.id);
  const pageStage = !directStages.length && pageState?.stage ? [pageState.stage] : [];
  const matchedStages = [...new Set([...directStages, ...fallbackStages, ...pageStage])];

  const wantsBeginner =
    BEGINNER_RE.test(clean) ||
    BEGINNER_RE.test(combinedContext) ||
    Boolean(pageState?.webReady);
  const preferredAgent =
    pageState?.agent && pageState.agent !== "all" ? pageState.agent : "";
  const preferredTask =
    pageState?.task && pageState.task !== "all"
      ? RESEARCH_TASKS.find((t) => t.id === pageState.task)
      : null;

  // 分词检索辅助打分（当前提问高权重，历史首轮核心词低权重兜底）
  const tokens = clean
    .replace(/[，。？！、,.?!:：/]/g, " ")
    .split(/\s+/)
    .filter((tok) => tok.length >= 2)
    .slice(0, 6);
  const tokenSearches = tokens.map((tok) => createSearch(tok));
  const fullSearch = createSearch(clean);
  const historySearches = priorUserTexts.slice(-1).map((txt) => createSearch(txt));

  const scored = skills.map((item) => {
    let relevanceScore = 0;
    const blob = [
      item.repo,
      item.curated_use_zh,
      item.curated_use_en,
      item.description,
      ...(item.topics || []),
    ].join(" ");

    // 1. 专业匹配加权（显式提问权重高于页面隐式继承）
    for (const did of matchedDisciplines) {
      const isDirect = directDisciplines.includes(did);
      const major =
        did === pageState?.discipline && pageState?.major ? pageState.major : "all";
      const fit = disciplineFit(item, { discipline: did, major });
      if (fit === "specific") relevanceScore += isDirect ? 42 : 28;
      else if (fit === "common") relevanceScore += 8;
    }

    // 2. 论文阶段急救场景匹配加权（精选锚点最高优先级）
    for (const sid of matchedStages) {
      const stage = RESEARCH_STAGES.find((s) => s.id === sid);
      if (!stage) continue;
      const isDirect = directStages.includes(sid);
      const featuredIdx = stage.featured?.indexOf(item.repo) ?? -1;
      if (featuredIdx !== -1) {
        relevanceScore += (isDirect ? 55 : 34) - featuredIdx * 3;
      } else if (matchesResearchStage(item, stage)) {
        relevanceScore += isDirect ? 24 : 14;
      }
    }

    // 3. 页面已选任务与平台加权
    if (preferredTask && matchesResearchTask(item, preferredTask)) {
      relevanceScore += 14;
    }
    const itemAgents = detectAgents(item);
    if (preferredAgent && itemAgents.includes(preferredAgent)) {
      relevanceScore += 15;
    }

    // 4. 关键词检索匹配
    if (fullSearch.matches(blob)) relevanceScore += 30;
    for (const ts of tokenSearches) {
      if (ts.matches(blob)) relevanceScore += 12;
    }
    for (const hs of historySearches) {
      if (hs.matches(blob)) relevanceScore += 10;
    }

    // 5. 零门槛/免命令行友好度加权
    const inst = installationFor(item);
    if (wantsBeginner) {
      if (isWebAiReady(item)) relevanceScore += 20;
      if (inst.mode === "command") relevanceScore += 8;
      if (/claude\.ai|web|网页|docx|easyread|anti-defensive|humanizer/i.test(blob)) {
        relevanceScore += 12;
      }
    }

    // 6. 社区认可度与近期维护状态（对数平滑，长期停更项目轻微降权）
    const popularityScore =
      Math.min(18, Math.log10(Math.max(10, item.stars || 10)) * 3.8) - (item.stale ? 4 : 0);
    const score = relevanceScore + popularityScore;

    return { item, score, relevanceScore, inst, itemAgents };
  });

  scored.sort((a, b) => b.score - a.score || (b.item.stars || 0) - (a.item.stars || 0));

  return scored.slice(0, limit).map(({ item, relevanceScore, inst, itemAgents }) => {
    const matchedTaskIds = RESEARCH_TASKS.filter((t) => matchesResearchTask(item, t)).map(
      (t) => t.id,
    );
    return {
      item,
      repo: item.repo,
      stars: item.stars || 0,
      relevanceScore,
      summary: item.curated_use_zh || item.description || "",
      summaryEn: item.curated_use_en || item.description || "",
      tasks: matchedTaskIds.join(", "),
      agents: itemAgents.slice(0, 3).join(", "),
      mode: inst.mode,
      webReady: isWebAiReady(item),
    };
  });
}

/**
 * 本地零成本智能回复生成器（当云端免费 API 未配置、离线或限流时无缝秒回）
 */
export function buildLocalAdvisorReply(query, candidates, lang = "zh", context = {}) {
  const clean = String(query || "").trim();
  const convo = matchConversationalIntent(clean, lang, context);
  if (convo) return convo.reply;

  const top = candidates.slice(0, 3);
  const maxRel = Math.max(0, ...top.map((c) => c.relevanceScore || 0));
  const priorText = Array.isArray(context?.history)
    ? context.history
        .filter((m) => m?.role === "user" && !matchConversationalIntent(m.text, lang))
        .slice(-2)
        .map((m) => m.text)
        .join(" ")
    : "";
  const combined = `${priorText} ${clean}`;
  const wantsBeginner =
    BEGINNER_RE.test(combined) || Boolean(context?.pageState?.webReady);
  const matchedDisc =
    DISCIPLINE_HINTS.find((d) => d.re.test(clean)) ||
    DISCIPLINE_HINTS.find((d) => d.re.test(priorText)) ||
    (context?.pageState?.discipline && context.pageState.discipline !== "all"
      ? { id: context.pageState.discipline }
      : null);
  const discObj = matchedDisc ? DISCIPLINES.find((d) => d.id === matchedDisc.id) : null;
  const isBroadAsk = maxRel < 10 && !discObj && !hasResearchIntent(combined);

  if (lang === "en") {
    const intro = discObj
      ? `Based on your **${discObj.en}** focus, here are the ${top.length} best-matched open-source Skills on our site:`
      : isBroadAsk
        ? `If you haven't narrowed down a specific task yet, here are the ${top.length} highest-rated all-around research Skills on site (tell me your **discipline + task** for sharper picks 🐹):`
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
    : isBroadAsk
      ? `如果你还没锁定具体方向，可以先看看站里口碑最高的 ${top.length} 个全流程科研合集（告诉我你的**专业 + 具体环节**还能挑得更准哦 🐹）：`
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
 * 从 AI 回复正文中提取被点名推荐的候选仓库（仅当提问本身具备明确科研相关性时才允许回退）
 */
export function extractMentionedCandidates(replyText, candidates) {
  const lower = String(replyText || "").toLowerCase();
  const hit = candidates.filter((c) => {
    const full = c.repo.toLowerCase();
    const shortName = full.split("/")[1];
    return lower.includes(full) || (shortName && shortName.length >= 5 && lower.includes(shortName));
  });
  if (hit.length > 0) return hit.slice(0, 3);
  const maxRel = Math.max(0, ...candidates.map((c) => c.relevanceScore || 0));
  return maxRel >= 18 ? candidates.slice(0, 3) : [];
}

/**
 * 提问主入口：寒暄/闲聊毫秒级自然直回；科研选型优先请求云端免费 AI（免预检简单请求），失败零感降级本地顾问
 */
export async function askShushuAssistant({
  query,
  items,
  lang = "zh",
  apiEndpoint,
  history = [],
  pageState = null,
}) {
  const context = { history, pageState };
  const convo = matchConversationalIntent(query, lang, context);
  if (convo) {
    return {
      reply: convo.reply,
      picks: [],
      source: "shushu-persona",
    };
  }

  const candidates = retrieveAssistantCandidates(query, items, 8, context);
  const pageContext = summarizePageContext(pageState, lang);
  const priorTurns = Array.isArray(history)
    ? history
        .filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.text === "string" &&
            m.text.trim() &&
            !(m.role === "user" && matchConversationalIntent(m.text, lang)),
        )
        .slice(-4)
        .map((m) => ({ role: m.role, content: m.text.trim().slice(0, 220) }))
    : [];
  const endpoint =
    apiEndpoint ||
    (typeof window !== "undefined" && window.__ARS_BOT_API) ||
    DEFAULT_BOT_API;

  if (endpoint !== "local-only") {
    const controller = new AbortController();
    // 留足 18s 兼容跨境链路及主备模型自动切换，并使用 text/plain 避免浏览器额外 OPTIONS 预检耗时
    const timer = setTimeout(() => controller.abort(), 18000);
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({
          query,
          lang,
          pageContext,
          history: priorTurns,
          candidates: candidates.map((c) => ({
            repo: c.repo,
            stars: c.stars,
            summary: lang === "en" ? c.summaryEn : c.summary,
            tasks: c.tasks,
            mode: c.mode,
            webReady: c.webReady,
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
    reply: buildLocalAdvisorReply(query, candidates, lang, context),
    picks: candidates.slice(0, 3),
    source: "local-advisor",
  };
}
