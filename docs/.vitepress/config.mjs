import { defineConfig } from "vitepress";
import mdAutoSpacing from "markdown-it-autospace";

// ============================================================
// ⚙️ SunsetRNE 个人工作站配置
// ============================================================

const USERNAME = "SunsetRNE";
const SITE = `https://${USERNAME}.github.io`;

export default defineConfig({
  lang: "zh-CN",
  title: "SunsetRNE",
  description: "Android 内核构建 · 开源折腾者——骁龙内核自动构建器与各种小项目",

  cleanUrls: true, // 生成 /about 而不是 /about.html
  lastUpdated: true, // 页面底部显示最后更新时间

  sitemap: {
    hostname: SITE, // 自动生成 sitemap.xml，利于 SEO
  },

  head: [
    // 网站图标（替换 docs/public/favicon.svg 即可换图标）
    ["link", { rel: "icon", href: "/favicon.svg" }],

    // 字体：中文用 MiSans，等宽用 JetBrains Mono（CDN 引入，无需打包）
    ["link", { rel: "preconnect", href: "https://cdn.jsdelivr.net/" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/misans@4.0.0/lib/Normal/MiSans.min.css",
      },
    ],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/jetbrains-mono-webfont@latest/jetbrains-mono.css",
      },
    ],
    // Remixicon 图标库
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/remixicon@4.9.1/fonts/remixicon.css",
      },
    ],

    // ---------- SEO 元信息（分享链接时显示漂亮卡片） ----------
    ["meta", { name: "robots", content: "index, follow" }],
    ["meta", { name: "author", content: "SunsetRNE" }],
    ["meta", { name: "keywords", content: "SunsetRNE, Android, 内核构建, GitHub, 个人主页, 开发者" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "SunsetRNE" }],
    ["meta", { property: "og:title", content: "SunsetRNE - 个人工作站" }],
    ["meta", { property: "og:description", content: "Android 内核构建 · 开源折腾者——骁龙内核自动构建器与各种小项目" }],
    ["meta", { property: "og:url", content: SITE }],
    ["meta", { property: "og:image", content: `${SITE}/avatar.png` }],
    ["meta", { name: "twitter:card", content: "summary" }],
    ["meta", { name: "twitter:title", content: "SunsetRNE - 个人工作站" }],
    ["meta", { name: "twitter:description", content: "Android 内核构建 · 开源折腾者——骁龙内核自动构建器与各种小项目" }],
    ["meta", { name: "twitter:image", content: `${SITE}/avatar.png` }],
  ],

  themeConfig: {
    // 顶部导航
    nav: [
      { text: "首页", link: "/" },
      { text: "现在", link: "/now" },
      { text: "关于我", link: "/about" },
      { text: "项目", link: "/projects" },
      { text: "工具箱", link: "/tools" },
      { text: "博客", link: "/blog" },
    ],

    // 右上角社交图标（支持 github / x / telegram / linkedin 等内置图标）
    socialLinks: [
      { icon: "github", link: `https://github.com/${USERNAME}` },
      // { icon: "telegram", link: "https://t.me/你的用户名" },
      // { icon: "x", link: "https://x.com/你的用户名" },
    ],

    // 页脚
    footer: {
      message: "用 ❤️ 和 VitePress 构建",
      copyright: "Copyright © 2025 SunsetRNE",
    },

    // 文档页右侧目录层级
    outline: {
      level: [2, 3],
    },

    // 返回顶部按钮
    returnToTopLabel: "回到顶部",
    sidebarMenuLabel: "菜单",
    darkModeSwitchLabel: "主题",
    lightModeSwitchTitle: "切换到浅色模式",
    darkModeSwitchTitle: "切换到深色模式",
  },

  markdown: {
    config: (md) => {
      // 中文与英文/数字之间自动加空格（pangu 排版，参考 ReSukiSU）
      md.use(mdAutoSpacing, {
        pangu: true,
        mojikumi: true,
        spacingItems: ["code_inline"],
      });
    },
  },
});