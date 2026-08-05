<script setup>
// 博客归档组件：统计条 + 写作热力图 + 时间线/标签双视图
import { ref, computed } from "vue";
import { data as posts } from "../../../blog/posts.data.js";

const view = ref("timeline"); // timeline | tags
const activeTag = ref("");

const total = computed(() => posts.length);
const tagMap = computed(() => {
  const m = new Map();
  posts.forEach((p) => {
    (p.tags || []).forEach((t) => {
      if (!m.has(t)) m.set(t, []);
      m.get(t).push(p);
    });
  });
  // 按文章数量降序
  return new Map([...m.entries()].sort((a, b) => b[1].length - a[1].length));
});
const tagCount = computed(() => tagMap.value.size);
const newest = computed(() => (posts[0] ? posts[0].date : "—"));
const oldest = computed(() =>
  posts.length > 0 ? posts[posts.length - 1].date : "—"
);

// ---------- 写作热力图：近 52 周，每天一个格子 ----------
const pad = (n) => String(n).padStart(2, "0");
const fmt = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const heatWeeks = computed(() => {
  const countMap = {};
  posts.forEach((p) => {
    if (p.date) countMap[p.date] = (countMap[p.date] || 0) + 1;
  });
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay()); // 本周日
  const start = new Date(sunday);
  start.setDate(sunday.getDate() - 51 * 7); // 52 周前
  const weeks = [];
  for (let w = 0; w < 52; w++) {
    const col = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + w * 7 + d);
      const key = fmt(dt);
      col.push({ key, count: countMap[key] || 0 });
    }
    weeks.push(col);
  }
  return weeks;
});

const heatLevel = (count) => (count >= 3 ? 3 : count);

// ---------- 标签筛选 ----------
const shownPosts = computed(() => {
  if (!activeTag.value) return posts;
  return tagMap.value.get(activeTag.value) || [];
});
function pickTag(t) {
  activeTag.value = activeTag.value === t ? "" : t;
}
</script>

<template>
  <div class="blog-archive">
    <!-- ============ 统计条 ============ -->
    <div class="stats">
      <div class="stat">
        <span class="num">{{ total }}</span>
        <span class="label">文章</span>
      </div>
      <div class="stat">
        <span class="num">{{ tagCount }}</span>
        <span class="label">标签</span>
      </div>
      <div class="stat">
        <span class="num date-num">{{ oldest }}</span>
        <span class="label">始于</span>
      </div>
      <div class="stat">
        <span class="num date-num">{{ newest }}</span>
        <span class="label">最近更新</span>
      </div>
    </div>

    <!-- ============ 写作热力图 ============ -->
    <div class="heatmap-block">
      <p class="block-title">🔥 写作热力图 · 近 52 周</p>
      <div class="heatmap">
        <div v-for="(col, wi) in heatWeeks" :key="wi" class="heat-col">
          <div
            v-for="(cell, di) in col"
            :key="di"
            class="heat-cell"
            :class="`lv-${heatLevel(cell.count)}`"
            :title="`${cell.key} · ${cell.count} 篇`"
          ></div>
        </div>
      </div>
      <div class="heatmap-legend">
        <span class="legend-text">少</span>
        <span class="heat-cell lv-0"></span>
        <span class="heat-cell lv-1"></span>
        <span class="heat-cell lv-2"></span>
        <span class="heat-cell lv-3"></span>
        <span class="legend-text">多</span>
      </div>
    </div>

    <!-- ============ 视图切换 ============ -->
    <div class="view-switch">
      <button :class="{ active: view === 'timeline' }" @click="view = 'timeline'">
        ⏱ 时间线
      </button>
      <button :class="{ active: view === 'tags' }" @click="view = 'tags'">
        🏷 按标签
      </button>
    </div>

    <!-- ============ 时间线视图 ============ -->
    <div v-if="view === 'timeline'" class="timeline">
      <div v-for="p in posts" :key="p.url" class="tl-item">
        <div class="tl-date">{{ p.date }}</div>
        <div class="tl-dot"></div>
        <div class="tl-card">
          <h3><a :href="p.url">{{ p.title }}</a></h3>
          <p v-if="p.description" class="tl-desc">{{ p.description }}</p>
          <div v-if="p.tags && p.tags.length" class="tl-tags">
            <span v-for="t in p.tags" :key="t" class="chip">{{ t }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ 标签视图 ============ -->
    <div v-else class="tags-view">
      <div class="tag-filter">
        <button
          class="chip"
          :class="{ active: !activeTag }"
          @click="pickTag('')"
        >
          全部
        </button>
        <button
          v-for="(list, t) in tagMap"
          :key="t"
          class="chip"
          :class="{ active: activeTag === t }"
          @click="pickTag(t)"
        >
          {{ t }} <span class="tag-num">{{ list.length }}</span>
        </button>
      </div>

      <template v-if="activeTag">
        <div class="tag-group">
          <h3 class="group-title">
            {{ activeTag }} <span class="tag-num">{{ shownPosts.length }} 篇</span>
          </h3>
          <div v-for="p in shownPosts" :key="p.url" class="group-item">
            <span class="group-date">{{ p.date }}</span>
            <a :href="p.url">{{ p.title }}</a>
          </div>
        </div>
      </template>
      <template v-else>
        <div v-for="(list, t) in tagMap" :key="t" class="tag-group">
          <h3 class="group-title">
            {{ t }} <span class="tag-num">{{ list.length }} 篇</span>
          </h3>
          <div v-for="p in list" :key="p.url" class="group-item">
            <span class="group-date">{{ p.date }}</span>
            <a :href="p.url">{{ p.title }}</a>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.blog-archive {
  margin: 24px 0 40px;
}

/* ---------- 统计条 ---------- */
.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
.stat {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 14px 16px;
  background: var(--vp-c-bg-soft);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat .num {
  font-size: 26px;
  font-weight: 700;
  font-family: var(--vp-font-family-mono);
  background: linear-gradient(135deg, var(--vp-c-brand-1), #8b5cf6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
}
.stat .num.date-num {
  font-size: 16px;
  align-self: center;
  padding-top: 6px;
}
.stat .label {
  font-size: 12px;
  color: var(--vp-c-text-2);
}

/* ---------- 热力图 ---------- */
.heatmap-block {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 16px;
  background: var(--vp-c-bg-soft);
  margin-bottom: 20px;
}
.block-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}
.heatmap {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(7, 11px);
  grid-auto-columns: 11px;
  gap: 3px;
  overflow-x: auto;
  padding-bottom: 2px;
}
.heat-cell {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  background: var(--vp-c-bg-alt);
  border: 1px solid var(--vp-c-divider);
}
.heat-cell.lv-1 {
  background: rgba(91, 91, 214, 0.25);
  border-color: transparent;
}
.heat-cell.lv-2 {
  background: rgba(91, 91, 214, 0.55);
  border-color: transparent;
}
.heat-cell.lv-3 {
  background: var(--vp-c-brand-1);
  border-color: transparent;
}
.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  justify-content: flex-end;
}
.heatmap-legend .heat-cell {
  width: 10px;
  height: 10px;
}
.legend-text {
  font-size: 11px;
  color: var(--vp-c-text-3);
  margin: 0 2px;
}

/* ---------- 视图切换 ---------- */
.view-switch {
  display: flex;
  gap: 8px;
  margin-bottom: 18px;
}
.view-switch button {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border-radius: 999px;
  padding: 6px 18px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.view-switch button:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.view-switch button.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #fff;
}

/* ---------- 时间线 ---------- */
.timeline {
  position: relative;
  padding-left: 12px;
}
.tl-item {
  position: relative;
  display: grid;
  grid-template-columns: 86px 24px 1fr;
  gap: 0;
  padding-bottom: 18px;
}
.tl-item::before {
  content: "";
  position: absolute;
  left: 105px;
  top: 8px;
  bottom: -4px;
  width: 2px;
  background: var(--vp-c-divider);
}
.tl-item:last-child::before {
  display: none;
}
.tl-date {
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  color: var(--vp-c-text-3);
  padding-top: 6px;
  text-align: right;
}
.tl-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--vp-c-bg);
  border: 3px solid var(--vp-c-brand-1);
  margin: 8px auto 0;
  z-index: 1;
}
.tl-card {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 14px 18px;
  background: var(--vp-c-bg-soft);
  transition: transform 0.2s, border-color 0.2s;
}
.tl-card:hover {
  transform: translateX(4px);
  border-color: var(--vp-c-brand-1);
}
.tl-card h3 {
  margin: 0 0 6px;
  font-size: 16px;
}
.tl-card h3 a {
  color: var(--vp-c-text-1);
  text-decoration: none;
}
.tl-card h3 a:hover {
  color: var(--vp-c-brand-1);
}
.tl-desc {
  margin: 0 0 10px;
  font-size: 13.5px;
  color: var(--vp-c-text-2);
}
.tl-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

/* ---------- 标签视图 ---------- */
.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}
.chip {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  border-radius: 999px;
  padding: 4px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}
.chip:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
.chip.active {
  background: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-1);
  color: #fff;
}
.tag-num {
  font-size: 11px;
  opacity: 0.8;
}
.tag-group {
  margin-bottom: 22px;
}
.group-title {
  font-size: 16px;
  margin: 0 0 10px;
  padding-bottom: 6px;
  border-bottom: 2px solid var(--vp-c-divider);
}
.group-item {
  padding: 5px 0;
  font-size: 14px;
}
.group-date {
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  color: var(--vp-c-text-3);
  margin-right: 12px;
}
.group-item a {
  color: var(--vp-c-text-1);
  text-decoration: none;
}
.group-item a:hover {
  color: var(--vp-c-brand-1);
}

/* ---------- 响应式 ---------- */
@media (max-width: 640px) {
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .tl-item {
    grid-template-columns: 72px 20px 1fr;
  }
  .tl-item::before {
    left: 81px;
  }
}
</style>