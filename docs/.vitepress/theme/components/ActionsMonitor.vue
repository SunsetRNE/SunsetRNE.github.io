<script setup>
// Actions 监控面板：平板挂屏用
// 数据源：actions-monitor workflow 每 30 分钟扫描生成的 actions-runs.json
// 特性：网格卡片（横屏 3~4 列）、大状态色块、失败置顶+红框、5 分钟自动刷新
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

const data = ref(null);
const loading = ref(true);
const error = ref("");
const statusFilter = ref("all");
const catFilter = ref("all");

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
  if (n.includes("ci") || n.includes("action")) return "CI/产物";
  if (n.includes("kernelsu") || n.includes("ksu") || n.includes("susfs") || n.includes("magisk") || n.includes("patch") || n.includes("kpm") || n.includes("sukisu"))
    return "Root方案";
  if (n.includes("kernel")) return "内核源码";
  return "工具/脚本";
}

// ---------- 状态语义（与 actions_monitor.py 的 summary 一致） ----------
const OK_CONCLUSIONS = ["success", "skipped", "neutral"];
const STATUS_ORDER = { failed: 0, running: 1, no_runs: 2, ok: 3 };
const STATUS_META = {
  failed: { icon: "✗", text: "失败", cls: "failed", color: "#dc2626" },
  running: { icon: "⏳", text: "运行中", cls: "running", color: "#2563eb" },
  ok: { icon: "✓", text: "成功", cls: "ok", color: "#22a06b" },
  no_runs: { icon: "⏸", text: "无运行", cls: "muted", color: "#94a3b8" },
};

function stOf(repo) {
  if (!repo.runs || !repo.runs.length) return "no_runs";
  const r = repo.runs[0];
  if (r.status !== "completed") return "running";
  return OK_CONCLUSIONS.includes(r.conclusion) ? "ok" : "failed";
}
const r0 = (repo) => (repo.runs && repo.runs[0]) || null;
const r1 = (repo) => (repo.runs && repo.runs[1]) || null;
const catOf = (repo) => repo.category || classify(repo.name);
const catColor = (repo) => CAT_COLOR[catOf(repo)] || "#4b5563";

const shown = computed(() => {
  if (!data.value) return [];
  let list = data.value.repos || [];
  if (statusFilter.value !== "all")
    list = list.filter((r) => stOf(r) === statusFilter.value);
  if (catFilter.value !== "all")
    list = list.filter((r) => catOf(r) === catFilter.value);
  // 失败置顶 → 运行中 → 无运行 → 正常，同组按名称
  return [...list].sort((a, b) => {
    const d = STATUS_ORDER[stOf(a)] - STATUS_ORDER[stOf(b)];
    return d !== 0 ? d : a.name.localeCompare(b.name);
  });
});

const cardLink = (repo) =>
  (r0(repo) && r0(repo).html_url) || repo.html_url;

function eventIcon(ev) {
  return (
    {
      push: "⬆️",
      schedule: "🕐",
      workflow_dispatch: "👆",
      pull_request: "🔀",
      fork: "🍴",
      release: "🏷️",
      watch: "👁️",
    }[ev] || "⚙️"
  );
}
// 失败 run 的结论文案（failure/timed_out/cancelled）
function failText(repo) {
  const r = r0(repo);
  if (!r || !r.conclusion) return "失败";
  return r.conclusion === "failure" ? "失败" : r.conclusion.toUpperCase();
}

function fmtTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", { hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function fmtAgo(iso) {
  if (!iso) return "—";
  const t = (Date.now() - new Date(iso).getTime()) / 1000;
  if (t < 60) return "刚刚";
  if (t < 3600) return Math.floor(t / 60) + " 分钟前";
  if (t < 86400) return Math.floor(t / 3600) + " 小时前";
  if (t < 86400 * 30) return Math.floor(t / 86400) + " 天前";
  return new Date(iso).toLocaleDateString("zh-CN");
}

// ---------- 分组折叠（全部视图下按状态分组，挂屏优先失败/运行中） ----------
const GROUPS = [
  { key: "failed", icon: "✗", label: "失败" },
  { key: "running", icon: "⏳", label: "运行中" },
  { key: "ok", icon: "✓", label: "正常" },
  { key: "no_runs", icon: "⏸", label: "无运行" },
];
// 默认：失败/运行中展开，正常/无运行折叠（挂屏只看重点，需要时点开）
const collapsed = ref({ failed: false, running: false, ok: true, no_runs: true });
const grouped = computed(() => {
  if (!data.value) return [];
  return GROUPS.map((g) => ({
    ...g,
    repos: (data.value.repos || [])
      .filter((r) => stOf(r) === g.key)
      .sort((a, b) => a.name.localeCompare(b.name)),
  }));
});
function toggleGroup(key) {
  collapsed.value[key] = !collapsed.value[key];
}
const isGroupedView = computed(
  () => statusFilter.value === "all" && catFilter.value === "all"
);

// ---------- 时间流记忆（actions-history.json：状态变化事件流） ----------
const history = ref([]);
const histOpen = ref(true);
const HIST_META = {
  failed: { icon: "✗", color: "#dc2626" },
  ok: { icon: "✓", color: "#22a06b" },
  running: { icon: "⏳", color: "#2563eb" },
  no_runs: { icon: "⏸", color: "#94a3b8" },
};
async function loadHistory() {
  try {
    const res = await fetch("/actions-history.json", { cache: "no-store" });
    if (!res.ok) return;
    const arr = await res.json();
    // 倒序取最近 8 条
    history.value = Array.isArray(arr) ? arr.slice(-8).reverse() : [];
  } catch (e) {
    // 历史文件还没生成时静默（不打扰挂屏）
  }
}

// ---------- 5 分钟自动刷新 ----------
let timer = null;
async function load() {
  try {
    const res = await fetch("/actions-runs.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data.value = await res.json();
    error.value = "";
  } catch (e) {
    if (!data.value)
      error.value = "暂无监控数据——Actions 监控还没跑过，或快照尚未生成";
  } finally {
    loading.value = false;
  }
}
onMounted(() => {
  load();
  loadHistory();
  timer = setInterval(() => {
    load();
    loadHistory();
  }, 5 * 60 * 1000); // 每 5 分钟刷新一次
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <div class="actions-monitor">
    <div v-if="loading" class="status">加载监控数据中…</div>

    <div v-else-if="error" class="empty">
      <p>{{ error }}</p>
      <p class="hint">
        配置好 <code>SYNC_TOKEN</code> 后，去
        <a
          href="https://github.com/SunsetRNE/SunsetRNE.github.io/actions/workflows/actions-monitor.yml"
          target="_blank"
        >Actions → Actions Monitor</a>
        手动运行一次即可生成快照。
      </p>
    </div>

    <template v-else>
      <div class="summary">
        <span class="sum-item"><b>{{ data.summary.total }}</b> 仓库</span>
        <span class="sum-item run"><b>{{ data.summary.running }}</b> 运行中</span>
        <span class="sum-item err"><b>{{ data.summary.failed }}</b> 失败</span>
        <span class="sum-item ok"><b>{{ data.summary.ok }}</b> 正常</span>
        <span class="sum-item muted"><b>{{ data.summary.no_runs }}</b> 无运行</span>
        <span class="updated">🕐 数据更新于 {{ fmtTime(data.updated_at) }}（{{ fmtAgo(data.updated_at) }}）</span>
      </div>

      <div class="filters">
        <button
          v-for="f in ['all', 'failed', 'running', 'ok', 'no_runs']"
          :key="f"
          :class="['chip', { active: statusFilter === f }]"
          @click="statusFilter = f"
        >
          {{ { all: "全部", failed: "✗ 失败", running: "⏳ 运行中", ok: "✓ 正常", no_runs: "⏸ 无运行" }[f] }}
        </button>
        <span class="refresh-btn" title="立即刷新" @click="load">🔄</span>
      </div>

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

      <!-- 时间流：最近状态变化（失败红 / 恢复绿 / 运行蓝） -->
      <div v-if="history.length" class="history">
        <div class="history-head" @click="histOpen = !histOpen">
          <span class="history-title">📜 时间流（状态变化）</span>
          <span class="history-arrow">{{ histOpen ? "▾" : "▸" }}</span>
        </div>
        <div v-if="histOpen" class="history-list">
          <div v-for="(ev, i) in history" :key="i" class="hist-item">
            <span class="hist-time">{{ fmtTime(ev.t) }}</span>
            <span class="hist-repo" :title="ev.repo">{{ ev.repo }}</span>
            <span class="hist-change">
              <span class="hist-st" :style="{ color: (HIST_META[ev.from] || {}).color }">
                {{ (HIST_META[ev.from] || {}).icon }} {{ ev.from }}
              </span>
              <span class="hist-arrow">→</span>
              <span class="hist-st" :style="{ color: (HIST_META[ev.to] || {}).color }">
                {{ (HIST_META[ev.to] || {}).icon }} {{ ev.to }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <!-- 分组折叠视图（全部 + 全部分类时）：失败/运行中默认展开 -->
      <template v-if="isGroupedView">
        <div v-for="g in grouped" :key="g.key" class="group">
          <div class="group-head" @click="toggleGroup(g.key)">
            <span class="group-icon" :style="{ color: STATUS_META[g.key].color }">{{ g.icon }}</span>
            <span class="group-label">{{ g.label }}</span>
            <span class="group-count">{{ g.repos.length }}</span>
            <span class="group-arrow">{{ collapsed[g.key] ? "▸" : "▾" }}</span>
          </div>
          <div v-if="!collapsed[g.key]" class="grid">
            <a
              v-for="repo in g.repos"
              :key="repo.name"
              :href="cardLink(repo)"
              target="_blank"
              :class="['card', stOf(repo)]"
            >
              <div class="ribbon" :style="{ background: STATUS_META[stOf(repo)].color }"></div>
              <div class="card-head">
                <span class="repo-name">{{ repo.name }}</span>
                <span
                  class="cat-badge"
                  :style="{ color: catColor(repo), background: catColor(repo) + '22' }"
                >{{ catOf(repo) }}</span>
              </div>
              <div class="status-block" :style="{ color: STATUS_META[stOf(repo)].color }">
                <span class="status-icon">{{ STATUS_META[stOf(repo)].icon }}</span>
                <span class="status-text">{{ stOf(repo) === "failed" ? failText(repo) : STATUS_META[stOf(repo)].text }}</span>
              </div>
              <div v-if="r0(repo)" class="run-info">
                <div class="run-name">
                  {{ r0(repo).name }}
                  <span class="run-num">#{{ r0(repo).run_number }}</span>
                </div>
                <div class="run-title" :title="r0(repo).display_title">{{ r0(repo).display_title || "—" }}</div>
                <div class="run-meta">
                  {{ eventIcon(r0(repo).event) }} {{ fmtAgo(r0(repo).created_at) }}
                </div>
              </div>
              <div v-else class="run-info none">暂无运行记录</div>
              <div v-if="r1(repo)" class="last-run">
                上次 {{ r1(repo).name }} #{{ r1(repo).run_number }} · {{ fmtAgo(r1(repo).created_at) }}
              </div>
            </a>
          </div>
        </div>
      </template>

      <!-- 筛选视图（选状态/分类时）：平铺展示 -->
      <div v-else class="grid">
        <a
          v-for="repo in shown"
          :key="repo.name"
          :href="cardLink(repo)"
          target="_blank"
          :class="['card', stOf(repo)]"
        >
          <div class="ribbon" :style="{ background: STATUS_META[stOf(repo)].color }"></div>
          <div class="card-head">
            <span class="repo-name">{{ repo.name }}</span>
            <span
              class="cat-badge"
              :style="{ color: catColor(repo), background: catColor(repo) + '22' }"
            >{{ catOf(repo) }}</span>
          </div>
          <div class="status-block" :style="{ color: STATUS_META[stOf(repo)].color }">
            <span class="status-icon">{{ STATUS_META[stOf(repo)].icon }}</span>
            <span class="status-text">{{ stOf(repo) === "failed" ? failText(repo) : STATUS_META[stOf(repo)].text }}</span>
          </div>
          <div v-if="r0(repo)" class="run-info">
            <div class="run-name">
              {{ r0(repo).name }}
              <span class="run-num">#{{ r0(repo).run_number }}</span>
            </div>
            <div class="run-title" :title="r0(repo).display_title">{{ r0(repo).display_title || "—" }}</div>
            <div class="run-meta">
              {{ eventIcon(r0(repo).event) }} {{ fmtAgo(r0(repo).created_at) }}
            </div>
          </div>
          <div v-else class="run-info none">暂无运行记录</div>
          <div v-if="r1(repo)" class="last-run">
            上次 {{ r1(repo).name }} #{{ r1(repo).run_number }} · {{ fmtAgo(r1(repo).created_at) }}
          </div>
        </a>
      </div>
      <div v-if="!isGroupedView && !shown.length" class="no-result">没有匹配的仓库</div>

      <div class="foot">
        ⏱ 快照由 Actions Monitor 每 30 分钟扫描一次，状态无变化时快照保持不动（这是正常的）
        · <a href="https://github.com/SunsetRNE/SunsetRNE.github.io/actions/workflows/actions-monitor.yml" target="_blank">扫描器运行记录</a>
      </div>
    </template>
  </div>
</template>

<style scoped>
.actions-monitor {
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
.sum-item.run b { color: #2563eb; }
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
  margin-bottom: 12px;
  flex-wrap: wrap;
  align-items: center;
}
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
.refresh-btn {
  margin-left: auto;
  cursor: pointer;
  font-size: 16px;
  padding: 2px 8px;
  border-radius: 8px;
  transition: background 0.2s;
  user-select: none;
}
.refresh-btn:hover {
  background: var(--vp-c-bg-soft);
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
/* 网格：横屏平板 3~4 列，手机 1 列 */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
}
.card {
  position: relative;
  display: block;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 12px 14px 10px;
  text-decoration: none;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  overflow: hidden;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.10);
  border-color: var(--vp-c-brand-1);
}
/* 顶部状态色带 */
.ribbon {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 5px;
}
/* 失败置顶 + 红框高亮（挂屏一眼看到） */
.card.failed {
  border-color: rgba(220, 38, 38, 0.55);
  background: rgba(220, 38, 38, 0.05);
}
.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
  margin-top: 3px;
}
.repo-name {
  font-family: var(--vp-font-family-mono);
  font-size: 13.5px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* 大状态色块 */
.status-block {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  margin-bottom: 10px;
  font-weight: 700;
}
.status-icon {
  font-size: 20px;
  line-height: 1;
}
.status-text {
  font-size: 15px;
  letter-spacing: 0.5px;
}
.card.ok .status-block { background: rgba(34, 160, 107, 0.10); }
.card.failed .status-block { background: rgba(220, 38, 38, 0.12); }
.card.running .status-block { background: rgba(37, 99, 235, 0.10); }
.card.muted .status-block { background: var(--vp-c-bg-soft); color: #94a3b8; }
.run-info {
  font-size: 12.5px;
  min-height: 52px;
}
.run-info.none {
  color: var(--vp-c-text-3);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
}
.run-name {
  font-weight: 600;
  color: var(--vp-c-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.run-num {
  color: var(--vp-c-text-3);
  font-weight: 400;
  font-size: 11.5px;
}
.run-title {
  margin-top: 3px;
  font-size: 12px;
  color: var(--vp-c-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.run-meta {
  margin-top: 3px;
  font-size: 11.5px;
  color: var(--vp-c-text-3);
}
.last-run {
  margin-top: 8px;
  padding-top: 7px;
  border-top: 1px dashed var(--vp-c-divider);
  font-size: 11px;
  color: var(--vp-c-text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.no-result {
  padding: 24px;
  text-align: center;
  color: var(--vp-c-text-3);
  font-size: 13px;
}

/* ---------- 分组折叠 ---------- */
.groups {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.group {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  overflow: hidden;
  background: var(--vp-c-bg);
}
.group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  cursor: pointer;
  user-select: none;
  background: var(--vp-c-bg-soft);
  font-size: 13.5px;
  font-weight: 600;
  transition: background 0.2s;
}
.group-head:hover {
  background: var(--vp-c-bg-alt);
}
.group-icon {
  font-size: 15px;
}
.group-label {
  color: var(--vp-c-text-1);
}
.group-count {
  margin-left: auto;
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg);
  border-radius: 999px;
  padding: 1px 10px;
}
.group-arrow {
  color: var(--vp-c-text-3);
  font-size: 12px;
  width: 14px;
  text-align: center;
}
.group .grid {
  padding: 10px;
}

/* ---------- 时间流（状态变化记忆） ---------- */
.history {
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  margin-bottom: 14px;
  overflow: hidden;
  background: var(--vp-c-bg);
}
.history-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  cursor: pointer;
  user-select: none;
  background: var(--vp-c-bg-soft);
  font-size: 13.5px;
  font-weight: 600;
  transition: background 0.2s;
}
.history-head:hover {
  background: var(--vp-c-bg-alt);
}
.history-title {
  color: var(--vp-c-text-1);
}
.history-arrow {
  margin-left: auto;
  color: var(--vp-c-text-3);
  font-size: 12px;
}
.history-list {
  padding: 6px 14px 8px;
}
.hist-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  font-size: 12.5px;
  border-bottom: 1px dashed var(--vp-c-divider);
}
.hist-item:last-child {
  border-bottom: none;
}
.hist-time {
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  white-space: nowrap;
}
.hist-repo {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 38%;
}
.hist-change {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.hist-st {
  font-weight: 600;
  font-size: 12px;
}
.hist-arrow {
  color: var(--vp-c-text-3);
}
.foot {
  margin-top: 16px;
  font-size: 12px;
  color: var(--vp-c-text-3);
  text-align: center;
}
.foot a {
  color: var(--vp-c-brand-1);
}
@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
/* 横屏平板/桌面：突破 VitePress 688px 内容容器，让监控网格铺满视口（挂屏 3~4 列） */
@media (min-width: 960px) {
  .actions-monitor {
    margin-left: calc(50% - 50vw);
    margin-right: calc(50% - 50vw);
    padding-left: 40px;
    padding-right: 40px;
  }
}
@media (min-width: 1280px) {
  .actions-monitor {
    padding-left: 56px;
    padding-right: 56px;
  }
}
</style>