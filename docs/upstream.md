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
遍历所有 fork → 调用 GitHub 官方 merge-upstream API（服务端同步，等同网页 Sync fork 按钮）
        ↓
API 被拒（422/403）→ 自动降级 git clone 兜底：clone → fetch upstream → merge → push
        ↓
生成监控报告 fork-status.json → 推回本仓库
        ↓
本站实时显示（数据同域读取，无 API 限流问题）
```

- **已同步 ✅**：与上游保持一致，或本次已自动拉取最新代码
- **冲突跳过 ⚠️**：fork 有本地修改与上游冲突（git 兜底也无法自动合并），需要手动处理（GitHub 网页上的 Sync fork 按钮）
- **失败 ❌**：API 与 git 兜底都失败（网络/权限问题），报告里会附详细原因

面板小技巧：
- **分类筛选**：每个 fork 按"存在的意义"标注（Root方案/内核源码/CI产物/模块框架/编译依赖/代理网络/AI工具/工具脚本）
- **编译依赖自动跳过**：toolchain/ccache/manifest/AnyKernel 等因编译而存在的仓库自动标记"⏭️ 无需同步"，不参与同步
- **排序**可切换「名称 / 上游活跃度」（按上游最后更新时间）
- **上游活跃**列显示相对时间（X 分钟/小时/天前）
- 冲突/失败仓库显示**落后约 X 天**（上游更新与 fork 的差距）
- **📈 趋势图**：近 14 次同步的 同步/冲突/失败 堆叠柱状图

## 🔧 手动触发一次同步

去 [Actions → Sync Forks](https://github.com/SunsetRNE/SunsetRNE.github.io/actions/workflows/sync-forks.yml) 点 **Run workflow**。

> 💡 数据说明：监控报告每天生成一次；上游最后更新时间来自 GitHub API。