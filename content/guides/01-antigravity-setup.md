---
slug: antigravity-setup
order: 1
group: 保姆级装机图文教程
agent: antigravity
card_title: 🚀 Google Antigravity 教程
card_desc: 可视化双栏界面 · 零基础最友好 · 原生支持 Skills
badge: 新手首选
title: Google Antigravity 零基础安装与第一个科研 Skill 挂载教程
summary: 手把手教你在 macOS 与 Windows 安装 Google Antigravity，配置本地 .agents/skills 目录，5 分钟跑通文献精读与科研绘图技能。
updated: 2026-11-28
reading_time: 4 分钟
---

相比纯黑框终端工具，**Google Antigravity** 自带直观的可视化文件树、右侧文档实时预览与内置终端，非常适合第一次接触 AI Agent 的本硕博同学用来精读 PDF 论文、自动运行 Python 画 300 DPI 顶刊统计图、改写 LaTeX 或 Word 论文。

## 1. 下载安装客户端与初始化环境

前往 Google Antigravity 官方下载页获取对应系统安装包（macOS 支持 Apple Silicon 与 Intel，Windows 支持 Win10/11 64 位），像安装普通软件一样拖入应用程序或双击完成安装。

为后续能够使用一行命令安装全站开源 Skills，建议同时确保电脑已安装 **Node.js（v20 及以上）**。打开 Antigravity 底部内置终端（快捷键 ``Ctrl + ` ``），验证环境是否就绪：

```bash
node -v && npm -v
```

若国内校园网下载依赖较慢，可先设置国内淘宝 npm 镜像源（只需执行一次，永久生效）：

```bash
npm config set registry https://registry.npmmirror.com
```

## 2. 两种方式把科研 Skills 装进 Antigravity

先在电脑上新建一个专门存放你当前课题或论文的文件夹（例如 `My-Paper-2026`），在 Antigravity 中点击 **File → Open Folder** 打开该文件夹。

### 方式一：使用官方 Skills CLI 一键安装（最推荐）

在本站找到心仪的仓库后，直接复制详情页的安装命令粘贴进终端回车，工具会自动识别 Antigravity 并挂载到当前项目或全局目录：

```bash
npx skills add Imbad0202/academic-research-skills
```

如果只想从几百个技能的大合集（如 `K-Dense-AI/scientific-agent-skills`）里单独安装某 1 个子技能（例如单细胞分析 `scanpy`），加上 `--skill` 参数即可避免撑爆上下文：

```bash
npx skills add K-Dense-AI/scientific-agent-skills --skill scanpy
```

### 方式二：手动放置文件夹（网络受限备选）

Antigravity 会自动扫描以下两个标准路径中的 `SKILL.md` 文件：
- **当前论文项目专属技能**：`<你的论文文件夹>/.agents/skills/<技能名>/SKILL.md`
- **全局跨项目通用技能**：`~/.agents/skills/<技能名>/SKILL.md`（Windows 位于 `C:\Users\<用户名>\.agents\skills\`）

你只需将从 GitHub 下载的包含 `SKILL.md` 的技能文件夹放入上述目录，Antigravity 右侧面板即可自动识别加载。

## 3. 在论文目录发送第一句科研指令

把你的英文参考文献 `paper.pdf` 或实验数据 `results.csv` 放进当前打开的文件夹中，直接在 Antigravity 对话框输入自然语言指令：

```text
请调用刚安装的科研技能，精读当前目录下的 paper.pdf，按“核心研究假设、方法创新、实验数据结论、方法局限性”整理一份 Markdown 组会汇报笔记保存到 notes.md。
```

Agent 会自动读取本地 PDF、遵守该 Skill 预设的严谨学术规范完成拆解，并将结果直接写入本地文件。

## 4. 常见安装报错排查（FAQ）

- **终端提示 `command not found: npx`**：说明电脑尚未安装 Node.js，前往 `nodejs.org` 下载 LTS 长期支持版安装后重启 Antigravity 即可。
- **执行 `npx skills add` 卡住不动**：校园网直连 GitHub 超时，可在命令前加上镜像参数：`npx --registry=https://registry.npmmirror.com skills add <仓库名>`，或开启稳定网络环境后重试。
