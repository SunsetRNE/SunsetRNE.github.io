# 🌅 SunsetRNE.github.io

我的个人工作站，基于 **VitePress** 构建，托管于 GitHub Pages。

> Android 内核构建 · 开源折腾者
> 从骁龙内核自动构建器到各种小项目——喜欢折腾，也喜欢把过程记录下来。

## ✨ 特性

- 🚀 **全自动部署**：push 到 main 分支 → GitHub Actions 自动构建 → 秒级上线
- 📡 **GitHub 动态**：首页组件实时拉取 GitHub API，仓库/Star 自动更新
- 📝 **纯 Markdown 写作**：改文章 = 改一个 `.md` 文件
- 🌓 深色/浅色主题 · 📱 响应式 · 🔍 SEO 全套

## 🗂️ 站点结构

| 页面 | 说明 |
| --- | --- |
| `/` | 首页：简介 + 特性卡片 + GitHub 动态 |
| `/now` | 现在在做什么（定期更新） |
| `/about` | 关于我 |
| `/projects` | 项目展示 |
| `/tools` | 工具箱（常用资源聚合） |
| `/blog` | 博客 |

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