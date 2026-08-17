# CLAUDE.md

남영동개발추진위원회 팀 홈페이지. 빌드 과정이 없는 순수 정적 사이트이고
`index.html` / `css/style.css` / `js/main.js` 세 파일이 전부입니다.

사이트 구조, 화살표 마크, 팀 사진 파일명은 **README.md** 에 있습니다.
여기에는 코드를 고칠 때 실제로 발목 잡히는 것들만 적습니다.

## 로컬에서 보기

```bash
python3 -m http.server 4173
```

`?qa=1` 을 붙이면 모든 애니메이션이 최종 상태로 고정됩니다. `qa.html` 은
고정 크기 iframe 으로 특정 구간을 찍는 스크린샷 하네스인데 로컬 전용이라
저장소에 없습니다(`.gitignore`).

## 배포 (Ubuntu 서버)

`.git` 은 웹 루트 바깥에 두고, 웹 루트에는 체크아웃만 합니다.

| | 경로 |
|---|---|
| bare 저장소 | `/opt/namyeong.git` |
| 웹 루트 (nginx root) | `/opt/namyeong.dev` |

서버에서 배포는 한 줄입니다. root 로 실행하세요 (gh 인증이 `/root/.config/gh`).

```bash
deploy-namyeong
```

`/usr/local/bin/deploy-namyeong` 에 있고 내용은 fetch + `checkout -f` 입니다.
`-f` 라서 바뀐 파일은 덮어쓰고 저장소에서 지운 파일은 서버에서도 지워집니다.
어떤 파일을 올려야 하는지 따질 필요가 없습니다.

서버를 새로 세팅해야 하면 (root 로):

```bash
gh auth login            # web browser 방식, Git 인증도 Yes
git clone --bare https://github.com/songa-lock/namyeong.dev.git /opt/namyeong.git
git --git-dir=/opt/namyeong.git config core.bare false
git --git-dir=/opt/namyeong.git --work-tree=/opt/namyeong.dev checkout -f main
```

배포 명령 등록:

```bash
printf '#!/bin/sh\nset -e\ngit --git-dir=/opt/namyeong.git fetch origin main\ngit --git-dir=/opt/namyeong.git --work-tree=/opt/namyeong.dev checkout -f main\necho "배포 완료"\n' > /usr/local/bin/deploy-namyeong && chmod +x /usr/local/bin/deploy-namyeong
```

`checkout -f` 는 저장소에 없는 파일은 건드리지 않습니다. 예전에 손으로 올린
잔여 파일을 정리하려면 `clean -nd` 로 목록을 먼저 확인하고 `-fd` 로 지우세요.

### css 나 js 를 고쳤으면 `?v=` 를 올리세요

`index.html` 이 `css/style.css?v=N` / `js/main.js?v=N` 으로 참조합니다. 배포가
파일 덮어쓰기라, 이 숫자를 안 올리면 **재방문자는 예전 CSS/JS 를 계속 씁니다.**
두 곳 다 같은 숫자로 올려야 합니다.

## 고칠 때 걸리는 것들

전부 실제로 한 번씩 터졌던 것들입니다.

### 스크롤 스크럽 `--p`

프로젝트 패널의 모든 연출(도우미 채팅 단계, 코드 타이핑, 채점 진행바, 폰
드리프트)은 패널마다 붙는 `--p` (0→1) 하나로 돌아갑니다. `js/main.js` 의
`updatePanels()` 가 씁니다.

- **데스크톱(961px~)**: 패널 전체가 `position: sticky` 로 고정되고,
  `.panel-wrap` 의 여분 높이만큼 스크럽이 진행됩니다.
- **모바일(~960px)**: 패널이 화면보다 커서 고정할 수 없으므로 **mock 만**
  고정합니다. `.panel-visual { min-height }` 가 고정 구간을 만듭니다.

모바일 쪽 고정 구간은 반드시 `min-height` 여야 합니다. **sticky 는 컨테이닝
블록의 _content_ 박스 안에서만 움직이고 padding 은 그 바깥이라, padding 으로
주면 이동 거리가 0 이 되어 고정이 아예 안 걸립니다.** 또 조상에
`overflow: hidden` 이 있으면 그게 스크롤 컨테이너가 되어 고정이 죽습니다 —
`.panel` 이 모바일에서 `overflow: clip` 인 이유입니다(clip 은 스크롤 컨테이너를
만들지 않습니다).

JS 는 고정 거리를 CSS 에서 **측정**합니다(`visual.offsetHeight -
mock.offsetHeight`). CSS 값만 바꾸면 타이밍이 따라옵니다.

### BeeTREE 코드 타이핑

줄마다 `--s`(시작) `--d`(구간) `--n`(글자 수)를 인라인으로 갖고, `ch` 단위 창을
넓혀서 한 글자씩 드러냅니다. 그래서:

- `.judge-code` 의 `letter-spacing` 은 **0 이어야 합니다.** body 의 `-0.01em`
  이 상속되면 `ch` 기준 창과 실제 글자 폭이 긴 줄에서 어긋납니다.
- `white-space: pre` 라 줄 안에 줄바꿈이나 여분 공백을 넣으면 안 됩니다.
- `--n` 은 그 줄의 실제 글자 수와 정확히 같아야 합니다.

### 스크롤로 구동되는 연출은 reduced-motion 이 안 막습니다

`prefers-reduced-motion` / `?qa=1` 의 기존 규칙은 transition·animation 을
끄는 것이라, `--p` 로 움직이는 것들은 그대로 돕니다. 새로 추가할 때마다 두
곳에 **완료 상태**를 따로 넣어야 합니다 (`.qa .jc-win`, reduced 블록의
`.jc-win` 이 그 예).

### 팀 사진

파일이 있는 사람만 `<img>` 를 둡니다. 미리 넣어두면 없는 파일을 요청해서
콘솔에 404 가 남습니다. `loading="lazy"` 도 쓰면 안 됩니다 — 사진 칸은 파일이
로드되기 전까지 `display:none` 인데, 숨어 있는 lazy 이미지는 브라우저가 아예
요청하지 않아서 영영 안 뜹니다.

### 화살표 마크

작게 + 온전한 형태로 쓰면 숫자 `7` 로 읽힙니다. 크게 쓰거나 가장자리에서
잘리게 배치하세요(히어로, 푸터, 외부 링크 창이 그렇게 하고 있습니다).
네비 로고만 예외인데 워드마크와 짝지어 있어서 괜찮습니다.

### 외부 링크 전환

외부 링크를 누르면 그 컨트롤이 브라우저 창으로 커진 뒤(`#portal`) 새 탭이
열립니다. 마크업은 `target="_blank"` 그대로 두고 JS 가 가로챕니다.

변형은 CSS 트랜지션이 아니라 **Web Animations 키프레임**입니다. 트랜지션은
시작값을 직전 스타일 플러시에서 가져가는데, `offsetWidth` 로 강제한 레이아웃
플러시가 geometry 는 잡아도 `border-radius`/`background` 는 스타일시트
기본값에서 시작해 버립니다.

새 탭은 제스처에서 760ms 뒤에 엽니다. Safari 가 이 거리의 `window.open()` 을
거부할 수 있어서 차단되면(null) 같은 탭 이동으로 넘어갑니다. `'noopener'` 를
feature 문자열로 넘기면 성공해도 null 을 돌려주므로 열린 뒤에 `opener` 를
끊습니다.

### 모바일 뷰포트 높이

`vhOf()` 가 값을 캐시합니다. 폰에서 주소창이 접히면 `window.innerHeight` 가
바뀌는데, 그걸 그대로 읽으면 스크롤 도중에 모든 애니메이션이 다시 매핑되면서
화면이 튑니다. 폭이 바뀌거나 높이가 140px 이상 바뀔 때만 갱신합니다.

### 터치 기기 성능

`@media (hover: none)` 블록에서 고정 바의 `backdrop-filter`, 발동하지 않는
tilt 용 `will-change`, 유휴 애니메이션들을 끕니다. 스크롤 끊김의 원인이라
새 장식을 추가할 때 여기도 같이 봐주세요.
