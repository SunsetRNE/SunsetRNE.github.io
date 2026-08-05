<script setup>
import { ref, onMounted } from "vue";

// 读取 sync workflow 生成的监控报告（docs/public/fork-status.json）
const report = ref(null);
const loading = ref(true);
const error = ref("");
const filter = ref("all");
const catFilter = ref("all"); // 分类筛选
const sortBy = ref("name"); // name | upstream
const search = ref("");
const history = ref([]);

// ---------- 仓库分类：按"存在的意义"标注 ----------
const CATEGORIES = [
  { value: "all", label: "全部分类" },
  { value: "Root方案", label: "Root方案" },
  { value: "内核源码", label: "内核源码" },
  { value: "CI/产物", label: "CI/产物" },
  { value: "模块/框架", label: "模块/框架" },
  { value: "编译依赖", label: "编译依赖" },
  { value: "代理网络", label: "代理网络" },
  { value: "AI工具", label: "AI工具" },
  { value: "工具/脚本", label: "工具/脚本" },
];
const CAT_COLOR = {
  "Root方案": "#7c3aed",
  "内核源码": "#d97706",
  "CI/产物": "#0891b2",
  "模块/框架": "#0d9488",
  "编译依赖": "#64748b",
  "代理网络": "#db2777",
  "AI工具": "#2563eb",
  "工具/脚本": "#4b5563",
};
function classify(name) {
  const n = name.toLowerCase();
  if (n.includes("toolchain") || n.includes("ccache") || n.includes("manifest") || n.includes("anykernel"))
    return "编译依赖";
  if (n.includes("clash") || n.includes("mihomo") || n === "box") return "代理网络";
  if (n.includes("gpt") || n.includes("codex") || n.includes("llm") || n.includes("mcp") || n.includes("operit") || n.includes("open-") || n.includes("headroom") || n.includes("agent"))
    return "AI工具";
  if (n.includes("installer") || n.includes("zygisk") || n.includes("webui") || n.includes("tricky") || n.includes("integrity") || n.includes("hma") || n.includes("lyric") || n.includes("faker") || n.includes("telegram"))
    return "模块/框架";
  // CI/产物 优先于 Root（ReSukiSU_CI 是产物仓库）
  if (n.includes("ci") || n.includes("action")) return "CI/产物";
  if (n.includes("kernelsu") || n.includes("ksu") || n.includes("susfs") || n.includes("magisk") || n.includes("patch") || n.includes("kpm") || n.includes("sukisu"))
    return "Root方案";
  if (n.includes("kernel")) return "内核源码";
  return "工具/脚本";
}

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
  // 同步历史（趋势图）
  try {
    const hr = await fetch("/fork-history.json", { cache: "no-store" });
    if (hr.ok) history.value = await hr.json();
  } catch (e) {
    /* 历史文件可能还不存在，忽略 */
  }
});

const filtered = () => {
  if (!report.value) return [];
  // 主表格永远只显示真 fork（自建仓库单独折叠区展示）
  const forks = report.value.forks.filter((f) => f.status !== "not_fork");
  let list = forks;
  if (filter.value !== "all") list = list.filter((f) => f.status === filter.value);
  // 分类筛选：优先数据层 category，缺失时前端规则兜底
  if (catFilter.value !== "all") {
    list = list.filter((f) => (f.category || classify(f.name)) === catFilter.value);
  }
  // 搜索：名称或上游包含关键字
  const kw = search.value.trim().toLowerCase();
  if (kw) {
    list = list.filter(
      (f) =>
        f.name.toLowerCase().includes(kw) ||
        (f.upstream || "").toLowerCase().includes(kw)
    );
  }
  // 排序：按名称 / 按上游最后更新时间（活跃度）
  if (sortBy.value === "upstream") {
    list = [...list].sort(
      (a, b) => (b.upstream_pushed_at || "").localeCompare(a.upstream_pushed_at || "")
    );
  } else {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name));
  }
  return list;
};

const catOf = (f) => f.category || classify(f.name);
const catColor = (f) => CAT_COLOR[catOf(f)] || "#4b5563";

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
  skipped: { cls: "muted", text: "⏭️ 无需同步" },
  pending: { cls: "muted", text: "⏳ 待同步" },
}[status] || { cls: "muted", text: status });

function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", { hour12: false });
}

// 相对时间：x分钟/小时/天前
function fmtAgo(iso) {
  if (!iso) return "—";
  const t = (Date.now() - new Date(iso).getTime()) / 1000;
  if (t < 60) return "刚刚";
  if (t < 3600) return Math.floor(t / 60) + " 分钟前";
  if (t < 86400) return Math.floor(t / 3600) + " 小时前";
  if (t < 86400 * 30) return Math.floor(t / 86400) + " 天前";
  return new Date(iso).toLocaleDateString("zh-CN");
}

// 落后估算：上游最后更新 - fork 最后更新（同步成功则已是最新）
function behindInfo(f) {
  if (f.status === "synced") return { text: "已是最新", cls: "ok" };
  if (!f.fork_pushed_at || !f.upstream_pushed_at) return null;
  const diff =
    (new Date(f.upstream_pushed_at) - new Date(f.fork_pushed_at)) / 86400000;
  if (diff <= 0.5) return null;
  return {
    text: `落后约 ${Math.round(diff)} 天`,
    cls: f.status === "conflict" ? "warn" : "err",
  };
}

// 趋势图：柱高按占比（相对 total）
const trend = () => history.value.slice(-14);
const segH = (h, key) => {
  const total = h.total || 1;
  return { height: Math.max(2, Math.round((h[key] / total) * 100)) + "%" };
};
const trendLabel = (iso) => {
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
};
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
        <span class="sum-item"><b>{{ report.forks.filter(f => f.status !== 'not_fork' && f.status !== 'skipped').length }}</b> 个待同步 fork</span>
        <span class="sum-item ok"><b>{{ report.synced }}</b> 已同步</span>
        <span class="sum-item warn"><b>{{ report.conflict }}</b> 冲突</span>
        <span class="sum-item err"><b>{{ report.error }}</b> 失败</span>
        <span class="sum-item muted"><b>{{ report.orphan || 0 }}</b> 上游缺失</span>
        <span class="sum-item muted"><b>{{ report.skipped || 0 }}</b> 无需同步</span>
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
        <input
          v-model="search"
          class="search-input"
          type="text"
          placeholder="🔍 搜索仓库名 / 上游…"
        />
        <span class="sort-group">
          <span class="sort-label">排序</span>
          <button :class="['chip', { active: sortBy === 'name' }]" @click="sortBy = 'name'">名称</button>
          <button :class="['chip', { active: sortBy === 'upstream' }]" @click="sortBy = 'upstream'">上游活跃度</button>
        </span>
      </div>

      <!-- 分类筛选：按仓库"存在的意义" -->
      <div class="cat-filters">
        <button
          v-for="c in CATEGORIES"
          :key="c.value"
          :class="['chip', 'cat-chip', { active: catFilter === c.value }]"
          @click="catFilter = c.value"
        >
          {{ c.label }}
        </button>
      </div>

      <!-- 同步历史趋势（近 14 次） -->
      <div v-if="trend().length" class="trend">
        <div class="trend-head">
          <b>📈 近 {{ trend().length }} 次同步趋势</b>
          <span class="trend-legend">
            <i class="dot ok"></i>已同步 <i class="dot warn"></i>冲突 <i class="dot err"></i>失败
          </span>
        </div>
        <div class="trend-chart">
          <div v-for="(h, i) in trend()" :key="i" class="trend-col">
            <div class="trend-bar" :title="`${trendLabel(h.updated_at)}: 同步${h.synced} 冲突${h.conflict} 失败${h.error}`">
              <div class="seg err" :style="segH(h, 'error')"></div>
              <div class="seg warn" :style="segH(h, 'conflict')"></div>
              <div class="seg ok" :style="segH(h, 'synced')"></div>
            </div>
            <div class="trend-date">{{ trendLabel(h.updated_at) }}</div>
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table class="fork-table">
          <thead>
            <tr>
              <th>我的 fork</th>
              <th>分类</th>
              <th>上游仓库</th>
              <th>状态</th>
              <th>更新时间</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="f in filtered()"
              :key="f.name"
              :class="['row', f.status]"
            >
              <td>
                <a :href="`https://github.com/SunsetRNE/${f.name}`" target="_blank">
                  {{ f.name }}
                </a>
              </td>
              <td>
                <span
                  class="cat-badge"
                  :style="{ color: catColor(f), background: catColor(f) + '22' }"
                >
                  {{ catOf(f) }}
                </span>
              </td>
              <td>
                <a v-if="f.upstream" :href="`https://github.com/${f.upstream}`" target="_blank">
                  {{ f.upstream }}
                </a>
                <span v-else>—</span>
                <div class="sub">上游更新 {{ fmtAgo(f.upstream_pushed_at) }}</div>
              </td>
              <td>
                <span :class="['badge', badge(f.status).cls]">{{ badge(f.status).text }}</span>
                <div class="note">{{ f.note }}</div>
                <div v-if="behindInfo(f)" :class="['behind', behindInfo(f).cls]">
                  {{ behindInfo(f).text }}
                </div>
              </td>
              <td class="time">{{ fmtAgo(f.fork_pushed_at) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filtered().length" class="no-result">没有匹配的仓库</div>
      </div>

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
  flex-wrap: wrap;
  align-items: center;
}
/* 分类筛选行 */
.cat-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  flex-wrap: wrap;
  align-items: center;
}
.cat-chip {
  font-size: 12.5px;
  padding: 3px 12px;
}
.cat-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.sort-group {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sort-label {
  font-size: 12.5px;
  color: var(--vp-c-text-3);
}
/* 搜索框 */
.search-input {
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 13px;
  width: 180px;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus {
  border-color: var(--vp-c-brand-1);
}
.search-input::placeholder {
  color: var(--vp-c-text-3);
}
/* 同步历史趋势图 */
.trend {
  margin-bottom: 14px;
  padding: 14px 18px;
  background: var(--vp-c-bg-soft);
  border-radius: 12px;
}
.trend-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 13.5px;
}
.trend-legend {
  font-size: 12px;
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  gap: 12px;
}
.trend-legend .dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
  margin-right: 4px;
  vertical-align: middle;
}
.dot.ok { background: #22a06b; }
.dot.warn { background: #d97706; }
.dot.err { background: #dc2626; }
.trend-chart {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 86px;
  padding-top: 4px;
}
.trend-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
.trend-bar {
  width: 100%;
  max-width: 34px;
  height: 66px;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  overflow: hidden;
  background: var(--vp-c-divider);
}
.trend-bar .seg { width: 100%; }
.seg.ok { background: #22a06b; }
.seg.warn { background: #d97706; }
.seg.err { background: #dc2626; }
.trend-date {
  font-size: 10.5px;
  color: var(--vp-c-text-3);
  white-space: nowrap;
}
/* 落后估算 */
.behind {
  margin-top: 3px;
  font-size: 12px;
  font-weight: 600;
}
.behind.ok { color: #22a06b; }
.behind.warn { color: #d97706; }
.behind.err { color: #dc2626; }
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
.table-wrap {
  max-height: 72vh;
  overflow: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
}
.fork-table th {
  text-align: left;
  padding: 9px 10px;
  border-bottom: 2px solid var(--vp-c-divider);
  color: var(--vp-c-text-2);
  font-weight: 600;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 2;
  background: var(--vp-c-bg);
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
/* 状态行着色：整行浅色，异常快速扫描 */
.fork-table tr.row.synced { background: rgba(34, 160, 107, 0.05); }
.fork-table tr.row.conflict { background: rgba(217, 119, 6, 0.10); }
.fork-table tr.row.error { background: rgba(220, 38, 38, 0.10); }
.fork-table tr.row.orphan { background: var(--vp-c-bg-soft); }
.fork-table tr.row:hover { background: var(--vp-c-bg-soft); }
.fork-table tr.row.synced:hover { background: rgba(34, 160, 107, 0.09); }
.fork-table tr.row.conflict:hover { background: rgba(217, 119, 6, 0.15); }
.fork-table tr.row.error:hover { background: rgba(220, 38, 38, 0.15); }
/* fork/上游 双时间小字 */
.sub {
  font-size: 11.5px;
  color: var(--vp-c-text-3);
  margin-top: 2px;
}
.no-result {
  padding: 18px;
  text-align: center;
  color: var(--vp-c-text-3);
  font-size: 13px;
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
  .search-input {
    width: 100%;
  }
  .sort-group {
    margin-left: 0;
    width: 100%;
  }
  .fork-table .note {
    max-width: 180px;
  }
}
</style>