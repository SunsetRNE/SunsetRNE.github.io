import DefaultTheme from "vitepress/theme";
import GitHubRepos from "./components/GitHubRepos.vue";
import GitHubForks from "./components/GitHubForks.vue";
import { NolebaseGitChangelogPlugin } from "@nolebase/vitepress-plugin-git-changelog/client";
import "@nolebase/vitepress-plugin-git-changelog/client/style.css";
import "./custom.css";

// 在默认主题基础上注册自定义组件
export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    // 注册 git 变更日志插件（<NolebaseGitChangelog /> 显示文章更新历史）
    app.use(NolebaseGitChangelogPlugin);
    app.component("GitHubRepos", GitHubRepos);
    app.component("GitHubForks", GitHubForks);
  },
};