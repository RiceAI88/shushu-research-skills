import { createSearch } from "./search.js";

let catalogPromise = null;

/**
 * 按需异步加载大合集仓库子技能目录（独立分包，首屏零体积占用，全局单例缓存）
 */
export function loadSubskillsCatalog() {
  if (!catalogPromise) {
    catalogPromise = import("../config/subskills-catalog.json")
      .then((m) => m.default || m)
      .catch(() => ({ repos: {} }));
  }
  return catalogPromise;
}

/**
 * 在单个仓库已收录的子技能列表中匹配用户当前搜索词，返回命中的子技能数组
 */
export function matchSubskillsForItem(item, query) {
  const q = String(query || "").trim();
  const list = item?.subskills_list;
  if (!q || !Array.isArray(list) || list.length === 0) return [];
  const search = createSearch(q);
  const lower = q.toLowerCase();
  return list.filter((sub) => {
    const text = `${sub.n || ""} ${sub.g || ""}`;
    return text.toLowerCase().includes(lower) || search.matches(text);
  });
}
