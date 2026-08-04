# 🌅 SunsetRNE.github.io

我的个人工作站：VitePress 驱动的 GitHub Pages 站点 + **Fork 上游自动同步监控**。

> Android 内核构建 · 开源折腾者

## ✨ 功能

| 功能 | 说明 |
| --- | --- |
| 🚀 全自动部署 | push → GitHub Actions 构建 → 秒级上线 |
| 📡 GitHub 动态 | 首页实时拉取 GitHub API，仓库/Star 自动更新 |
| 🔄 **Fork 自动同步** | 每天自动同步 48 个 fork 仓库的上游更新（clone → merge → push） |
| 📊 **上游监控面板** | `/upstream` 页面实时显示每个 fork 的同步状态（已同步/冲突/失败） |
| 🗓️ Now 页面 | 公开"现在在做什么"，定期更新 |
| 🧰 工具箱 | 常用工具/资源聚合页 |
| 📝 博客 | 纯 Markdown 写作，随写随发 |

## 🗂️ 站点结构

| 页面 | 说明 |
| --- | --- |
| `/` | 首页：简介 + 特性卡片 + GitHub 动态 |
| `/now` | 现在在做什么 |
| `/about` | 关于我 |
| `/projects` | 项目展示 |
| `/upstream` | **Fork 上游监控面板** |
| `/tools` | 工具箱 |
| `/blog` | 博客 |

## 🔄 Fork 自动同步架构

```
每天 UTC 02:00（北京时间 10:00）
        ↓
.github/workflows/sync-forks.yml（GitHub Actions）
        ↓
.github/scripts/sync_forks.py
 遍历所有 fork → clone → fetch upstream → merge → push
        ↓
生成 docs/public/fork-status.json → 推回仓库
        ↓
/upstream 页面实时展示（同域读取，无 API 限流）
```

### 启用自动同步（一次性配置）

1. 生成 PAT：GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
   - 权限：`Contents: Read and write`（或直接选 repo 全权限）
   - 有效期按需设置
2. 存到仓库：本仓库 **Settings → Secrets and variables → Actions → New repository secret**
   - 名称：`SYNC_TOKEN`，值：上一步的 token
3. 手动跑一次验证：**Actions → Sync Forks → Run workflow**

之后每天自动同步 + 更新监控报告；也可以随时手动触发。

## 🛠️ 本地开发

```bash
bun install        # 或 npm install / pnpm install
bun run docs:dev   # 本地预览 http://localhost:5173
bun run docs:build # 构建产物在 docs/.vitepress/dist
```

## 🚀 部署

push 即可，`.github/workflows/deploy.yml` 自动完成构建 + 发布：

```bash
git add .
git commit -m "update"
git push origin main
```

## 📄 License

MIT