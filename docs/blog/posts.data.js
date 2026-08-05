// 博客文章数据源：构建时自动扫描 docs/blog/posts/*.md 的 frontmatter
// 由 BlogArchive 组件消费，写新文章后无需手动维护列表
import { createContentLoader } from "vitepress";

const pad = (n) => String(n).padStart(2, "0");
// 统一转成 "YYYY-MM-DD HH:MM"：保留时间，同一天的多篇文章也能精确排序
const fmtDateTime = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;

export default createContentLoader("/blog/posts/*.md", {
  transform(raw) {
    return raw
      .map(({ url, frontmatter }) => {
        let date = frontmatter.date;
        // YAML 可能把 date 解析成 Date 对象（无时区时间按 UTC 解析），
        // 也可能保留字符串；这里统一转成 "YYYY-MM-DD HH:MM" 字符串，
        // 字典序即时间序，天然可排序
        const dateStr =
          date instanceof Date
            ? fmtDateTime(
                new Date(date.getTime() + date.getTimezoneOffset() * 60000)
              ) // 补偿 YAML 的 UTC 解析，还原成本地时间
            : String(date || "").slice(0, 16).replace("T", " ");
        return {
          url,
          title: frontmatter.title || "未命名",
          date: dateStr,
          description: frontmatter.description || "",
          tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
        };
      })
      .sort((a, b) => (a.date > b.date ? 1 : -1)); // 编年史：最早在前
  },
});