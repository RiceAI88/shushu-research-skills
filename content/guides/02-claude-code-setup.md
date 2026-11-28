---
slug: claude-code-setup
order: 2
group: 保姆级装机图文教程
agent: claude-code
card_title: ✴️ Claude Code 保姆级安装
card_desc: 学术长文逻辑、审稿返修与复杂代码天花板
badge: 硕博最爱
title: Claude Code 国内安装、账号配置与学术论文实战指南
summary: 详解 macOS / Windows 下安装 Claude Code、配置 ~/.claude/skills 技能目录、解决网络与账号订阅问题，高效完成文献综述与审稿返修。
updated: 2026-11-28
reading_time: 5 分钟
---

**Claude Code** 是 Anthropic 官方推出的终端原生 AI Agent，也是目前全球开源科研 Skills 生态支持度最高、长论文逻辑严密性与审稿返修表现最强的宿主工具。

## 1. 环境准备与一行命令安装

Claude Code 运行依赖 **Node.js 18+**（Windows 用户建议配合 PowerShell 7 或 WSL2 使用体验更佳）。打开电脑终端（macOS `Terminal` 或 Windows `PowerShell`），使用国内镜像源极速全局安装：

```bash
npm install -g @anthropic-ai/claude-code --registry=https://registry.npmmirror.com
```

安装完成后，检查版本号确认安装成功：

```bash
claude --version
```

## 2. 进入论文文件夹启动并完成账号配置

在终端切换（`cd`）到你的论文或实验代码目录，输入 `claude` 启动交互界面：

```bash
cd ~/Documents/My-Research-Paper
claude
```

首次启动会引导完成账号授权（支持 **Claude Pro / Max 订阅账号登录**，或通过环境变量 `ANTHROPIC_API_KEY` 接入按量 API 额度）：
- **日常高频改论文、写实验脚本**：优先选择包月订阅制账号，不用担心长篇 PDF 多轮对话消耗 Token；
- **批量处理百篇文献或跑自动化管线**：适合搭配按量计费 API Key。

## 3. 在 Claude Code 中安装与管理科研 Skills

Claude Code 原生支持标准 `SKILL.md` 技能目录与 `/plugin` 插件机制：

### 方法 A：通过 Skills CLI 自动挂载到 Claude Code

在系统终端（注意不是在 Claude 对话框内）运行：

```bash
npx skills add Imbad0202/academic-research-skills -a claude-code
```

### 方法 B：通过 Claude 对话框内 `/plugin` 命令安装

部分仓库支持插件市场语法，启动 `claude` 后直接在输入框发送以 `/` 开头的命令（详情页会明确标注“在 AI Agent 对话框内输入”）：

```text
/plugin marketplace add K-Dense-AI/scientific-agent-skills
```

### 方法 C：本地技能文件夹存放路径

- **仅对当前课题生效**：`<课题根目录>/.claude/skills/<技能名>/SKILL.md`
- **对本机所有课题生效**：`~/.claude/skills/<技能名>/SKILL.md`

## 4. 科研高频实战技巧

1. **配合 `CLAUDE.md` 固定目标期刊体例**：在论文根目录建一个 `CLAUDE.md`，写明目标投稿期刊（如 *Nature Communications* 或《经济研究》）、引文格式与禁用词汇，Claude Code 每次调用写作 Skill 都会严格遵循。
2. **保护原始实验数据**：在发起润色或代码重构前，先运行 `git init && git commit -am "backup"`，所有改动一目了然、随时可回退。
