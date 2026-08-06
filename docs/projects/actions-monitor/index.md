---
title: Actions 监控
description: 全账号 GitHub Actions 运行状态挂屏监控
navbar: false
sidebar: false
aside: false
footer: false
lastUpdated: false
pageClass: monitor-page
---

# ⚡ Actions 监控

全账号 GitHub Actions 运行状态挂屏监控面板：55 个公开仓库的状态网格、失败置顶、5 分钟自动刷新。专为平板挂屏设计，扫一眼就知道哪些流水线挂了。

<ActionsMonitor />

::: tip 说明
- 快照由 [Actions Monitor](https://github.com/SunsetRNE/SunsetRNE.github.io/actions/workflows/actions-monitor.yml) workflow 每 **30 分钟**扫描一次全账号公开仓库的最近 2 条 runs
- 页面每 **5 分钟**自动刷新；状态无变化时快照保持不动（说明一切正常）
- 失败细节 GitHub 会自动邮件通知，这里只管"挂屏一眼看到红的就是挂了"
- 每张卡片点击直达对应 workflow run 页面，便于排查
:::
