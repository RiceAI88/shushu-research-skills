import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
import sync_install_counts as sic  # noqa: E402


class SyncInstallCountsTests(unittest.TestCase):
    def test_skills_sh_filters_strictly_by_exact_repo_source(self):
        fake_response = {
            "skills": [
                {"id": "other/repo/s1", "source": "other/repo", "skillId": "s1", "name": "s1", "installs": 99999},
                {"id": "k-dense-ai/scientific-agent-skills/scanpy", "source": "k-dense-ai/scientific-agent-skills", "skillId": "scanpy", "name": "scanpy", "installs": 1200},
                {"id": "k-dense-ai/scientific-agent-skills/rdkit", "source": "k-dense-ai/scientific-agent-skills", "skillId": "rdkit", "name": "rdkit", "installs": 800},
                # 重复 ID 去重
                {"id": "k-dense-ai/scientific-agent-skills/rdkit", "source": "k-dense-ai/scientific-agent-skills", "skillId": "rdkit", "name": "rdkit", "installs": 800},
            ]
        }
        with patch.object(sic, "_http_json", return_value=fake_response):
            total, per_sub = sic.fetch_skills_sh_installs("K-Dense-AI/scientific-agent-skills")
        self.assertEqual(total, 2000)
        self.assertEqual(per_sub["scanpy"], 1200)
        self.assertEqual(per_sub["rdkit"], 800)

    def test_pypi_requires_reverse_github_url_verification(self):
        def fake_http(url, **_kwargs):
            if "pypi.org/pypi/unrelated-pkg/json" in url:
                return {"info": {"home_page": "https://github.com/someone-else/unrelated-pkg"}}
            if "pypi.org/pypi/paper-qa/json" in url:
                return {"info": {"project_urls": {"Source": "https://github.com/Future-House/paper-qa"}}}
            if "pypistats.org/api/packages/paper-qa/recent" in url:
                return {"data": {"last_month": 108760}}
            return None

        with patch.object(sic, "_http_json", side_effect=fake_http):
            unverified = sic.fetch_verified_pypi_30d(
                {"repo": "my-lab/unrelated-pkg", "language": "Python", "description": ""}
            )
            verified = sic.fetch_verified_pypi_30d(
                {"repo": "Future-House/paper-qa", "language": "Python", "description": "pip install paper-qa"}
            )
        self.assertEqual(unverified, 0)
        self.assertEqual(verified, 108760)

    def test_enrich_subskills_catalog_attaches_counts_and_sorts(self):
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / "subskills-catalog.json"
            p.write_text(
                json.dumps(
                    {
                        "repos": {
                            "owner/pack": {
                                "branch": "main",
                                "total": 2,
                                "items": [
                                    {"n": "alpha", "g": "", "p": "skills/alpha/SKILL.md"},
                                    {"n": "beta", "g": "", "p": "skills/beta/SKILL.md"},
                                ],
                            }
                        }
                    }
                ),
                encoding="utf-8",
            )
            touched = sic.enrich_subskills_catalog(p, {"owner/pack": {"beta": 3400, "alpha": 150}})
            self.assertEqual(touched, 2)
            updated = json.loads(p.read_text(encoding="utf-8"))
            items = updated["repos"]["owner/pack"]["items"]
            self.assertEqual(items[0]["n"], "beta")
            self.assertEqual(items[0]["i"], 3400)
            self.assertEqual(items[1]["i"], 150)


if __name__ == "__main__":
    unittest.main()
