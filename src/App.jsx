import { BeginnerDialog } from "./components/BeginnerDialog";
import { OverlaySkeleton } from "./components/OverlaySkeleton";
import { growthState } from "./projectFacts";
import { ScopeControl } from "./components/ScopeControl";
import { ActionPopover } from "./components/ActionPopover";
import { ScopeSwitch } from "./components/ScopeSwitch";
import { DisciplineSelector } from "./components/DisciplineSelector";
import { SlidingTaskList } from "./components/SlidingTaskList";
import { Reveal, useSiteReducedMotion } from "./components/SiteMotion";
import { DailyArrivals } from "./components/DailyArrivals";
import { triggerCommunityDialog } from "./components/CommunityCard";
import { RechargeAd } from "./components/RechargeAd";
import { BackToTop } from "./components/BackToTop";
import { SearchBox } from "./components/SearchBox";
import { Panel } from "./components/Panel";
import React, {
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Button,
  ConfigProvider,
  Segmented,
  Space,
  Tag,
  Tooltip,
  theme,
} from "antd";
import { zhCN, enUS } from "./antd-locales";
import {
  AppstoreOutlined,
  BarsOutlined,
  BulbOutlined,
  CalendarOutlined,
  CloseOutlined,
  GithubOutlined,
  StarFilled,
  StarOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import {
  AGENT_PLATFORMS,
  detectAgents,
  filterItems,
  taskCountsFor,
  recentlyUpdatedCount,
  isNewThisWeek,
  isNewToday,
  beijingDay,
  FONT_FAMILY,
  persistState,
  REPOSITORY_URL,
  RESEARCH_STAGES,
  RESEARCH_TASKS,
  restoreState,
  serializeState,
} from "./domain";
import { copyText } from "./clipboard";
import { buildPackUrl, formatPackShareText } from "./shareText";
import { translations } from "./i18n";
import { THEME_TOKENS } from "./tokens";
import { enrichItem, editorialPicks } from "./practical";
import { ViewportEditorialPicks } from "./components/ViewportEditorialPicks";
import { UpdateStatus } from "./components/UpdateStatus";
import { DataTransparency } from "./components/DataTransparency";
import { ActiveFilters } from "./components/ActiveFilters";
import { RepositoryViews } from "./components/RepositoryViews";
import { FeedbackProvider, useFeedback } from "./components/FeedbackProvider";
import { DeferredFeature } from "./components/DeferredFeature";
const RepositoryDrawer = lazy(() =>
  import("./components/RepositoryDrawer").then((module) => ({
    default: module.RepositoryDrawer,
  })),
);
const FilterControls = lazy(() => import("./components/FilterControls"));
const ComparisonDialog = lazy(() => import("./components/ComparisonDialog"));
const RechargeNotice = lazy(() =>
  import("./components/RechargeNotice").then((m) => ({
    default: m.RechargeNotice,
  })),
);
import { ViewportInsights } from "./components/ViewportInsights";

const dataset = window.ACADEMIC_SKILLS_RANKINGS || {};
const sourceItems = Array.isArray(dataset.items)
  ? dataset.items.map((item) => ({
      ...enrichItem(item),
      new_this_week: isNewThisWeek(item, dataset.metadata?.generated_at),
      inactive90:
        Number.isFinite(Date.parse(item.last_push_date)) &&
        Date.parse(dataset.metadata?.generated_at) -
          Date.parse(item.last_push_date + "T00:00:00Z") >=
          90 * 86400000,
    }))
  : [];
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}
const defaults = {
  lang: window.ARS_DEFAULT_LANG || "zh",
  theme: matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
  view: "card",
};
const base = import.meta.env.BASE_URL;
const taskLabels = {
  analyze: "taskAnalyze",
  compute: "taskCompute",
  find: "taskFind",
  read: "taskRead",
  write: "taskWrite",
  figures: "taskFigures",
  reproduce: "taskReproduce",
  review: "taskReview",
};
// 急救场景单色线性图标路径，替代跨系统画风不一的彩色 Emoji
const STAGE_ICON_PATHS = {
  undergrad: "M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5",
  proposal: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15z",
  figures: "M3 3v18h18M7 16l4-5 4 3 5-7",
  empirical: "M18 20V10M12 20V4M6 20v-6",
  slides: "M2 3h20v14H2zM8 21h8M12 17v4",
  rebuttal: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z",
};
const localFile = (name) => base + name;
const landingHash = window.__ARS_INITIAL_HASH || "";
export default function App() {
  const reducedMotion=useSiteReducedMotion();
  const items = sourceItems;
  const landingSeed = useMemo(
    () => (landingHash ? restoreState(null, landingHash, defaults, items) : null),
    [items],
  );
  const [state, update] = useState(() =>
    restoreState(storage, location.hash || landingHash, defaults, items),
  );
  useEffect(() => {
    persistState(storage, state);
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en";
    const matchesLanding =
      landingSeed &&
      state.lang === "zh" &&
      state.discipline === landingSeed.discipline &&
      state.task === landingSeed.task;
    document.title =
      matchesLanding && window.__ARS_CUSTOM_TITLE
        ? window.__ARS_CUSTOM_TITLE
        : state.lang === "zh"
          ? "科研鼠鼠 · Skills 导航站｜大学生与研究生科研工具"
          : "Research Hamster · Skills Directory";
    const hash = serializeState(state);
    const seedSerialized = landingSeed
      ? serializeState(restoreState(storage, landingHash, defaults, items))
      : "";
    const nextHash =
      landingSeed && !location.hash && hash === seedSerialized ? "" : hash;
    if (location.hash !== nextHash)
      window.history.replaceState(
        null,
        "",
        location.pathname + location.search + nextHash,
      );
  }, [state, landingSeed]);
  useEffect(() => {
    const change = () =>
      update((previous) => ({
        ...restoreState(storage, location.hash || landingHash, defaults, items),
        favorites: previous.favorites,
        compare: previous.compare,
      }));
    addEventListener("hashchange", change);
    return () => removeEventListener("hashchange", change);
  }, []);
  const tokens = THEME_TOKENS[state.theme] || THEME_TOKENS.light;
  return (
    <ConfigProvider
      locale={state.lang === "zh" ? zhCN : enUS}
      theme={{
        algorithm:
          state.theme === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          motion: !reducedMotion,
          colorPrimary: tokens.primary,
          colorLink: tokens.link,
          colorLinkHover: tokens.linkHover,
          colorLinkActive: tokens.linkActive,
          fontFamily: FONT_FAMILY,
          colorBgContainer: tokens.bgContainer,
          borderRadius: 12,
          colorText: tokens.text,
          colorTextSecondary: tokens.textSecondary,
          colorBorder: tokens.border,
          colorBgLayout: tokens.bgLayout,
        },
        components: {
          Table: { headerBg: tokens.tableHeaderBg },
        },
      }}
    >
      <FeedbackProvider>
        <Dashboard {...{ state, update }} />
      </FeedbackProvider>
    </ConfigProvider>
  );
}
function Dashboard({ state, update }) {
  const [historyData, setHistoryData] = useState(
    () => window.ACADEMIC_SKILLS_HISTORY || { series: {} },
  );
  useEffect(() => {
    const syncHistory = () => {
      if (window.ACADEMIC_SKILLS_HISTORY) {
        setHistoryData(window.ACADEMIC_SKILLS_HISTORY);
      }
    };
    syncHistory();
    window.addEventListener("ars-history-loaded", syncHistory);
    return () => window.removeEventListener("ars-history-loaded", syncHistory);
  }, []);
  const [today, setToday] = useState(() => beijingDay());
  useEffect(() => {
    const sync = () => setToday(beijingDay());
    const timer = setInterval(sync, 60000);
    addEventListener("focus", sync);
    return () => {
      clearInterval(timer);
      removeEventListener("focus", sync);
    };
  }, []);
  const items = useMemo(
    () =>
      sourceItems.map((item) => ({
        ...item,
        new_today: isNewToday(item, today),
      })),
    [today],
  );
  const message = useFeedback();
  const [compareOpen, setCompareOpen] = useState(false);
  const [guideSection, setGuideSection] = useState(null);
  const [drawerRequested, setDrawerRequested] = useState(Boolean(state.repo));
  const [comparisonRequested, setComparisonRequested] = useState(false);
  useEffect(() => {
    if (state.repo) setDrawerRequested(true);
  }, [state.repo]);
  useEffect(() => {
    if (compareOpen) setComparisonRequested(true);
  }, [compareOpen]);
  const filterRef = useRef(null);
  const [filterHeight, setFilterHeight] = useState(0);
  useEffect(() => {
    const element = filterRef.current;
    const measure = () =>
      setFilterHeight(Math.ceil(element.getBoundingClientRect().height));
    measure();
    const observer =
      typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    observer?.observe(element);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);
  const visible = useMemo(() => filterItems(items, state), [items, state]);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const disciplineItems = useMemo(() => filterItems(items, {...state, discipline:'all', major:'all', task:'all'}), [items,state]);
  const scopeItems = useMemo(
    () =>
      items.filter(
        (item) =>
          item.repository_kind === "skill" ||
          (state.includeRelated && item.repository_kind === "related"),
      ),
    [items, state.includeRelated],
  );
  const relatedCount = items.filter(
    (item) => item.repository_kind === "related",
  ).length;
  const search = useRef(null);
  const stickySearch = useRef(null);
  const [stickySearchVisible, setStickySearchVisible] = useState(false);
  const syncStickySearch = useCallback(() => {
    const input = search.current?.input;
    const toolbar = filterRef.current;
    if (
      !input ||
      !toolbar ||
      document.activeElement?.id === "stickySearchInput"
    )
      return;
    const top = input.getBoundingClientRect().top;
    // Enter when the toolbar is pinned; return only after the original input is fully visible.
    setStickySearchVisible((showing) =>
      showing ? top < 8 : toolbar.getBoundingClientRect().top <= 0,
    );
  }, []);
  useEffect(() => {
    syncStickySearch();
    addEventListener("scroll", syncStickySearch, { passive: true });
    addEventListener("resize", syncStickySearch);
    return () => {
      removeEventListener("scroll", syncStickySearch);
      removeEventListener("resize", syncStickySearch);
    };
  }, [syncStickySearch]);

  const t = (key) => translations[state.lang][key] || key;
  const taskOptions = RESEARCH_TASKS.map((task) => ({
    id: task.id,
    label: t(taskLabels[task.id]),
  }));
  const fmt = (value) =>
    new Intl.NumberFormat(state.lang === "zh" ? "zh-CN" : "en-US").format(
      value || 0,
    );
  const taskCounts = useMemo(
    () => taskCountsFor(items, state),
    [
      items,
      state.query,
      state.agent,
      state.favOnly,
      state.favorites,
      state.newOnly,
      state.todayOnly,
      state.includeRelated,
      state.discipline,
      state.major,
      state.includeCommon,
      state.stage,
      state.pack,
    ],
  );
  const selected =
    visible.find((item) => item.repo === state.repo) ||
    items.find((item) => item.repo === state.repo);
  const platformIds = new Set(items.flatMap(detectAgents));
  const net7 = scopeItems.filter(i=>["value","zero"].includes(growthState(i,historyData,dataset.metadata?.generated_at))).reduce((sum, i) => sum + (i.star_delta_7d || 0), 0);
  const toggleCompare = (repo) => {
    if (!state.compare.includes(repo) && state.compare.length >= 3) {
      message.info(t("compareFull"));
      return;
    }
    update((s) => ({
      ...s,
      compare: s.compare.includes(repo)
        ? s.compare.filter((r) => r !== repo)
        : [...s.compare, repo],
    }));
  };
  useEffect(() => {
    if (!state.compare.length) setCompareOpen(false);
  }, [state.compare]);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && compareOpen) {
        setCompareOpen(false);
        return;
      }
      if (
        e.defaultPrevented ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        compareOpen ||
        guideSection ||
        state.repo
      )
        return;
      const target = e.target;
      if (
        target.isContentEditable ||
        target.closest('input,select,textarea,[role="combobox"],.ant-select')
      )
        return;
      if (e.key === "/") {
        e.preventDefault();
        (stickySearchVisible ? stickySearch.current : search.current)?.focus();
      }
      if (e.key === "t")
        update((s) => ({
          ...s,
          theme: s.theme === "light" ? "dark" : "light",
        }));
      if (e.key === "l")
        update((s) => ({ ...s, lang: s.lang === "zh" ? "en" : "zh" }));
      if (e.key === "v")
        update((s) => ({ ...s, view: s.view === "table" ? "card" : "table" }));
      if (e.key === "f") update((s) => ({ ...s, favOnly: !s.favOnly }));
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [compareOpen, guideSection, state.repo, update, stickySearchVisible]);
  function exportFavorites() {
    const favorites = items
      .filter((i) => state.favorites.includes(i.repo))
      .map((i) => ({
        repo: i.repo,
        stars: i.stars,
        url: i.url,
        category: i.category.en,
      }));
    const url = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            { exported_at: new Date().toISOString(), favorites },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "ars-favorites.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function shareFavoritesPack(onlyUrl = false) {
    const byRepo = new Map(items.map((i) => [i.repo, i]));
    const favItems = state.favorites
      .map((r) => byRepo.get(r))
      .filter(Boolean);
    if (!favItems.length) return;
    const text = onlyUrl
      ? buildPackUrl(
          favItems.map((i) => i.repo),
          { lang: state.lang },
        )
      : formatPackShareText(favItems, { lang: state.lang });
    try {
      await copyText(text);
      message.success(
        onlyUrl
          ? state.lang === "zh"
            ? "已复制专属收藏清单链接"
            : "Toolkit share link copied"
          : state.lang === "zh"
            ? "已复制收藏清单安利文案与专属链接，可直接发给同门！"
            : "Toolkit share card & link copied!",
      );
    } catch {
      message.error(t("copyFailed"));
    }
  }
  const activeStageObj = RESEARCH_STAGES.find((s) => s.id === state.stage);
  const recentCount = recentlyUpdatedCount(
    scopeItems,
    dataset.metadata?.generated_at,
  );
  const newcomers = scopeItems.filter((item) => item.new_this_week).length;
  return (
    <div
      className={`prs-page${stickySearchVisible ? " sticky-search-active" : ""}`}
    >
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById("main");
          main?.scrollIntoView();
          main?.focus({ preventScroll: true });
        }}
      >
        {t("skipToContent")}
      </a>
      <header className="site-header">
        <div
          className="top-notice-bar"
          role="region"
          aria-label={state.lang === "zh" ? "站点公告与快捷入口" : "Site announcements"}
        >
          <div className="top-notice-inner container">
            <span className="top-notice-item">
              <i className="notice-badge-dot" aria-hidden="true" />
              {state.lang === "zh"
                ? "开源收录：每日自动追踪 GitHub 科研 Skills"
                : "Open directory: daily GitHub research Skills updates"}
            </span>
            <span className="top-notice-item top-notice-muted">
              {state.lang === "zh"
                ? "📌 性质说明：保留作者原始简介与可核验安装指引"
                : "📌 Preserves original descriptions & verified install commands"}
            </span>
            <button
              type="button"
              className="top-notice-action"
              onClick={triggerCommunityDialog}
            >
              {state.lang === "zh"
                ? "💬 加入各专业科研交流群 ›"
                : "💬 Join research community ›"}
            </button>
            <a
              className="top-notice-partner"
              href="https://zhi1ke.com?pic=6PEB"
              target="_blank"
              rel="sponsored noopener noreferrer"
            >
              {state.lang === "zh"
                ? "✨ 合作伙伴：智一刻 AI 论文初稿生成 ↗"
                : "✨ Partner: Zhi1ke AI paper outline ↗"}
            </a>
          </div>
        </div>
        <Reveal
          as="nav"
          kind="quiet"
          className="site-nav container"
          aria-label="Primary"
        >
          <a className="brand" href={base}>
            <span className="brand-mark">
              <img
                src={localFile("assets/hamster-logo.png")}
                alt=""
                width="36"
                height="36"
              />
            </span>
            <span>{state.lang === "zh" ? "科研鼠鼠 · Skills 导航站" : "Research Hamster · Skills Directory"}</span>
          </a>
          <Space size={8} wrap className="nav-actions">
            <Segmented
              aria-label="Language"
              value={state.lang}
              options={[
                { label: "中文", value: "zh" },
                { label: "EN", value: "en" },
              ]}
              onChange={(lang) => update((s) => ({ ...s, lang }))}
            />
            <Tooltip title={t("reportsLink")}>
              <Button
                aria-label={t("reportsLink")}
                icon={<CalendarOutlined aria-hidden="true" />}
                href={localFile("reports/")}
              >
                {t("reportsLink")}
              </Button>
            </Tooltip>
            <Tooltip title={state.lang === "zh" ? "切换主题" : "Toggle theme"}>
              <Button
                aria-label="Toggle theme"
                data-testid="theme-toggle"
                icon={<BulbOutlined aria-hidden="true" />}
                onClick={() =>
                  update((s) => ({
                    ...s,
                    theme: s.theme === "light" ? "dark" : "light",
                  }))
                }
              >
                {t("themeLabel")}
              </Button>
            </Tooltip>
            <Button href={`${REPOSITORY_URL}/issues/new?template=recommend-repo.yml`} target="_blank" rel="noopener noreferrer">{state.lang === "zh" ? "推荐 Skill" : "Suggest a Skill"}</Button>
            <Button
              icon={<GithubOutlined aria-hidden="true" />}
              href={REPOSITORY_URL}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </Button>
          </Space>
          <RechargeAd t={t} />
        </Reveal>
        <section className="hero container">
          <div className="hero-copy">
            <div className="hero-capsule">
              <Button
                className="beginner-entry"
                onClick={() => setGuideSection("basics")}
              >
                {state.lang === "zh" ? "30 秒看懂 Skill" : "Skills in 30 seconds"}
              </Button>
              <span className="hero-capsule-sep" aria-hidden="true">
                ·
              </span>
              <button
                type="button"
                className="hero-capsule-path"
                onClick={() => setGuideSection("paths")}
              >
                {state.lang === "zh" ? "专业科研路径 ›" : "Research paths ›"}
              </button>
            </div>
            <Reveal as="h1" kind="hero" tabIndex={-1}>
              {state.lang === "zh" ? (
                <>
                  找到适合你专业的<em>科研 Skills</em>
                </>
              ) : (
                <>
                  Find research <em>Skills for your discipline</em>
                </>
              )}
            </Reveal>
            <Reveal as="p" kind="hero" order={1} className="hero-subtitle">
              {t("heroSubtitle")}
            </Reveal>
          </div>
          <div className="hero-toolbar">
            <div
              className="page-tabs"
              data-section={state.section}
              role="tablist"
              aria-label={t("pageViews")}
            >
              {["ranking", "insights"].map((section) => (
                <Button
                  key={section}
                  role="tab"
                  id={`tab-${section}`}
                  aria-selected={state.section === section}
                  aria-controls={`panel-${section}`}
                  tabIndex={state.section === section ? 0 : -1}
                  onKeyDown={(event) => {
                    if (
                      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                        event.key,
                      )
                    ) {
                      event.preventDefault();
                      const next =
                        event.key === "Home"
                          ? "ranking"
                          : event.key === "End"
                            ? "insights"
                            : section === "ranking"
                              ? "insights"
                              : "ranking";
                      update((s) => ({ ...s, section: next }));
                      document.getElementById(`tab-${next}`)?.focus();
                    }
                  }}
                  onClick={() => update((s) => ({ ...s, section }))}
                >
                  {t(section === "ranking" ? "tableTitle" : "insightsTitle")}
                </Button>
              ))}
            </div>
            <SearchBox
              inactive={stickySearchVisible}
              inputRef={search}
              state={state}
              update={update}
              items={visible}
              taskOptions={taskOptions}
              t={t}
            />
          </div>
          <div
            className="portal-kpi-grid"
            data-testid="portal-kpi-grid"
            aria-label={state.lang === "zh" ? "核心收录指标" : "Key directory metrics"}
          >
            <button
              type="button"
              className="portal-kpi-card portal-kpi-btn"
              title={state.lang === "zh" ? "查看全部收录并重置筛选" : "Show all listed Skills and reset filters"}
              onClick={() =>
                update((s) => ({
                  ...s,
                  section: "ranking",
                  query: "",
                  task: "all",
                  category: "all",
                  agent: "all",
                  favOnly: false,
                  newOnly: false,
                  todayOnly: "",
                  discipline: "all",
                  major: "all",
                  stage: "",
                  pack: [],
                  packTitle: "",
                  sort: "rank",
                }))
              }
            >
              <div className="portal-kpi-meta">
                <span>{state.lang === "zh" ? "已收录 Skills" : "Listed Skills"}</span>
                <strong>{fmt(scopeItems.length)}</strong>
              </div>
              <span className="portal-kpi-icon kpi-icon-blue" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-6 9 6v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
              </span>
            </button>
            <button
              type="button"
              className={`portal-kpi-card portal-kpi-btn${state.sort === "updated" ? " is-active" : ""}`}
              aria-pressed={state.sort === "updated"}
              title={state.lang === "zh" ? "按最近更新排序" : "Sort by most recently updated"}
              onClick={() =>
                update((s) => ({
                  ...s,
                  section: "ranking",
                  sort: s.sort === "updated" ? "rank" : "updated",
                }))
              }
            >
              <div className="portal-kpi-meta">
                <span>{state.lang === "zh" ? "近期活跃维护" : "Active in 30d"}</span>
                <strong>{fmt(recentCount)}</strong>
              </div>
              <span className="portal-kpi-icon kpi-icon-emerald" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" />
                </svg>
              </span>
            </button>
            <button
              type="button"
              className={`portal-kpi-card portal-kpi-btn${state.newOnly ? " is-active" : ""}`}
              aria-pressed={state.newOnly}
              title={state.lang === "zh" ? "筛选本周新收录项目" : "Filter Skills added this week"}
              onClick={() =>
                update((s) => ({
                  ...s,
                  section: "ranking",
                  todayOnly: "",
                  newOnly: !s.newOnly,
                }))
              }
            >
              <div className="portal-kpi-meta">
                <span>{state.lang === "zh" ? "本周新增收录" : "New this week"}</span>
                <strong>{fmt(newcomers)}</strong>
              </div>
              <span className="portal-kpi-icon kpi-icon-amber" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M19 8v6M22 11h-6" />
                </svg>
              </span>
            </button>
            <button
              type="button"
              className={`portal-kpi-card portal-kpi-btn${state.sort === "delta7" ? " is-active" : ""}`}
              aria-pressed={state.sort === "delta7"}
              title={state.lang === "zh" ? "按近 7 日 Stars 上升最快排序" : "Sort by fastest 7-day Stars growth"}
              onClick={() =>
                update((s) => ({
                  ...s,
                  section: "ranking",
                  sort: s.sort === "delta7" ? "rank" : "delta7",
                }))
              }
            >
              <div className="portal-kpi-meta">
                <span>{state.lang === "zh" ? "近 7 日净增 Stars" : "7-day net Stars"}</span>
                <strong>
                  {net7 > 0 ? "+" : ""}
                  {fmt(net7)}
                </strong>
              </div>
              <span className="portal-kpi-icon kpi-icon-purple" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                  <polyline points="16 7 22 7 22 13" />
                </svg>
              </span>
            </button>
          </div>
        </section>
      </header>
      <main
        id="main"
        className="container"
        tabIndex={-1}
        style={{
          "--ranking-filter-height": `${filterHeight + (stickySearchVisible ? 48 : 0)}px`,
        }}
      >
        <DisciplineSelector items={disciplineItems} visible={visible} state={state} update={update} />
        <section
          className="stage-quick-bar"
          data-testid="stage-quick-bar"
          aria-label={state.lang === "zh" ? "论文阶段急救包" : "Research stage quick-picks"}
        >
          <div className="stage-quick-row">
            <span className="stage-quick-label">
              {state.lang === "zh" ? "急救场景" : "Quick stage"}
            </span>
            <div className="stage-pill-list">
              {RESEARCH_STAGES.map((stage) => {
                const active = state.stage === stage.id;
                const [icon, ...labelParts] = stage[state.lang].split(" ");
                return (
                  <button
                    key={stage.id}
                    type="button"
                    className={`stage-pill${active ? " is-active" : ""}`}
                    data-stage={stage.id}
                    aria-pressed={active}
                    title={stage[`hint_${state.lang}`]}
                    onClick={() =>
                      update((s) => ({
                        ...s,
                        section: "ranking",
                        stage: active ? "" : stage.id,
                      }))
                    }
                  >
                    <span className="stage-pill-icon" aria-hidden="true">
                      <svg
                        viewBox="0 0 24 24"
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d={STAGE_ICON_PATHS[stage.id] || ""} />
                      </svg>
                    </span>
                    <span className="stage-pill-text">
                      {labelParts.join(" ")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {activeStageObj && (
            <p className="stage-quick-hint" data-testid="stage-quick-hint">
              <span>{activeStageObj[`hint_${state.lang}`]}</span>
              <button
                type="button"
                className="stage-clear-inline"
                onClick={() => update((s) => ({ ...s, stage: "" }))}
              >
                {state.lang === "zh" ? "退出场景" : "Clear stage"}
              </button>
            </p>
          )}
        </section>
        <section
          ref={filterRef}
          className="filters"
          aria-label="Ranking controls"
        >
          <div className="sticky-search-slot">
            <SearchBox
              inactive={!stickySearchVisible}
              inputRef={stickySearch}
              state={state}
              update={update}
              items={visible}
              taskOptions={taskOptions}
              t={t}
              onBlur={syncStickySearch}
              inputId="stickySearchInput"
              compact
            />
          </div>{" "}
          <section className="task-navigation" aria-labelledby="taskHeading">
            <h2 id="taskHeading" className="sr-only">
              {t("taskHeading")}
            </h2>
            <span className="sr-only" id="taskCountHint">
              {t("taskCountHint")}
            </span>
            <SlidingTaskList value={state.task} title={t("taskCountHint")}>
              <Button
                type="text"
                data-task="all"
                aria-label={t("taskAll")}
                aria-pressed={state.task === "all"}
                aria-description={`${taskCounts.all} ${t("repos")}`}
                onClick={() =>
                  update((previous) => ({
                    ...previous,
                    task: "all",
                    category: "all",
                  }))
                }
              >
                {state.lang === "zh" ? "全部" : "All"}{" "}
                <span className="task-count" aria-hidden="true">
                  {taskCounts.all}
                </span>
              </Button>
              {RESEARCH_TASKS.map((task) => (
                <Button
                  key={task.id}
                  type="text"
                  data-task={task.id}
                  aria-label={t(taskLabels[task.id])}
                  aria-description={`${taskCounts[task.id]} ${t("repos")}`}
                  disabled={taskCounts[task.id] === 0 && state.task !== task.id}
                  aria-pressed={state.task === task.id}
                  onClick={() =>
                    update((s) => ({
                      ...s,
                      task: task.id,
                      category: "all",
                    }))
                  }
                >
                  {t(taskLabels[task.id])}{" "}
                  <span className="task-count" aria-hidden="true">
                    {taskCounts[task.id]}
                  </span>
                </Button>
              ))}
            </SlidingTaskList>
            <p className="task-count-note sr-only">{t("taskCountNote")}</p>
          </section>
          <div className="filter-fields">
            <ActionPopover label={state.lang === "zh" ? "筛选" : "Filters"} filter lang={state.lang} count={Number(state.agent !== "all") + Number(!["rank","stars"].includes(state.sort)) + Number(state.favOnly)}>
            {() => <DeferredFeature t={t} loadingFallback={<OverlaySkeleton kind="filters" lang={state.lang}/>}><FilterControls {...{state,update,t,platformIds}} /></DeferredFeature>}
            </ActionPopover>
            <div className="view-controls">
              <Segmented
                aria-label="View"
                value={state.view}
                onChange={(view) => update((s) => ({ ...s, view }))}
                options={[
                  {
                    value: "table",
                    icon: <BarsOutlined aria-hidden="true" />,
                    label: <span className="sr-only">{t("viewTable")}</span>,
                  },
                  {
                    value: "card",
                    icon: <AppstoreOutlined aria-hidden="true" />,
                    label: <span className="sr-only">{t("viewCard")}</span>,
                  },
                ]}
              />

            </div>
          </div>
        </section>

        <ActiveFilters {...{ state, update, t }} empty={!visible.length} />
        <div
          id="panel-ranking"
          role="tabpanel"
          aria-labelledby="tab-ranking"
          hidden={state.section !== "ranking"}
        >
          <Panel
            id="rankings"
            tabIndex={-1}
            className="ranking-section"
            bodyStyle={{ padding: 0 }}
          >
            <div className="ranking-header">
              <div>
                <h2 className="sr-only">
                  {t("tableTitle")}{" "}
                  {visible.length !== scopeItems.length && (
                    <Tag>{fmt(visible.length)}</Tag>
                  )}
                </h2>
                <div className="ranking-status-line">
                  <span>
                    {state.sort === 'fit' && state.discipline !== 'all' && <>{state.lang === 'zh' ? '专业适用优先 · ' : 'Discipline fit first · '}</>}
                    {t(
                      {
                        fit: "rankByStars",
                        rank: "rankByStars",
                        stars: "rankByStars",
                        trend: "sortTrend",
                        updated: "sortUpdated",
                        delta30: "sortDelta30",
                        delta7: "sortDelta7",
                        newest: "sortNewest",
                      }[state.sort],
                    )}
                  </span>
                  <span aria-hidden="true">·</span>
                  <UpdateStatus
                    generatedAt={dataset.metadata?.generated_at}
                    collection={dataset.metadata?.collection}
                    lang={state.lang}
                    t={t}
                    compact
                  />
                  <Button
                    type="link"
                    onClick={() => setOverviewOpen((value) => !value)}
                    aria-expanded={overviewOpen}
                    aria-controls="data-overview"
                  >
                    {t("dataOverview")} {overviewOpen ? "⌃" : "⌄"}
                  </Button>
                  <span className="ranking-sort-shortcuts">
                    {[
                      ["delta7", "sortDelta7"],
                      ["newest", "sortNewest"],
                    ].map(([sort, label]) => (
                      <Button
                        key={sort}
                        type="text"
                        size="small"
                        aria-pressed={state.sort === sort}
                        onClick={() => update((s) => ({ ...s, sort }))}
                      >
                        {t(label)}
                      </Button>
                    ))}
                  </span>
                </div>
                <section
                  id="data-overview"
                  hidden={!overviewOpen}
                  className="statistics compact-statistics"
                  aria-label="Aggregate statistics"
                >
                  <span>
                    {t("repos")} <strong>{fmt(scopeItems.length)}</strong>
                  </span>
                  <Tooltip title={t("newWeekHelp")}>
                    <button
                      type="button"
                      data-testid="new-this-week"
                      aria-pressed={state.newOnly}
                      onClick={() =>
                        update((s) => ({ ...s, newOnly: !s.newOnly }))
                      }
                    >
                      {t("statNewWeek")} <strong>{fmt(newcomers)}</strong>
                    </button>
                  </Tooltip>
                  <span title={state.lang==="zh" ? "仅统计具有完整7日对比记录的项目，短期数值不计入。" : "Only projects with complete 7-day history; short-term values excluded."}>
                    {t("statNet7d")}{" "}
                    <strong>
                      {net7 > 0 ? "+" : ""}
                      {fmt(net7)}
                    </strong>
                  </span>
                  <span>
                    {t("statRecentPush")}{" "}
                    <strong>
                      {fmt(recentCount)} / {fmt(scopeItems.length)}
                    </strong>
                  </span>
                  <a
                    href={localFile("docs/methodology.md")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("methodTitle")}
                  </a>
                </section>
              </div>
              <Space wrap size={8}>
                {state.favorites.length > 0 && (
                  <Button
                    size="small"
                    className="share-pack-trigger"
                    data-testid="share-favorites-pack"
                    onClick={() => shareFavoritesPack(false)}
                  >
                    {state.lang === "zh"
                      ? `📦 分享清单 (${state.favorites.length})`
                      : `📦 Share pack (${state.favorites.length})`}
                  </Button>
                )}
                <ScopeControl {...{state,update,relatedCount}} />
                <Button type="link" onClick={()=>setGuideSection("paths")}>{state.lang === "zh" ? "专业路径" : "Research paths"}</Button>
                <details className="export-menu">
                  <summary>{t("exportMenu")} ⌄</summary>
                  <div
                    className="export-options"
                    role="group"
                    aria-label={t("exportMenu")}
                  >
                    <button
                      type="button"
                      disabled={!state.favorites.length}
                      onClick={() => shareFavoritesPack(false)}
                    >
                      {state.lang === "zh" ? "复制收藏清单文案" : "Copy toolkit card"}
                    </button>
                    <button
                      type="button"
                      disabled={!state.favorites.length}
                      onClick={() => shareFavoritesPack(true)}
                    >
                      {state.lang === "zh" ? "复制收藏清单链接" : "Copy toolkit link"}
                    </button>
                    <button
                      type="button"
                      disabled={!state.favorites.length}
                      onClick={exportFavorites}
                    >
                      {t("exportFav")}
                    </button>
                    <a
                      download="rankings.json"
                      href={localFile("data/rankings.json")}
                    >
                      {t("downloadJson")}
                    </a>
                    <a
                      download="rankings.csv"
                      href={localFile("data/rankings.csv")}
                    >
                      {t("downloadCsv")}
                    </a>
                  </div>
                </details>
              </Space>
            </div>
            {state.pack?.length > 0 && (
              <div
                className="shared-pack-banner"
                data-testid="pack-banner"
                role="region"
                aria-label={state.lang === "zh" ? "同门分享工具包" : "Shared toolkit"}
              >
                <div className="shared-pack-copy">
                  <strong>
                    📦{" "}
                    {state.packTitle ||
                      (state.lang === "zh"
                        ? "同门分享的科研 Skills 工具包"
                        : "Shared Research Skills Toolkit")}
                  </strong>
                  <span>
                    {state.lang === "zh"
                      ? `共匹配 ${visible.length} 款实用科研项目`
                      : `${visible.length} curated repositories`}
                  </span>
                </div>
                <div className="shared-pack-actions">
                  <Button
                    size="small"
                    type="primary"
                    data-testid="save-pack-to-favorites"
                    onClick={() => {
                      update((s) => ({
                        ...s,
                        favorites: [...new Set([...s.favorites, ...s.pack])],
                      }));
                      message.success(
                        state.lang === "zh"
                          ? "已将该清单全部加入我的收藏"
                          : "Saved all toolkit items to favorites",
                      );
                    }}
                  >
                    {state.lang === "zh" ? "⭐ 一键收入我的收藏" : "⭐ Save all"}
                  </Button>
                  <Button
                    size="small"
                    data-testid="reshare-pack"
                    onClick={async () => {
                      try {
                        await copyText(
                          formatPackShareText(visible, {
                            lang: state.lang,
                            title: state.packTitle,
                          }),
                        );
                        message.success(
                          state.lang === "zh"
                            ? "已复制工具包文案，可继续转发"
                            : "Toolkit card copied",
                        );
                      } catch {
                        message.error(t("copyFailed"));
                      }
                    }}
                  >
                    {state.lang === "zh" ? "转发给同门" : "Reshare"}
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    data-testid="exit-pack"
                    onClick={() =>
                      update((s) => ({ ...s, pack: [], packTitle: "" }))
                    }
                  >
                    {state.lang === "zh" ? "查看全部榜单" : "View all Skills"}
                  </Button>
                </div>
              </div>
            )}
            {(visible.length > 0 || !items.length || state.todayOnly) && (
              <DailyArrivals {...{ items, state, update, t }} />
            )}
            <RepositoryViews
              {...{
                items: visible,
                allItems: items,
                filterHeight: filterHeight + (stickySearchVisible ? 48 : 0),
                state,
                update,
                toggleCompare,
                t,
                fmt,
                history: historyData,
                generatedAt: dataset.metadata?.generated_at,
              }}
            />
          </Panel>
          <div id="beginner-paths">
            {editorialPicks(visible).length > 0 && <ViewportEditorialPicks items={visible} state={state} t={t} />}
          </div>
        </div>
        <div
          id="panel-insights"
          role="tabpanel"
          aria-labelledby="tab-insights"
          hidden={state.section !== "insights"}
        >
          {state.section === "insights" && (
            <ViewportInsights
              scopeControl={
                <ScopeControl {...{state,update,relatedCount}} />
              }
              items={visible}
              professionItems={disciplineItems}
              allItems={scopeItems}
              history={historyData}
              generatedAt={dataset.metadata?.generated_at}
              state={state}
              update={update}
              t={t}
            />
          )}
        </div>
        <DataTransparency t={t} base={base} lang={state.lang} />
      </main>
      <Reveal as="footer" className="site-footer container">
        <span>
          {state.lang === "zh" ? "科研鼠鼠 · Skills 导航站" : "Research Hamster · Skills Directory"} · MIT ·{" "}
          <a href={REPOSITORY_URL}>RiceAI88/shushu-research-skills</a> ·{" "}
          {state.lang === "zh" ? "基于" : "Based on"}{" "}
          <a href="https://github.com/kael-odin/awesome-academic-research-skills">
            kael-odin
          </a>
        </span>
        <a href={localFile("feed.xml")}>{t("subscribeTitle")}</a>
        <span className="keyboard-hint">{t("shortcuts")}</span>
      </Reveal>
      {(selected || drawerRequested) && (
        <DeferredFeature t={t}>
          <RepositoryDrawer
            {...{
              item: selected,
              items: visible,
              state,
              update,
              toggleCompare,
              t,
              fmt,
            }}
            onOpenGuide={() => {
              update((s) => ({ ...s, repo: null }));
              setGuideSection("basics");
            }}
          />
        </DeferredFeature>
      )}
      {state.compare.length > 0 && (
        <div className="compare-tray" data-testid="compare-tray">
          <strong>
            {t("compareTray")} ({state.compare.length}/3)
          </strong>
          <div className="compare-names">
            {state.compare.map((repo) => (
              <Tag key={repo} closable onClose={() => toggleCompare(repo)}>
                {repo.split("/").pop()}
              </Tag>
            ))}
          </div>
          <Tooltip title={t("compareTitle")}>
            <Button
              data-testid="open-compare"
              icon={<SwapOutlined aria-hidden="true" />}
              onClick={() => setCompareOpen(true)}
            />
          </Tooltip>
          <Tooltip title={t("compareClear")}>
            <Button
              data-testid="clear-compare"
              icon={<CloseOutlined aria-hidden="true" />}
              onClick={() => update((s) => ({ ...s, compare: [] }))}
            />
          </Tooltip>
        </div>
      )}
      <BeginnerDialog section={guideSection} lang={state.lang} items={items} t={t} onClose={()=>setGuideSection(null)} onOpenRepo={repo=>update(s=>({...s,repo}))} />
      <DeferredRechargeNotice
        lang={state.lang}
        busy={Boolean(state.repo || compareOpen || guideSection)}
      />
      <BackToTop
        label={t("backToTop")}
        comparisonOpen={state.compare.length > 0}
      />
      {(compareOpen || comparisonRequested) && (
        <DeferredFeature t={t}>
          <ComparisonDialog
            open={compareOpen}
            onClose={() => setCompareOpen(false)}
            onRemove={toggleCompare}
            repos={state.compare}
            items={items}
            lang={state.lang}
            theme={state.theme}
            history={historyData}
            t={t}
          />
        </DeferredFeature>
      )}
    </div>
  );
}

// 延迟 12 秒后再按需加载代充提示弹窗，减轻移动端首屏 JS 体积
function DeferredRechargeNotice({ lang, busy }) {
  const [ready, setReady] = useState(() => Number(window.__ARS_NOTICE_DELAY_MS) === 0);
  useEffect(() => {
    try {
      const last = Number(localStorage.getItem("prs-recharge-notice-shown-v2"));
      if (Number.isFinite(last) && last > 0 && Date.now() - last >= 0 && Date.now() - last < 12 * 3600000)
        return undefined;
    } catch {
      /* storage blocked */
    }
    if (ready) return undefined;
    const ms = Number.isFinite(window.__ARS_NOTICE_DELAY_MS) ? window.__ARS_NOTICE_DELAY_MS : 12000;
    const timer = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(timer);
  }, [ready]);
  if (!ready) return null;
  return (
    <React.Suspense fallback={null}>
      <RechargeNotice lang={lang} busy={busy} immediate />
    </React.Suspense>
  );
}
