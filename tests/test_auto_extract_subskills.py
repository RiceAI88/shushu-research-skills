import unittest

from scripts.auto_extract_subskills import (
    extract_subskills_from_tree,
    sync_subskills_catalog,
)


class AutoExtractSubskillsTest(unittest.TestCase):
    def test_extracts_clean_names_and_groups_while_ignoring_noise_and_root_wrapper(self) -> None:
        tree = [
            {"type": "blob", "path": "SKILL.md"},
            {"type": "blob", "path": "skills/bioinformatics/scanpy-qc/SKILL.md"},
            {"type": "blob", "path": "skills/bioinformatics/deseq2/SKILL.md"},
            {"type": "blob", "path": ".claude/skills/paper-polish/SKILL.md"},
            {"type": "blob", "path": "node_modules/pkg/SKILL.md"},
            {"type": "tree", "path": "skills/bioinformatics"},
        ]
        total, items = extract_subskills_from_tree(tree, repo="org/mega-skills")
        self.assertEqual(total, 4)
        self.assertEqual(
            items,
            [
                {"n": "paper-polish", "p": ".claude/skills/paper-polish/SKILL.md"},
                {"n": "deseq2", "p": "skills/bioinformatics/deseq2/SKILL.md", "g": "bioinformatics"},
                {"n": "scanpy-qc", "p": "skills/bioinformatics/scanpy-qc/SKILL.md", "g": "bioinformatics"},
            ],
        )

    def test_sync_reuses_unchanged_push_cache_and_fetches_new_multi_skill_repos(self) -> None:
        rankings = {
            "items": [
                {
                    "repo": "Cached/Repo",
                    "stars": 9000,
                    "repository_kind": "skill",
                    "skills_count": 12,
                    "last_push_date": "2026-11-20",
                    "default_branch": "main",
                },
                {
                    "repo": "Fresh/Suite",
                    "stars": 5000,
                    "repository_kind": "skill",
                    "skills_count": 4,
                    "last_push_date": "2026-11-24",
                    "default_branch": "main",
                },
            ]
        }
        existing = {
            "schema_version": 1,
            "repos": {
                "cached/repo": {
                    "repo": "Cached/Repo",
                    "branch": "main",
                    "pushed": "2026-11-20",
                    "total": 12,
                    "items": [{"n": "a", "p": "a/SKILL.md"}, {"n": "b", "p": "b/SKILL.md"}],
                }
            },
        }
        calls: list[str] = []

        def fake_fetch(repo: str, branch: str, _tok=None):
            calls.append(f"{repo}@{branch}")
            return {
                "tree": [
                    {"type": "blob", "path": "skills/lit-search/SKILL.md"},
                    {"type": "blob", "path": "skills/figure-plot/SKILL.md"},
                ]
            }

        catalog, updated = sync_subskills_catalog(
            rankings_data=rankings,
            existing_catalog=existing,
            fetch_tree=fake_fetch,
            limit=5,
            sleep_sec=0,
        )
        self.assertEqual(calls, ["Fresh/Suite@main"])
        self.assertEqual(updated, ["Fresh/Suite"])
        self.assertIn("cached/repo", catalog["repos"])
        self.assertEqual(len(catalog["repos"]["fresh/suite"]["items"]), 2)


if __name__ == "__main__":
    unittest.main()
