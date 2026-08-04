# My Personal Site 🚀

基于 **VitePress** 的 GitHub 个人展示页，方案参考 [ReSukiSU.github.io](https://github.com/ReSukiSU/ReSukiSU.github.io)。
写 Markdown → push 到 GitHub → Actions 自动构建 → 免费上线 GitHub Pages，**零服务器成本**。

## 项目结构

```
.
├── .github/workflows/deploy.yml   # 自动构建 + 部署流水线
├── docs/                          # 站点源码（Markdown + 配置）
│   ├── index.md                   # 首页（hero + 特性卡片）
│   ├── about.md                   # 关于我
│   ├── projects.md                # 项目展示
│   ├── blog.md                    # 博客列表
│   ├── blog/posts/                # 文章目录
│   ├── public/                    # 静态资源（头像、图标）
│   └── .vitepress/
│       ├── config.mjs             # ★ 全站配置（改这里）
│       └── theme/                 # 自定义样式
├── package.json
└── bun.lock（bun install 后生成）
```

## 🚀 三步上线

### 第 1 步：创建仓库（名字必须是这个！）

GitHub Pages 个人站要求仓库名**必须等于 `你的用户名.github.io`**：

1. GitHub → New repository → 名字填 `你的用户名.github.io`（例如 `zhangsan.github.io`）
2. Public，不要勾选 README（保持空仓库，方便直接 push）

> ⚠️ 仓库名不对 → 页面无法上线。这是唯一硬性要求。

### 第 2 步：改配置、填内容

把本项目文件放进仓库后，只需修改 **2 个文件**：

| 文件 | 改什么 |
| --- | --- |
| `docs/.vitepress/config.mjs` | `USERNAME` 改成你的 GitHub 用户名；`title`/`description` 改成你的名字和简介；社交链接换成你的 |
| `docs/index.md` | hero 里的名字、标签、按钮链接；6 个特性卡片改成你的技术方向 |

可选：`docs/about.md`（自我介绍）、`docs/projects.md`（项目）、`docs/blog.md`（博客）、`docs/public/avatar.svg`（头像）。

### 第 3 步：push，等 1 分钟

```bash
git add .
git commit -m "feat: init personal site"
git push origin main
```

然后：

1. 打开仓库 → **Settings → Pages** → Source 选 **GitHub Actions**（Actions 会自动帮你构建部署）
2. 打开 **Actions** 标签页看流水线跑完（绿色 ✅）
3. 访问 `https://你的用户名.github.io` 🎉

以后每次 push 修改，网站自动更新。

## 💻 本地开发

```bash
bun install        # 安装依赖（没有 bun 就先装：curl -fsSL https://bun.sh/install | bash）
bun run docs:dev   # 本地预览 http://localhost:5173（改代码实时刷新）
bun run docs:build # 构建产物在 docs/.vitepress/dist
```

## 🔧 自定义速查

- **主题色**：改 `docs/.vitepress/theme/custom.css` 里的 `--vp-c-brand-1/2/3`
- **字体**：默认中文 MiSans + 等宽 JetBrains Mono（CDN），在 `config.mjs` 的 `head` 里换
- **图标**：首页特性卡片用 Remixicon，去 [remixicon.com](https://remixicon.com) 挑，把 `ri-xxx` 替换掉
- **SEO**：`config.mjs` 里的 og:/twitter: 标签，改完分享链接就有漂亮卡片
- **自定义域名**：买好域名后在 `docs/public/` 放 `CNAME` 文件，或到仓库 Settings → Pages 里配

## 💡 进阶玩法（以后再说）

- **自动列项目**：构建时调用 GitHub API 生成项目列表（`repos.json` 思路）
- **站内搜索**：加 `vitepress-plugin-pagefind`（ReSukiSU 同款，中文分词优化）
- **llms.txt**：加 `vitepress-plugin-llms`，让 AI 也能读懂你的站
- **Profile README**：再建一个 `你的用户名/你的用户名` 仓库放 README，GitHub 主页也会很酷（和本站不冲突，可同时拥有）

## 📄 License

MIT
