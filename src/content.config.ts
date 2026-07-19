import { defineCollection, z } from "astro:content";
import { notionLoader } from "notion-astro-loader";
import {
  notionPageSchema,
  transformedPropertySchema as t,
} from "notion-astro-loader/schemas";

// ── Notion 연동 (ON) ─────────────────────────────────────────
// 글 소스 = Notion "📝 블로그 Pipeline" DB.
// "발행" 체크된 글만 불러오고, 노션 속성을 기존 사이트 스키마
// (title/pubDate/category/tags/summary/draft)로 변환한다.
const posts = defineCollection({
  loader: notionLoader({
    auth: import.meta.env.NOTION_TOKEN,
    database_id: import.meta.env.NOTION_DATABASE_ID,
    // 발행 체크된 글만
    filter: { property: "발행", checkbox: { equals: true } },
  }),
  schema: notionPageSchema({
    properties: z.object({
      제목: t.title,
      슬러그: t.rich_text.optional(),
      카테고리: t.select.optional(),
      태그: t.multi_select.optional(),
      요약: t.rich_text.optional(),
      발행일: t.date.optional(),
    }),
  }).transform((page) => ({
    title: page.properties.제목,
    slug: page.properties.슬러그?.trim() || undefined, // 비면 페이지 id로 폴백
    category: page.properties.카테고리 ?? "학습 노트",
    tags: page.properties.태그 ?? [],
    summary: page.properties.요약 ?? "",
    pubDate: page.properties.발행일?.start ?? new Date(),
    draft: false, // 로더에서 이미 "발행" 필터링됨
  })),
});

export const collections = { posts };

// ── 로컬 마크다운으로 되돌리려면 ─────────────────────────────
// 아래 블록으로 교체하면 src/content/posts/*.md 를 다시 소스로 사용.
//
// import { glob } from "astro/loaders";
// const posts = defineCollection({
//   loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
//   schema: z.object({
//     title: z.string(),
//     pubDate: z.coerce.date(),
//     category: z.string(),
//     tags: z.array(z.string()).default([]),
//     summary: z.string(),
//     draft: z.boolean().default(false),
//   }),
// });
