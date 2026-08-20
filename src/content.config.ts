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

// 노션 표 셀에는 정렬용 nbsp(U+00A0)가 잔뜩 붙어 온다. 일반 공백과 달리 접히지 않아
// 칸을 밀어내고 단어를 쪼개므로, 표 셀 앞뒤의 nbsp 를 정리한다.
function rehypeTrimTableCells() {
  return (tree: any) => {
    const clean = (n: any) => {
      if (n?.type === "text") {
        n.value = n.value.replace(/ /g, " ");
      }
      n?.children?.forEach(clean);
    };
    const trimEdges = (cell: any) => {
      const kids = cell.children ?? [];
      const first = kids.find((c: any) => c.type === "text");
      const last = [...kids].reverse().find((c: any) => c.type === "text");
      if (first) first.value = first.value.replace(/^s+/, "");
      if (last) last.value = last.value.replace(/s+$/, "");
    };
    const walk = (n: any) => {
      if (n?.tagName === "th" || n?.tagName === "td") {
        clean(n);
        trimEdges(n);
        return;
      }
      n?.children?.forEach(walk);
    };
    walk(tree);
  };
}

// 노션 "링크 멘션"은 제목·파비콘(mention.link_mention)을 들고 있는데,
// 로더가 쓰는 plain_text 에는 URL 이 들어 있어 본문에 긴 주소가 그대로 찍힌다.
// rehype 단계에서는 멘션 정보가 사라지므로, 원본 블록(file.data)에서
// href → {제목, 아이콘} 지도를 만들어 노션과 같은 칩 모양으로 되돌린다.
// 파비콘은 빌드 때 받아 /notion-img/ 로 넣는다 (사이트에서 외부 요청이 나가지 않게).
function rehypeMentionTitles() {
  return async (tree: any, file: any) => {
    const mentions = new Map<string, { title: string; icon?: string }>();
    const seen = new Set<any>();
    const collect = (n: any, depth = 0) => {
      if (!n || typeof n !== "object" || depth > 12 || seen.has(n)) return;
      seen.add(n);
      if (Array.isArray(n)) return n.forEach((c) => collect(c, depth + 1));
      const lm = n?.mention?.link_mention;
      if (lm?.href && lm?.title) {
        mentions.set(String(lm.href), {
          title: String(lm.title),
          icon: lm.icon_url ? String(lm.icon_url) : undefined,
        });
      }
      for (const v of Object.values(n)) collect(v, depth + 1);
    };
    collect(file?.data);
    if (!mentions.size) return;

    // 표시 텍스트가 URL 그대로인 링크만 대상 (직접 쓴 링크 텍스트는 보존)
    const textOf = (n: any): string =>
      n.type === "text" ? n.value : (n.children ?? []).map(textOf).join("");
    const targets: { node: any; info: { title: string; icon?: string } }[] = [];
    const walk = (n: any) => {
      if (n?.tagName === "a") {
        const href = String(n.properties?.href ?? "");
        const info = mentions.get(href);
        if (info && textOf(n).trim() === href) targets.push({ node: n, info });
      }
      n?.children?.forEach(walk);
    };
    walk(tree);
    if (!targets.length) return;

    // 같은 아이콘은 한 번만 받는다
    const iconUrls = [...new Set(targets.map((t) => t.info.icon).filter(Boolean))] as string[];
    const localIcons = new Map<string, string>();
    await Promise.all(
      iconUrls.map(async (url) => {
        const local = await saveRemoteImage(url);
        if (local) localIcons.set(url, local);
      })
    );

    for (const { node, info } of targets) {
      const icon = info.icon ? localIcons.get(info.icon) : undefined;
      const kids: any[] = [];
      if (icon) {
        kids.push({
          type: "element",
          tagName: "img",
          properties: { src: icon, alt: "", loading: "lazy", "aria-hidden": "true" },
          children: [],
        });
      }
      kids.push({ type: "text", value: info.title });
      node.children = kids;
      node.properties = { ...node.properties, className: ["link-mention"] };
    }
  };
}

// 노션의 셀 병합(colspan)은 로더가 버려서, 병합된 머리글이
// "내용 있는 칸 + 뒤따르는 빈 칸들"로 넘어온다. 표의 첫 행에 한해
// 뒤쪽 빈 칸을 마지막 내용 칸에 colspan 으로 되돌려준다.
// (첫 행만 손대므로 본문 행의 '값이 비어 있는 칸'은 건드리지 않는다)
function rehypeMergeTableHeader() {
  return (tree: any) => {
    const textOf = (n: any): string =>
      n.type === "text" ? n.value : (n.children ?? []).map(textOf).join("");
    const walk = (n: any) => {
      if (n?.tagName === "table") {
        const rows: any[] = [];
        const collectRows = (x: any) => {
          if (x?.tagName === "tr") rows.push(x);
          else x?.children?.forEach(collectRows);
        };
        collectRows(n);
        const first = rows[0];
        if (first) {
          const cells = (first.children ?? []).filter(
            (c: any) => c.tagName === "th" || c.tagName === "td"
          );
          let last = cells.length - 1;
          while (last > 0 && textOf(cells[last]).trim() === "") last--;
          const empties = cells.length - 1 - last;
          if (empties >= 1 && textOf(cells[last]).trim() !== "") {
            cells[last].properties = cells[last].properties ?? {};
            cells[last].properties.colSpan = empties + 1;
            const drop = new Set(cells.slice(last + 1));
            first.children = (first.children ?? []).filter((c: any) => !drop.has(c));
          }
        }
      }
      n?.children?.forEach(walk);
    };
    walk(tree);
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

// 원격 이미지를 내려받아 public/notion-img/<해시>.<확장자> 로 저장하고 로컬 경로를 돌려준다.
// 실패하면 null (빌드는 계속). 본문 이미지와 멘션 파비콘이 같이 쓴다.
async function saveRemoteImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "novice-22-blog/1.0 (+https://novice-22.com)" },
    });
    if (!res.ok) return null;
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
            : ct.includes("icon")
              ? "ico"
              : "jpg";
    const hash = createHash("sha1").update(buf).digest("hex").slice(0, 16);
    if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });
    writeFileSync(join(IMG_DIR, `${hash}.${ext}`), buf);
    return `/notion-img/${hash}.${ext}`;
  } catch {
    return null;
  }
}

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
        const local = await saveRemoteImage(realUrl);
        if (!local) return; // 실패 시 원본 유지 (빌드는 계속)
        node.properties.src = local;
        delete node.properties.srcset;
        delete node.properties.width;
        delete node.properties.height;
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
    rehypePlugins: [rehypeDownloadImages, rehypeLinkManualToc, rehypeShikiCode, rehypeMentionTitles, rehypeExternalLinks, rehypeTrimTableCells, rehypeMergeTableHeader],
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

// ── 주요통신기반시설(주통기) 점검 항목 ────────────────────────
// 노션의 별도 DB("주통기 웹 애플리케이션 21항목")를 그대로 읽어온다.
// 출력 모양을 posts 와 똑같이 맞춰서, 기존 카드·글 페이지·검색이 그대로 동작하게 함.
//   슬러그: 코드(SI, SF …)가 항목마다 고유하므로 cii-<코드> 로 URL 고정
//   요약:   점검 경로를 목록 카드 한 줄 설명으로 사용
const cii = defineCollection({
  loader: notionLoader({
    auth: import.meta.env.NOTION_TOKEN,
    database_id: "3bff35df-dcf4-80d4-8f89-dbab7f0ceaba",
    // 내용을 다 쓴 항목만 공개 (빈 템플릿이 올라가지 않게)
    filter: { property: "발행", checkbox: { equals: true } },
    rehypePlugins: [rehypeDownloadImages, rehypeLinkManualToc, rehypeShikiCode, rehypeMentionTitles, rehypeExternalLinks, rehypeTrimTableCells, rehypeMergeTableHeader],
  }),
  schema: notionPageSchema({
    properties: z.object({
      이름: t.title,
      코드: t.select.optional(),
      내부코드: t.multi_select.optional(),
      "점검 경로": t.rich_text.optional(),
      중요도: t.select.optional(),
      판정: t.select.optional(),
      발행일: t.date.optional(),
    }),
  }).transform((page) => ({
    title: page.properties.이름,
    slug: page.properties.코드 ? `cii-${page.properties.코드.toLowerCase()}` : undefined,
    category: "주요통신기반시설",
    field: null,
    tags: page.properties.내부코드 ?? [],
    summary: page.properties["점검 경로"] ?? "",
    pubDate: page.properties.발행일?.start ?? new Date(),
    draft: false, // 로더에서 이미 "발행" 필터링됨
    // 주통기 전용 부가 정보 (목록·글 상단에 뱃지로 쓸 수 있음)
    severity: page.properties.중요도 ?? null,
    verdict: page.properties.판정 ?? null,
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
    rehypePlugins: [rehypeStripImages, rehypeMentionTitles, rehypeExternalLinks, rehypeTrimTableCells, rehypeMergeTableHeader],
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

export const collections = { posts, cii, news };

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
