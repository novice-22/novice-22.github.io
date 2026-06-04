// ───────────────────────────────────────────────────────────
// 사이트 전체 설정 — 여기만 고치면 블로그 전반에 반영됩니다.
// ───────────────────────────────────────────────────────────

export const SITE = {
  // GitHub Pages 주소로 바꾸세요 (astro.config.mjs 의 site 와 동일하게)
  url: "https://novice-22.github.io",
  title: "urim",
  tagline: "security research log",
  description: "취약점 분석 · 버그바운티 · CTF 기록. 발견한 것들을 글로 남기는 공간.",
  author: "urim",
};

// 사이드바 메뉴
export const NAV = [
  { label: "홈", href: "/" },
  { label: "글 전체", href: "/posts" },
  { label: "소개", href: "/about" },
];

// 카테고리 — slug(URL용)와 name(표시용)을 분리
// 글 프론트매터의 category 값은 name 과 똑같이 적으면 됩니다.
export const CATEGORIES = [
  { slug: "vuln", name: "취약점 분석" },
  { slug: "bugbounty", name: "버그바운티" },
  { slug: "ctf", name: "CTF · 워게임" },
  { slug: "project", name: "프로젝트" },
  { slug: "news", name: "보안뉴스" },
  { slug: "study", name: "학습 노트" },
];

// 외부 링크 (USERNAME 부분을 본인 계정으로)
export const SOCIAL = [
  { label: "GITHUB", href: "https://github.com/novice-22" },
  { label: "HACKERONE", href: "https://hackerone.com/your-username" },
  { label: "RSS", href: "/rss.xml" },
];

// 소개(About) 페이지 내용 — 자유롭게 수정
export const ABOUT = {
  heading: "소개",
  lines: [
    "보안을 공부하고, 찾은 것들을 기록합니다.",
    "취약점 분석 · 버그바운티 · CTF · 자작 진단 환경.",
  ],
  skills: ["Web", "1-day 분석", "IoT/펌웨어", "DevSecOps", "CTF"],
  // 키-값 형태로 표시됩니다.
  facts: [
    { k: "교육", v: "K-Shield Jr." },
    { k: "활동", v: "HackerOne VDP · DreamHack" },
    { k: "관심", v: "취약점 진단 · 자동화" },
  ],
  contact: "your-email@example.com",
};

// 카테고리 헬퍼
export const categoryNameToSlug = (name: string) =>
  CATEGORIES.find((c) => c.name === name)?.slug ?? "etc";

export const categorySlugToName = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
