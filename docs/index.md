---
# 首页使用 VitePress 的 home 布局
layout: home

hero:
  name: "SunsetRNE"
  text: "Android 内核构建 · 开源折腾者"
  tagline: "从骁龙内核自动构建器到各种小项目——喜欢折腾，也喜欢把过程记录下来。"
  image:
    src: /avatar.png        # 你的 GitHub 头像（docs/public/avatar.png）
    alt: SunsetRNE
  actions:
    - theme: brand
      text: 查看我的项目
      link: /projects
    - theme: alt
      text: 关于我
      link: /about
    - theme: alt
      text: GitHub
      link: https://github.com/SunsetRNE

features:
  - title: 内核构建自动化
    details: 维护骁龙平台的自动内核构建器（sm8650 / sm8750 系列），用完全自动化的方式构建 Oppo/OnePlus/Realme 内核。
    icon: <i class="ri-android-fill"></i>
  - title: Kotlin / Android
    details: 用 Kotlin 折腾 Android 开发与工具链，关注系统底层与自动化方向。
    icon: <i class="ri-code-s-slash-fill"></i>
  - title: Rust · Shell · Python
    details: 小工具、自动化脚本、CLI——用最合适的语言解决实际问题。
    icon: <i class="ri-terminal-box-fill"></i>
  - title: 开源社区
    details: Fork 并跟进 ReSukiSU、内核构建等上游项目，参与 CI 与自动发布流程。
    icon: <i class="ri-github-fill"></i>
  - title: 博客输出
    details: 把折腾内核、自动化的过程整理成文章，让经验可以被检索到。
    icon: <i class="ri-article-fill"></i>
  - title: 联系我
    details: 通过 GitHub 或博客留言交流，欢迎技术讨论。
    icon: <i class="ri-chat-smile-3-fill"></i>
---

<!-- ============ 工作站模式：GitHub 动态（自动拉取仓库） ============ -->
<GitHubRepos username="SunsetRNE" :limit="6" />