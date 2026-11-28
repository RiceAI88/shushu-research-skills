---
slug: codex-cli-setup
order: 3
group: 保姆级装机图文教程
agent: codex
card_title: ⌨️ OpenAI Codex CLI 指南
card_desc: 极简终端流 · 数学建模推导与实验复现利器
badge: 数理强项
title: OpenAI Codex CLI 安装配置与实验代码复现入门
summary: 快速安装 OpenAI 官方 Codex CLI，挂载学术计算与建模 Skills，高效完成数学推导、Stata/Python 实证与消融实验复现。
updated: 2026-11-28
reading_time: 4 分钟
---

**OpenAI Codex CLI** 是 OpenAI 官方开源的轻量级本地命令行 Agent。得益于推理模型在数理证明、算法排错和统计检验上的强项，Codex 非常适合理工科实验复现、数学建模竞赛（美赛 MCM/ICM、国赛）与经管实证代码编写。

## 1. 全局安装 Codex CLI

确保电脑已安装 **Node.js 20+** 与 **Git**，在终端运行以下命令完成安装：

```bash
npm install -g @openai/codex --registry=https://registry.npmmirror.com
```

进入你的实验代码或数据文件夹，直接输入 `codex` 启动：

```bash
cd ~/Projects/Paper-Experiments
codex
```

首次启动可选择使用 **ChatGPT Plus / Pro 账号一键登录**，或在环境变量中配置 `OPENAI_API_KEY`。

## 2. 为 Codex 安装科研 Skills

Codex 完整兼容开放的 Agent Skills 标准，推荐直接在系统终端通过 `npx skills` 定向挂载：

```bash
npx skills add jihe520/MathModelAgent -a codex
```

你也可以手动将包含 `SKILL.md` 的技能文件夹放置于以下目录：
- **项目级目录**：`<项目根目录>/.codex/skills/<技能名>/SKILL.md` 或 `.agents/skills/<技能名>/SKILL.md`
- **用户全局目录**：`~/.codex/skills/<技能名>/SKILL.md`

## 3. 实验复现与建模典型用法

启动 `codex` 后，直接指定本地数据或开源论文代码目录，让它按科研规范执行：

```text
请使用已加载的科研技能检查当前目录下的实验代码，整理缺失依赖清单、固定全部随机种子，针对 dataset.csv 运行基线回归与稳健性检验，并将三线表结果导出为 tables/main_result.tex。
```

> [!TIP]
> **安全沙箱模式提示**：Codex 默认在受控目录权限下运行代码，首次执行 Python / R 绘图脚本时会请求你确认运行权限，按回车批准即可在本地直接生成高清图表。
