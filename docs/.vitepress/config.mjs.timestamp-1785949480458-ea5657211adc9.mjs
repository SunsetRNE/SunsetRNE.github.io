// docs/.vitepress/config.mjs
import { defineConfig } from "file:///data/user/0/com.ai.assistance.operit/files/workspace/SunsetRNE.GitHub.io/node_modules/.pnpm/vitepress@1.6.3_@algolia+client-search@5.56.0_less@4.8.1_postcss@8.5.25_search-insights@2.17.3/node_modules/vitepress/dist/node/index.js";
import mdAutoSpacing from "file:///data/user/0/com.ai.assistance.operit/files/workspace/SunsetRNE.GitHub.io/node_modules/.pnpm/markdown-it-autospace@1.1.4/node_modules/markdown-it-autospace/index.js";
import { withMermaid } from "file:///data/user/0/com.ai.assistance.operit/files/workspace/SunsetRNE.GitHub.io/node_modules/.pnpm/vitepress-plugin-mermaid@2.0.17_mermaid@11.16.0_vitepress@1.6.3_@algolia+client-search@_350da4b807fe40e21ba47e0e45ada0bc/node_modules/vitepress-plugin-mermaid/dist/vitepress-plugin-mermaid.es.mjs";
import { GitChangelog } from "file:///data/user/0/com.ai.assistance.operit/files/workspace/SunsetRNE.GitHub.io/node_modules/.pnpm/@nolebase+vitepress-plugin-git-changelog@2.18.2_vitepress@1.6.3_@algolia+client-search@_de341dbfac824c0aa4513e8d3e3fdff0/node_modules/@nolebase/vitepress-plugin-git-changelog/dist/vite/index.mjs";
import footnote from "file:///data/user/0/com.ai.assistance.operit/files/workspace/SunsetRNE.GitHub.io/node_modules/.pnpm/markdown-it-footnote@4.0.0/node_modules/markdown-it-footnote/index.mjs";
import taskLists from "file:///data/user/0/com.ai.assistance.operit/files/workspace/SunsetRNE.GitHub.io/node_modules/.pnpm/markdown-it-task-lists@2.1.1/node_modules/markdown-it-task-lists/index.js";
import mdKatex from "file:///data/user/0/com.ai.assistance.operit/files/workspace/SunsetRNE.GitHub.io/node_modules/.pnpm/markdown-it-katex@2.0.3/node_modules/markdown-it-katex/index.js";
import lightbox from "file:///data/user/0/com.ai.assistance.operit/files/workspace/SunsetRNE.GitHub.io/node_modules/.pnpm/vitepress-plugin-lightbox@1.0.3/node_modules/vitepress-plugin-lightbox/dist/index.js";
import { tabsMarkdownPlugin } from "file:///data/user/0/com.ai.assistance.operit/files/workspace/SunsetRNE.GitHub.io/node_modules/.pnpm/vitepress-plugin-tabs@0.9.1_vitepress@1.6.3_@algolia+client-search@5.56.0_less@4.8.1_po_e52954bb36f067042234405ff6f10bd0/node_modules/vitepress-plugin-tabs/dist/node/index.js";
var USERNAME = "SunsetRNE";
var SITE = `https://${USERNAME}.github.io`;
var config_default = withMermaid(defineConfig({
  lang: "zh-CN",
  title: "SunsetRNE",
  description: "Android \u5185\u6838\u6784\u5EFA \xB7 \u5F00\u6E90\u6298\u817E\u8005\u2014\u2014\u9A81\u9F99\u5185\u6838\u81EA\u52A8\u6784\u5EFA\u5668\u4E0E\u5404\u79CD\u5C0F\u9879\u76EE",
  cleanUrls: true,
  // 生成 /about 而不是 /about.html
  lastUpdated: true,
  // 页面底部显示最后更新时间
  sitemap: {
    hostname: SITE
    // 自动生成 sitemap.xml，利于 SEO
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
        href: "https://cdn.jsdelivr.net/npm/misans@4.0.0/lib/Normal/MiSans.min.css"
      }
    ],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/jetbrains-mono-webfont@latest/jetbrains-mono.css"
      }
    ],
    // Remixicon 图标库
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://cdn.jsdelivr.net/npm/remixicon@4.9.1/fonts/remixicon.css"
      }
    ],
    // ---------- SEO 元信息（分享链接时显示漂亮卡片） ----------
    ["meta", { name: "robots", content: "index, follow" }],
    ["meta", { name: "author", content: "SunsetRNE" }],
    ["meta", { name: "keywords", content: "SunsetRNE, Android, \u5185\u6838\u6784\u5EFA, GitHub, \u4E2A\u4EBA\u4E3B\u9875, \u5F00\u53D1\u8005" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "SunsetRNE" }],
    ["meta", { property: "og:title", content: "SunsetRNE - \u4E2A\u4EBA\u5DE5\u4F5C\u7AD9" }],
    ["meta", { property: "og:description", content: "Android \u5185\u6838\u6784\u5EFA \xB7 \u5F00\u6E90\u6298\u817E\u8005\u2014\u2014\u9A81\u9F99\u5185\u6838\u81EA\u52A8\u6784\u5EFA\u5668\u4E0E\u5404\u79CD\u5C0F\u9879\u76EE" }],
    ["meta", { property: "og:url", content: SITE }],
    ["meta", { property: "og:image", content: `${SITE}/avatar.png` }],
    ["meta", { name: "twitter:card", content: "summary" }],
    ["meta", { name: "twitter:title", content: "SunsetRNE - \u4E2A\u4EBA\u5DE5\u4F5C\u7AD9" }],
    ["meta", { name: "twitter:description", content: "Android \u5185\u6838\u6784\u5EFA \xB7 \u5F00\u6E90\u6298\u817E\u8005\u2014\u2014\u9A81\u9F99\u5185\u6838\u81EA\u52A8\u6784\u5EFA\u5668\u4E0E\u5404\u79CD\u5C0F\u9879\u76EE" }],
    ["meta", { name: "twitter:image", content: `${SITE}/avatar.png` }]
  ],
  themeConfig: {
    // 本地全文搜索（VitePress 内置 local provider，基于 minisearch）
    search: {
      provider: "local",
      options: {
        translations: {
          button: { buttonText: "\u641C\u7D22", buttonAriaLabel: "\u641C\u7D22" },
          modal: {
            noResultsText: "\u672A\u627E\u5230\u76F8\u5173\u7ED3\u679C",
            resetButtonTitle: "\u6E05\u9664\u641C\u7D22\u6761\u4EF6",
            footer: { selectText: "\u9009\u62E9", navigateText: "\u5207\u6362", closeText: "\u5173\u95ED" }
          }
        }
      }
    },
    // 顶部导航
    nav: [
      { text: "\u9996\u9875", link: "/" },
      { text: "\u73B0\u5728", link: "/now" },
      { text: "\u5173\u4E8E\u6211", link: "/about" },
      { text: "\u9879\u76EE", link: "/projects" },
      { text: "\u4E0A\u6E38\u76D1\u63A7", link: "/upstream" },
      { text: "\u5DE5\u5177\u7BB1", link: "/tools" },
      { text: "\u535A\u5BA2", link: "/blog" }
    ],
    // 右上角社交图标（支持 github / x / telegram / linkedin 等内置图标）
    socialLinks: [
      { icon: "github", link: `https://github.com/${USERNAME}` }
      // { icon: "telegram", link: "https://t.me/你的用户名" },
      // { icon: "x", link: "https://x.com/你的用户名" },
    ],
    // 页脚
    footer: {
      message: "\u7528 \u2764\uFE0F \u548C VitePress \u6784\u5EFA",
      copyright: "Copyright \xA9 2026 SunsetRNE"
    },
    // 文档页右侧目录层级
    outline: {
      level: [2, 3]
    },
    // 返回顶部按钮
    returnToTopLabel: "\u56DE\u5230\u9876\u90E8",
    sidebarMenuLabel: "\u83DC\u5355",
    darkModeSwitchLabel: "\u4E3B\u9898",
    lightModeSwitchTitle: "\u5207\u6362\u5230\u6D45\u8272\u6A21\u5F0F",
    darkModeSwitchTitle: "\u5207\u6362\u5230\u6DF1\u8272\u6A21\u5F0F"
  },
  markdown: {
    config: (md) => {
      md.use(mdAutoSpacing, {
        pangu: true,
        mojikumi: true,
        spacingItems: ["code_inline"]
      });
      md.use(footnote);
      md.use(taskLists, { enabled: true, label: true });
      md.use(mdKatex);
      md.use(lightbox, {});
      md.use(tabsMarkdownPlugin);
    }
  },
  // ---------- 第三方插件 ----------
  vite: {
    plugins: [
      GitChangelog({
        repoURL: "https://github.com/SunsetRNE/SunsetRNE.github.io"
      })
    ],
    ssr: {
      // nolebase 插件 dist 内含 .vue 源文件，需交给 Vite 处理而非 node 直接加载
      noExternal: [
        "@nolebase/vitepress-plugin-enhanced-readabilities",
        "@nolebase/vitepress-plugin-git-changelog"
      ]
    }
  }
}));
export {
  config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiZG9jcy8udml0ZXByZXNzL2NvbmZpZy5tanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvZGF0YS91c2VyLzAvY29tLmFpLmFzc2lzdGFuY2Uub3Blcml0L2ZpbGVzL3dvcmtzcGFjZS9TdW5zZXRSTkUuR2l0SHViLmlvL2RvY3MvLnZpdGVwcmVzc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2RhdGEvdXNlci8wL2NvbS5haS5hc3Npc3RhbmNlLm9wZXJpdC9maWxlcy93b3Jrc3BhY2UvU3Vuc2V0Uk5FLkdpdEh1Yi5pby9kb2NzLy52aXRlcHJlc3MvY29uZmlnLm1qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vZGF0YS91c2VyLzAvY29tLmFpLmFzc2lzdGFuY2Uub3Blcml0L2ZpbGVzL3dvcmtzcGFjZS9TdW5zZXRSTkUuR2l0SHViLmlvL2RvY3MvLnZpdGVwcmVzcy9jb25maWcubWpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVwcmVzc1wiO1xuaW1wb3J0IG1kQXV0b1NwYWNpbmcgZnJvbSBcIm1hcmtkb3duLWl0LWF1dG9zcGFjZVwiO1xuaW1wb3J0IHsgd2l0aE1lcm1haWQgfSBmcm9tIFwidml0ZXByZXNzLXBsdWdpbi1tZXJtYWlkXCI7XG5pbXBvcnQgeyBHaXRDaGFuZ2Vsb2cgfSBmcm9tIFwiQG5vbGViYXNlL3ZpdGVwcmVzcy1wbHVnaW4tZ2l0LWNoYW5nZWxvZ1wiO1xuaW1wb3J0IGZvb3Rub3RlIGZyb20gXCJtYXJrZG93bi1pdC1mb290bm90ZVwiO1xuaW1wb3J0IHRhc2tMaXN0cyBmcm9tIFwibWFya2Rvd24taXQtdGFzay1saXN0c1wiO1xuaW1wb3J0IG1kS2F0ZXggZnJvbSBcIm1hcmtkb3duLWl0LWthdGV4XCI7XG5pbXBvcnQgbGlnaHRib3ggZnJvbSBcInZpdGVwcmVzcy1wbHVnaW4tbGlnaHRib3hcIjtcbmltcG9ydCB7IHRhYnNNYXJrZG93blBsdWdpbiB9IGZyb20gXCJ2aXRlcHJlc3MtcGx1Z2luLXRhYnNcIjtcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4vLyBcdTI2OTlcdUZFMEYgU3Vuc2V0Uk5FIFx1NEUyQVx1NEVCQVx1NURFNVx1NEY1Q1x1N0FEOVx1OTE0RFx1N0Y2RVxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbmNvbnN0IFVTRVJOQU1FID0gXCJTdW5zZXRSTkVcIjtcbmNvbnN0IFNJVEUgPSBgaHR0cHM6Ly8ke1VTRVJOQU1FfS5naXRodWIuaW9gO1xuXG5leHBvcnQgZGVmYXVsdCB3aXRoTWVybWFpZChkZWZpbmVDb25maWcoe1xuICBsYW5nOiBcInpoLUNOXCIsXG4gIHRpdGxlOiBcIlN1bnNldFJORVwiLFxuICBkZXNjcmlwdGlvbjogXCJBbmRyb2lkIFx1NTE4NVx1NjgzOFx1Njc4NFx1NUVGQSBcdTAwQjcgXHU1RjAwXHU2RTkwXHU2Mjk4XHU4MTdFXHU4MDA1XHUyMDE0XHUyMDE0XHU5QTgxXHU5Rjk5XHU1MTg1XHU2ODM4XHU4MUVBXHU1MkE4XHU2Nzg0XHU1RUZBXHU1NjY4XHU0RTBFXHU1NDA0XHU3OUNEXHU1QzBGXHU5ODc5XHU3NkVFXCIsXG5cbiAgY2xlYW5VcmxzOiB0cnVlLCAvLyBcdTc1MUZcdTYyMTAgL2Fib3V0IFx1ODAwQ1x1NEUwRFx1NjYyRiAvYWJvdXQuaHRtbFxuICBsYXN0VXBkYXRlZDogdHJ1ZSwgLy8gXHU5ODc1XHU5NzYyXHU1RTk1XHU5MEU4XHU2NjNFXHU3OTNBXHU2NzAwXHU1NDBFXHU2NkY0XHU2NUIwXHU2NUY2XHU5NUY0XG5cbiAgc2l0ZW1hcDoge1xuICAgIGhvc3RuYW1lOiBTSVRFLCAvLyBcdTgxRUFcdTUyQThcdTc1MUZcdTYyMTAgc2l0ZW1hcC54bWxcdUZGMENcdTUyMjlcdTRFOEUgU0VPXG4gIH0sXG5cbiAgaGVhZDogW1xuICAgIC8vIFx1N0Y1MVx1N0FEOVx1NTZGRVx1NjgwN1x1RkYwOFx1NjZGRlx1NjM2MiBkb2NzL3B1YmxpYy9mYXZpY29uLnN2ZyBcdTUzNzNcdTUzRUZcdTYzNjJcdTU2RkVcdTY4MDdcdUZGMDlcbiAgICBbXCJsaW5rXCIsIHsgcmVsOiBcImljb25cIiwgaHJlZjogXCIvZmF2aWNvbi5zdmdcIiB9XSxcblxuICAgIC8vIFx1NUI1N1x1NEY1M1x1RkYxQVx1NEUyRFx1NjU4N1x1NzUyOCBNaVNhbnNcdUZGMENcdTdCNDlcdTVCQkRcdTc1MjggSmV0QnJhaW5zIE1vbm9cdUZGMDhDRE4gXHU1RjE1XHU1MTY1XHVGRjBDXHU2NUUwXHU5NzAwXHU2MjUzXHU1MzA1XHVGRjA5XG4gICAgW1wibGlua1wiLCB7IHJlbDogXCJwcmVjb25uZWN0XCIsIGhyZWY6IFwiaHR0cHM6Ly9jZG4uanNkZWxpdnIubmV0L1wiIH1dLFxuICAgIFtcbiAgICAgIFwibGlua1wiLFxuICAgICAge1xuICAgICAgICByZWw6IFwic3R5bGVzaGVldFwiLFxuICAgICAgICBocmVmOiBcImh0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vbWlzYW5zQDQuMC4wL2xpYi9Ob3JtYWwvTWlTYW5zLm1pbi5jc3NcIixcbiAgICAgIH0sXG4gICAgXSxcbiAgICBbXG4gICAgICBcImxpbmtcIixcbiAgICAgIHtcbiAgICAgICAgcmVsOiBcInN0eWxlc2hlZXRcIixcbiAgICAgICAgaHJlZjogXCJodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvbnBtL2pldGJyYWlucy1tb25vLXdlYmZvbnRAbGF0ZXN0L2pldGJyYWlucy1tb25vLmNzc1wiLFxuICAgICAgfSxcbiAgICBdLFxuICAgIC8vIFJlbWl4aWNvbiBcdTU2RkVcdTY4MDdcdTVFOTNcbiAgICBbXG4gICAgICBcImxpbmtcIixcbiAgICAgIHtcbiAgICAgICAgcmVsOiBcInN0eWxlc2hlZXRcIixcbiAgICAgICAgaHJlZjogXCJodHRwczovL2Nkbi5qc2RlbGl2ci5uZXQvbnBtL3JlbWl4aWNvbkA0LjkuMS9mb250cy9yZW1peGljb24uY3NzXCIsXG4gICAgICB9LFxuICAgIF0sXG5cbiAgICAvLyAtLS0tLS0tLS0tIFNFTyBcdTUxNDNcdTRGRTFcdTYwNkZcdUZGMDhcdTUyMDZcdTRFQUJcdTk0RkVcdTYzQTVcdTY1RjZcdTY2M0VcdTc5M0FcdTZGMDJcdTRFQUVcdTUzNjFcdTcyNDdcdUZGMDkgLS0tLS0tLS0tLVxuICAgIFtcIm1ldGFcIiwgeyBuYW1lOiBcInJvYm90c1wiLCBjb250ZW50OiBcImluZGV4LCBmb2xsb3dcIiB9XSxcbiAgICBbXCJtZXRhXCIsIHsgbmFtZTogXCJhdXRob3JcIiwgY29udGVudDogXCJTdW5zZXRSTkVcIiB9XSxcbiAgICBbXCJtZXRhXCIsIHsgbmFtZTogXCJrZXl3b3Jkc1wiLCBjb250ZW50OiBcIlN1bnNldFJORSwgQW5kcm9pZCwgXHU1MTg1XHU2ODM4XHU2Nzg0XHU1RUZBLCBHaXRIdWIsIFx1NEUyQVx1NEVCQVx1NEUzQlx1OTg3NSwgXHU1RjAwXHU1M0QxXHU4MDA1XCIgfV0sXG4gICAgW1wibWV0YVwiLCB7IHByb3BlcnR5OiBcIm9nOnR5cGVcIiwgY29udGVudDogXCJ3ZWJzaXRlXCIgfV0sXG4gICAgW1wibWV0YVwiLCB7IHByb3BlcnR5OiBcIm9nOnNpdGVfbmFtZVwiLCBjb250ZW50OiBcIlN1bnNldFJORVwiIH1dLFxuICAgIFtcIm1ldGFcIiwgeyBwcm9wZXJ0eTogXCJvZzp0aXRsZVwiLCBjb250ZW50OiBcIlN1bnNldFJORSAtIFx1NEUyQVx1NEVCQVx1NURFNVx1NEY1Q1x1N0FEOVwiIH1dLFxuICAgIFtcIm1ldGFcIiwgeyBwcm9wZXJ0eTogXCJvZzpkZXNjcmlwdGlvblwiLCBjb250ZW50OiBcIkFuZHJvaWQgXHU1MTg1XHU2ODM4XHU2Nzg0XHU1RUZBIFx1MDBCNyBcdTVGMDBcdTZFOTBcdTYyOThcdTgxN0VcdTgwMDVcdTIwMTRcdTIwMTRcdTlBODFcdTlGOTlcdTUxODVcdTY4MzhcdTgxRUFcdTUyQThcdTY3ODRcdTVFRkFcdTU2NjhcdTRFMEVcdTU0MDRcdTc5Q0RcdTVDMEZcdTk4NzlcdTc2RUVcIiB9XSxcbiAgICBbXCJtZXRhXCIsIHsgcHJvcGVydHk6IFwib2c6dXJsXCIsIGNvbnRlbnQ6IFNJVEUgfV0sXG4gICAgW1wibWV0YVwiLCB7IHByb3BlcnR5OiBcIm9nOmltYWdlXCIsIGNvbnRlbnQ6IGAke1NJVEV9L2F2YXRhci5wbmdgIH1dLFxuICAgIFtcIm1ldGFcIiwgeyBuYW1lOiBcInR3aXR0ZXI6Y2FyZFwiLCBjb250ZW50OiBcInN1bW1hcnlcIiB9XSxcbiAgICBbXCJtZXRhXCIsIHsgbmFtZTogXCJ0d2l0dGVyOnRpdGxlXCIsIGNvbnRlbnQ6IFwiU3Vuc2V0Uk5FIC0gXHU0RTJBXHU0RUJBXHU1REU1XHU0RjVDXHU3QUQ5XCIgfV0sXG4gICAgW1wibWV0YVwiLCB7IG5hbWU6IFwidHdpdHRlcjpkZXNjcmlwdGlvblwiLCBjb250ZW50OiBcIkFuZHJvaWQgXHU1MTg1XHU2ODM4XHU2Nzg0XHU1RUZBIFx1MDBCNyBcdTVGMDBcdTZFOTBcdTYyOThcdTgxN0VcdTgwMDVcdTIwMTRcdTIwMTRcdTlBODFcdTlGOTlcdTUxODVcdTY4MzhcdTgxRUFcdTUyQThcdTY3ODRcdTVFRkFcdTU2NjhcdTRFMEVcdTU0MDRcdTc5Q0RcdTVDMEZcdTk4NzlcdTc2RUVcIiB9XSxcbiAgICBbXCJtZXRhXCIsIHsgbmFtZTogXCJ0d2l0dGVyOmltYWdlXCIsIGNvbnRlbnQ6IGAke1NJVEV9L2F2YXRhci5wbmdgIH1dLFxuICBdLFxuXG4gIHRoZW1lQ29uZmlnOiB7XG4gICAgLy8gXHU2NzJDXHU1NzMwXHU1MTY4XHU2NTg3XHU2NDFDXHU3RDIyXHVGRjA4Vml0ZVByZXNzIFx1NTE4NVx1N0Y2RSBsb2NhbCBwcm92aWRlclx1RkYwQ1x1NTdGQVx1NEU4RSBtaW5pc2VhcmNoXHVGRjA5XG4gICAgc2VhcmNoOiB7XG4gICAgICBwcm92aWRlcjogXCJsb2NhbFwiLFxuICAgICAgb3B0aW9uczoge1xuICAgICAgICB0cmFuc2xhdGlvbnM6IHtcbiAgICAgICAgICBidXR0b246IHsgYnV0dG9uVGV4dDogXCJcdTY0MUNcdTdEMjJcIiwgYnV0dG9uQXJpYUxhYmVsOiBcIlx1NjQxQ1x1N0QyMlwiIH0sXG4gICAgICAgICAgbW9kYWw6IHtcbiAgICAgICAgICAgIG5vUmVzdWx0c1RleHQ6IFwiXHU2NzJBXHU2MjdFXHU1MjMwXHU3NkY4XHU1MTczXHU3RUQzXHU2NzlDXCIsXG4gICAgICAgICAgICByZXNldEJ1dHRvblRpdGxlOiBcIlx1NkUwNVx1OTY2NFx1NjQxQ1x1N0QyMlx1Njc2MVx1NEVGNlwiLFxuICAgICAgICAgICAgZm9vdGVyOiB7IHNlbGVjdFRleHQ6IFwiXHU5MDA5XHU2MkU5XCIsIG5hdmlnYXRlVGV4dDogXCJcdTUyMDdcdTYzNjJcIiwgY2xvc2VUZXh0OiBcIlx1NTE3M1x1OTVFRFwiIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcblxuICAgIC8vIFx1OTg3Nlx1OTBFOFx1NUJGQ1x1ODIyQVxuICAgIG5hdjogW1xuICAgICAgeyB0ZXh0OiBcIlx1OTk5Nlx1OTg3NVwiLCBsaW5rOiBcIi9cIiB9LFxuICAgICAgeyB0ZXh0OiBcIlx1NzNCMFx1NTcyOFwiLCBsaW5rOiBcIi9ub3dcIiB9LFxuICAgICAgeyB0ZXh0OiBcIlx1NTE3M1x1NEU4RVx1NjIxMVwiLCBsaW5rOiBcIi9hYm91dFwiIH0sXG4gICAgICB7IHRleHQ6IFwiXHU5ODc5XHU3NkVFXCIsIGxpbms6IFwiL3Byb2plY3RzXCIgfSxcbiAgICAgIHsgdGV4dDogXCJcdTRFMEFcdTZFMzhcdTc2RDFcdTYzQTdcIiwgbGluazogXCIvdXBzdHJlYW1cIiB9LFxuICAgICAgeyB0ZXh0OiBcIlx1NURFNVx1NTE3N1x1N0JCMVwiLCBsaW5rOiBcIi90b29sc1wiIH0sXG4gICAgICB7IHRleHQ6IFwiXHU1MzVBXHU1QkEyXCIsIGxpbms6IFwiL2Jsb2dcIiB9LFxuICAgIF0sXG5cbiAgICAvLyBcdTUzRjNcdTRFMEFcdTg5RDJcdTc5M0VcdTRFQTRcdTU2RkVcdTY4MDdcdUZGMDhcdTY1MkZcdTYzMDEgZ2l0aHViIC8geCAvIHRlbGVncmFtIC8gbGlua2VkaW4gXHU3QjQ5XHU1MTg1XHU3RjZFXHU1NkZFXHU2ODA3XHVGRjA5XG4gICAgc29jaWFsTGlua3M6IFtcbiAgICAgIHsgaWNvbjogXCJnaXRodWJcIiwgbGluazogYGh0dHBzOi8vZ2l0aHViLmNvbS8ke1VTRVJOQU1FfWAgfSxcbiAgICAgIC8vIHsgaWNvbjogXCJ0ZWxlZ3JhbVwiLCBsaW5rOiBcImh0dHBzOi8vdC5tZS9cdTRGNjBcdTc2ODRcdTc1MjhcdTYyMzdcdTU0MERcIiB9LFxuICAgICAgLy8geyBpY29uOiBcInhcIiwgbGluazogXCJodHRwczovL3guY29tL1x1NEY2MFx1NzY4NFx1NzUyOFx1NjIzN1x1NTQwRFwiIH0sXG4gICAgXSxcblxuICAgIC8vIFx1OTg3NVx1ODExQVxuICAgIGZvb3Rlcjoge1xuICAgICAgbWVzc2FnZTogXCJcdTc1MjggXHUyNzY0XHVGRTBGIFx1NTQ4QyBWaXRlUHJlc3MgXHU2Nzg0XHU1RUZBXCIsXG4gICAgICBjb3B5cmlnaHQ6IFwiQ29weXJpZ2h0IFx1MDBBOSAyMDI2IFN1bnNldFJORVwiLFxuICAgIH0sXG5cbiAgICAvLyBcdTY1ODdcdTY4NjNcdTk4NzVcdTUzRjNcdTRGQTdcdTc2RUVcdTVGNTVcdTVDNDJcdTdFQTdcbiAgICBvdXRsaW5lOiB7XG4gICAgICBsZXZlbDogWzIsIDNdLFxuICAgIH0sXG5cbiAgICAvLyBcdThGRDRcdTU2REVcdTk4NzZcdTkwRThcdTYzMDlcdTk0QUVcbiAgICByZXR1cm5Ub1RvcExhYmVsOiBcIlx1NTZERVx1NTIzMFx1OTg3Nlx1OTBFOFwiLFxuICAgIHNpZGViYXJNZW51TGFiZWw6IFwiXHU4M0RDXHU1MzU1XCIsXG4gICAgZGFya01vZGVTd2l0Y2hMYWJlbDogXCJcdTRFM0JcdTk4OThcIixcbiAgICBsaWdodE1vZGVTd2l0Y2hUaXRsZTogXCJcdTUyMDdcdTYzNjJcdTUyMzBcdTZENDVcdTgyNzJcdTZBMjFcdTVGMEZcIixcbiAgICBkYXJrTW9kZVN3aXRjaFRpdGxlOiBcIlx1NTIwN1x1NjM2Mlx1NTIzMFx1NkRGMVx1ODI3Mlx1NkEyMVx1NUYwRlwiLFxuICB9LFxuXG4gIG1hcmtkb3duOiB7XG4gICAgY29uZmlnOiAobWQpID0+IHtcbiAgICAgIC8vIFx1NEUyRFx1NjU4N1x1NEUwRVx1ODJGMVx1NjU4Ny9cdTY1NzBcdTVCNTdcdTRFNEJcdTk1RjRcdTgxRUFcdTUyQThcdTUyQTBcdTdBN0FcdTY4M0NcdUZGMDhwYW5ndSBcdTYzOTJcdTcyNDhcdUZGMENcdTUzQzJcdTgwMDMgUmVTdWtpU1VcdUZGMDlcbiAgICAgIG1kLnVzZShtZEF1dG9TcGFjaW5nLCB7XG4gICAgICAgIHBhbmd1OiB0cnVlLFxuICAgICAgICBtb2ppa3VtaTogdHJ1ZSxcbiAgICAgICAgc3BhY2luZ0l0ZW1zOiBbXCJjb2RlX2lubGluZVwiXSxcbiAgICAgIH0pO1xuICAgICAgLy8gXHU4MTFBXHU2Q0U4XHUzMDAxXHU0RUZCXHU1MkExXHU1MjE3XHU4ODY4XHUzMDAxS2FUZVggXHU2NTcwXHU1QjY2XHU1MTZDXHU1RjBGXHUzMDAxXHU1NkZFXHU3MjQ3XHU3MDZGXHU3QkIxXHUzMDAxXHU5MDA5XHU5ODc5XHU1MzYxXG4gICAgICBtZC51c2UoZm9vdG5vdGUpO1xuICAgICAgbWQudXNlKHRhc2tMaXN0cywgeyBlbmFibGVkOiB0cnVlLCBsYWJlbDogdHJ1ZSB9KTtcbiAgICAgIG1kLnVzZShtZEthdGV4KTtcbiAgICAgIG1kLnVzZShsaWdodGJveCwge30pO1xuICAgICAgbWQudXNlKHRhYnNNYXJrZG93blBsdWdpbik7XG4gICAgfSxcbiAgfSxcblxuICAvLyAtLS0tLS0tLS0tIFx1N0IyQ1x1NEUwOVx1NjVCOVx1NjNEMlx1NEVGNiAtLS0tLS0tLS0tXG4gIHZpdGU6IHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICBHaXRDaGFuZ2Vsb2coe1xuICAgICAgICByZXBvVVJMOiBcImh0dHBzOi8vZ2l0aHViLmNvbS9TdW5zZXRSTkUvU3Vuc2V0Uk5FLmdpdGh1Yi5pb1wiLFxuICAgICAgfSksXG4gICAgXSxcbiAgICBzc3I6IHtcbiAgICAgIC8vIG5vbGViYXNlIFx1NjNEMlx1NEVGNiBkaXN0IFx1NTE4NVx1NTQyQiAudnVlIFx1NkU5MFx1NjU4N1x1NEVGNlx1RkYwQ1x1OTcwMFx1NEVBNFx1N0VEOSBWaXRlIFx1NTkwNFx1NzQwNlx1ODAwQ1x1OTc1RSBub2RlIFx1NzZGNFx1NjNBNVx1NTJBMFx1OEY3RFxuICAgICAgbm9FeHRlcm5hbDogW1xuICAgICAgICBcIkBub2xlYmFzZS92aXRlcHJlc3MtcGx1Z2luLWVuaGFuY2VkLXJlYWRhYmlsaXRpZXNcIixcbiAgICAgICAgXCJAbm9sZWJhc2Uvdml0ZXByZXNzLXBsdWdpbi1naXQtY2hhbmdlbG9nXCIsXG4gICAgICBdLFxuICAgIH0sXG4gIH0sXG59KSk7Il0sCiAgIm1hcHBpbmdzIjogIjtBQUFxYixTQUFTLG9CQUFvQjtBQUNsZCxPQUFPLG1CQUFtQjtBQUMxQixTQUFTLG1CQUFtQjtBQUM1QixTQUFTLG9CQUFvQjtBQUM3QixPQUFPLGNBQWM7QUFDckIsT0FBTyxlQUFlO0FBQ3RCLE9BQU8sYUFBYTtBQUNwQixPQUFPLGNBQWM7QUFDckIsU0FBUywwQkFBMEI7QUFNbkMsSUFBTSxXQUFXO0FBQ2pCLElBQU0sT0FBTyxXQUFXLFFBQVE7QUFFaEMsSUFBTyxpQkFBUSxZQUFZLGFBQWE7QUFBQSxFQUN0QyxNQUFNO0FBQUEsRUFDTixPQUFPO0FBQUEsRUFDUCxhQUFhO0FBQUEsRUFFYixXQUFXO0FBQUE7QUFBQSxFQUNYLGFBQWE7QUFBQTtBQUFBLEVBRWIsU0FBUztBQUFBLElBQ1AsVUFBVTtBQUFBO0FBQUEsRUFDWjtBQUFBLEVBRUEsTUFBTTtBQUFBO0FBQUEsSUFFSixDQUFDLFFBQVEsRUFBRSxLQUFLLFFB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
