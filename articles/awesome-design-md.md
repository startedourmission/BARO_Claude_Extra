# DESIGN.md로 프론트엔드 디자인하기

> Linear처럼, Stripe처럼, Claude처럼 생긴 UI를 AI에게 시키는 가장 쉬운 방법.

## 들어가며

"이 페이지를 Linear 느낌으로 만들어 줘"라고 AI에게 부탁해 본 적이 있나요? 결과물은 보통 **반쯤만** 비슷합니다. 보라색이 들어가고 여백이 넓긴 한데, Linear 특유의 정밀함은 빠져 있죠. 문제는 AI가 "Linear 느낌"을 **어렴풋이만** 알기 때문입니다. 이름은 알지만, 구체적인 컬러 토큰·타이포 스케일·여백 규칙을 정확히 기억하지 못합니다.

[VoltAgent의 awesome-design-md](https://github.com/VoltAgent/awesome-design-md)는 이 간극을 메우는 큐레이션 저장소입니다. 유명 서비스 68곳(Claude, Linear, Stripe, Vercel, Apple, Tesla 등)의 디자인 시스템을 **한 장의 마크다운 파일**로 정리해 두었습니다. 프로젝트 루트에 복사해 넣고 "이 스타일로 만들어 줘"라고만 하면, AI가 픽셀 단위로 맞춰 만들어 줍니다.

이 글에서는 DESIGN.md가 무엇인지, 어떻게 생겨났는지, 클로드 코드와 함께 어떻게 써먹는지 정리합니다.

## DESIGN.md란 무엇인가

DESIGN.md는 [Google Stitch](https://stitch.withgoogle.com/docs/design-md/overview/)가 제안한 새로운 포맷입니다. 이름 그대로 **마크다운으로 쓴 디자인 시스템 문서**이고, AI 에이전트가 UI를 만들 때 읽는 것을 전제로 설계되었습니다.

현재 에이전트 업계에서 통용되는 "표준 문서" 구도는 이렇습니다.

| 파일 | 누가 읽는가 | 무엇을 정의하는가 |
|------|-------------|-------------------|
| `AGENTS.md` | 코딩 에이전트 | 프로젝트를 **어떻게 만들지** |
| `DESIGN.md` | 디자인 에이전트 | 프로젝트가 **어떻게 보여야 하는지** |
| `CLAUDE.md` | 클로드 코드 | 위 둘 모두에 해당하는 통합 지침 |

핵심은 **LLM이 가장 잘 읽는 포맷이 마크다운**이라는 사실입니다. Figma 익스포트, JSON 스키마, 특수 툴 없이 평범한 텍스트 파일만 있으면 충분합니다. 파싱할 것도, 설정할 것도 없습니다.

## DESIGN.md 한 장에 들어가는 9가지

저장소의 모든 DESIGN.md는 Stitch 포맷에 확장 섹션을 더해 아래 9가지를 담고 있습니다.

| # | 섹션 | 무엇을 담는가 |
|---|------|---------------|
| 1 | Visual Theme & Atmosphere | 분위기, 밀도, 디자인 철학 |
| 2 | Color Palette & Roles | 시맨틱 이름 + hex + 기능적 역할 |
| 3 | Typography Rules | 폰트 패밀리, 전체 계층 표 |
| 4 | Component Stylings | 버튼, 카드, 인풋, 네비 (상태별) |
| 5 | Layout Principles | 간격 스케일, 그리드, 여백 철학 |
| 6 | Depth & Elevation | 그림자 시스템, 표면 계층 |
| 7 | Do's and Don'ts | 디자인 가드레일과 안티패턴 |
| 8 | Responsive Behavior | 브레이크포인트, 터치 타깃, 붕괴 전략 |
| 9 | Agent Prompt Guide | 빠른 컬러 레퍼런스, 바로 쓰는 프롬프트 |

각 브랜드마다 `DESIGN.md` 외에 `preview.html`(라이트)과 `preview-dark.html`(다크) 미리보기도 함께 제공됩니다. 직접 열어 보고 어떤 느낌인지 확인한 뒤 선택할 수 있습니다.

## 실제로 이걸로 만들어 보면

말보다 결과를 보는 게 빠릅니다. `npx getdesign@latest add claude`와 `npx getdesign@latest add linear.app`로 받은 두 파일을 각각 LLM에게 "이 DESIGN.md 그대로 가상 제품 랜딩 페이지를 만들어 줘"라고 요청해 붙여 넣은 결과를 아래에 임베드했습니다. 둘 다 단일 HTML 파일이고 소스도 이 부록에 함께 들어 있습니다.

### 데모 1 — Claude 스타일

가상의 글쓰기 동반자 "Ink"를 Claude DESIGN.md로 구현한 페이지입니다. 양피지 톤 캔버스, 세리프 헤드라인, 테라코타 CTA, 따뜻한 중립 컬러.

<iframe src="articles/assets/design-md-demo/claude.html"
        width="100%" height="760"
        style="border: 1px solid var(--rule); border-radius: 8px; margin: 12px 0;"
        loading="lazy"
        title="Claude DESIGN.md로 만든 Ink 데모 페이지"></iframe>

[새 창에서 열기](articles/assets/design-md-demo/claude.html) · [소스 보기](articles/assets/design-md-demo/claude.html)

### 데모 2 — Linear 스타일

가상의 엔지니어링 속도 트래커 "Orbit"을 Linear DESIGN.md로 구현한 페이지. 근검은색(`#08090a`) 캔버스, Inter Variable weight 510, 강한 negative letter-spacing, 인디고-바이올렛 포인트.

<iframe src="articles/assets/design-md-demo/linear.html"
        width="100%" height="760"
        style="border: 1px solid var(--rule); border-radius: 8px; margin: 12px 0;"
        loading="lazy"
        title="Linear DESIGN.md로 만든 Orbit 데모 페이지"></iframe>

[새 창에서 열기](articles/assets/design-md-demo/linear.html) · [소스 보기](articles/assets/design-md-demo/linear.html)

---

두 페이지를 나란히 놓고 보면 "같은 제품 카테고리(개인 생산성 도구)여도 DESIGN.md만 바꾸면 완전히 다른 세계관이 된다"는 게 감이 옵니다. 컬러 토큰·폰트·간격·그림자가 한 번에 묶음으로 갈아끼워지니까요.

## 파일 속 들여다보기

어떤 규칙이 저 두 페이지를 만들어냈는지 보고 싶다면 원본 DESIGN.md를 읽어 보세요. 제가 이 부록에 전체 파일도 함께 넣어뒀습니다.

- [claude.DESIGN.md 전체 파일](articles/assets/design-md/claude.DESIGN.md) (312줄)
- [linear.DESIGN.md 전체 파일](articles/assets/design-md/linear.DESIGN.md) (367줄)

각 파일의 앞부분을 발췌해 둡니다.

### Claude — 따뜻한 테라코타, 에디토리얼 레이아웃

```markdown
# Design System Inspired by Claude (Anthropic)

## 1. Visual Theme & Atmosphere

Claude's interface is a literary salon reimagined as a product page —
warm, unhurried, and quietly intellectual. The entire experience is built
on a parchment-toned canvas (#f5f4ed) that deliberately evokes the
feeling of high-quality paper rather than a digital surface...

**Key Characteristics:**
- Warm parchment canvas (#f5f4ed) evoking premium paper, not screens
- Custom Anthropic type family: Serif for headlines, Sans for UI, Mono for code
- Terracotta brand accent (#c96442) — warm, earthy, deliberately un-tech
- Exclusively warm-toned neutrals — every gray has a yellow-brown undertone
- Organic, editorial illustrations replacing typical tech iconography
- Ring-based shadow system (0px 0px 0px 1px) creating border-like depth
- Magazine-like pacing with generous section spacing

## 2. Color Palette & Roles

### Primary
- **Anthropic Near Black** (#141413): The primary text color and
  dark-theme surface — not pure black but a warm, almost olive-tinted
  dark that's gentler on the eyes.
- **Terracotta Brand** (#c96442): The core brand color — a burnt
  orange-brown used for primary CTA buttons, brand moments, and
  the signature accent. Deliberately earthy and un-tech.
- **Coral Accent** (#d97757): A lighter, warmer variant...
```

"따뜻하다, 느긋하다, 지적이다"로 요약되는 분위기가 첫 단락에서 그대로 전달됩니다. LLM이 이 문서를 읽으면 "에디토리얼", "warm parchment", "serif 헤드라인" 같은 단어를 놓치지 않고 반영합니다.

### Linear — 어두운 캔버스 위의 정밀 공학

```markdown
# Design System Inspired by Linear

## 1. Visual Theme & Atmosphere

Linear's website is a masterclass in dark-mode-first product design —
a near-black canvas (#08090a) where content emerges from darkness like
starlight. The overall impression is one of extreme precision
engineering: every element exists in a carefully calibrated hierarchy
of luminance...

**Key Characteristics:**
- Dark-mode-native: #08090a marketing background, #0f1011 panel,
  #191a1b elevated surfaces
- Inter Variable with "cv01", "ss03" globally — geometric alternates
- Signature weight 510 (between regular and medium) for most UI text
- Aggressive negative letter-spacing at display sizes
  (-1.584px at 72px, -1.056px at 48px)
- Brand indigo-violet: #5e6ad2 (bg) / #7170ff (accent) / #828fff (hover)
- Semi-transparent white borders: rgba(255,255,255,0.05)–0.08
- Button backgrounds at near-zero opacity

## 2. Color Palette & Roles

### Background Surfaces
- **Marketing Black** (#010102 / #08090a): The deepest background —
  the canvas for hero sections. Near-pure black with an imperceptible
  blue-cool undertone.
- **Panel Dark** (#0f1011): Sidebar and panel backgrounds.
- **Level 3 Surface** (#191a1b): Elevated surface areas,
  card backgrounds, dropdowns.
- **Secondary Surface** (#28282c): The lightest dark surface — hover
  states and slightly elevated components.
```

같은 형식 안에서 완전히 다른 세계관이 드러납니다. Linear 파일은 "Weight 510", "OpenType features cv01, ss03", "-1.584px letter-spacing" 같은 **숫자로 박제된 규칙**이 많아서, LLM이 재현할 때도 정밀하게 맞춥니다.

### 두 파일이 공유하는 구조

형식은 동일합니다. 9개 섹션 순서도 같고, 표 형식도 같습니다. 그 위에 브랜드마다 다른 값이 채워질 뿐입니다. **같은 그릇에 다른 내용물을 담는 방식** 덕분에, LLM이 어느 브랜드의 DESIGN.md를 읽어도 같은 기대치로 해석합니다.

전체 파일을 받아서 프로젝트에 떨구고 싶다면 저장소에서 직접 받는 쪽이 빠릅니다.

```bash
# CLI 한 줄로 현재 폴더에 DESIGN.md 생성
npx --yes getdesign@latest add claude
npx --yes getdesign@latest add linear.app
npx --yes getdesign@latest add vercel
```

## 어떤 브랜드들이 있나

68개 브랜드가 7개 카테고리로 정리되어 있습니다. 대표적인 것만 추립니다.

### AI·LLM 플랫폼

**Claude**(따뜻한 테라코타, 에디토리얼 레이아웃), **Cohere**(선명한 그라데이션), **ElevenLabs**(어두운 시네마틱), **Mistral AI**(보라 톤 프렌치 미니멀), **Ollama**(터미널 모노크롬), **Replicate**(화이트 캔버스), **xAI**(스타크 모노크롬).

### 개발자 도구·IDE

**Cursor**(다크에 그라데이션 악센트), **Vercel**(Geist 폰트, 흑백의 정밀함), **Raycast**(다크 크롬 + 바이브런트 그라데이션), **Warp**(다크 IDE 스타일), **Superhuman**(프리미엄 퍼플 글로우).

### 백엔드·DB·DevOps

**Supabase**(다크 에메랄드), **MongoDB**(그린 리프), **ClickHouse**(노랑 악센트 기술 문서), **Sentry**(데이터 밀도 높은 핑크-퍼플 다크).

### 생산성·SaaS

**Linear**(극단적 미니멀, 보라 악센트), **Notion**(따뜻한 미니멀, 세리프 헤딩), **Resend**(미니멀 다크, 모노스페이스 악센트), **Cal.com**(클린 뉴트럴).

### 핀테크·크립토

**Stripe**(시그니처 퍼플 그라데이션, weight-300 우아함), **Revolut**(슬릭 다크, 그라데이션 카드), **Wise**(밝은 그린), **Binance**(Binance Yellow, 트레이딩 플로어 긴박감).

### 이커머스·리테일

**Airbnb**(따뜻한 코랄, 사진 중심), **Nike**(모노크롬, 거대한 대문자 Futura), **Shopify**(시네마틱 다크 + 네온 그린).

### 미디어·컨슈머 테크

**Apple**(프리미엄 여백, SF Pro), **Spotify**(다크에 바이브런트 그린), **WIRED**(브로드시트 밀도, 잉크-블루 링크), **SpaceX**(스타크 흑백, 풀블리드 이미지).

### 자동차

**Tesla**(급진적 생략, 시네마틱 풀뷰포트), **Ferrari**(키아로스쿠로 흑백 에디토리얼, 페라리 레드), **Lamborghini**(트루 블랙 성당 + 골드 악센트).

이 외에도 Figma, Framer, Webflow, SpaceX, Pinterest, The Verge 등이 있습니다. 전체 목록은 [저장소 README](https://github.com/VoltAgent/awesome-design-md)에서 확인하세요.

## 기본 사용법

### 1단계: 브랜드 고르고 미리보기

저장소의 `preview.html`을 열어 실제 어떤 느낌인지 확인합니다. "머리로 생각한 Linear"와 "DESIGN.md가 기술하는 Linear"가 다를 수 있으니 반드시 눈으로 보고 고릅니다.

### 2단계: DESIGN.md 복사

프로젝트 루트에 `DESIGN.md` 파일을 만들어 내용을 붙여넣습니다.

```bash
# 예: Linear 스타일을 적용
curl https://getdesign.md/linear.app/design-md > DESIGN.md
```

### 3단계: 에이전트에게 지시

클로드 코드 세션에서 자연어로 요청합니다.

```text
DESIGN.md를 읽고, 이 스타일로 우리 랜딩 페이지를 다시 만들어 줘.
히어로 섹션, 피처 3개, 요금제 카드, 푸터를 포함해서.
기존 라우트 구조는 유지하고, 컴포넌트만 교체.
```

DESIGN.md의 9가지 섹션을 LLM이 스스로 읽고, 컬러·타이포·여백·그림자를 모두 반영한 코드를 뱉어 줍니다.

## 클로드 코드와 실전 워크플로

DESIGN.md를 단순 복사만 하지 말고, 프로젝트에 맞춰 **한 번 다듬은 뒤** 쓰는 것이 품질을 크게 올립니다. 권장 흐름은 이렇습니다.

### ① DESIGN.md + AGENTS.md 분리

- `DESIGN.md` — 비주얼 규칙만
- `AGENTS.md`(또는 `CLAUDE.md`) — 파일 구조, 컴포넌트 컨벤션, 테스트 실행 방식

두 문서를 분리해 두면 "디자인만 갈아끼우기"가 쉬워집니다. Linear 느낌으로 썼다가 Stripe 느낌으로 바꿔 보고 싶을 때 `DESIGN.md`만 교체하면 됩니다.

### ② 토큰은 CSS 변수로

DESIGN.md의 컬러·폰트·여백을 그대로 Tailwind 설정이나 CSS 변수로 내보내 달라고 요청합니다.

```text
DESIGN.md의 컬러 팔레트와 타이포 스케일을
`app/globals.css`의 :root 변수로 추출해 줘.
기존 하드코딩된 hex 값도 변수로 치환하고.
```

이렇게 해두면 이후에 브랜드를 갈아끼울 때 변수 값만 바꾸면 됩니다.

### ③ 섹션 단위로 변환

한 번에 전체를 만들지 말고, 섹션 단위로 반복합니다.

```text
먼저 히어로 섹션만 DESIGN.md에 맞춰 다시 만들자.
@app/(marketing)/page.tsx를 참고해서,
레이아웃은 유지하되 스타일만 교체.
```

전체를 한 번에 요청하면 세세한 디테일이 누락되기 쉽지만, 섹션 단위라면 DESIGN.md의 `Component Stylings`와 `Layout Principles`를 제대로 반영합니다.

### ④ Do's와 Don'ts를 근거로 리뷰

DESIGN.md의 7번째 섹션 "Do's and Don'ts"는 리뷰 기준으로 그대로 쓸 수 있습니다.

```text
방금 만든 히어로를 DESIGN.md의 "Do's and Don'ts" 기준으로 점검해 줘.
어긴 규칙이 있으면 수정하고.
```

디자인 리뷰가 구조화된 규칙 기반으로 진행되므로, "감으로 괜찮다"가 아니라 "7번 섹션 3번째 Don't에 걸린다"는 식의 객관적 피드백이 나옵니다.

## 커스터마이징 팁

### 합성하기

하나의 DESIGN.md만 쓰라는 법은 없습니다. 두 개를 섞을 수도 있습니다.

```text
Vercel의 타이포 계층(Geist, 흑백 정밀함)과
Stripe의 컬러 그라데이션을 결합해서
새 DESIGN.md를 만들어 줘.
```

LLM이 두 파일을 읽고 하이브리드 스펙을 작성해 줍니다.

### 자사 브랜드화

공개 브랜드의 DESIGN.md를 참고용으로만 쓰고, 최종 파일은 **자사 브랜드 가이드로 대체**하세요. 로고 컬러, 전용 폰트, 금지 표현을 넣으면 그대로 팀 전체의 디자인 컨벤션이 됩니다.

### DESIGN.md 신청

찾는 브랜드가 없다면 [getdesign.md/request](https://getdesign.md/request)에서 신청할 수 있습니다. 공개 요청 외에 개인 전용으로 받는 옵션도 있습니다.

## 한계와 주의점

- **공개 디자인만 반영** — 로그인 후에 보이는 대시보드, 네이티브 앱 UI는 포함되지 않습니다.
- **저작권은 각자** — 추출된 디자인 토큰은 공개 CSS 값일 뿐, 타사 브랜드 정체성을 상업적으로 그대로 쓰는 건 별개 문제입니다. 레퍼런스·학습·사내 프로토타입 용도가 안전합니다.
- **시점 차** — 사이트는 리뉴얼되지만 DESIGN.md는 한 시점의 스냅샷입니다. 오래된 파일은 현재와 다를 수 있습니다.
- **"완성"이 아니다** — 자동 생성 결과는 **출발점**입니다. 접근성(시맨틱 마크업, 포커스 스타일), 성능, 실제 브랜드 규정을 사람이 마무리해야 합니다.

## 어디에 쓰면 좋은가

- **빠른 프로토타입** — 투자 피칭용 목업, 해커톤, 사내 데모
- **레퍼런스 분석** — "우리 경쟁사는 왜 이 컬러를 쓸까"를 DESIGN.md로 추출해 분석
- **디자인 시스템 학습** — Linear·Stripe가 어떻게 계층을 짜는지 섹션별로 뜯어보기
- **내부 도구 UI 통일** — 한 번 고른 DESIGN.md를 여러 내부 도구에 공통 적용해 일관성 확보

## 마치며

DESIGN.md는 "디자인 시스템을 **평범한 텍스트로도 충분히 기술할 수 있다**"는 증명입니다. Figma가 필요한 자리가 있고, JSON 토큰 스키마가 필요한 자리가 있지만, **LLM과 협업하는 자리에서는 마크다운이 가장 빠릅니다.**

책 본문에서 CLAUDE.md의 역할을 익혔다면, 그 옆 자리에 DESIGN.md를 두고 한 번 실험해 보세요. "이 페이지를 Linear처럼 만들어 줘"라는 지시의 체감 품질이 완전히 달라집니다.

---

*이 글은 [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 저장소를 참고해 작성되었습니다. 수록 브랜드와 포맷은 계속 확장되고 있으니 공식 레포에서 최신 목록을 확인하세요.*
