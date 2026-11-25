#!/usr/bin/env python3
"""自动提取多技能合集仓库（skills_count >= 3）的子技能目录索引。

设计原则：
1. 仅使用 Python 标准库与官方 GitHub Git Trees API（每个仓库只需 1 次请求即可获取完整目录树）。
2. 按仓库的 last_push_date 做增量缓存：仓库未发生新提交时直接复用本地 config/subskills-catalog.json，
   不重复消耗 GitHub API 配额。
3. 严守真实证据：只收录目录树中真实存在 SKILL.md 文件的子目录路径，不凭空猜测任何子技能名称。
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
RANKINGS_PATH = ROOT / "data" / "rankings.json"
CATALOG_PATH = ROOT / "config" / "subskills-catalog.json"

REPO_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*/[A-Za-z0-9][A-Za-z0-9_.-]*$")
NOISE_SEGMENTS = {
    ".git",
    ".github",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
    "dist",
    "build",
    "vendor",
}
CONTAINER_DIRS = {
    "skills",
    "skill",
    ".claude",
    ".codex",
    ".cursor",
    ".gemini",
    ".agent",
    ".agents",
    "plugins",
    "packages",
    "src",
}

MAX_PREVIEW_ITEMS_PER_REPO = 250


def github_tree_fetch(repo: str, branch: str, token: str | None = None) -> dict[str, Any]:
    ref = urllib.parse.quote(branch or "HEAD", safe="")
    url = f"https://api.github.com/repos/{repo}/git/trees/{ref}?recursive=1"
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "shushu-subskills-extractor",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=25) as resp:
        return json.load(resp)


def extract_subskills_from_tree(tree_nodes: list[Any], repo: str = "") -> tuple[int, list[dict[str, str]]]:
    """从 Git Tree 节点列表中提取真实 SKILL.md 子技能条目（纯函数，便于测试）。"""
    repo_short = repo.split("/")[-1].lower() if repo else ""
    skill_paths: list[str] = []
    for node in tree_nodes:
        if not isinstance(node, dict) or node.get("type", "blob") != "blob":
            continue
        raw_path = str(node.get("path") or "").strip("/")
        if not raw_path:
            continue
        parts = raw_path.split("/")
        if parts[-1].lower() != "skill.md":
            continue
        if any(seg.lower() in NOISE_SEGMENTS for seg in parts[:-1]):
            continue
        skill_paths.append(raw_path)

    total_files = len(skill_paths)
    if total_files < 2:
        return total_files, []

    parsed: list[dict[str, str]] = []
    seen_names: set[str] = set()
    for path in sorted(skill_paths):
        dirs = path.split("/")[:-1]
        # 若仓库同时包含根目录顶层 SKILL.md 与多个子目录 SKILL.md，跳过顶层总入口以免充数
        if not dirs:
            continue
        meaningful = [d for d in dirs if d.lower() not in CONTAINER_DIRS]
        if not meaningful:
            name = dirs[-1]
            group = ""
        else:
            name = meaningful[-1]
            group = "/".join(meaningful[:-1])
        if name.lower() == repo_short and len(skill_paths) > 2 and len(meaningful) == 1:
            continue
        dedup_key = f"{group}/{name}".lower()
        if dedup_key in seen_names:
            continue
        seen_names.add(dedup_key)
        entry: dict[str, str] = {"n": name, "p": path}
        if group:
            entry["g"] = group
        parsed.append(entry)

    parsed.sort(key=lambda x: (x.get("g", ""), x["n"].lower()))
    return max(total_files, len(parsed)), parsed[:MAX_PREVIEW_ITEMS_PER_REPO]


def sync_subskills_catalog(
    *,
    rankings_data: dict[str, Any],
    existing_catalog: dict[str, Any],
    fetch_tree=github_tree_fetch,
    token: str | None = None,
    limit: int = 20,
    min_skills: int = 3,
    sleep_sec: float = 0.1,
) -> tuple[dict[str, Any], list[str]]:
    """增量更新多技能仓库的子技能目录索引。"""
    repos_map: dict[str, Any] = dict(existing_catalog.get("repos") or {})
    candidates = [
        it
        for it in rankings_data.get("items", [])
        if it.get("repository_kind") == "skill"
        and REPO_RE.fullmatch(str(it.get("repo") or ""))
        and (it.get("skills_count") or 0) >= min_skills
    ]
    candidates.sort(key=lambda x: -(x.get("stars") or 0))

    updated_repos: list[str] = []
    fetched = 0
    for item in candidates:
        if fetched >= limit:
            break
        repo = str(item["repo"])
        key = repo.lower()
        push_date = str(item.get("last_push_date") or "")
        branch = str(item.get("default_branch") or "main")
        cached = repos_map.get(key)
        if (
            isinstance(cached, dict)
            and push_date
            and cached.get("pushed") == push_date
            and isinstance(cached.get("items"), list)
            and len(cached["items"]) >= 2
        ):
            continue

        fetched += 1
        try:
            payload = fetch_tree(repo, branch, token)
        except (urllib.error.URLError, TimeoutError, ValueError, KeyError, OSError):
            continue

        total, sub_items = extract_subskills_from_tree(payload.get("tree") or [], repo=repo)
        if len(sub_items) >= 2:
            repos_map[key] = {
                "repo": repo,
                "branch": branch,
                "pushed": push_date,
                "total": int(item.get("skills_count") or total),
                "items": sub_items,
            }
            updated_repos.append(repo)
        if sleep_sec > 0:
            time.sleep(sleep_sec)

    out_catalog = {
        "schema_version": 1,
        "updated_at": datetime.now(timezone.utc).date().isoformat(),
        "repos": repos_map,
    }
    return out_catalog, updated_repos


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="增量提取多技能仓库的子技能目录索引")
    parser.add_argument("--limit", type=int, default=20, help="单次最多请求 GitHub API 的仓库数")
    parser.add_argument("--min-skills", type=int, default=3, help="触发子技能提取的最小 skills_count")
    parser.add_argument("--dry-run", action="store_true", help="仅打印提取结果，不写盘")
    args = parser.parse_args(argv)

    rankings_data = json.loads(RANKINGS_PATH.read_text(encoding="utf-8"))
    existing = (
        json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
        if CATALOG_PATH.exists()
        else {"schema_version": 1, "repos": {}}
    )
    token = os.environ.get("GITHUB_TOKEN")

    catalog, updated = sync_subskills_catalog(
        rankings_data=rankings_data,
        existing_catalog=existing,
        token=token,
        limit=max(0, args.limit),
        min_skills=max(2, args.min_skills),
    )
    print(f"Synced sub-skills catalog: {len(updated)} updated ({len(catalog['repos'])} total cached)")
    for r in updated:
        entry = catalog["repos"][r.lower()]
        print(f"  + {r}: {len(entry['items'])} previewed / {entry['total']} total")

    if not args.dry_run and (updated or not CATALOG_PATH.exists()):
        CATALOG_PATH.write_text(
            json.dumps(catalog, ensure_ascii=False, separators=(",", ":")) + "\n",
            encoding="utf-8",
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
