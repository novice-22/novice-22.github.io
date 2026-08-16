import { defineCollection, z } from "astro:content";
import { notionLoader } from "notion-astro-loader";
import {
  notionPageSchema,
  transformedPropertySchema as t,
} from "notion-astro-loader/schemas";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// 노션 코드블록 문법 강조 — 로더는 <pre><code class="language-x"> 만 내보내고
// Astro 의 Shiki 파이프라인을 타지 않아 색이 안 입혀진다. 여기서 직접 Shiki(one-dark-pro)를
// 돌려 사이트의 다른 코드블록과 동일하게 맞춘다. (shiki 는 Astro 의존성이라 추가 설치 없음)
const SHIKI_LANGS = [
  "typescript", "javascript", "tsx", "jsx", "json", "bash", "shell", "python",
  "go", "rust", "c", "cpp", "java", "php", "ruby", "sql", "yaml", "toml",
  "html", "css", "xml", "diff", "powershell", "ini", "markdown", "docker",
];
let hlPromise: Promise<any> | null = null;
function getHighlighter() {
  if (!hlPromise) {
    hlPromise = import("shiki").then((s) =>
      s.createHighlighter({ themes: ["one-dark-pro"], langs: SHIKI_LANGS })
    );
  }
  return hlPromise;
}
function rehypeShikiCode() {
  return async (tree: any) => {
    const targets: { node: any; parent: any; index: number }[] = [];
    const walk = (node: any, parent: any = null, index = 0) => {
      if (
        node?.tagName === "pre" &&
        node.children?.length === 1 &&
        node.children[0]?.tagName === "code"
      ) {
        targets.push({ node, parent, index });
        return; // pre 안쪽은 더 안 봐도 됨
      }
      node?.children?.forEach((c: any, i: number) => walk(c, node, i));
    };
    walk(tree);
    if (!targets.length) return;

    const hl = await getHighlighter();
    const loaded = new Set(hl.getLoadedLanguages());
    const textOf = (n: any): string =>
      n.type === "text" ? n.value : (n.children ?? []).map(textOf).join("");

    for (const { node, parent, index } of targets) {
      if (!parent) continue;
      const code = node.children[0];
      const cls: string[] = (code.properties?.className ?? []) as string[];
      // "language-typescript" → typescript. "plain text" 처럼 미지원이면 텍스트로.
      const raw = (cls.find((c) => c.startsWith("language-")) ?? "").replace("language-", "");
      const lang = loaded.has(raw) ? raw : "text";
      try {
        const hast = hl.codeToHast(textOf(code).replace(/\n$/, ""), {
          lang,
          theme: "one-dark-pro",
        });
        const pre = hast.children?.find((c: any) => c.tagName === "pre");
        if (pre) parent.children[index] = pre;
      } catch {
        // 강조 실패 시 원본 <pre> 유지 (빌드는 계속)
      }
    }
  };
}

// 본문(노션)에서 온 외부 링크는 새 탭으로 열리게 한다.
// 내부 링크(/posts/... , #앵커)는 같은 탭 유지 — 사이트 안 이동까지 새 탭이면 불편하다.
function rehypeExternalLinks() {
  return (tree: any) => {
    const walk = (n: any) => {
      if (n?.tagName === "a") {
        const href = n.properties?.href;
        if (typeof href === "string" && /^https?:\/\//i.test(href)) {
          n.properties.target = "_blank";
          n.properties.rel = "noopener noreferrer";
        }
      }
      n?.children?.forEach(walk);
    };
    walk(tree);
  };
}

// 본문에 직접 쓴 "목차" 목록을 실제 헤딩 링크로 바꿔준다.
// (노션에서 번호 목록으로 적은 목차는 그냥 텍스트라 클릭이 안 됨 → 글 내용은 그대로 두고 <a> 만 입힘)
// "목차" 가 들어간 헤딩 바로 다음 목록에만 적용해서, 본문의 다른 목록은 건드리지 않는다.
function rehypeLinkManualToc() {
  // 비교용 정규화: 이모지·기호 제거, 앞 번호("1." "2)") 제거, 공백 정리
  const norm = (s: string) =>
    s
      .replace(/[\p{Extended_Pictographic}️]/gu, "")
      .replace(/^\s*\d+\s*[.)]\s*/, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  return (tree: any) => {
    const textOf = (n: any): string =>
      n.type === "text" ? n.value : (n.children ?? []).map(textOf).join("");

    // 1) 헤딩 수집 (id 있는 것만)
    const heads: { id: string; key: string }[] = [];
    const collect = (n: any) => {
      if (/^h[1-6]$/.test(n?.tagName ?? "") && n.properties?.id) {
        heads.push({ id: String(n.properties.id), key: norm(textOf(n)) });
      }
      n?.children?.forEach(collect);
    };
    collect(tree);
    if (!heads.length) return;

    // 2) "목차" 헤딩 바로 뒤의 목록 찾기
    const linkList = (list: any) => {
      for (const li of list.children ?? []) {
        if (li.tagName !== "li") continue;
        // 이미 링크가 있으면 통과
        if ((li.children ?? []).some((c: any) => c.tagName === "a")) continue;
        const hit = heads.find((h) => h.key && h.key === norm(textOf(li)));
        if (!hit) continue;
        li.children = [
          {
            type: "element",
            tagName: "a",
            properties: { href: `#${hit.id}`, className: ["toc-jump"] },
            children: li.children,
          },
        ];
      }
    };

    const scan = (parent: any) => {
      const kids = parent?.children ?? [];
      kids.forEach((n: any, i: number) => {
        if (/^h[1-6]$/.test(n?.tagName ?? "") && /목차/.test(textOf(n))) {
          const next = kids.slice(i + 1).find((c: any) => c.type === "element");
          if (next && (next.tagName === "ol" || next.tagName === "ul")) linkList(next);
        }
        scan(n);
      });
    };
    scan(tree);
  };
}

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
            headers: { "User-Agent": "novice-22-blog/1.0 (+https://novice-22.com)" },
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
    rehypePlugins: [rehypeDownloadImages, rehypeLinkManualToc, rehypeShikiCode, rehypeExternalLinks],
  }),
  schema: notionPageSchema({
    properties: z.object({
      제목: t.title,
      슬러그: t.rich_text.optional(),
      카테고리: t.select.optional(),
      분야: t.select.optional(), // 취약점 분석 글의 하위 분야 (웹/IoT·펌웨어/AI·MCP)
      태그: t.multi_select.optional(),
      "제보 제목": t.rich_text.optional(), // 목록 카드·메타 설명에 쓰는 한 줄 (GHSA 등 원문 제목)
      발행일: t.date.optional(),
    }),
  }).transform((page) => ({
    title: page.properties.제목,
    slug: page.properties.슬러그?.trim() || undefined, // 비면 페이지 id로 폴백
    category: page.properties.카테고리 ?? "취약점 분석",
    field: page.properties.분야 ?? null, // 취약점 분석만 사용, 나머지는 null
    tags: page.properties.태그 ?? [],
    summary: page.properties["제보 제목"] ?? "",
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
    rehypePlugins: [rehypeStripImages, rehypeExternalLinks],
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
