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
