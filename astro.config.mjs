import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // ⚠️ 본인 GitHub Pages 주소로 바꾸세요 (src/consts.ts 의 SITE.url 과 동일하게)
  site: "https://novice-22.github.io",

  // user/org 페이지(your-username.github.io)면 base 불필요.
  // 프로젝트 페이지(your-username.github.io/repo-name)면 아래 주석 해제:
  // base: "/repo-name",

  integrations: [sitemap()],

  markdown: {
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: false,
    },
  },
});
