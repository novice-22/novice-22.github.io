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

// 홈 히어로의 소속 한 줄 — [라벨 : 이름] 형태로 나란히 표시됩니다.
// role 은 선택(있으면 이름 뒤에 괄호로 붙음). 항목을 추가하면 " | " 로 자동 구분.
export const AFFILIATIONS = [
  { label: "CTF Team", name: "RubiyaLab" },
  { label: "CTF 소그룹", name: "RubiyaLab Holiday", role: "Group Lead" },
];

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
    "모의해킹 분야 취업을 준비하고 있습니다.",
    "RubiyaLab 소속으로 CTF에 참여하고, 오픈소스 취약점 제보와 버그바운티를 하고 있습니다.",
    "보안 관련 개발도 좋아해서, 취미로 도구를 만들어보고 있습니다.",
  ],

  // ② 관심 분야 태그 — 증명용 스킬이 아니라 "요즘 파는 것" 태그.
  //    자유롭게 추가/삭제.
  skills: ["Web", "IoT/펌웨어", "AI/MCP", "1-day 분석", "버그바운티", "CTF"],

  // ③ 이력 — 이력서 스타일 섹션. 항목이 하나도 없는 섹션은 페이지에 표시되지 않음.
  //    when: 연도/기간(비워도 됨) · name: 이름 · desc: 한 줄 설명(선택)
  //    ▼ 아래 (괄호) 부분을 실제 내용으로 채우세요.
  //   ▼ 섹션 순서 = 페이지 표시 순서.
  resume: [
    {
      label: "CTF · Wargame",
      items: [
        { when: "2025.12 ~ 현재", name: "RubiyaLab", desc: "", href: "https://rubiyalab.team/" },
        { when: "2026.08 ~ 현재", name: "RubiyaLab Holiday", desc: "소그룹 · Group Lead" },
        { when: "", name: "", desc: "" }, // 한 줄 간격 (CTF ↔ Wargame 구분)
        { when: "webhacking.kr", name: "novice-22 · 랭킹 12위 (6695점, all clear)", desc: "", href: "https://webhacking.kr" },
      ],
    },
    {
      label: "교육 · 수료",
      items: [
        { when: "2026.03~05", name: "K-Shield Jr. 16기 모의해킹 및 취약점 진단", desc: "" },
        { when: "2026.06", name: "버그헌팅 실습훈련 중급과정 [8차]", desc: "KISA 실전형 사이버훈련장 (Security-Gym)" },
      ],
    },
    {
      label: "프로젝트",
      items: [
        {
          when: "2026.03~05",
          name: "IoT 취약점 분석 프로젝트",
          desc: "K-Shield Jr. 16기 모의해킹 및 취약점 진단",
        },
        {
          when: "2026.06~07",
          name: "1-day 취약점 분석 프로젝트",
          desc: "KISA 정보보안 프로젝트 멘토링 · Team Lead",
        },
      ],
    },
    {
      label: "수상 · 성과",
      items: [
        {
          when: "2026.08",
          name: "Black Hat USA 2026 · MSRC 비공개 행사 초청",
          desc: "invite-only researcher celebration",
        },
        { when: "2026.05", name: "IoT 취약점 분석 프로젝트", desc: "최우수 프로젝트" },
      ],
    },
    // 오픈소스 취약점 제보 — GitHub 프로젝트 대상. 새 제보는 아래 줄에 계속 추가.
    //   패턴: { when: "대상 프로젝트", name: "CVE 번호(또는 발급 대기)", desc: "CWE 등 비고" }
    {
      label: "취약점 제보 · 오픈소스 (CVE)",
      items: [
        { when: "mcpvault", name: "CVE-2026-57441", desc: "", href: "https://github.com/bitbonsai/mcpvault/security/advisories/GHSA-j99q-93c9-h869" },
        { when: "browse-mcp", name: "CVE-2026-55557", desc: "", href: "https://github.com/That1Drifter/browse-mcp/security/advisories/GHSA-m9mq-7m7q-xc6p" },
        { when: "pdf-reader-mcp", name: "CVE-2026-62264", desc: "", href: "https://github.com/SylphxAI/pdf-reader-mcp/security/advisories/GHSA-q344-5v34-gm84" },
        { when: "mssql-mcp-core", name: "CVE-2026-63129", desc: "", href: "https://github.com/ConnorBritain/mssql-mcp-core/security/advisories/GHSA-2m9m-6cr5-9x25" },
        { when: "nginx-ui", name: "CVE 발급 대기", desc: "", href: "https://github.com/0xJacky/nginx-ui/security/advisories/GHSA-76pm-mq2q-9gcr" },
        { when: "nginx-ui", name: "CVE 발급 대기", desc: "", href: "https://github.com/0xJacky/nginx-ui/security/advisories/GHSA-cf23-7qxj-xmhr" },
        { when: "fast-agent", name: "CVE 발급 대기", desc: "", href: "https://github.com/evalstate/fast-agent/security/advisories/GHSA-9vhv-g5hf-m7m7" },
      ],
    },
    // 버그바운티 — 플랫폼별로 항목이 쌓임.
    //   · 같은 플랫폼(FinderGap 등)에서 리포트가 더 나오면 그 아래 줄만 추가.
    //   · 새 플랫폼(HackerOne 등)이 생기면 when 에 플랫폼명을 넣어 이어서 추가.
    //   패턴: { when: "플랫폼", name: "리포트번호", desc: "상태 · 포인트" }
    {
      label: "버그바운티",
      items: [
        { when: "FinderGap", name: "FVE-2026-615c-74655", desc: "유효 리포트 · 47 point" },
      ],
    },
    {
      label: "자격증",
      items: [
        { when: "2026", name: "정보보안기사", desc: "필기 합격 · 실기 2회차 준비 중" },
        { when: "2023.05", name: "정보보안산업기사", desc: "" },
        { when: "2022.07", name: "리눅스마스터 2급", desc: "" },
        { when: "2022.04", name: "네트워크관리사 2급", desc: "" },
      ],
    },
    {
      label: "경력",
      items: [
        { when: "2023 ~ 2025", name: "공군 정보보호병", desc: "" },
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
