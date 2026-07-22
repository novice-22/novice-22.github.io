// ───────────────────────────────────────────────────────────
// 사이트 전체 설정 — 여기만 고치면 블로그 전반에 반영됩니다.
// ───────────────────────────────────────────────────────────

export const SITE = {
  // astro.config.mjs 의 site 와 동일하게 유지
  url: "https://novice-22.com",
  title: "novice-22",
  tagline: "security research log",
  description: "취약점 분석 · 버그바운티 · CTF 기록. 발견한 것들을 글로 남기는 공간.",
  author: "novice-22",
};

// 사이드바 메뉴
export const NAV = [
  { label: "홈", href: "/" },
  { label: "보안뉴스 스크랩", href: "/news" },
  { label: "소개", href: "/about" },
];

// 카테고리 — slug(URL용)와 name(표시용)을 분리.
// 글의 category 값은 name 과 똑같이 적는다.
// "취약점 분석"만 하위 분야(children)로 한 번 더 나뉜다.
// 취약점 분석 글은 노션 "분야" 속성으로 분야를 지정한다.
export const CATEGORIES = [
  {
    slug: "vuln",
    name: "취약점 분석",
    children: [
      { slug: "web", name: "웹" },
      { slug: "iot", name: "IoT/펌웨어" },
      { slug: "aimcp", name: "AI/MCP" },
    ],
  },
  { slug: "report", name: "취약점 제보" },
  { slug: "project", name: "프로젝트" },
];

// 방문자 카운터 Worker 주소 (Cloudflare Workers)
export const VISITOR_API = "https://visitor-counter.gmemod6602.workers.dev";

// 외부 링크
export const SOCIAL = [
  { label: "GITHUB", href: "https://github.com/novice-22" },
  { label: "NOTION", href: "https://notion.novice-22.com" },
  { label: "TAJA", href: "https://taja.novice-22.com" },
  { label: "RSS", href: "/rss.xml" },
];

// ───────────────────────────────────────────────────────────
// 소개(About) 페이지 — 아래 틀에 내용만 채우면 됩니다.
// 용도: 이력서가 아니라 "이 블로그 주인이 어떤 사람인지" 정도.
// ───────────────────────────────────────────────────────────
export const ABOUT = {
  heading: "소개",

  // ① 나를 보여주는 소개 — 한 줄에 하나씩, 2~3줄 권장.
  //    사이드바 문구와 겹치지 않게, 좀 더 "사람"이 보이는 문장으로.
  //    예: "취약점을 찾고 분석하는 과정을 좋아합니다."
  lines: [
    "취약점을 찾고, 분석하고, 재현하는 과정을 좋아합니다.",
    "웹과 IoT를 주로 다루고, 직접 만든 진단 환경에서 실험한 것들을 기록합니다.",
    "(→ 본인 어필 문장으로 자유롭게 수정하세요)",
  ],

  // ② 관심 분야 태그 — 증명용 스킬이 아니라 "요즘 파는 것" 태그.
  //    자유롭게 추가/삭제.
  skills: ["Web", "1-day 분석", "IoT/펌웨어", "DevSecOps", "CTF"],

  // ③ 이력 — 이력서 스타일 섹션. 항목이 하나도 없는 섹션은 페이지에 표시되지 않음.
  //    when: 연도/기간(비워도 됨) · name: 이름 · desc: 한 줄 설명(선택)
  //    ▼ 아래 (괄호) 부분을 실제 내용으로 채우세요.
  resume: [
    {
      label: "교육 · 수료",
      items: [
        { when: "20XX", name: "K-Shield Jr. (기수 채우기)", desc: "" },
      ],
    },
    {
      label: "자격증",
      items: [
        { when: "20XX.XX", name: "(자격증 이름 채우기)", desc: "" },
      ],
    },
    {
      label: "활동",
      items: [
        { when: "20XX~", name: "CTF 팀 (팀 이름 채우기)", desc: "(포지션/분야 한 줄)" },
        { when: "", name: "DreamHack · 자작 진단 랩", desc: "" },
      ],
    },
    {
      label: "프로젝트",
      items: [
        { when: "20XX", name: "(프로젝트 이름 채우기)", desc: "(뭘 만들었고 뭘 배웠는지 한 줄)" },
      ],
    },
    {
      label: "수상 · 성과",
      items: [
        { when: "20XX.XX", name: "(대회/공모전 이름 · 순위 채우기)", desc: "" },
      ],
    },
    {
      label: "취약점 제보",
      items: [
        { when: "20XX.XX", name: "(KVE/CVE 번호 또는 제보 대상 채우기)", desc: "(취약점 종류 한 줄)" },
      ],
    },
    // ▼ 경력이 생기면 여기에 채우세요 (비어 있는 동안은 페이지에 안 보임).
    {
      label: "경력",
      items: [
        // 예: { when: "2027.01~", name: "회사 이름 — 보안 컨설팅 인턴", desc: "웹 취약점 진단" },
      ],
    },
  ],

  // ④ 연락처 — 외부(헤드헌팅 등) 연락 받을 메일.
  contact: "gmemod6602@gmail.com",
};

// 카테고리 헬퍼
export const categoryNameToSlug = (name: string) =>
  CATEGORIES.find((c) => c.name === name)?.slug ?? "etc";

export const categorySlugToName = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;

// 하위 분야를 가진 카테고리 (취약점 분석)
export const getCategory = (slug: string) =>
  CATEGORIES.find((c) => c.slug === slug);

export const fieldNameToSlug = (catSlug: string, fieldName: string) =>
  getCategory(catSlug)?.children?.find((f) => f.name === fieldName)?.slug ?? "etc";

export const fieldSlugToName = (catSlug: string, fieldSlug: string) =>
  getCategory(catSlug)?.children?.find((f) => f.slug === fieldSlug)?.name ?? fieldSlug;
