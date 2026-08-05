<script setup>
import { ref, onMounted } from "vue";

const props = defineProps({
  username: { type: String, required: true },
  limit: { type: Number, default: 6 },
});

const repos = ref([]);
const loading = ref(true);
const error = ref("");

onMounted(async () => {
  try {
    const res = await fetch(
      `https://api.github.com/users/${props.username}/repos?sort=updated&per_page=100`
    );
    if (!res.ok) throw new Error(`API ${res.status}`);
    let list = await res.json();
    // 过滤 fork 仓库，按 stars 排序，取前 N 个
    list = list
      .filter((r) => !r.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count);
    repos.value = list.slice(0, props.limit);
  } catch (e) {
    error.value = "⚠️ 无法加载 GitHub 数据（可能是网络问题），稍后刷新试试";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="gh-repos">
    <h2 class="section-title">🚀 GitHub 动态</h2>
    <p class="hint">自动从 GitHub API 拉取，push 新仓库后无需改代码</p>

    <p v-if="loading" class="status">加载中…</p>
    <p v-else-if="error" class="status">{{ error }}</p>

    <div v-else class="repos-grid">
      <a
        v-for="r in repos"
        :key="r.id"
        :href="r.html_url"
        target="_blank"
        rel="noopener"
        class="repo-card"
      >
        <h3>
          {{ r.name }}
          <span v-if="r.stargazers_count > 0" class="stars">
            ⭐ {{ r.stargazers_count }}
          </span>
        </h3>
        <p class="desc">{{ r.description || "暂无描述" }}</p>
        <div class="meta">
          <span v-if="r.language" class="lang">{{ r.language }}</span>
          <span class="date">更新于 {{ r.updated_at.slice(0, 10) }}</span>
        </div>
      </a>
    </div>

    <p class="more">
      <a :href="`https://github.com/${username}?tab=repositories`" target="_blank">
        查看全部仓库 →
      </a>
    </p>
  </div>
</template>

<style scoped>
.gh-repos {
  margin: 40px 0 20px;
  text-align: left;
}
.section-title {
  font-size: 22px;
  margin-bottom: 4px;
  background: linear-gradient(135deg, var(--vp-c-brand-1), var(--vp-c-brand-grad-2, #8b5cf6));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}
.hint {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 18px;
}
.status {
  color: var(--vp-c-text-2);
  padding: 20px 0;
}
.repos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}
.repo-card {
  display: block;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 16px 18px;
  background: var(--vp-c-bg-soft);
  transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
}
.repo-card:hover {
  transform: translateY(-3px);
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  text-decoration: none;
}
.repo-card h3 {
  margin: 0 0 6px;
  font-size: 16px;
  font-family: var(--vp-font-family-mono);
  color: var(--vp-c-brand-1);
}
.repo-card .stars {
  font-size: 13px;
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-base);
}
.repo-card .desc {
  margin: 0 0 12px;
  font-size: 13.5px;
  color: var(--vp-c-text-2);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.repo-card .meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--vp-c-text-3);
}
.repo-card .lang {
  color: var(--vp-c-brand-1);
  font-weight: 600;
}
.more {
  margin-top: 16px;
  font-size: 14px;
}
.more a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}
.more a:hover {
  text-decoration: underline;
}
</style>