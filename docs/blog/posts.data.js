// 博客文章数据源：构建时自动扫描 docs/blog/posts/*.md 的 frontmatter
// 由 BlogArchive 组件消费，写新文章后无需手动维护列表
import { createContentLoader } from "vitepress";

const pad = (n) => String(n).padStart(2, "0");
const fmtDate = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default createContentLoader("/blog/posts/*.md", {
  transform(raw) {
    return raw
      .map(({ url, frontmatter }) => {
        let date = frontmatter.date;
        // YAML 可能把 date 解析成 Date 对象，统一转成 YYYY-MM-DD
        const dateStr =
          date instanceof Date
            ? fmtDate(date)
            : String(date || "").slice(0, 10);
        return {
          url,
          title: frontmatter.title || "未命名",
          date: dateStr,
          description: frontmatter.description || "",
          tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1)); // 最新在前
  },
});
