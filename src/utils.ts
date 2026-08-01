// 날짜 → "2026.05.28"
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

// 본문 글자 수로 대략적인 읽는 시간(분) 추정 — 한국어 기준 분당 ~500자
export function readingTime(body: string | undefined): number {
  if (!body) return 1;
  const chars = body.replace(/\s/g, "").length;
  return Math.max(1, Math.round(chars / 500));
}

// 날짜 → "2026-07-19" (URL 슬러그용)
function dateSlug(date: Date | string): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 글 URL 슬러그 — 노션 "슬러그" 속성이 있으면 그걸, 없으면 페이지 id로 폴백
// 제목 → URL 슬러그. 소문자화, 영숫자와 점(.)은 유지, 나머지는 하이픈으로.
//   점을 살려 파일·패키지명(neo.mjs 등)이 쪼개지지 않게 함.
//   예) "CVE-2026-1111 : neo.mjs" → "cve-2026-1111-neo.mjs"
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-") // 영숫자·점 외에는 하이픈
    .replace(/^[-.]+|[-.]+$/g, ""); // 앞뒤의 하이픈·점 제거
}

// 글 URL 슬러그. 우선순위:
//   1) 슬러그를 직접 입력 → 그걸 사용 (링크 고정이 필요한 글: CVE 참조 등)
//   2) "취약점 제보" 카테고리 → 제목으로 자동 생성 (제목이 영문·숫자 형태 전제)
//   3) 그 외 → 노션 페이지 id 폴백 (한글 제목 등 slugify 부적합한 경우 대비)
export function postSlug(post: {
  id: string;
  data: { slug?: string; category?: string; title?: string };
}): string {
  // 직접 입력한 슬러그도 slugify로 정리(대문자→소문자 등) → URL 통일
  if (post.data.slug) {
    const manual = slugify(post.data.slug);
    if (manual) return manual;
  }
  if (post.data.category === "취약점 제보" && post.data.title) {
    const auto = slugify(post.data.title);
    if (auto) return auto;
  }
  return post.id;
}

// 뉴스 URL 슬러그 — 슬러그 있으면 그걸, 없으면 날짜 기반(2026-07-19).
// 같은 날 여러 개면 뒤에 -2, -3 … 을 붙여 중복 방지.
export function newsSlugs<T extends { id: string; data: { slug?: string; date: Date | string } }>(
  items: T[]
): Map<string, string> {
  const used = new Map<string, number>();
  const result = new Map<string, string>();
  // 날짜 오름차순으로 번호를 매겨야 오래된 글의 URL이 안정적
  const ordered = [...items].sort(
    (a, b) => new Date(a.data.date).valueOf() - new Date(b.data.date).valueOf()
  );
  for (const item of ordered) {
    if (item.data.slug) {
      result.set(item.id, item.data.slug);
      continue;
    }
    const base = dateSlug(item.data.date);
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    result.set(item.id, n === 1 ? base : `${base}-${n}`);
  }
  return result;
}
