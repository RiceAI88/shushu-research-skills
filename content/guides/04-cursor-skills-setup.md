---
slug: cursor-skills-setup
order: 4
group: 保姆级装机图文教程
agent: cursor
card_title: ⚡ Cursor 科研写作配置
card_desc: LaTeX / Python 双修 · 可视化对比逐段改稿
badge: 改稿直观
title: Cursor 编辑器挂载学术 Skills 与 LaTeX 论文实战教程
summary: 面向习惯 VS Code 界面的同学，详解如何在 Cursor 中挂载科研 Skills 与 MCP 文献工具，实现左栏改 LaTeX 代码、右栏实时预览 PDF。
updated: 2026-11-28
reading_time: 4 分钟
---

如果你习惯使用 VS Code 编写 Python 代码或配合 Overleaf / 本地 TeX Live 撰写 LaTeX 论文，**Cursor** 是最顺手的科研 IDE 选择——它的绿色/红色逐行 Diff 视图能让你清楚看到 AI 润色了哪一个单词，杜绝误改实验数值。

## 1. 安装 Cursor 与科研必备扩展

1. 前往 `cursor.com` 下载安装客户端，首次打开可一键导入你原有的 VS Code 插件与快捷键；
2. 写 LaTeX 论文建议在扩展市场安装 **LaTeX Workshop**（保存即可在右侧分屏实时预览编译后的 PDF）；做数据分析建议安装 **Python** 与 **Jupyter** 扩展。

## 2. 将本站科研 Skills 挂载到 Cursor

Cursor 支持通过 `npx skills` 自动将技能安装到项目规则目录，打开 Cursor 底部终端（``Ctrl + ` ``）运行：

```bash
npx skills add WenyuChiou/academic-writing-skills -a cursor
```

安装器会自动把技能规范写入当前课题的 `.cursor/rules/`（`.mdc` 规则文件）或 `.agents/skills/` 中。当你在右侧 **Agent 对话面板（快捷键 `Cmd/Ctrl + I`）** 提问时，Cursor 会自动按任务上下文加载对应学术规范。

## 3. 接入文献检索 MCP Server（进阶加分项）

本站收录的多款文献检索工具（如 `arXiv`、`PubMed`、`Semantic Scholar`、`Zotero` 连接器）支持 **MCP 协议**。在 Cursor 设置中打开 **Cursor Settings → MCP → Add new global MCP server**，填入仓库详情页提供的命令后，你就可以在改论文时直接说：

```text
帮我在 Zotero 本地库和近三年 arXiv 论文里核对第 2 节提到的对比方法引用是否准确，补齐缺失的 BibTeX 条目到 refs.bib，并用绿色 Diff 标出引言段落的逻辑润色建议。
```

审核无误后点击 **Accept** 即可逐处采纳修改，兼顾高效率与 100% 学术可控性。
