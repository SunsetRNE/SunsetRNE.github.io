import DefaultTheme from "vitepress/theme";
import GitHubRepos from "./components/GitHubRepos.vue";
import "./custom.css";

// 在默认主题基础上注册自定义组件
export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    // 在 Markdown 里直接使用 <GitHubRepos username="xxx" />
    app.component("GitHubRepos", GitHubRepos);
  },
};