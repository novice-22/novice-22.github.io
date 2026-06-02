import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// ── 기본: 로컬 마크다운 (src/content/posts/*.md) ──────────────
// 토큰 없이 바로 동작합니다. 글은 .md 파일로 추가하세요.
const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    pubDate: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    summary: z.string(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };

// ── Notion 연동으로 전환할 때 ────────────────────────────────
// 1) npm install notion-astro-loader   (Astro 6 호환 버전 확인)
// 2) Notion integration 생성 후 토큰 발급, DB를 integration에 공유
// 3) .env 에 NOTION_TOKEN / NOTION_DATABASE_ID 추가
// 4) 위 posts 컬렉션을 아래처럼 교체:
//
// import { notionLoader } from "notion-astro-loader";
// const posts = defineCollection({
//   loader: notionLoader({
//     token: import.meta.env.NOTION_TOKEN,
//     database_id: import.meta.env.NOTION_DATABASE_ID,
//     filter: { property: "발행", checkbox: { equals: true } },
//   }),
//   // schema 는 Notion DB 속성에서 자동 추론됩니다.
// });
//
// 자세한 매핑(제목/발행일/카테고리/태그/요약 → 프론트매터)은 README 참고.
