import DefaultTheme from "vitepress/theme";
import Layout from "./Layout.vue";
import GitHubRepos from "./components/GitHubRepos.vue";
import GitHubForks from "./components/GitHubForks.vue";
import BlogArchive from "./components/BlogArchive.vue";
import ActionsMonitor from "./components/ActionsMonitor.vue";
import { NolebaseGitChangelogPlugin } from "@nolebase/vitepress-plugin-git-changelog/client";
import "@nolebase/vitepress-plugin-git-changelog/client/style.css";
import { NolebaseEnhancedReadabilitiesPlugin } from "@nolebase/vitepress-plugin-enhanced-readabilities/client";
import "@nolebase/vitepress-plugin-enhanced-readabilities/client/style.css";
import { enhanceAppWithTabs } from "vitepress-plugin-tabs/client";
import "katex/dist/katex.min.css";
import "./custom.css";

// 在默认主题基础上注册自定义组件
export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // 注册 git 变更日志插件（<NolebaseGitChangelog /> 显示文章更新历史）
    app.use(NolebaseGitChangelogPlugin);
    // 阅读增强插件（字号/行距/聚焦/布局切换）
    app.use(NolebaseEnhancedReadabilitiesPlugin);
    // 选项卡插件（:::tabs 容器）
    enhanceAppWithTabs(app);
    app.component("GitHubRepos", GitHubRepos);
    app.component("GitHubForks", GitHubForks);
    app.component("BlogArchive", BlogArchive);
    app.component("ActionsMonitor", ActionsMonitor);
  },
};