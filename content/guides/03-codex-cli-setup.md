---
slug: codex-cli-setup
order: 3
group: 客户端可视化教程
card_title: OpenAI Codex 客户端
badge: 数理实验强
card_desc: 桌面端直连 ChatGPT 账号 · 免配环境
title: OpenAI Codex 客户端（桌面 App & 图形扩展）零基础安装与实战指南
summary: 告别繁琐命令行与 API Key 配置：直接安装 OpenAI 官方 Codex 桌面客户端或可视化扩展，一键登录 ChatGPT 账号即可跑通数理建模、统计检验与科研绘图 Skills。
reading_time: 4 分钟
updated: 2026-11-28
---

**OpenAI Codex** 在数学公式推导、实证统计回归、复杂实验代码复现上表现极稳。过去很多教程只教怎么在黑框终端里装命令行，其实 OpenAI 已经推出了**官方 Codex 桌面客户端与 IDE 可视化面板**——**直接用你平时的 ChatGPT 账号点一下就能登录，全程不需要敲命令、也不需要申请 API Key**。

## 1. 安装 OpenAI Codex 可视化客户端（二选一）

### 方式一：安装 OpenAI Codex 独立桌面客户端（最简洁直观）

1. 下载并安装官方 **Codex Desktop 客户端**（macOS 可直接下载 Codex App 或通过 ChatGPT 桌面客户端开启工作区；Windows 用户推荐直接使用下方方式二官方图形扩展或 Windows 桌面预览版）。
2. 打开客户端后点击 **Sign in with ChatGPT**，浏览器自动跳转登录你的 ChatGPT Plus / Pro / Team / Edu 账号即可直接激活，**零 API Key 配置**。
3. 点击界面左上角的 **Open Project / 添加文件夹**，选中你存放实验数据、代码或论文的本地文件夹。

### 方式二：在 VS Code / Cursor 中一键安装「Codex」官方图形面板（全平台通用）

1. 打开 VS Code（Windows 与 macOS 均完全免费），点击左侧扩展商店图标（**Extensions**）。
2. 搜索 **OpenAI Codex**（认准 OpenAI 官方发布），点击 **Install** 按钮完成安装。
3. 点击左侧栏新增的 **Codex 图标**呼出图形对话侧边栏，点击 **Sign in with ChatGPT** 完成网页授权，即可在可视化界面里多任务并行跑实验、看图表、点选应用修改。

> [!TIP]
> Codex 客户端内置了清晰的**可视化审批卡片**：每当它准备读取数据表、生成统计图或保存脚本时，界面上都会直观列出改动预览，你点一下确认即可安全执行。

## 2. 零命令行把科研 Skills 装入 Codex 客户端

Codex 客户端原生识别工作区下的 `.agents/skills/` 目录，同样不需要你自己打开终端敲命令：

### 方法一：在 Codex 客户端聊天框发一句话自动安装（推荐）

从本站挑好需要的科研 Skill 后，直接把下面这句话（替换成你想装的仓库地址）发进 Codex 客户端对话框：

```text
请帮我把这个 GitHub 仓库里的科研技能下载并配置到当前项目的 .agents/skills/ 文件夹中：https://github.com/K-Dense-AI/scientific-agent-skills
```

在客户端弹出的网络与写入请求框点击 **Approve（批准）**，Codex 就会自动把技能包下载整理到位。

### 方法二：浏览器下载 ZIP 拖入文件夹

打开该 Skill 的 GitHub 页面，点击 **Code → Download ZIP** 解压到本地，直接用鼠标把含 `SKILL.md` 的文件夹拖进课题文件夹下的 `.agents/skills/` 目录即可。

## 3. 在客户端里跑通数据分析与论文配图

打开你的实验数据文件夹后，直接在 Codex 客户端输入框里拖入表格或点名文件，发送中文需求：

```text
请使用已安装的科学数据分析与绘图技能，读取当前文件夹下的 experiment.csv：先做正态性与组间显著性检验并汇总成三线表，再生成一张期刊投稿级高清箱线散点组合图（保存为 figure1.pdf 和可复现脚本）。
```

完成后，你可以在客户端右侧直接点开生成的 PDF 矢量图查看效果；如果字号或配色想调，直接用中文追问「把图例移到右上角、改成色盲友好蓝橙配色」，客户端会立即重新出图。
