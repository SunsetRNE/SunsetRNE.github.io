# 🔄 Fork 上游监控与自动同步

> 我 fork 了很多上游项目（48 个）。这里实时监控它们与上游的同步状态，
> 每天由 GitHub Actions 自动同步 + 生成报告，无需手动维护。

## 📊 监控面板

<GitHubForks />

## ⚙️ 工作原理

```
每天 UTC 02:00（北京时间 10:00）
        ↓
GitHub Actions (Sync Forks)
        ↓
遍历所有 fork → clone → fetch upstream → merge → push
        ↓
生成监控报告 fork-status.json → 推回本仓库
        ↓
本站实时显示（数据同域读取，无 API 限流问题）
```

- **已同步 ✅**：与上游保持一致，或本次已自动拉取最新代码
- **冲突跳过 ⚠️**：fork 有本地修改与上游冲突，需要手动处理（GitHub 网页上的 Sync fork 按钮）
- **失败 ❌**：clone/fetch/push 出错，检查网络或权限

## 🔧 手动触发一次同步

去 [Actions → Sync Forks](https://github.com/SunsetRNE/SunsetRNE.github.io/actions/workflows/sync-forks.yml) 点 **Run workflow**。

> 💡 数据说明：监控报告每天生成一次；上游最后更新时间来自 GitHub API。