import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // src/consts.ts 의 SITE.url 과 동일하게 유지
  site: "https://novice-22.com",

  // user/org 페이지(your-username.github.io)면 base 불필요.
  // 프로젝트 페이지(your-username.github.io/repo-name)면 아래 주석 해제:
  // base: "/repo-name",

  integrations: [sitemap()],

  // Notion 본문 이미지(원격 AWS 버킷)를 빌드 시 처리
  image: {
    remotePatterns: [{ protocol: "https", hostname: "**.amazonaws.com" }],
  },

  markdown: {
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: false,
    },
  },
});
