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

// 글 URL 슬러그 — 노션 "슬러그" 속성이 있으면 그걸, 없으면 페이지 id로 폴백
export function postSlug(post: { id: string; data: { slug?: string } }): string {
  return post.data.slug || post.id;
}
