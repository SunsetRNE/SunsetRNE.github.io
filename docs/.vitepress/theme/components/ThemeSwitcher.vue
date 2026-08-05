<script setup>
// 主题切换器：右下角悬浮按钮，切换 html[data-theme]，localStorage 记忆
import { ref, onMounted } from "vue";

const THEME_KEY = "sunsetrne-theme";

const themes = [
  { name: "default", label: "靛蓝默认", colors: ["#5b5bd6", "#8b5cf6"] },
  { name: "geek", label: "荧光极客", colors: ["#00e68a", "#00e5ff"] },
  { name: "paper", label: "暖纸墨", colors: ["#b5651d", "#c0392b"] },
  { name: "neon", label: "极夜霓虹", colors: ["#a855f7", "#ec4899"] },
];

const open = ref(false);
const current = ref("default");

onMounted(() => {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved && themes.some((t) => t.name === saved)) {
    current.value = saved;
    document.documentElement.setAttribute("data-theme", saved);
  }
});

function pick(name) {
  current.value = name;
  document.documentElement.setAttribute("data-theme", name);
  localStorage.setItem(THEME_KEY, name);
  open.value = false;
}
</script>

<template>
  <div class="theme-switcher">
    <button
      class="ts-btn"
      :title="'切换主题（当前：' + (themes.find((t) => t.name === current)?.label || '') + '）'"
      :aria-label="'切换主题'"
      @click="open = !open"
    >
      🎨
    </button>
    <div v-if="open" class="ts-panel">
      <div
        v-for="t in themes"
        :key="t.name"
        class="ts-item"
        :class="{ active: current === t.name }"
        @click="pick(t.name)"
      >
        <span class="ts-dots">
          <i v-for="c in t.colors" :key="c" :style="{ background: c }"></i>
        </span>
        <span class="ts-label">{{ t.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-switcher {
  position: fixed;
  right: 20px;
  bottom: 24px;
  z-index: 100;
}
.ts-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.ts-btn:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
}
.ts-panel {
  position: absolute;
  right: 0;
  bottom: 54px;
  background: var(--vp-c-bg-elv);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.16);
  min-width: 160px;
}
.ts-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13.5px;
  color: var(--vp-c-text-1);
  transition: background 0.15s;
}
.ts-item:hover {
  background: var(--vp-c-bg-soft);
}
.ts-item.active {
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.ts-dots {
  display: inline-flex;
  gap: 3px;
}
.ts-dots i {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}
.ts-label {
  line-height: 1;
}
</style>