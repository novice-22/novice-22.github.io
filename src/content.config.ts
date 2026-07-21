import { defineCollection, z } from "astro:content";
import { notionLoader } from "notion-astro-loader";
import {
  notionPageSchema,
  transformedPropertySchema as t,
} from "notion-astro-loader/schemas";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// 블로그 글 이미지: 노션 임시 URL을 빌드 때 내려받아 정적 파일(public/notion-img)로
// 저장하고 경로를 바꿔치기 → 정적 호스팅에서도 깨지지 않게.
const IMG_DIR = "public/notion-img";
function rehypeDownloadImages() {
  return async (tree: any) => {
    const imgs: any[] = [];
    const walk = (n: any) => {
      if (n?.type === "element" && n.tagName === "img") imgs.push(n);
      n?.children?.forEach(walk);
    };
    walk(tree);
    await Promise.all(
      imgs.map(async (node) => {
        const src = node.properties?.src;
        if (!src || typeof src !== "string") return;
        // 로더가 만든 /_image?href=<원본> 에서 원본 URL 추출
        let realUrl = src;
        const m = src.match(/[?&]href=([^&]+)/);
        if (m) realUrl = decodeURIComponent(m[1]);
        if (!/^https?:\/\//.test(realUrl)) return; // 이미 로컬이면 통과
        try {
          const res = await fetch(realUrl, {
            headers: { "User-Agent": "urim-blog/1.0 (+https://novice-22.com)" },
          });
          if (!res.ok) return;
          const buf = Buffer.from(await res.arrayBuffer());
          const ct = res.headers.get("content-type") || "";
          const ext = ct.includes("png")
            ? "png"
            : ct.includes("webp")
              ? "webp"
              : ct.includes("gif")
                ? "gif"
                : ct.includes("svg")
                  ? "svg"
                  : "jpg";
          const hash = createHash("sha1").update(buf).digest("hex").slice(0, 16);
          if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });
          writeFileSync(join(IMG_DIR, `${hash}.${ext}`), buf);
          node.properties.src = `/notion-img/${hash}.${ext}`;
          delete node.properties.srcset;
          delete node.properties.width;
          delete node.properties.height;
        } catch {
          // 실패 시 원본 유지 (빌드는 계속)
        }
      })
    );
  };
}

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
    rehypePlugins: [rehypeDownloadImages],
  }),
  schema: notionPageSchema({
    properties: z.object({
      제목: t.title,
      슬러그: t.rich_text.optional(),
      카테고리: t.select.optional(),
      분야: t.select.optional(), // 취약점 분석 글의 하위 분야 (웹/IoT·펌웨어/AI·MCP)
      태그: t.multi_select.optional(),
      요약: t.rich_text.optional(),
      발행일: t.date.optional(),
    }),
  }).transform((page) => ({
    title: page.properties.제목,
    slug: page.properties.슬러그?.trim() || undefined, // 비면 페이지 id로 폴백
    category: page.properties.카테고리 ?? "취약점 분석",
    field: page.properties.분야 ?? null, // 취약점 분석만 사용, 나머지는 null
    tags: page.properties.태그 ?? [],
    summary: page.properties.요약 ?? "",
    pubDate: page.properties.발행일?.start ?? new Date(),
    draft: false, // 로더에서 이미 "발행" 필터링됨
  })),
});

// 뉴스 본문에서 기사 이미지(저작권·만료 URL) 제거 — 렌더 자체를 안 하게
function rehypeStripImages() {
  return (tree: any) => {
    const strip = (node: any) => {
      if (!node.children) return;
      node.children = node.children.filter(
        (c: any) => !(c.type === "element" && c.tagName === "img")
      );
      node.children.forEach(strip);
    };
    strip(tree);
  };
}

// ── 보안뉴스 스크랩 (Notion "보안뉴스 스크랩" DB) ────────────
// 뉴스 제목 + 원문 링크 + 내 요약·느낀점. "발행" 체크된 것만.
const news = defineCollection({
  loader: notionLoader({
    auth: import.meta.env.NOTION_TOKEN,
    database_id: "1f56ae44781344a7a1f317f86526bcc8",
    filter: { property: "발행", checkbox: { equals: true } },
    rehypePlugins: [rehypeStripImages],
  }),
  schema: notionPageSchema({
    properties: z.object({
      "뉴스 제목": t.title,
      "원문 URL": t.url.optional(),
      카테고리: t.multi_select.optional(),
      키워드: t.multi_select.optional(),
      날짜: t.date.optional(),
    }),
  }).transform((page) => ({
    title: page.properties["뉴스 제목"],
    source: page.properties["원문 URL"] ?? "",
    categories: page.properties.카테고리 ?? [],
    keywords: page.properties.키워드 ?? [],
    // 날짜 없으면 아주 옛날로 → 정렬 시 맨 아래로 (맨 위로 튀지 않게)
    date: page.properties.날짜?.start ?? new Date(0),
  })),
});

export const collections = { posts, news };

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
