import React, { useEffect, useMemo, useState } from "react";
import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { copyText } from "../clipboard";
import { trackEvent } from "../analytics";
import { useFeedback } from "./FeedbackProvider";
import { formatCompactCount } from "../practical";
import { loadSubskillsCatalog, matchSubskillsForItem } from "../subskillsLoader";

/**
 * 面向多技能合集仓库的子技能目录浏览器：支持毫秒级搜索、点选复制调用词与直达官方 SKILL.md
 */
export function SubskillsExplorer({ item, lang = "zh", initialFilter = "" }) {
  const zh = lang === "zh";
  const message = useFeedback();
  const [catalog, setCatalog] = useState(null);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [copiedName, setCopiedName] = useState("");

  useEffect(() => {
    setExpanded(false);
    setCopiedName("");
    setQuery("");
  }, [item?.repo]);

  useEffect(() => {
    let alive = true;
    if ((item?.skills_count || 0) < 2) return undefined;
    loadSubskillsCatalog().then((data) => {
      if (!alive) return;
      setCatalog(data);
      const extQuery = String(initialFilter || "").trim();
      if (extQuery) {
        const list = data?.repos?.[String(item?.repo || "").toLowerCase()]?.items || [];
        const hits = matchSubskillsForItem({ subskills_list: list }, extQuery);
        if (hits.length > 0 && hits.length < list.length) {
          setQuery(extQuery);
        }
      }
    });
    return () => {
      alive = false;
    };
  }, [item?.repo, item?.skills_count, initialFilter]);

  const entry = catalog?.repos?.[String(item?.repo || "").toLowerCase()];
  const allSubskills = entry?.items || [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allSubskills;
    return allSubskills.filter(
      (sub) =>
        sub.n.toLowerCase().includes(q) ||
        (sub.g && sub.g.toLowerCase().includes(q)),
    );
  }, [allSubskills, query]);

  if (!entry || allSubskills.length < 2) return null;

  const isSearching = Boolean(query.trim());
  const defaultLimit = 10;
  const shown = isSearching || expanded ? filtered.slice(0, 60) : filtered.slice(0, defaultLimit);
  const branch = encodeURIComponent(entry.branch || item?.default_branch || "main");
  const totalCount = Math.max(entry.total || 0, allSubskills.length);

  const buildSubskillPrompt = (sub) =>
    zh
      ? `请使用 ${item.repo} 技能库中的【${sub.n}】子技能，帮我处理当前目录下的研究任务（请先简要说明所需输入材料，再按规范执行）。`
      : `Using the [${sub.n}] sub-skill from ${item.repo}, help me run this workflow on the files in my current folder (briefly confirm expected inputs first).`;

  const handleCopySubskill = async (sub) => {
    try {
      await copyText(buildSubskillPrompt(sub));
      setCopiedName(sub.p);
      trackEvent("copy_subskill_prompt", { repo: item.repo, subskill: sub.n });
      message.success(
        zh ? `已复制「${sub.n}」子技能调用词` : `Copied prompt for ${sub.n}`,
      );
      window.setTimeout(() => {
        setCopiedName((cur) => (cur === sub.p ? "" : cur));
      }, 1800);
    } catch {
      message.error(zh ? "复制失败，请手动选择复制" : "Copy failed");
    }
  };

  return (
    <section
      className="subskills-explorer"
      data-testid="subskills-explorer"
      aria-label={zh ? "仓库内子技能目录" : "Included sub-skills directory"}
    >
      <div className="subskills-header">
        <div className="subskills-title">
          <strong>
            {zh
              ? `🧩 内含 ${totalCount} 个子技能`
              : `🧩 Includes ${totalCount} sub-skills`}
          </strong>
          <span>
            {zh ? "点名称一键复制专属调用词" : "Click any sub-skill to copy its prompt"}
          </span>
        </div>
        {allSubskills.length > 6 && (
          <input
            type="search"
            className="subskills-search"
            data-testid="subskills-search"
            value={query}
            placeholder={zh ? "搜索子技能名 / 领域…" : "Filter sub-skills…"}
            aria-label={zh ? "搜索仓库内子技能" : "Filter included sub-skills"}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
      </div>

      {shown.length > 0 ? (
        <div className="subskills-grid">
          {shown.map((sub) => {
            const copied = copiedName === sub.p;
            const fileUrl = `https://github.com/${item.repo}/blob/${branch}/${sub.p}`;
            return (
              <div key={sub.p} className="subskill-pill" data-testid="subskill-pill">
                <button
                  type="button"
                  className="subskill-copy-btn"
                  onClick={() => handleCopySubskill(sub)}
                  title={
                    zh
                      ? `点击复制「${sub.n}」调用提示词`
                      : `Copy prompt for ${sub.n}`
                  }
                >
                  {copied ? (
                    <CheckOutlined className="subskill-icon is-copied" aria-hidden="true" />
                  ) : (
                    <CopyOutlined className="subskill-icon" aria-hidden="true" />
                  )}
                  <span className="subskill-name">{sub.n}</span>
                  {sub.i > 0 && (
                    <b
                      className="subskill-installs"
                      title={
                        zh
                          ? `Skills CLI 累计下载 ${sub.i.toLocaleString()} 次`
                          : `${sub.i.toLocaleString()} downloads via Skills CLI`
                      }
                    >
                      ↓{formatCompactCount(sub.i)}
                    </b>
                  )}
                  {sub.g && <em className="subskill-group">{sub.g.split("/").pop()}</em>}
                </button>
                <a
                  className="subskill-doc-link"
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={zh ? "查看官方 SKILL.md" : "Open SKILL.md on GitHub"}
                  aria-label={`${sub.n} SKILL.md`}
                >
                  ↗
                </a>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="subskills-empty">
          {zh ? "没有匹配该关键词的子技能" : "No matching sub-skills"}
        </p>
      )}

      {!isSearching && filtered.length > defaultLimit && (
        <button
          type="button"
          className="subskills-more-btn"
          data-testid="subskills-toggle-more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded
            ? zh
              ? "收起列表 ⌃"
              : "Collapse ⌃"
            : zh
              ? `展开更多子技能（共收录 ${allSubskills.length} 个目录项）⌄`
              : `Show more sub-skills (${allSubskills.length} indexed) ⌄`}
        </button>
      )}
    </section>
  );
}
