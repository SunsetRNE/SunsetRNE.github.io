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

全账号 GitHub Actions 运行状态挂屏监控面板：55 个公开仓库的状态网格、失败置顶、自适应刷新。专为平板挂屏设计，扫一眼就知道哪些流水线挂了。

<ActionsMonitor />

::: tip 说明
- 快照由 [Actions Monitor](https://github.com/SunsetRNE/SunsetRNE.github.io/actions/workflows/actions-monitor.yml) workflow 扫描生成：每 **5 分钟**启动一个 job，job 内部每 **60 秒**循环扫描（存在运行中流水线时连扫最多 4 轮，静止立即退出）
- 数据推送至独立数据仓库 [actions-data](https://github.com/SunsetRNE/actions-data)（纯 JSON，Pages 无构建直发，**不触发主站编译**），页面从这里读取
- 页面**自适应刷新**：有运行中流水线时 60 秒，全部静止时 5 分钟
- 失败细节 GitHub 会自动邮件通知，这里只管"挂屏一眼看到红的就是挂了"
- 每张卡片点击直达对应 workflow run 页面，便于排查
- 主站静态快照作为兜底：数据仓库不可达时自动回退
:::
