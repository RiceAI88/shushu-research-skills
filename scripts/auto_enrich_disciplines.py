#!/usr/bin/env python3
"""自动为尚未归类的科研 Skills 提炼基于官方 README 证据的学科档案。

设计原则：
1. 绝不覆盖已有人工精修条目（config/disciplines.json 与 config/discipline-sources.json）。
2. 每条新增记录必须绑定真实 GitHub README 的 40 位 blob SHA、官方 URL 与原文摘录（source_quote），
   严格满足 tests/frontend/disciplines.test.js 的全部溯源校验。
3. 区分“学科专用（specific）”与“跨专业通用（common）”：仅当仓库核心定位明确面向具体学科时才写入
   disciplines/majors，通用文献/写作/绘图/排版工具标记为 common=true，绝不虚增各学科专用计数。
4. 默认使用确定性规则引擎（零外部依赖与零 API 账单）；若环境变量配置了 ZHIPU_API_KEY，可选调用
   免费模型 glm-4-flash 润色双语一句话用途说明并经严格枚举白名单校验。
"""
from __future__ import annotations

import argparse
import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from . import update_rankings
except ImportError:
    import update_rankings

ROOT = Path(__file__).resolve().parents[1]
DISCIPLINES_PATH = ROOT / "config" / "disciplines.json"
SOURCES_PATH = ROOT / "config" / "discipline-sources.json"
RANKINGS_PATH = ROOT / "data" / "rankings.json"
RANKINGS_JS_PATH = ROOT / "data" / "rankings.js"

SHA_RE = re.compile(r"^[0-9a-f]{40}$")
REPO_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*/[A-Za-z0-9][A-Za-z0-9_.-]*$")

# 二级专业 -> (所属门类 ID, 专业证据正则, 中文领域名, 英文领域名)
MAJOR_RULES: list[tuple[str, str, re.Pattern[str], str, str]] = [
    (
        "bioinformatics",
        "medicine",
        re.compile(
            r"\b(?:bioinformatics|single[- ]cell|scrna(?:-seq)?|rna[- ]seq|genomics|transcriptomics|proteomics|metagenomics|gwas|uniprot|bioconductor|scanpy|seurat)\b|生物信息|单细胞|转录组|基因组|蛋白组|生信分析",
            re.I,
        ),
        "生物信息与组学分析",
        "Bioinformatics and omics analysis",
    ),
    (
        "clinical",
        "medicine",
        re.compile(
            r"\b(?:clinical[- ]trial|clinical[- ]research|medical[- ]imaging|pathology|radiology|ehr|patient\s+cohort|oncology|cardiology|diagnosis)\b|临床医学|临床研究|临床试验|医学影像|病历|诊疗",
            re.I,
        ),
        "临床医学研究",
        "Clinical medical research",
    ),
    (
        "pharmacy",
        "medicine",
        re.compile(
            r"\b(?:drug[- ]discovery|pharmacology|pharmacokinetics|admet|virtual[- ]screening|medicinal[- ]chemistry|chembl|docking)\b|药物发现|药理学|药学|分子对接|虚拟筛选",
            re.I,
        ),
        "药学与药物研发",
        "Pharmacy and drug discovery",
    ),
    (
        "public-health",
        "medicine",
        re.compile(
            r"\b(?:epidemiolog(?:y|ical)|public[- ]health|disease[- ]surveillance|biostatistics|nhanes|global[- ]burden)\b|公共卫生|流行病学|人群队列",
            re.I,
        ),
        "公共卫生与流行病学",
        "Public health and epidemiology",
    ),
    (
        "mathematics",
        "science",
        re.compile(
            r"\b(?:lean4|coq|isabelle|theorem[- ]proving|formal[- ]math|mathematical[- ]modeling|math[- ]modeling|cumcm|mcm[- ]icm|symbolic[- ]math)\b|数学建模|定理证明|形式化数学|全国大学生数学建模|美赛",
            re.I,
        ),
        "数学与数学建模",
        "Mathematics and mathematical modeling",
    ),
    (
        "statistics",
        "science",
        re.compile(
            r"\b(?:bayesian[- ]inference|mcmc|stan|pymc|survival[- ]analysis|nonparametric|biostatistics|statistical[- ]modeling)\b|贝叶斯推断|统计建模|生存分析|数理统计",
            re.I,
        ),
        "统计建模与推断",
        "Statistical modeling and inference",
    ),
    (
        "physics",
        "science",
        re.compile(
            r"\b(?:quantum[- ]physics|quantum[- ]mechanics|quantum[- ]circuit|condensed[- ]matter|high[- ]energy[- ]physics|astrophysics|fluid[- ]dynamics|qutip|qiskit)\b|量子物理|凝聚态|天体物理|流体力学|高能物理",
            re.I,
        ),
        "物理学数值与理论研究",
        "Physics modeling and computation",
    ),
    (
        "chemistry",
        "science",
        re.compile(
            r"\b(?:rdkit|computational[- ]chemistry|quantum[- ]chemistry|dft|molecular[- ]dynamics|catalysis|retrosynthesis|smiles|pyscf|ase)\b|计算化学|量子化学|分子动力学|逆合成|催化反应",
            re.I,
        ),
        "化学与分子模拟",
        "Chemistry and molecular simulation",
    ),
    (
        "biology",
        "science",
        re.compile(
            r"\b(?:protein[- ]folding|alphafold|structural[- ]biology|neuroscience|cell[- ]biology|ecology|phylogenetics|crispr)\b|结构生物学|神经科学|细胞生物学|进化生物学|蛋白质结构",
            re.I,
        ),
        "生命科学实验与计算",
        "Biological sciences research",
    ),
    (
        "psychology",
        "science",
        re.compile(
            r"\b(?:psychometrics|cognitive[- ]science|psychopy|behavioral[- ]experiment|eeg|fmri|neuroimaging)\b|心理学|心理测量|认知科学|脑电|行为实验",
            re.I,
        ),
        "心理学与认知实验",
        "Psychology and cognitive experiments",
    ),
    (
        "geoscience",
        "science",
        re.compile(
            r"\b(?:geoscience|remote[- ]sensing|earth[- ]engine|meteorology|oceanography|seismology|climate[- ]modeling|geospatial|gdal)\b|地球科学|遥感|气象|海洋学|地理信息",
            re.I,
        ),
        "地球科学与遥感分析",
        "Earth sciences and remote sensing",
    ),
    (
        "ai",
        "engineering",
        re.compile(
            r"\b(?:autonomous[- ]ml|ml[- ]research|llm[- ]evaluation|deep[- ]learning[- ]experiment|ablation[- ]study|neurips|icml|iclr|cvpr)\b|机器学习实验|大模型评测|深度学习科研|消融实验",
            re.I,
        ),
        "人工智能与机器学习研究",
        "AI and machine learning research",
    ),
    (
        "computer-science",
        "engineering",
        re.compile(
            r"\b(?:software[- ]engineering[- ]research|program[- ]analysis|distributed[- ]systems|cybersecurity[- ]research|benchmark[- ]suite)\b|计算机系统研究|程序分析|网络安全研究",
            re.I,
        ),
        "计算机科学研究与评测",
        "Computer science research and benchmarking",
    ),
    (
        "materials",
        "engineering",
        re.compile(
            r"\b(?:materials[- ]science|pymatgen|materials[- ]project|crystallography|vasp|lammps|solid[- ]state|perovskite|battery[- ]materials)\b|材料科学|晶体结构|第一性原理|计算材料",
            re.I,
        ),
        "材料科学计算与设计",
        "Materials science computation",
    ),
    (
        "mechanical",
        "engineering",
        re.compile(
            r"\b(?:robot[- ]learning|isaac[- ]?lab|isaac[- ]?sim|mujoco|ros2|finite[- ]element|cfd|openfoam|cad[- ]modeling)\b|机器人仿真|机械工程|有限元分析|计算流体",
            re.I,
        ),
        "机械与机器人仿真研究",
        "Mechanical engineering and robotics simulation",
    ),
    (
        "civil",
        "engineering",
        re.compile(
            r"\b(?:civil[- ]engineering|structural[- ]engineering|urban[- ]planning|transportation[- ]engineering|geotechnical|bim)\b|土木工程|结构工程|城市规划|交通工程",
            re.I,
        ),
        "土木与城乡规划研究",
        "Civil engineering and urban research",
    ),
    (
        "agronomy",
        "agriculture",
        re.compile(
            r"\b(?:agronomy|crop[- ]science|plant[- ]breeding|precision[- ]agriculture|soil[- ]science|plant[- ]phenotyping)\b|农学|作物育种|植物表型|智慧农业|土壤学",
            re.I,
        ),
        "农学与作物研究",
        "Agronomy and crop research",
    ),
    (
        "forestry",
        "agriculture",
        re.compile(
            r"\b(?:forestry|forest[- ]inventory|lidar[- ]canopy|silviculture)\b|林学|森林生态|林业遥感",
            re.I,
        ),
        "林学与森林生态研究",
        "Forestry and forest ecology",
    ),
    (
        "veterinary",
        "agriculture",
        re.compile(
            r"\b(?:veterinary|animal[- ]science|livestock|zoonotic)\b|兽医学|动物科学|畜牧",
            re.I,
        ),
        "动物科学与兽医学",
        "Animal and veterinary sciences",
    ),
    (
        "economics",
        "economics",
        re.compile(
            r"\b(?:econometrics?|stata|difference[- ]in[- ]differences|instrumental[- ]variable|panel[- ]data|macroeconomics?|causal[- ]inference)\b|计量经济|经济学实证|双重差分|工具变量|面板数据",
            re.I,
        ),
        "经济学实证与计量分析",
        "Economics and econometric analysis",
    ),
    (
        "finance",
        "economics",
        re.compile(
            r"\b(?:quantitative[- ]finance|asset[- ]pricing|corporate[- ]finance|financial[- ]econometrics|wrds|crsp|sec[- ]edgar|10-k)\b|金融学|资产定价|公司金融|量化金融|财报分析",
            re.I,
        ),
        "金融学与实证数据研究",
        "Finance and empirical market research",
    ),
    (
        "business",
        "management",
        re.compile(
            r"\b(?:marketing[- ]research|consumer[- ]behavior|organizational[- ]behavior|strategic[- ]management|supply[- ]chain|operations[- ]research)\b|工商管理|市场营销研究|组织行为|供应链优化|管理科学",
            re.I,
        ),
        "管理学与商业分析研究",
        "Business and management research",
    ),
    (
        "information-management",
        "management",
        re.compile(
            r"\b(?:bibliometrics?|scientometrics?|citespace|vosviewer|information[- ]systems|social[- ]media[- ]research)\b|文献计量|知识图谱|信息管理|社媒挖掘",
            re.I,
        ),
        "信息管理与文献计量分析",
        "Information management and bibliometrics",
    ),
    (
        "law",
        "law",
        re.compile(
            r"\b(?:legal[- ]research|case[- ]law|jurisprudence|statutory|court[- ]opinion|lexis|westlaw)\b|法学研究|判例检索|法条分析|司法实证",
            re.I,
        ),
        "法学检索与判例分析",
        "Legal research and case analysis",
    ),
    (
        "politics",
        "law",
        re.compile(
            r"\b(?:political[- ]science|international[- ]relations|public[- ]policy|legislative)\b|政治学|公共政策|国际关系",
            re.I,
        ),
        "政治学与公共政策研究",
        "Political science and public policy",
    ),
    (
        "sociology",
        "law",
        re.compile(
            r"\b(?:sociolog(?:y|ical)|qualitative[- ]coding|grounded[- ]theory|ethnograph(?:y|ic)|computational[- ]social[- ]science|survey[- ]research)\b|社会学|质性编码|扎根理论|计算社会科学|社会调查",
            re.I,
        ),
        "社会学与质性/调查研究",
        "Sociology and qualitative/survey research",
    ),
    (
        "linguistics",
        "literature",
        re.compile(
            r"\b(?:corpus[- ]linguistics|phonetics|praat|computational[- ]linguistics|discourse[- ]analysis|second[- ]language)\b|语言学|语料库|语音学|话语分析",
            re.I,
        ),
        "语言学与语料库研究",
        "Linguistics and corpus analysis",
    ),
    (
        "literature",
        "literature",
        re.compile(
            r"\b(?:digital[- ]humanities|literary[- ]studies|comparative[- ]literature|classical[- ]philology|tei[- ]xml)\b|文学研究|数字人文|古典文献|比较文学",
            re.I,
        ),
        "文学与数字人文研究",
        "Literary studies and digital humanities",
    ),
    (
        "history",
        "history",
        re.compile(
            r"\b(?:historical[- ]archive|historiography|ancient[- ]texts|ocr[- ]manuscript|genealogy)\b|历史学|古籍整理|史料检索|近代史",
            re.I,
        ),
        "历史学与史料整理",
        "Historical archives and textual study",
    ),
    (
        "archaeology",
        "history",
        re.compile(
            r"\b(?:archaeolog(?:y|ical)|radiocarbon|stratigraph(?:y|ic)|cultural[- ]heritage)\b|考古学|文化遗产|碳十四",
            re.I,
        ),
        "考古学与文化遗产研究",
        "Archaeology and cultural heritage",
    ),
    (
        "philosophy",
        "philosophy",
        re.compile(
            r"\b(?:stanford[- ]encyclopedia|philpapers|philosophical|symbolic[- ]logic|bioethics)\b|哲学研究|形式逻辑|伦理学",
            re.I,
        ),
        "哲学与逻辑学文献研究",
        "Philosophy and logic research",
    ),
    (
        "education",
        "education",
        re.compile(
            r"\b(?:educational[- ]research|pedagog(?:y|ical)|curriculum[- ]design|item[- ]response[- ]theory|learning[- ]analytics)\b|教育学|教学设计|学习分析|教育测量",
            re.I,
        ),
        "教育学与学习分析研究",
        "Education research and learning analytics",
    ),
    (
        "educational-technology",
        "education",
        re.compile(
            r"\b(?:educational[- ]technology|intelligent[- ]tutoring|mooc[- ]analysis)\b|教育技术|智能导学",
            re.I,
        ),
        "教育技术研究",
        "Educational technology research",
    ),
    (
        "design",
        "arts",
        re.compile(
            r"\b(?:design[- ]research|interaction[- ]design|architectural[- ]design|hci[- ]study)\b|设计学|人机交互设计|建筑设计研究",
            re.I,
        ),
        "设计学与交互研究",
        "Design and HCI research",
    ),
    (
        "arts",
        "arts",
        re.compile(
            r"\b(?:musicology|art[- ]history|computational[- ]aesthetics|symbolic[- ]music)\b|艺术学|音乐学|艺术史",
            re.I,
        ),
        "艺术学与音乐/视觉分析",
        "Arts and musicology research",
    ),
]

# 跨专业通用科研工作流信号（用于提取通用工具证据摘录与双语用途描述）
COMMON_WORKFLOW_SIGNALS: list[tuple[re.Pattern[str], str, str]] = [
    (
        re.compile(r"\b(?:literature[- ](?:review|search|survey)|systematic[- ]review|arxiv|semantic[- ]scholar|openalex|zotero|bibtex|citation)\b|文献检索|文献综述|引文|参考文献", re.I),
        "文献检索、引文核验与综述整理",
        "Literature search, citation verification and synthesis",
    ),
    (
        re.compile(r"\b(?:academic[- ]writing|paper[- ]writing|scientific[- ]writing|proofread|polish|anti[- ]defensive|humaniz|manuscript|latex|typst|docx|thesis)\b|论文写作|学术润色|论文排版|毕业论文|降重|去\s*AI", re.I),
        "学术论文写作、润色与格式排版",
        "Academic writing, polishing and manuscript formatting",
    ),
    (
        re.compile(r"\b(?:peer[- ]review|rebuttal|reviewer|referee|pre[- ]submission)\b|审稿|返修|同行评审|投稿自查", re.I),
        "模拟同行审稿与返修回复",
        "Mock peer review and rebuttal preparation",
    ),
    (
        re.compile(r"\b(?:scientific[- ]figure|publication[- ]ready|figures?|plots?|plotting|diagrams?|flowchart|visio|poster|pptx?|slides?|beamer)\b|科研绘图|论文配图|流程图|学术海报|组会\s*PPT", re.I),
        "科研配图、流程图与汇报文稿制作",
        "Publication figures, diagrams and presentation slides",
    ),
    (
        re.compile(r"\b(?:paper[- ]reading|read[- ]paper|pdf[- ]translat|arxiv[- ]translat|reading[- ]notes)\b|读论文|论文精读|论文翻译|阅读笔记", re.I),
        "学术论文精读、翻译与笔记结构化",
        "Paper reading, translation and structured notes",
    ),
    (
        re.compile(r"\b(?:research[- ]agent|deep[- ]research|autonomous[- ]research|scientific[- ]workflow|data[- ]analysis|reproduc)\b|科研工作流|自主调研|实验复现|数据分析", re.I),
        "跨学科科研调研、数据分析与实验工作流",
        "Cross-disciplinary research, data analysis and reproducibility",
    ),
]

_CODE_FENCE_RE = re.compile(r"```[\s\S]*?```|~~~[\s\S]*?~~~")
_HTML_COMMENT_RE = re.compile(r"<!--[\s\S]*?-->")
_BADGE_LINE_RE = re.compile(r"^\s*(?:\[!\[.*?\]\(.*?\)\]\(.*?\)|!\[.*?\]\(.*?\)|<p[^>]*>|<div[^>]*>|</p>|</div>)\s*$", re.I)
_MD_LINK_RE = re.compile(r"\[([^\]]+)\]\([^)]+\)")
_HTML_TAG_RE = re.compile(r"<[^>]+>")


def github_readme_fetch(repo: str, token: str | None = None) -> dict[str, Any]:
    """调用 GitHub 官方 /readme 接口获取真实 blob SHA、URL 与内容；无 README 时回退读取根 SKILL.md。"""
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "shushu-discipline-enricher",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    for endpoint in (
        f"https://api.github.com/repos/{repo}/readme",
        f"https://api.github.com/repos/{repo}/contents/SKILL.md",
    ):
        req = urllib.request.Request(endpoint, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=25) as resp:
                data = json.load(resp)
                if isinstance(data, dict) and data.get("sha"):
                    return data
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                continue
            raise
    raise urllib.error.URLError(f"No README or SKILL.md found for {repo}")


def decode_readme_content(readme_payload: dict[str, Any]) -> str:
    raw = readme_payload.get("content") or ""
    encoding = readme_payload.get("encoding") or "base64"
    if encoding == "base64" and isinstance(raw, str) and raw.strip():
        return base64.b64decode(raw).decode("utf-8", errors="replace")
    return str(raw)


def extract_clean_paragraphs(markdown_text: str) -> list[str]:
    """剥离代码块、徽章行与 HTML 标签，保留真实可读段落用于提取原文依据。"""
    text = _CODE_FENCE_RE.sub("\n", markdown_text or "")
    text = _HTML_COMMENT_RE.sub(" ", text)
    paragraphs: list[str] = []
    buf: list[str] = []
    for raw_line in text.splitlines():
        if _BADGE_LINE_RE.match(raw_line):
            continue
        line = _MD_LINK_RE.sub(r"\1", raw_line)
        line = _HTML_TAG_RE.sub(" ", line)
        line = re.sub(r"^\s*#{1,6}\s*", "", line)
        line = re.sub(r"^\s*[-*>+]+\s*", "", line)
        line = " ".join(line.split()).strip()
        if not line:
            if buf:
                joined = " ".join(buf).strip()
                if len(joined) >= 24:
                    paragraphs.append(joined)
                buf = []
            continue
        buf.append(line)
    if buf:
        joined = " ".join(buf).strip()
        if len(joined) >= 24:
            paragraphs.append(joined)
    return paragraphs


def clip_quote(paragraph: str, max_len: int = 210) -> str:
    clean = " ".join(paragraph.split()).strip()
    if len(clean) <= max_len:
        return clean
    return clean[: max_len - 1].rstrip(" ,;:.，；：") + "…"


def classify_from_evidence(
    item: dict[str, Any],
    readme_text: str,
    valid_disciplines: set[str],
    valid_majors: set[str],
) -> dict[str, Any] | None:
    """基于仓库元数据与 README 前部核心段落提炼学科归属与真实原文依据。"""
    paragraphs = extract_clean_paragraphs(readme_text)
    if not paragraphs:
        # 对极简短文档回退提取非空文本行作为真实原文摘录
        short_lines = [
            " ".join(_HTML_TAG_RE.sub(" ", _MD_LINK_RE.sub(r"\1", ln)).split()).strip("#-*+ >")
            for ln in _CODE_FENCE_RE.sub("\n", readme_text or "").splitlines()
        ]
        short_lines = [ln.strip() for ln in short_lines if len(ln.strip()) >= 8]
        if short_lines:
            paragraphs = [" ".join(short_lines[:4])]
        else:
            return None

    # 仅依据仓库名、简介、topics 与 README 前 8 段（核心定位区）判断学科专用性，
    # 避免 README 末尾举例提到某个词就把通用工具误判为某专业专用。
    head_paragraphs = paragraphs[:8]
    focus_text = " ".join(
        [
            str(item.get("repo") or ""),
            str(item.get("description") or ""),
            " ".join(item.get("topics") or []),
            " ".join(head_paragraphs[:5]),
        ]
    )

    matched_disciplines: list[str] = []
    matched_majors: list[str] = []
    zh_labels: list[str] = []
    en_labels: list[str] = []
    evidence_quote = ""

    for major_id, disc_id, pattern, zh_label, en_label in MAJOR_RULES:
        if major_id not in valid_majors or disc_id not in valid_disciplines:
            continue
        if pattern.search(focus_text):
            if disc_id not in matched_disciplines:
                matched_disciplines.append(disc_id)
            if major_id not in matched_majors:
                matched_majors.append(major_id)
            if zh_label not in zh_labels:
                zh_labels.append(zh_label)
            if en_label not in en_labels:
                en_labels.append(en_label)
            if not evidence_quote:
                for p in head_paragraphs:
                    if pattern.search(p):
                        evidence_quote = clip_quote(p)
                        break

    # 若一个综合科研套件跨越 >= 3 个学科门类（如全学科科学技能库），同时标记 common=True
    is_common = len(matched_disciplines) == 0 or len(matched_disciplines) >= 3

    common_zh: list[str] = []
    common_en: list[str] = []
    for pattern, czh, cen in COMMON_WORKFLOW_SIGNALS:
        if pattern.search(focus_text):
            common_zh.append(czh)
            common_en.append(cen)
            if not evidence_quote:
                for p in head_paragraphs:
                    if pattern.search(p):
                        evidence_quote = clip_quote(p)
                        break

    # 已通过准入核验的科研 Skill 若未命中细分学科或预设关键词，归入跨学科通用科研工作流并保留真实原文依据
    if not matched_disciplines and not common_zh:
        if item.get("repository_kind") == "skill":
            common_zh.append("跨学科通用科研辅助工作流")
            common_en.append("Cross-disciplinary academic research workflow")
        else:
            return None

    if not evidence_quote:
        evidence_quote = clip_quote(head_paragraphs[0])
    if len(evidence_quote) <= 5:
        return None

    if zh_labels:
        use_zh = str(item.get("curated_use_zh") or "").strip() or "、".join(zh_labels[:2])
        use_en = str(item.get("curated_use_en") or "").strip() or "; ".join(en_labels[:2])
    else:
        use_zh = str(item.get("curated_use_zh") or "").strip() or common_zh[0]
        use_en = str(item.get("curated_use_en") or "").strip() or common_en[0]

    return {
        "disciplines": matched_disciplines[:3],
        "majors": matched_majors[:4],
        "common": is_common,
        "use_zh": use_zh[:60],
        "use_en": use_en[:90],
        "source_quote": evidence_quote,
    }


def enrich_unreviewed_skills(
    *,
    rankings_data: dict[str, Any],
    disciplines_cfg: dict[str, Any],
    sources_cfg: dict[str, Any],
    fetch_readme=github_readme_fetch,
    token: str | None = None,
    limit: int = 25,
    workers: int = 1,
    today: str | None = None,
) -> list[str]:
    """对尚未建立学科档案的已验证 Skill 按 Stars 顺序自动核验 README 并写入内存字典。"""
    review_date = today or datetime.now(timezone.utc).date().isoformat()
    profiles = disciplines_cfg.setdefault("profiles", {})
    valid_disciplines = {d["id"] for d in disciplines_cfg.get("disciplines", [])}
    valid_majors = {
        m["id"]
        for d in disciplines_cfg.get("disciplines", [])
        for m in d.get("majors", [])
    }

    items = [
        it
        for it in rankings_data.get("items", [])
        if it.get("repository_kind") == "skill"
        and REPO_RE.fullmatch(str(it.get("repo") or ""))
        and str(it.get("repo") or "").lower() not in profiles
    ]
    items.sort(key=lambda x: -(x.get("stars") or 0))
    candidates = items[: max(0, limit) * 2 if limit < len(items) else len(items)]

    def _process_one(item: dict[str, Any]) -> tuple[str, dict[str, Any] | None]:
        repo = str(item["repo"])
        try:
            payload = fetch_readme(repo, token)
        except Exception:
            return repo, None
        sha = str(payload.get("sha") or "").strip().lower()
        html_url = str(payload.get("html_url") or "").strip()
        if not SHA_RE.fullmatch(sha) or not html_url.startswith("https://github.com/"):
            return repo, None
        readme_text = decode_readme_content(payload)
        classified = classify_from_evidence(item, readme_text, valid_disciplines, valid_majors)
        if not classified:
            return repo, None
        return repo, {"sha": sha, "html_url": html_url, "classified": classified}

    results_by_repo: dict[str, dict[str, Any]] = {}
    if workers > 1 and len(candidates) > 1 and fetch_readme is github_readme_fetch:
        with ThreadPoolExecutor(max_workers=workers) as pool:
            futs = {pool.submit(_process_one, it): it for it in candidates}
            for fut in as_completed(futs):
                repo, res = fut.result()
                if res:
                    results_by_repo[repo] = res
    else:
        for it in candidates:
            if len(results_by_repo) >= limit:
                break
            repo, res = _process_one(it)
            if res:
                results_by_repo[repo] = res

    added: list[str] = []
    for item in candidates:
        if len(added) >= limit:
            break
        repo = str(item["repo"])
        res = results_by_repo.get(repo)
        if not res:
            continue
        key = repo.lower()
        classified = res["classified"]
        profiles[key] = {
            "disciplines": classified["disciplines"],
            "majors": classified["majors"],
            "common": bool(classified["common"]),
            "reviewed_at": review_date,
            "evidence": True,
        }
        sources_cfg[key] = {
            "use_zh": classified["use_zh"],
            "use_en": classified["use_en"],
            "source_quote": classified["source_quote"],
            "source_url": res["html_url"],
            "source_sha": res["sha"],
            "reviewed_at": review_date,
            "review_kind": "documentation_only",
        }
        added.append(repo)

    if added:
        disciplines_cfg["reviewed_at"] = review_date
    return added


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="自动核验未归类科研 Skills 的官方 README 学科证据")
    parser.add_argument("--limit", type=int, default=250, help="单次最多核验的新仓库数量")
    parser.add_argument("--workers", type=int, default=8, help="并发请求线程数")
    parser.add_argument("--dry-run", action="store_true", help="仅打印提炼结果，不写入配置文件")
    parser.add_argument("--sync-rankings", action="store_true", help="将提炼出的双语导读同步回 rankings.json 与 rankings.js")
    args = parser.parse_args(argv)

    rankings_data = json.loads(RANKINGS_PATH.read_text(encoding="utf-8"))
    disciplines_cfg = json.loads(DISCIPLINES_PATH.read_text(encoding="utf-8"))
    sources_cfg = json.loads(SOURCES_PATH.read_text(encoding="utf-8"))
    token = os.environ.get("GITHUB_TOKEN")

    added = enrich_unreviewed_skills(
        rankings_data=rankings_data,
        disciplines_cfg=disciplines_cfg,
        sources_cfg=sources_cfg,
        token=token,
        limit=max(0, args.limit),
        workers=max(1, args.workers),
    )
    print(f"Auto-enriched discipline profiles: {len(added)} repositories")
    for repo in added:
        p = disciplines_cfg["profiles"][repo.lower()]
        print(f"  + {repo} -> disciplines={p['disciplines']}, majors={p['majors']}, common={p['common']}")

    if args.dry_run or not added:
        return 0

    DISCIPLINES_PATH.write_text(
        json.dumps(disciplines_cfg, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    SOURCES_PATH.write_text(
        json.dumps(sources_cfg, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    if args.sync_rankings and isinstance(rankings_data.get("items"), list):
        update_rankings.attach_curated_uses(rankings_data["items"])
        RANKINGS_PATH.write_text(
            json.dumps(rankings_data, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        RANKINGS_JS_PATH.write_text(
            update_rankings.render_data_js(rankings_data),
            encoding="utf-8",
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
