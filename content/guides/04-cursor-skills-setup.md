---
slug: cursor-skills-setup
order: 4
group: 客户端可视化教程
card_title: Cursor 桌面客户端
badge: 改稿最直观
card_desc: 左看论文右对话 · 红绿对比逐句点选接受修改
title: Cursor 桌面客户端零基础安装与双栏改论文配置指南
summary: 双击安装即用：左边实时看论文原稿、右边中文对话框发指令，教你零命令行在 Cursor 客户端挂载科研 Skills 并可视化逐段润色论文。
reading_time: 3 分钟
updated: 2026-11-28
---

如果你经常写 **LaTeX / Markdown 论文**，或者希望在修改论文与实验脚本时**清楚看到 AI 到底改了哪几个词**，**Cursor 桌面客户端**是非常顺手的可视化工作台：左边是你的论文正文，右边是 AI Agent 聊天窗，所有润色都会以红绿对照呈现，鼠标点选「接受」或「退回」即可。

## 1. 下载安装客户端并打开课题文件夹

1. 前往 [cursor.com](https://cursor.com) 下载对应 macOS 或 Windows 的桌面安装包，双击一键安装并登录账号。
2. 点击欢迎页中间的 **Open Project（打开项目）**，直接选中你存放论文初稿（`.tex` / `.md` / `.docx`）与图表的文件夹。
3. 按快捷键 `Cmd + I`（Windows 按 `Ctrl + I`）或点击右上角侧栏开关，确保右侧 **Agent 对话面板**处于打开状态，模式选择默认的 **Agent**。

## 2. 零命令行挂载本站科研 Skills

Cursor 客户端原生支持 `.cursor/skills/` 与 `.agents/skills/` 目录规范，全程在界面内即可装好：

### 方法一：直接让右侧 Agent 对话框自动下载挂载（推荐）

复制下面这句话（可替换成本站任意 Skill 的 GitHub 链接）粘贴到右侧 Agent 聊天框回车发送：

```text
请帮我把这个科研 Skill 仓库下载放到当前项目的 .cursor/skills/ 文件夹中，装好后告诉我包含哪些可用技能：https://github.com/Yuan1z0825/nature-skills
```

点击对话流里弹出的运行确认按钮，Cursor 就会自动创建好目录并拉取全部规则文件。

### 方法二：客户端设置面板或鼠标拖拽

1. 打开 `Cursor Settings（设置） → Rules & Skills`，可直接查看当前项目已识别到的全部本地 Skills 开关。
2. 也可以在 GitHub 页面点击 **Download ZIP** 解压后，用鼠标把含 `SKILL.md` 的文件夹直接拖进左侧文件树的 `.cursor/skills/` 目录中。

## 3. 左看原稿、右发指令：可视化逐句改论文

在右侧聊天框输入 `@` 选中你的论文文件与想要调用的科研技能，发送具体指令：

```text
请结合 @nature-skills 里的科研绘图与学术写作规范，检查并润色 @main.tex 的 Results 章节：消除口语化句式，统一图表引用格式，但不要改动任何实验数值与公式符号。
```

生成完毕后，左侧正文会自动浮现清晰的**红绿修订对比条**：觉得改得好的句子点击绿色 **Accept**，想保留原意的地方点击 **Reject**，审稿返修与毕业论文定稿效率极高。
