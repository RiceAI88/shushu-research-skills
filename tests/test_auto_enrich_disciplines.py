import base64
import json
import unittest
from pathlib import Path

from scripts.auto_enrich_disciplines import enrich_unreviewed_skills

ROOT = Path(__file__).resolve().parents[1]


def _encode_md(text: str) -> str:
    return base64.b64encode(text.encode("utf-8")).decode("ascii")


class AutoEnrichDisciplinesTest(unittest.TestCase):
    def setUp(self) -> None:
        base_cfg = json.loads((ROOT / "config" / "disciplines.json").read_text(encoding="utf-8"))
        self.disciplines_cfg = {
            "schema_version": 1,
            "reviewed_at": "2026-11-22",
            "count_unit": "unique_repositories",
            "disciplines": base_cfg["disciplines"],
            "profiles": {
                "existing/manual-repo": {
                    "disciplines": ["medicine"],
                    "majors": ["clinical"],
                    "common": False,
                    "reviewed_at": "2026-11-14",
                    "evidence": True,
                }
            },
        }
        self.sources_cfg = {
            "existing/manual-repo": {
                "use_zh": "既有人工核验条目",
                "use_en": "Existing manual entry",
                "source_quote": "Original human-curated quote.",
                "source_url": "https://github.com/existing/manual-repo/blob/main/README.md",
                "source_sha": "a" * 40,
                "reviewed_at": "2026-11-14",
                "review_kind": "documentation_only",
            }
        }

    def test_enriches_specialist_and_common_skills_without_touching_existing_entries(self) -> None:
        rankings = {
            "items": [
                {
                    "repo": "Existing/Manual-Repo",
                    "stars": 9999,
                    "repository_kind": "skill",
                    "description": "Should never be overwritten",
                    "topics": [],
                },
                {
                    "repo": "econlab/stata-did-skill",
                    "stars": 500,
                    "repository_kind": "skill",
                    "description": "Stata econometrics and difference-in-differences workflow",
                    "topics": ["econometrics"],
                },
                {
                    "repo": "writer/latex-polish-skill",
                    "stars": 300,
                    "repository_kind": "skill",
                    "description": "Academic writing proofreading and LaTeX manuscript formatting",
                    "topics": ["latex"],
                },
                {
                    "repo": "noise/empty-readme",
                    "stars": 200,
                    "repository_kind": "skill",
                    "description": "Misc tool",
                    "topics": [],
                },
            ]
        }

        readmes = {
            "econlab/stata-did-skill": {
                "sha": "1" * 40,
                "html_url": "https://github.com/econlab/stata-did-skill/blob/main/README.md",
                "encoding": "base64",
                "content": _encode_md(
                    "# Stata DID Skill\n\n"
                    "Automates panel-data econometrics, difference-in-differences event studies, "
                    "and publication regression tables in Stata for empirical economics research.\n"
                ),
            },
            "writer/latex-polish-skill": {
                "sha": "2" * 40,
                "html_url": "https://github.com/writer/latex-polish-skill/blob/main/README.md",
                "encoding": "base64",
                "content": _encode_md(
                    "# LaTeX Polish\n\n"
                    "Provides academic writing proofreading, citation hygiene, and LaTeX manuscript "
                    "formatting rules for graduate researchers across disciplines.\n"
                ),
            },
            "noise/empty-readme": {
                "sha": "3" * 40,
                "html_url": "https://github.com/noise/empty-readme/blob/main/README.md",
                "encoding": "base64",
                "content": _encode_md("# Hi\n"),
            },
        }

        added = enrich_unreviewed_skills(
            rankings_data=rankings,
            disciplines_cfg=self.disciplines_cfg,
            sources_cfg=self.sources_cfg,
            fetch_readme=lambda repo, _tok=None: readmes[repo],
            limit=10,
            today="2026-11-25",
        )

        self.assertEqual(added, ["econlab/stata-did-skill", "writer/latex-polish-skill"])
        # 人工条目保持原样不被修改
        self.assertEqual(self.sources_cfg["existing/manual-repo"]["use_zh"], "既有人工核验条目")

        # 专业专属项目：准确识别经济学门类与二级专业，且提取真实原文摘录
        econ_profile = self.disciplines_cfg["profiles"]["econlab/stata-did-skill"]
        self.assertEqual(econ_profile["disciplines"], ["economics"])
        self.assertEqual(econ_profile["majors"], ["economics"])
        self.assertFalse(econ_profile["common"])
        self.assertTrue(econ_profile["evidence"])
        econ_src = self.sources_cfg["econlab/stata-did-skill"]
        self.assertEqual(econ_src["source_sha"], "1" * 40)
        self.assertIn("difference-in-differences", econ_src["source_quote"])
        self.assertEqual(econ_src["review_kind"], "documentation_only")

        # 跨专业通用项目：不污染各学科专用计数，标记 common=True
        common_profile = self.disciplines_cfg["profiles"]["writer/latex-polish-skill"]
        self.assertEqual(common_profile["disciplines"], [])
        self.assertEqual(common_profile["majors"], [])
        self.assertTrue(common_profile["common"])


if __name__ == "__main__":
    unittest.main()
