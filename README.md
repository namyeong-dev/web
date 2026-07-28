# 남영동개발추진위원회 — 팀 홈페이지

기술로 누군가의 하루를 조금 더 가볍게.

순수 HTML/CSS/JS 정적 사이트입니다. 빌드 과정 없이 그대로 배포할 수 있습니다.

## 구조

```
index.html            페이지 전체 (히어로 / 프로젝트 / 팀 / 후원 / 푸터)
css/style.css         스타일 + 애니메이션
js/main.js            스크롤 인터랙션 엔진
assets/img/           프로젝트 로고, 파비콘, OG 이미지
assets/team/          팀원 프로필 사진 (아래 참고)
qa.html               스크린샷 검증용 하네스 (배포에 포함돼도 무해)
```

## 화살표 마크

인스타그램에 쓰는 화살표가 이 사이트의 시그니처입니다. SVG path 하나로 되어 있어
어디서든 재사용할 수 있습니다.

```html
<svg viewBox="0 0 70 62" fill="none" stroke="currentColor"
     stroke-width="13.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M7 7H63L34 55" />
</svg>
```

쓰는 곳: 파비콘, 네비 로고, 히어로(로드 시 그려짐), 후원 섹션 배경 패턴, 푸터.

**작게 쓰지 마세요.** 작은 크기에서 온전한 형태로 보이면 숫자 `7`로 읽힙니다.
크게 쓰거나, 인스타그램 포스트처럼 화면 가장자리에서 잘리게 배치하세요.

## 섹션 구성

히어로 → WHO WE ARE(+로고 마퀴) → 프로젝트 3개 → 팀 → 푸터.
후원 섹션은 뺐습니다. 나중에 후원 수단이 생기면 팀 섹션 뒤에 다시 넣으면 됩니다.

## 팀원 프로필 사진 넣기

아래 파일명으로 `assets/team/` 폴더에 넣기만 하면 자동으로 표시됩니다.
사진이 없으면 이니셜 모노그램이 대신 표시됩니다. 권장 비율은 세로형(1:1.16), 500px 이상.

| 파일명 | 팀원 |
|---|---|
| `lee-yunho.jpg` | 이윤호 (팀장) |
| `lee-donggeon.jpg` | 이동건 |
| `jeong-sua.jpg` | 정수아 |
| `seo-jaeyeon.jpg` | 서재연 |

## 로컬에서 보기

```bash
python3 -m http.server 4173
```

브라우저에서 http://localhost:4173 접속.

## 배포

정적 호스팅이면 어디든 가능합니다 — GitHub Pages, Vercel, Netlify, Cloudflare Pages.
폴더 전체를 올리면 끝. (`namyeong.dev` 도메인 연결은 호스팅 서비스의 커스텀 도메인 설정에서.)

배포 도메인이 `namyeong.dev`가 아니라면 `index.html` 위쪽의 `og:url`, `og:image`
두 줄을 실제 주소로 바꿔주세요. OG 이미지는 히어로를 그대로 찍은 것이라,
디자인을 바꾸면 `assets/img/og.png`도 다시 만들어야 합니다.

## 참고

- `?qa=1` 파라미터를 붙이면 모든 애니메이션이 최종 상태로 고정됩니다 (스크린샷/인쇄용).
- 애니메이션은 `prefers-reduced-motion`을 존중하고, 세션 중에 설정을 켜도 즉시 멈춥니다.
- 폰트: Pretendard Variable + Galmuri11 (jsDelivr CDN).
- `assets/img/beetree-logo-ink.png`는 흰 배경용으로 만든 BeeTREE 마크입니다.
  원본(`beetree-logo-white.png`)의 명도를 반전시킨 것이라, 원본이 바뀌면 다시 만들어야 합니다.
- 디자인 원본 폴더(`디자인/`)는 저장소에 올리지 않습니다(`.gitignore`).
  사이트가 실제로 쓰는 이미지는 전부 `assets/img/`에 복사되어 있어서,
  저장소만 클론해도 사이트는 그대로 돕니다.
- 손가Lock 패널의 아이폰 목업은 원본 `iPhone01·02.png`를 그대로 씁니다.
  배경이 투명한 PNG라 다른 화면으로 교체해도 그대로 동작합니다.
- 두 목업의 여백 비율이 달라서(`iPhone02`는 폰이 이미지의 92%, `iPhone01`은 86%)
  `.phone-before`/`.phone-after`의 `height` 값으로 실제 폰 크기를 맞춰 뒀습니다.
  목업을 교체하면 이 두 값을 다시 조정해야 합니다.
- 데스크톱에서는 OS 커서를 숨기고 직접 그린 커서(원 + 조준점)를 씁니다.
  터치 기기나 `prefers-reduced-motion` 환경에서는 자동으로 원래 커서가 나옵니다.
