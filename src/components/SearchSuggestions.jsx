import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SearchHighlight } from "./SearchHighlight";

const QUICK_KEYWORDS = {
  zh: ["论文写作", "文献综述", "Zotero", "LaTeX", "科研绘图", "审稿"],
  en: ["paper writing", "literature review", "Zotero", "LaTeX", "figures", "peer review"],
};

const RECENT_QUERIES_KEY = "ars-recent-queries";

function readRecentQueries() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_QUERIES_KEY) || "[]");
    return Array.isArray(parsed)
      ? parsed.filter((s) => typeof s === "string" && s.trim().length >= 2).slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

export function saveRecentQuery(raw) {
  const clean = String(raw || "").trim();
  if (clean.length < 2) return;
  try {
    const prev = readRecentQueries().filter(
      (x) => x.toLowerCase() !== clean.toLowerCase(),
    );
    localStorage.setItem(
      RECENT_QUERIES_KEY,
      JSON.stringify([clean, ...prev].slice(0, 5)),
    );
  } catch {
    /* ignore */
  }
}

export default function SearchSuggestions({
  state,
  update,
  items,
  allItems = items,
  taskOptions,
  taskIds,
  t,
  focused,
  expanded,
  expand,
  dismiss,
  keyHandler,
  inputRef,
}) {
  const [active, setActive] = useState(-1);
  const [recentQueries, setRecentQueries] = useState(readRecentQueries);
  const listRef = useRef(null);
  const zh = state.lang === "zh";

  useEffect(() => {
    if (focused) setRecentQueries(readRecentQueries());
  }, [focused]);

  useEffect(
    () => setActive(-1),
    [
      state.query,
      state.task,
      state.category,
      state.agent,
      state.favOnly,
      state.sort,
      state.lang,
      focused,
    ],
  );
  useEffect(() => {
    if (!expanded) setActive(-1);
  }, [expanded]);

  const q = state.query.trim().toLowerCase();
  const options = q
    ? [
        ...taskOptions
          .filter(
            (task) =>
              taskIds.includes(task.id) || task.label.toLowerCase().includes(q),
          )
          .slice(0, 2)
          .map((task) => ({ ...task, kind: "task" })),
        ...items.slice(0, 5).map((item) => ({
          id: item.repo,
          label: item.repo,
          item,
          kind: "repo",
        })),
      ]
    : [];
  const open = focused && expanded && options.length > 0;
  const showQuickPicks = focused && expanded && !q;
  const activeOption = open && options[active];

  const recentViewedItems = showQuickPicks
    ? (state.recent || [])
        .slice(0, 3)
        .map((repo) => (allItems || items).find((it) => it.repo === repo))
        .filter(Boolean)
    : [];

  useEffect(() => {
    if (open && active >= 0)
      listRef.current
        ?.querySelector(`#search-option-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  useLayoutEffect(() => {
    keyHandler.current = keyDown;
    return () => {
      keyHandler.current = null;
    };
  });

  useLayoutEffect(() => {
    const input = inputRef.current?.input;
    if (!input) return;
    input.setAttribute("aria-autocomplete", "list");
    if (open) input.setAttribute("aria-controls", "search-suggestions");
    else input.removeAttribute("aria-controls");
    if (activeOption)
      input.setAttribute("aria-activedescendant", `search-option-${active}`);
    else input.removeAttribute("aria-activedescendant");
    return () => {
      input.removeAttribute("aria-controls");
      input.removeAttribute("aria-activedescendant");
    };
  }, [open, active, activeOption, inputRef]);

  function choose(option) {
    if (state.query.trim().length >= 2) saveRecentQuery(state.query);
    dismiss();
    setActive(-1);
    if (option.kind === "task") {
      update((previous) => ({
        ...previous,
        query: "",
        task: option.id,
        category: "all",
      }));
    } else update((previous) => ({ ...previous, repo: option.id }));
  }

  function keyDown(event) {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    if (["ArrowDown", "ArrowUp"].includes(event.key) && options.length) {
      event.preventDefault();
      expand();
      setActive((previous) =>
        event.key === "ArrowDown"
          ? (previous + 1) % options.length
          : previous <= 0
            ? options.length - 1
            : previous - 1,
      );
    } else if (event.key === "Enter") {
      if (state.query.trim().length >= 2) saveRecentQuery(state.query);
      if (activeOption) {
        event.preventDefault();
        choose(activeOption);
      } else dismiss();
    } else if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        event.stopPropagation();
      }
      dismiss();
      setActive(-1);
    } else if (event.key === "Tab") dismiss();
  }

  return (
    <>
      <span className="sr-only" role="status">
        {open
          ? t("searchSuggestionCount").replace("{count}", options.length)
          : ""}
      </span>
      {open && (
        <div className="search-popup">
          <ul
            ref={listRef}
            id="search-suggestions"
            role="listbox"
            aria-label={t("searchSuggestions")}
          >
            {options.map((option, index) => (
              <li
                key={`${option.kind}-${option.id}`}
                id={`search-option-${index}`}
                role="option"
                aria-selected={index === active}
                data-suggestion-kind={option.kind}
                data-suggestion-repo={
                  option.kind === "repo" ? option.id : undefined
                }
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                onMouseEnter={() => setActive(index)}
              >
                <div className="search-option-heading">
                  <span>
                    <SearchHighlight text={option.label} query={state.query} />
                  </span>
                  <small>
                    {t(
                      option.kind === "task"
                        ? "searchTask"
                        : "searchRepository",
                    )}
                  </small>
                </div>
                {(zh && option.item?.curated_use_zh
                  ? option.item.curated_use_zh
                  : option.item?.description) && (
                  <div className="search-option-description">
                    <SearchHighlight
                      text={
                        zh && option.item?.curated_use_zh
                          ? option.item.curated_use_zh
                          : option.item.description
                      }
                      query={state.query}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="search-suggestion-hint">
            {t("searchSuggestionHint")}
          </div>
        </div>
      )}
      {showQuickPicks && (
        <div
          className="search-popup search-quick-picks"
          data-testid="search-quick-picks"
          onPointerDown={(event) => event.preventDefault()}
        >
          {recentViewedItems.length > 0 && (
            <div className="search-quick-group" data-testid="search-recent-repos">
              <span className="search-quick-label">
                {zh ? "最近浏览" : "Recently viewed"}
              </span>
              <div className="search-quick-list">
                {recentViewedItems.map((it) => (
                  <button
                    key={it.repo}
                    type="button"
                    className="search-quick-chip is-repo"
                    onClick={() => {
                      dismiss();
                      update((prev) => ({ ...prev, repo: it.repo }));
                    }}
                  >
                    {it.repo.split("/").pop()}
                  </button>
                ))}
              </div>
            </div>
          )}
          {recentQueries.length > 0 && (
            <div className="search-quick-group" data-testid="search-recent-queries">
              <div className="search-quick-head">
                <span className="search-quick-label">
                  {zh ? "最近搜索" : "Recent searches"}
                </span>
                <button
                  type="button"
                  className="search-quick-clear"
                  onClick={() => {
                    setRecentQueries([]);
                    try {
                      localStorage.removeItem(RECENT_QUERIES_KEY);
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  {zh ? "清空" : "Clear"}
                </button>
              </div>
              <div className="search-quick-list">
                {recentQueries.map((word) => (
                  <button
                    key={word}
                    type="button"
                    className="search-quick-chip"
                    onClick={() => {
                      update((previous) => ({ ...previous, query: word }));
                      expand();
                    }}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="search-quick-group">
            <span className="search-quick-label">
              {zh ? "热门科研场景" : "Popular searches"}
            </span>
            <div className="search-quick-list">
              {(QUICK_KEYWORDS[state.lang] || QUICK_KEYWORDS.zh).map((word) => (
                <button
                  key={word}
                  type="button"
                  className="search-quick-chip"
                  onClick={() => {
                    saveRecentQuery(word);
                    update((previous) => ({ ...previous, query: word }));
                    expand();
                  }}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
