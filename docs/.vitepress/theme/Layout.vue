<script setup>
import DefaultTheme from "vitepress/theme";
import { onMounted } from "vue";
import { useRouter } from "vitepress";
import mediumZoom from "medium-zoom";
import ThemeSwitcher from "./components/ThemeSwitcher.vue";

const { Layout } = DefaultTheme;
const router = useRouter();

// 图片灯箱：点击放大（vitepress-plugin-lightbox 配套）
const setupMediumZoom = () => {
  mediumZoom("[data-zoomable]", {
    background: "transparent",
  });
};

onMounted(setupMediumZoom);
router.onAfterRouteChanged = () => setupMediumZoom();
</script>

<template>
  <Layout />
  <ThemeSwitcher />
</template>
