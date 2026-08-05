import { defineConfig } from "vitepress";
import mdAutoSpacing from "markdown-it-autospace";
import { withMermaid } from "vitepress-plugin-mermaid";
import { GitChangelog } from "@nolebase/vitepress-plugin-git-changelog";
import footnote from "markdown-it-footnote";
import taskLists from "markdown-it-task-lists";
import mdKatex from "markdown-it-katex";
import lightbox from "vitepress-plugin-lightbox";
import { tabsMarkdownPlugin } from "vitepress-plugin-tabs";

// ============================================================
// ⚙️ SunsetRNE 个人工作站配置
// ============================================================

const USERNAME = "SunsetRNE";
const SITE = `https://${USERNAME}.github.io`;

export default withMermaid(defineConfig({
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
    // 更新时间前缀（默认英文 "Last updated"）
    lastUpdatedText: "最后更新于",

    // 本地全文搜索（VitePress 内置 local provider，基于 minisearch）
    search: {
      provider: "local",
      options: {
        translations: {
          button: { buttonText: "搜索", buttonAriaLabel: "搜索" },
          modal: {
            noResultsText: "未找到相关结果",
            resetButtonTitle: "清除搜索条件",
            footer: { selectText: "选择", navigateText: "切换", closeText: "关闭" },
          },
        },
      },
    },

    // 顶部导航
    nav: [
      { text: "首页", link: "/" },
      { text: "现在", link: "/now" },
      { text: "关于我", link: "/about" },
      { text: "项目", link: "/projects" },
      { text: "上游监控", link: "/upstream" },
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
      message: "能跑就行 🏃",
      copyright: "Copyright © 2026 SunsetRNE",
    },

    // 文档页右侧目录层级
    outline: {
      level: [2, 3],
      label: "本页目录", // 右侧目录标题（默认英文 "On this page"）
    },

    // 404 页面文案（默认英文）
    notFound: {
      title: "页面走丢了",
      quote: "这个页面不存在，可能链接写错了，或者内容被移动了。",
      linkLabel: "回到首页",
      linkText: "返回首页",
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
      // 脚注、任务列表、KaTeX 数学公式、图片灯箱、选项卡
      md.use(footnote);
      md.use(taskLists, { enabled: true, label: true });
      md.use(mdKatex);
      md.use(lightbox, {});
      md.use(tabsMarkdownPlugin);
    },
  },

  // ---------- 第三方插件 ----------
  vite: {
    plugins: [
      GitChangelog({
        repoURL: "https://github.com/SunsetRNE/SunsetRNE.github.io",
      }),
    ],
    ssr: {
      // nolebase 插件 dist 内含 .vue 源文件，需交给 Vite 处理而非 node 直接加载
      noExternal: [
        "@nolebase/vitepress-plugin-enhanced-readabilities",
        "@nolebase/vitepress-plugin-git-changelog",
      ],
    },
  },
}));