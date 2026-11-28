import React, { useEffect, useMemo, useState } from "react";
import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { copyText } from "../clipboard";
import { useFeedback } from "./FeedbackProvider";
import { trackEvent } from "../analytics";

// 自动扫描 content/guides/*.md：后续新增或修改教程仅需往该目录放入 Markdown 文件即可自动上线
const rawGuideModules = import.meta.glob("../../content/guides/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function parseFrontmatter(raw) {
  const text = String(raw || "").replace(/\r\n/g, "\n");
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: text.trim() };
  const meta = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    meta[key] = key === "order" ? Number(val) || 99 : val;
  }
  return { meta, body: match[2].trim() };
}

function slugifyHeading(text, idx) {
  const clean = String(text || "")
    .replace(/[`*_~]/g, "")
    .trim();
  return `sec-${idx}-${clean.slice(0, 18).replace(/\s+/g, "-")}`;
}

// 解析行内 **加粗**、`代码` 与 [链接](url)
function renderInline(text) {
  const parts = String(text || "").split(
    /(\*\*[^*]+\*\*|``[^`]+``|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*(?!\s)[^*]+\*)/g,
  );
  return parts.map((tok, i) => {
    if (!tok) return null;
    if (tok.startsWith("**") && tok.endsWith("**")) {
      return <strong key={i}>{tok.slice(2, -2)}</strong>;
    }
    if (tok.startsWith("``") && tok.endsWith("``")) {
      return <code key={i}>{tok.slice(2, -2).trim()}</code>;
    }
    if (tok.startsWith("`") && tok.endsWith("`")) {
      return <code key={i}>{tok.slice(1, -1)}</code>;
    }
    if (tok.startsWith("*") && tok.endsWith("*") && tok.length > 2) {
      return <em key={i}>{tok.slice(1, -1)}</em>;
    }
    const linkMatch = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <React.Fragment key={i}>{tok}</React.Fragment>;
  });
}

// 轻量结构化解析 Markdown 正文（支持标题目录锚点、一键复制代码块、表格、提示框与列表）
function parseMarkdownBlocks(body) {
  const lines = String(body || "").split("\n");
  const blocks = [];
  const toc = [];
  let i = 0;
  let headingIdx = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    // 代码块 ```lang
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim() || "bash";
      const codeLines = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      continue;
    }

    // 二级 / 三级标题
    const hMatch = line.match(/^(#{2,3})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const text = hMatch[2].trim();
      const id = slugifyHeading(text, ++headingIdx);
      if (level === 2) toc.push({ id, text: text.replace(/[`*]/g, "") });
      blocks.push({ type: "heading", level, id, text });
      i += 1;
      continue;
    }

    // 表格
    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:-]+\|/.test(lines[i + 1])) {
      const parseRow = (r) =>
        r
          .trim()
          .replace(/^\|/, "")
          .replace(/\|$/, "")
          .split("|")
          .map((c) => c.trim());
      const headers = parseRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        rows.push(parseRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    // 引用提示框 > [!TIP]
    if (line.trim().startsWith(">")) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        const cleaned = lines[i].replace(/^\s*>\s?/, "");
        if (!/^\[!(?:TIP|NOTE|IMPORTANT|WARNING)\]/i.test(cleaned.trim())) {
          quoteLines.push(cleaned);
        }
        i += 1;
      }
      blocks.push({ type: "callout", text: quoteLines.join(" ") });
      continue;
    }

    // 无序或有序列表
    if (/^\s*(?:[-*]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\.\s+/.test(line);
      const items = [];
      while (i < lines.length && /^\s*(?:[-*]|\d+\.)\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*(?:[-*]|\d+\.)\s+/, "").trim());
        i += 1;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    // 普通段落
    const para = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !/^#{2,3}\s+/.test(lines[i]) &&
      !lines[i].trim().startsWith(">") &&
      !/^\s*(?:[-*]|\d+\.)\s+/.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "p", text: para.join(" ") });
  }

  return { blocks, toc };
}

const ALL_GUIDES = Object.entries(rawGuideModules)
  .filter(([path]) => !/README\.md$/i.test(path))
  .map(([, content]) => {
    const { meta, body } = parseFrontmatter(content);
    const { blocks, toc } = parseMarkdownBlocks(body);
    return { ...meta, body, blocks, toc };
  })
  .filter((g) => g.slug && g.title)
  .sort((a, b) => (a.order || 99) - (b.order || 99));

export default function AgentGuides({
  lang = "zh",
  activeSlug = "",
  onSelectSlug,
  onBackToRanking,
  onOpenCommunity,
}) {
  const zh = lang === "zh";
  const message = useFeedback();
  const [copiedIdx, setCopiedIdx] = useState(null);

  const current = useMemo(
    () => ALL_GUIDES.find((g) => g.slug === activeSlug) || ALL_GUIDES[0],
    [activeSlug],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [current?.slug]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const g of ALL_GUIDES) {
      const grp = g.group || "装机与实战教程";
      if (!map.has(grp)) map.set(grp, []);
      map.get(grp).push(g);
    }
    return [...map.entries()];
  }, []);

  const topAgentCards = useMemo(
    () => ALL_GUIDES.filter((g) => g.card_title).slice(0, 4),
    [],
  );

  const handleCopyCode = async (idx, code) => {
    try {
      await copyText(code);
      setCopiedIdx(idx);
      trackEvent("copy_guide_command", { slug: current?.slug });
      message.success(zh ? "已复制命令" : "Command copied");
      setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1800);
    } catch {
      message.error(zh ? "复制失败，请手动复制" : "Copy failed");
    }
  };

  if (!current) return null;

  return (
    <section
      className="agent-guides-module"
      data-testid="agent-guides-module"
      aria-labelledby="agent-guides-heading"
    >
      <div className="agent-guides-hero">
        <div className="agent-guides-hero-top">
          <div>
            <h2 id="agent-guides-heading">
              {zh
                ? "科研 AI Agent 零基础装机与 Skills 实战专栏"
                : "Research AI Agent Setup & Skills Tutorials"}
            </h2>
            <p>
              {zh
                ? "专门写给还没装过本地 AI 助手的同学：挑下方任意 1 款工具花 5 分钟装好，即可解锁本站 500+ 科研 Skills 的完整读写文献与运行绘图能力。"
                : "New to local AI Agents? Pick any one tool below, set it up in 5 minutes, and unlock all 500+ verified research Skills."}
            </p>
          </div>
          <button
            type="button"
            className="agent-guides-back-btn"
            data-testid="guides-back-to-ranking"
            onClick={onBackToRanking}
          >
            {zh ? "← 装好了？返回 Skills 榜单" : "← Back to Skills Ranking"}
          </button>
        </div>

        <div className="agent-guides-cards" role="tablist" aria-label={zh ? "主流科研 Agent 快速切换" : "Popular AI Agents"}>
          {topAgentCards.map((g) => {
            const active = g.slug === current.slug;
            return (
              <button
                key={g.slug}
                type="button"
                role="tab"
                aria-selected={active}
                className={`agent-guide-top-card${active ? " is-active" : ""}`}
                data-guide-card={g.slug}
                onClick={() => onSelectSlug(g.slug)}
              >
                <div className="agent-guide-card-head">
                  <strong>{g.card_title}</strong>
                  {g.badge && <em>{g.badge}</em>}
                </div>
                <span>{g.card_desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="agent-guides-layout">
        <aside className="agent-guides-sidebar" aria-label={zh ? "教程文章列表" : "Tutorial list"}>
          {groups.map(([groupName, list]) => (
            <div key={groupName} className="agent-guides-nav-group">
              <div className="agent-guides-group-title">{groupName}</div>
              {list.map((g) => {
                const active = g.slug === current.slug;
                return (
                  <button
                    key={g.slug}
                    type="button"
                    className={`agent-guides-nav-item${active ? " is-active" : ""}`}
                    data-guide-nav={g.slug}
                    aria-current={active ? "page" : undefined}
                    onClick={() => onSelectSlug(g.slug)}
                  >
                    <span>{g.card_title || g.title}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        <article className="agent-guides-article" key={current.slug}>
          <header className="agent-article-header">
            <div className="agent-article-meta">
              {current.updated && <span>更新于 {current.updated}</span>}
              {current.reading_time && <span>· 预计阅读 {current.reading_time}</span>}
              <span>· 零基础本硕博适用</span>
            </div>
            <h1>{current.title}</h1>
            {current.summary && <p className="agent-article-lead">{current.summary}</p>}
          </header>

          <div className="agent-article-body">
            {current.blocks.map((b, idx) => {
              if (b.type === "heading") {
                return b.level === 2 ? (
                  <h2 key={idx} id={b.id}>
                    {renderInline(b.text)}
                  </h2>
                ) : (
                  <h3 key={idx} id={b.id}>
                    {renderInline(b.text)}
                  </h3>
                );
              }
              if (b.type === "code") {
                const isCommand = b.lang === "bash" || b.lang === "sh" || b.lang === "text";
                return (
                  <div key={idx} className="agent-code-block">
                    <pre>
                      <code>{b.code}</code>
                    </pre>
                    {isCommand && (
                      <button
                        type="button"
                        className="agent-code-copy"
                        onClick={() => handleCopyCode(idx, b.code)}
                      >
                        {copiedIdx === idx ? (
                          <>
                            <CheckOutlined aria-hidden="true" /> 已复制
                          </>
                        ) : (
                          <>
                            <CopyOutlined aria-hidden="true" /> 复制
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              }
              if (b.type === "table") {
                return (
                  <div key={idx} className="agent-table-wrap">
                    <table className="agent-md-table">
                      <thead>
                        <tr>
                          {b.headers.map((h, hi) => (
                            <th key={hi}>{renderInline(h)}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {b.rows.map((r, ri) => (
                          <tr key={ri}>
                            {r.map((cell, ci) => (
                              <td
                                key={ci}
                                dangerouslySetInnerHTML={
                                  cell.includes("<br/>")
                                    ? {
                                        __html: cell
                                          .replace(
                                            /\*\*([^*]+)\*\*/g,
                                            "<strong>$1</strong>",
                                          )
                                          .replace(/`([^`]+)`/g, "<code>$1</code>"),
                                      }
                                    : undefined
                                }
                              >
                                {cell.includes("<br/>") ? null : renderInline(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }
              if (b.type === "callout") {
                return (
                  <div key={idx} className="agent-callout">
                    {renderInline(b.text)}
                  </div>
                );
              }
              if (b.type === "list") {
                const ListTag = b.ordered ? "ol" : "ul";
                return (
                  <ListTag key={idx} className="agent-md-list">
                    {b.items.map((it, li) => (
                      <li key={li}>{renderInline(it)}</li>
                    ))}
                  </ListTag>
                );
              }
              return <p key={idx}>{renderInline(b.text)}</p>;
            })}
          </div>

          <div className="agent-recharge-card" data-testid="guide-recharge-card">
            <div>
              <strong>
                💡 没有海外信用卡或怕封号？本站自营正规 AI 订阅代充与 API 额度
              </strong>
              <p>
                官方渠道支持 Claude / ChatGPT / Gemini / Codex · 自动发货 ·{" "}
                <em>可开增值税发票（技术服务费 / 文献检索）走课题组报销</em>
              </p>
            </div>
            <a
              href="https://catfk.com/shop/1991"
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="agent-recharge-cta"
              onClick={() =>
                trackEvent("click_recharge", {
                  slot: "agent_guide",
                  guide: current.slug,
                })
              }
            >
              前往选购 →
            </a>
          </div>

          <div className="agent-finish-card">
            <div>
              <strong>🎉 软件环境准备好了？立即去挑你的第一款科研 Skill！</strong>
              <p>按你的学科门类（理学 / 工学 / 医学 / 经管等）或科研任务一键复制安装命令。</p>
            </div>
            <button
              type="button"
              className="agent-finish-btn"
              onClick={onBackToRanking}
            >
              浏览 500+ 科研 Skills →
            </button>
          </div>
        </article>

        <aside className="agent-guides-toc" aria-label={zh ? "本篇目录与协助" : "On this page"}>
          {current.toc.length > 0 && (
            <div className="agent-side-box">
              <div className="agent-guides-group-title">本篇目录</div>
              <nav className="agent-toc-links">
                {current.toc.map((tItem) => (
                  <a key={tItem.id} href={`#${tItem.id}`} onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(tItem.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}>
                    {tItem.text}
                  </a>
                ))}
              </nav>
            </div>
          )}

          {onOpenCommunity && (
            <div className="agent-side-box is-mint">
              <strong>💬 卡在某一步装不上？</strong>
              <p>扫码加入科研鼠鼠交流群，同专业师兄师姐在线帮你看报错截图。</p>
              <button type="button" onClick={() => onOpenCommunity("agent_guide")}>
                扫码加入交流群
              </button>
            </div>
          )}

          <div className="agent-side-box">
            <strong>⏳ 明天就要交开题/初稿？</strong>
            <p>来不及配本地环境，可用合作工作台 <b>智一刻 AI</b> 直接生成带引文的论文提纲与初稿。</p>
            <a
              href="https://zhi1ke.com?pic=6PEB"
              target="_blank"
              rel="sponsored noopener noreferrer"
              onClick={() => trackEvent("click_zhi1ke", { slot: "agent_guide" })}
            >
              打开在线工作台 ↗
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}
