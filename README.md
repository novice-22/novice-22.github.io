# novice-22 — security research log

Astro 기반 정적 기술 블로그. 다크 "research log" 디자인, 코드 하이라이팅·목차·RSS·다크/라이트 토글 포함.
기본은 로컬 마크다운으로 바로 동작하고, 준비되면 Notion을 CMS로 붙일 수 있습니다.

> 아래 명령어는 모두 **Windows 명령 프롬프트(cmd)** 기준입니다.

---

## 사전 준비

1. **Node.js 설치** — [nodejs.org](https://nodejs.org) 에서 최신 LTS 설치 (npm 같이 설치됨). npm 명령이 동작하려면 필수입니다.
2. **설치 확인** — cmd를 새로 열고:
   ```bat
   node -v
   npm -v
   ```
   버전이 찍히면 정상입니다.
3. **압축 풀기** — 탐색기에서 우클릭 → 압축 풀기, 또는 cmd에서:
   ```bat
   tar -xf astro-blog.zip
   ```

---

## 빠른 시작

```bat
cd astro-blog
npm install
npm run dev
```

- `npm run dev` 실행 후 브라우저에서 **http://localhost:4321** 접속
- 빌드: `npm run build` (정적 파일이 `dist\` 폴더에 생성)
- 빌드 미리보기: `npm run preview`

---

## 커스터마이즈

설정은 두 파일만 고치면 됩니다.

- **`src\consts.ts`** — 제목, 메뉴, 카테고리, 소셜 링크, 소개(About) 내용
- **`astro.config.mjs`** — `site`(본인 GitHub Pages 주소), 프로젝트 페이지면 `base`

`your-username` / 링크 / 소개 텍스트를 본인 것으로 바꾸세요.

---

## 글 작성 (로컬 마크다운)

`src\content\posts\` 에 `.md` 파일을 추가합니다. 파일명이 곧 URL slug가 됩니다.

```markdown
---
title: "글 제목"
pubDate: 2026-06-01
category: "취약점 분석"
tags: ["web", "writeup"]
summary: "목록 카드에 보일 한 줄 요약."
draft: false
---

본문 (마크다운). 코드블록은 자동 하이라이팅, 헤딩(##)은 자동 목차.
```

`category` 는 `consts.ts` 의 카테고리 name 과 똑같이 적으세요. `draft: true` 면 빌드에서 제외됩니다.

---

## GitHub Pages 배포

1. 레포를 GitHub에 올립니다 (기본 브랜치 `main`, git push로 업로드).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions** 선택.
3. `astro.config.mjs` 의 `site` 를 본인 주소로 (`https://<id>.github.io`).
   - user 페이지(`<id>.github.io`)면 `base` 불필요.
   - 프로젝트 페이지(`<id>.github.io/<repo>`)면 `base: "/<repo>"` 주석 해제.
4. push 하면 `.github\workflows\deploy.yml` 이 자동으로 빌드·배포합니다. (Actions 탭에서 수동 실행도 가능)

---

## Notion 연동 켜기

로컬 마크다운 대신 Notion DB를 글 소스로 쓰고 싶을 때:

1. **로더 설치**
   ```bat
   npm install notion-astro-loader
   ```
   (Astro 6 호환 버전인지 확인. 포크가 여럿이라 이슈가 있으면 다른 포크로 교체.)
2. **Notion integration 생성** — notion.so/my-integrations 에서 만들고 토큰 발급 → 글이 담긴 DB를 그 integration에 **공유(Connections)**.
3. **DB ID 확보** — DB URL의 32자리 ID 부분.
4. **자격 증명 등록**
   - 로컬: 토큰 파일을 복사한 뒤 값 채우기
     ```bat
     copy .env.example .env
     ```
   - GitHub: **Settings → Secrets and variables → Actions** 에 `NOTION_TOKEN`, `NOTION_DATABASE_ID` 등록.
5. **컬렉션 교체** — `src\content.config.ts` 의 `posts` 를 파일 하단 주석의 `notionLoader` 버전으로 교체.
6. **DB 속성 매핑** (DB에 이 속성들을 두세요)

   | Notion 속성 | 타입 | 매핑 |
   |---|---|---|
   | 제목 | Title | title |
   | 발행일 | Date | pubDate |
   | 카테고리 | Select | category |
   | 태그 | Multi-select | tags |
   | 요약 | Text | summary |
   | 발행 | Checkbox | 빌드 필터(체크된 글만 발행) |

7. **시크릿 전달** — `.github\workflows\deploy.yml` 의 `env:` 블록 주석 해제.
8. (선택) **정기 재빌드** — 같은 파일의 `schedule: cron` 주석 해제. 로더는 *빌드 시점*에 노션을 읽으므로, 노션을 고쳐도 재빌드가 돌아야 사이트에 반영됩니다.

> 노션 본문 이미지는 만료되는 임시 URL이라, 로더가 빌드 때 받아오는 동작이 정상인지 확인하세요. 콜아웃/토글 등 일부 블록은 마크다운으로 완벽히 변환되지 않을 수 있습니다.

---

## 유지보수 메모

- 의존성은 한꺼번에 올리지 말고 의도적으로 — 올리기 전 `npm run build` 로 확인.
- 보안 패치는 Dependabot 권장.
- **`notion-astro-loader` 는 커뮤니티 패키지**라 Astro 업데이트에 뒤처질 수 있는 약한 고리. 상태만 가끔 확인. (콘텐츠는 노션, 코드는 Git에 남아 있어 로더를 갈아끼워도 됩니다.)

---

## 구조

```
src\
  consts.ts            사이트 설정 (제목/메뉴/카테고리/링크/소개)
  content.config.ts    글 컬렉션 (로컬 md ↔ Notion 전환)
  content\posts\        마크다운 글
  layouts\BaseLayout    공통 셸 (헤드/사이드바/테마·복사 스크립트)
  components\           Sidebar, PostCard
  pages\                index, posts, posts\[slug], categories\[category], about, rss
  styles\global.css     디자인 시스템
.github\workflows\      Pages 자동 배포
```
