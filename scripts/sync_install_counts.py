#!/usr/bin/env python3
"""同步站内仓库真实公开安装量与下载量（零估算、零 Forks 充数）。

数据来源与核验原则：
1. skills_cli     — Skills CLI 官方注册中心（skills.sh/api/search），严格校验 source == owner/repo，同时回填子技能级安装数
2. pypi_30d       — PyPI 官方近 30 天下载量（pypistats.org），必须先通过 pypi.org/pypi/<pkg>/json 反向核验仓库地址归属
3. npm_30d        — npm 官方近 30 天下载量（api.npmjs.org），必须先通过 registry.npmjs.org 反向核验仓库地址归属
4. github_releases— GitHub Releases 发行版附件累计真实下载次数（配置 GITHUB_TOKEN 时增量采集）
"""

from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import gzip
import http.client
import json
import os
from pathlib import Path
import re
from typing import Any
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
RANKINGS_PATH = ROOT / "data" / "rankings.json"
INSTALL_COUNTS_PATH = ROOT / "config" / "install-counts.json"
SUBSKILLS_CATALOG_PATH = ROOT / "config" / "subskills-catalog.json"

PIP_HINT_RE = re.compile(
    r"\b(?:pip3?|uvx|uv\s+tool)\s+install\s+(?:-[A-Za-z]+\s+)*([A-Za-z0-9][A-Za-z0-9_.-]{1,60})"
)
NPM_HINT_RE = re.compile(
    r"\b(?:npx|npm\s+i(?:nstall)?(?:\s+-g)?)\s+(@?[A-Za-z0-9][A-Za-z0-9_./-]{1,60})"
)


def _http_json(url: str, headers: dict[str, str] | None = None, timeout: float = 8.0) -> Any | None:
    req_headers = {
        "User-Agent": "shushu-research-skills/1.0",
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
    }
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status != 200:
                return None
            raw = resp.read(4_000_000)
            if "gzip" in (resp.headers.get("Content-Encoding") or "").lower():
                raw = gzip.decompress(raw)
            return json.loads(raw.decode("utf-8", errors="replace"))
    except (urllib.error.URLError, http.client.HTTPException, TimeoutError, ValueError, OSError):
        return None


def fetch_skills_sh_installs(repo: str) -> tuple[int, dict[str, int]]:
    """查询 skills.sh 官方注册表，返回 (该仓库总安装数, {子技能名小写: 安装数})。"""
    q = urllib.parse.quote(repo, safe="")
    data = _http_json(f"https://skills.sh/api/search?q={q}&limit=250")
    if not isinstance(data, dict) or not isinstance(data.get("skills"), list):
        return 0, {}
    repo_lower = repo.lower()
    seen_ids: set[str] = set()
    total = 0
    per_skill: dict[str, int] = {}
    for entry in data["skills"]:
        if not isinstance(entry, dict):
            continue
        if str(entry.get("source") or "").strip().lower() != repo_lower:
            continue
        sid = str(entry.get("id") or "")
        if sid in seen_ids:
            continue
        seen_ids.add(sid)
        cnt = entry.get("installs")
        if isinstance(cnt, int) and not isinstance(cnt, bool) and cnt > 0:
            total += cnt
            for key_field in ("skillId", "name"):
                k = str(entry.get(key_field) or "").strip().lower()
                if k:
                    per_skill[k] = max(per_skill.get(k, 0), cnt)
    return total, per_skill


def _candidate_pypi_names(item: dict[str, Any]) -> list[str]:
    repo = str(item.get("repo") or "")
    short = repo.split("/")[-1].strip()
    desc = f"{item.get('description') or ''} {item.get('curated_use_en') or ''}"
    cands: list[str] = []
    for m in PIP_HINT_RE.finditer(desc):
        pkg = m.group(1).strip("`'\".,;)")
        if pkg and not pkg.startswith(("http", "git+")):
            cands.append(pkg.lower())
    if short:
        low = short.lower()
        cands.append(low)
        if "_" in low:
            cands.append(low.replace("_", "-"))
        for suffix in ("-python", "-py", "-cli"):
            if low.endswith(suffix) and len(low) > len(suffix) + 2:
                cands.append(low[: -len(suffix)])
    out: list[str] = []
    for c in cands:
        if c not in out and re.fullmatch(r"[a-z0-9][a-z0-9_.-]{1,60}", c):
            out.append(c)
    return out[:3]


def fetch_verified_pypi_30d(item: dict[str, Any]) -> int:
    """严格核验 PyPI 包元数据反向指向当前 GitHub 仓库后，返回近 30 天真实下载量。"""
    if item.get("language") not in ("Python", "Jupyter Notebook"):
        return 0
    repo = str(item.get("repo") or "").strip()
    if not repo:
        return 0
    needle = f"github.com/{repo}".lower()
    for pkg in _candidate_pypi_names(item):
        meta = _http_json(f"https://pypi.org/pypi/{urllib.parse.quote(pkg)}/json", timeout=6.0)
        if not isinstance(meta, dict):
            continue
        info_blob = json.dumps(meta.get("info") or {}, ensure_ascii=False).lower()
        if needle not in info_blob:
            continue
        stats = _http_json(
            f"https://pypistats.org/api/packages/{urllib.parse.quote(pkg)}/recent",
            timeout=6.0,
        )
        last_month = ((stats or {}).get("data") or {}).get("last_month")
        if isinstance(last_month, int) and last_month > 0:
            return last_month
    return 0


def _candidate_npm_names(item: dict[str, Any]) -> list[str]:
    repo = str(item.get("repo") or "")
    short = repo.split("/")[-1].strip()
    desc = f"{item.get('description') or ''} {item.get('curated_use_en') or ''}"
    cands: list[str] = []
    for m in NPM_HINT_RE.finditer(desc):
        pkg = m.group(1).strip("`'\".,;)")
        if pkg and pkg not in ("skills", "add") and "/" not in pkg.lstrip("@"):
            cands.append(pkg.lower())
    if short:
        cands.append(short.lower())
    out: list[str] = []
    for c in cands:
        if c not in out:
            out.append(c)
    return out[:2]


def fetch_verified_npm_30d(item: dict[str, Any]) -> int:
    """严格核验 npm 包 repository/homepage 指向当前 GitHub 仓库后，返回近 30 天下载量。"""
    if item.get("language") not in ("JavaScript", "TypeScript"):
        return 0
    repo = str(item.get("repo") or "").strip()
    if not repo:
        return 0
    needle = f"github.com/{repo}".lower()
    for pkg in _candidate_npm_names(item):
        encoded = urllib.parse.quote(pkg, safe="@/")
        meta = _http_json(f"https://registry.npmjs.org/{encoded}/latest", timeout=6.0)
        if not isinstance(meta, dict):
            continue
        repo_blob = json.dumps(
            {"r": meta.get("repository"), "h": meta.get("homepage")},
            ensure_ascii=False,
        ).lower()
        if needle not in repo_blob:
            continue
        dl_encoded = urllib.parse.quote(pkg, safe="")
        stats = _http_json(
            f"https://api.npmjs.org/downloads/point/last-month/{dl_encoded}",
            timeout=6.0,
        )
        downloads = (stats or {}).get("downloads")
        if isinstance(downloads, int) and downloads > 0:
            return downloads
    return 0


def fetch_github_release_downloads(repo: str, token: str = "") -> int:
    """汇总 GitHub Releases 附件真实累计 download_count（建议在配置 GITHUB_TOKEN 时启用）。"""
    if not token:
        return 0
    headers = {"Authorization": f"Bearer {token}"}
    releases = _http_json(
        f"https://api.github.com/repos/{repo}/releases?per_page=25",
        headers=headers,
        timeout=7.0,
    )
    if not isinstance(releases, list):
        return 0
    total = 0
    for rel in releases:
        if not isinstance(rel, dict) or rel.get("draft"):
            continue
        for asset in rel.get("assets") or []:
            cnt = asset.get("download_count") if isinstance(asset, dict) else 0
            if isinstance(cnt, int) and cnt > 0:
                total += cnt
    return total


def inspect_one_repo(
    item: dict[str, Any],
    gh_token: str = "",
) -> tuple[str, int, str, dict[str, int]]:
    """探测单个仓库真实公开安装/下载量，返回 (repo_lower, count, source, per_subskill_map)。"""
    repo = str(item.get("repo") or "").strip()
    repo_lower = repo.lower()
    if not repo:
        return "", 0, "", {}

    # 1. 优先查询 Skills CLI 官方注册表（对 skill 类及全站多技能仓库最精准）
    skills_cnt, per_sub = fetch_skills_sh_installs(repo)
    if skills_cnt > 0:
        return repo_lower, skills_cnt, "skills_cli", per_sub

    # 2. 反向核验包管理器近 30 天下载量与 GitHub Release 发行包下载量，取最高真实值
    candidates: list[tuple[int, str]] = []
    pypi_cnt = fetch_verified_pypi_30d(item)
    if pypi_cnt > 0:
        candidates.append((pypi_cnt, "pypi_30d"))
    npm_cnt = fetch_verified_npm_30d(item)
    if npm_cnt > 0:
        candidates.append((npm_cnt, "npm_30d"))
    rel_cnt = fetch_github_release_downloads(repo, gh_token)
    if rel_cnt > 0:
        candidates.append((rel_cnt, "github_releases"))

    if candidates:
        best_cnt, best_src = max(candidates, key=lambda x: x[0])
        return repo_lower, best_cnt, best_src, per_sub

    return repo_lower, 0, "", per_sub


def enrich_subskills_catalog(
    subskills_path: Path,
    subskill_installs_by_repo: dict[str, dict[str, int]],
) -> int:
    """将 skills.sh 子技能安装数回填到 config/subskills-catalog.json 的每个目录项 `i` 字段。"""
    if not subskills_path.exists() or not subskill_installs_by_repo:
        return 0
    catalog = json.loads(subskills_path.read_text(encoding="utf-8"))
    repos_map = catalog.get("repos")
    if not isinstance(repos_map, dict):
        return 0
    touched = 0
    for repo_lower, per_sub in subskill_installs_by_repo.items():
        entry = repos_map.get(repo_lower)
        if not isinstance(entry, dict) or not isinstance(entry.get("items"), list) or not per_sub:
            continue
        for sub in entry["items"]:
            if not isinstance(sub, dict):
                continue
            name_key = str(sub.get("n") or "").strip().lower()
            slug_key = Path(str(sub.get("p") or "")).parent.name.strip().lower()
            cnt = per_sub.get(name_key) or per_sub.get(slug_key) or 0
            if cnt > 0 and sub.get("i") != cnt:
                sub["i"] = cnt
                touched += 1
        # 按子技能安装数降序微调默认预览顺序（无安装数的保持原相对顺序）
        entry["items"].sort(key=lambda s: -(int(s.get("i") or 0)))
    if touched > 0:
        subskills_path.write_text(
            json.dumps(catalog, ensure_ascii=False, separators=(",", ":")) + "\n",
            encoding="utf-8",
        )
    return touched


def sync_install_counts(
    limit: int = 300,
    workers: int = 12,
    force: bool = False,
) -> dict[str, Any]:
    rankings = json.loads(RANKINGS_PATH.read_text(encoding="utf-8"))
    items = [
        it
        for it in rankings.get("items", [])
        if it.get("repository_kind") in ("skill", "related")
    ]
    # 优先同步 Skill 仓库及高星项目
    items.sort(
        key=lambda it: (
            0 if it.get("repository_kind") == "skill" else 1,
            -(int(it.get("stars") or 0)),
        )
    )

    existing: dict[str, list[Any]] = {}
    if INSTALL_COUNTS_PATH.exists():
        try:
            loaded = json.loads(INSTALL_COUNTS_PATH.read_text(encoding="utf-8"))
            if isinstance(loaded.get("repos"), dict):
                existing = dict(loaded["repos"])
        except ValueError:
            existing = {}

    targets = items[:limit] if force else [
        it for it in items if str(it.get("repo") or "").lower() not in existing
    ][:limit]
    # 每次也刷新前 40 个头部核心仓库以保持安装数实时增长
    top_refresh = items[: min(40, len(items))]
    seen_target = {str(it.get("repo") or "").lower() for it in targets}
    for it in top_refresh:
        rl = str(it.get("repo") or "").lower()
        if rl not in seen_target and len(targets) < limit:
            targets.append(it)
            seen_target.add(rl)

    gh_token = os.environ.get("GITHUB_TOKEN", "").strip()
    subskill_map: dict[str, dict[str, int]] = {}
    updated = 0

    with ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        futs = [pool.submit(inspect_one_repo, it, gh_token) for it in targets]
        for fut in as_completed(futs):
            try:
                repo_lower, cnt, src, per_sub = fut.result()
            except Exception:
                continue
            if not repo_lower:
                continue
            if per_sub:
                subskill_map[repo_lower] = per_sub
            if cnt > 0 and src:
                prev = existing.get(repo_lower)
                if prev != [cnt, src]:
                    existing[repo_lower] = [cnt, src]
                    updated += 1

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    sorted_repos = dict(sorted(existing.items(), key=lambda kv: -int(kv[1][0])))
    payload = {
        "updated_at": today,
        "repos": sorted_repos,
    }
    INSTALL_COUNTS_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    sub_touched = enrich_subskills_catalog(SUBSKILLS_CATALOG_PATH, subskill_map)
    return {
        "checked": len(targets),
        "total_with_installs": len(sorted_repos),
        "updated": updated,
        "subskills_enriched": sub_touched,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync verified open-source Skill install & download counts.")
    parser.add_argument("--limit", type=int, default=260, help="Max repositories to query in this run")
    parser.add_argument("--workers", type=int, default=12, help="Concurrent HTTP workers")
    parser.add_argument("--force", action="store_true", help="Re-query even already cached repos")
    args = parser.parse_args()
    summary = sync_install_counts(limit=args.limit, workers=args.workers, force=args.force)
    print(
        f"Synced install counts: checked={summary['checked']}, "
        f"with_installs={summary['total_with_installs']}, "
        f"updated={summary['updated']}, subskills_enriched={summary['subskills_enriched']}"
    )


if __name__ == "__main__":
    main()
