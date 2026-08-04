<script setup>
import { ref, onMounted } from "vue";

// 读取 sync workflow 生成的监控报告（docs/public/fork-status.json）
const report = ref(null);
const loading = ref(true);
const error = ref("");
const filter = ref("all");

onMounted(async () => {
  try {
    const res = await fetch("/fork-status.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    report.value = await res.json();
  } catch (e) {
    error.value = "暂无监控数据——同步流水线还没跑过，或报告尚未生成";
  } finally {
    loading.value = false;
  }
});

const filtered = () => {
  if (!report.value) return [];
  // 主表格永远只显示真 fork（自建仓库单独折叠区展示）
  const forks = report.value.forks.filter((f) => f.status !== "not_fork");
  if (filter.value === "all") return forks;
  return forks.filter((f) => f.status === filter.value);
};

const ownRepos = () => {
  if (!report.value) return [];
  return report.value.forks.filter((f) => f.status === "not_fork");
};

const badge = (status) => ({
  synced: { cls: "ok", text: "✅ 已同步" },
  conflict: { cls: "warn", text: "⚠️ 冲突跳过" },
  error: { cls: "err", text: "❌ 失败" },
  orphan: { cls: "muted", text: "🕳️ 上游缺失" },
  not_fork: { cls: "muted", text: "🏠 自建仓库" },
  pending: { cls: "muted", text: "⏳ 待同步" },
}[status] || { cls: "muted", text: status });

function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", { hour12: false });
}
</script>

<template>
  <div class="fork-monitor">
    <div v-if="loading" class="status">加载监控数据中…</div>

    <div v-else-if="error" class="empty">
      <p>{{ error }}</p>
      <p class="hint">
        配置好 <code>SYNC_TOKEN</code> 后，去
        <a href="https://github.com/SunsetRNE/SunsetRNE.github.io/actions/workflows/sync-forks.yml" target="_blank">Actions → Sync Forks</a>
        手动运行一次即可生成报告。
      </p>
    </div>

    <template v-else>
      <div class="summary">
        <span class="sum-item"><b>{{ report.forks.filter(f => f.status !== 'not_fork').length }}</b> 个可同步 fork</span>
        <span class="sum-item ok"><b>{{ report.synced }}</b> 已同步</span>
        <span class="sum-item warn"><b>{{ report.conflict }}</b> 冲突</span>
        <span class="sum-item err"><b>{{ report.error }}</b> 失败</span>
        <span class="sum-item muted"><b>{{ report.orphan || 0 }}</b> 上游缺失</span>
        <span class="updated">🕐 报告更新于 {{ fmtTime(report.updated_at) }}</span>
      </div>

      <div class="filters">
        <button
          v-for="f in ['all', 'synced', 'conflict', 'error', 'orphan']"
          :key="f"
          :class="['chip', { active: filter === f }]"
          @click="filter = f"
        >
          {{ { all: "全部", synced: "已同步", conflict: "冲突", error: "失败", orphan: "上游缺失" }[f] }}
        </button>
      </div>

      <table class="fork-table">
        <thead>
          <tr>
            <th>我的 fork</th>
            <th>上游仓库</th>
            <th>状态</th>
            <th>上游最后更新</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="f in filtered()" :key="f.name">
            <td>
              <a :href="`https://github.com/SunsetRNE/${f.name}`" target="_blank">
                {{ f.name }}
              </a>
            </td>
            <td>
              <a v-if="f.upstream" :href="`https://github.com/${f.upstream}`" target="_blank">
                {{ f.upstream }}
              </a>
              <span v-else>—</span>
            </td>
            <td>
              <span :class="['badge', badge(f.status).cls]">{{ badge(f.status).text }}</span>
              <div class="note">{{ f.note }}</div>
            </td>
            <td class="time">{{ fmtTime(f.upstream_pushed_at) }}</td>
          </tr>
        </tbody>
      </table>

      <!-- 自建仓库：折叠显示，避免混淆 -->
      <details v-if="ownRepos().length" class="own-fold">
        <summary>
          🏠 自建仓库（{{ ownRepos().length }} 个，不参与同步）
        </summary>
        <div class="own-list">
          <a
            v-for="f in ownRepos()"
            :key="f.name"
            :href="`https://github.com/SunsetRNE/${f.name}`"
            target="_blank"
            class="own-chip"
          >
            {{ f.name }}
          </a>
        </div>
      </details>
    </template>
  </div>
</template>

<style scoped>
.fork-monitor {
  margin: 24px 0;
}
.status {
  color: var(--vp-c-text-2);
  padding: 20px 0;
}
.empty {
  border: 1px dashed var(--vp-c-divider);
  border-radius: 12px;
  padding: 28px;
  text-align: center;
  color: var(--vp-c-text-2);
}
.empty code {
  background: var(--vp-c-bg-soft);
  padding: 2px 6px;
  border-radius: 4px;
}
.hint {
  margin-top: 10px;
  font-size: 13px;
}
.hint a {
  color: var(--vp-c-brand-1);
}
.summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 20px;
  padding: 14px 18px;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
  margin-bottom: 14px;
  font-size: 14px;
}
.sum-item b {
  font-size: 17px;
  margin-right: 3px;
}
.sum-item.ok b { color: #22a06b; }
.sum-item.warn b { color: #d97706; }
.sum-item.err b { color: #dc2626; }
.sum-item.muted b { color: var(--vp-c-text-2); }
.updated {
  margin-left: auto;
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}
.filters {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.chip {
  border: 1px solid var(--vp-c-divider);
  background: transparent;
  color: var(--vp-c-text-2);
  padding: 4px 14px;
  border-radius: 999px;
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
.fork-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
}
.fork-table th {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 2px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-weight: 600;
  white-space: nowrap;
}
.fork-table td {
  padding: 9px 10px;
  border-bottom: 1px solid var(--vp-c-divider);
  vertical-align: top;
}
.fork-table a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
}
.fork-table a:hover {
  text-decoration: underline;
}
.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.badge.ok { background: rgba(34, 160, 107, 0.15); color: #22a06b; }
.badge.warn { background: rgba(217, 119, 6, 0.15); color: #d97706; }
.badge.err { background: rgba(220, 38, 38, 0.15); color: #dc2626; }
.badge.muted { background: var(--vp-c-bg-soft); color: var(--vp-c-text-3); }
.note {
  font-size: 12px;
  color: var(--vp-c-text-3);
  margin-top: 3px;
}
.time {
  color: var(--vp-c-text-2);
  white-space: nowrap;
  font-size: 12.5px;
}
/* 自建仓库折叠区 */
.own-fold {
  margin-top: 18px;
  border: 1px dashed var(--vp-c-divider);
  border-radius: 10px;
  padding: 10px 14px;
}
.own-fold summary {
  cursor: pointer;
  font-size: 13.5px;
  color: var(--vp-c-text-2);
  user-select: none;
}
.own-fold summary:hover {
  color: var(--vp-c-brand-1);
}
.own-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.own-chip {
  font-size: 12.5px;
  padding: 4px 12px;
  border-radius: 999px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: all 0.2s;
}
.own-chip:hover {
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
@media (max-width: 640px) {
  .fork-table th:nth-child(4),
  .fork-table td:nth-child(4) {
    display: none;
  }
}
</style>