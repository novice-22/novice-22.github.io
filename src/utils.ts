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
export function postSlug(post: { id: string; data: { slug?: string } }): string {
  return post.data.slug || post.id;
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
