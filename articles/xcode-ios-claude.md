# Xcode로 아이폰 앱 개발하기 — 클로드 풀스택 활용

> 스위프트 코드 작성부터 시뮬레이터 자동 테스트까지, Xcode 내장 AI와 Claude Code를 언제 어떻게 섞어 쓸지 정리합니다.

## 들어가며

iOS 앱 개발은 오랫동안 "Apple 생태계에 푹 잠겨야 제대로 할 수 있는 작업"이었습니다. Xcode, Interface Builder, 시뮬레이터, 엔터프라이즈 인증서 — 이 사슬을 벗어난 도구는 늘 반쪽짜리였죠. 그런데 2025년 후반부터 2026년 초 사이에 지형이 눈에 띄게 바뀌었습니다.

- **Xcode 26** — ChatGPT 네이티브 통합 + 제3자 모델(Claude 등) 플러그인 + 로컬 모델 지원
- **Xcode 26.3 (2026-02)** — "에이전틱 코딩" 정식 지원. Anthropic/OpenAI 에이전트가 프로젝트 빌드·테스트·프리뷰 스크린샷까지 자율 수행
- **Claude Code + MCP** — 터미널에서 스위프트 빌드하고, 시뮬레이터 돌리고, UI 탭하고, 스크린샷 찍어 검증까지 한 세션에 끝나는 워크플로

이 부록은 개인 앱 개발자·사이드 프로젝트 하는 iOS 개발자 관점에서, **Xcode 안의 AI**와 **Claude Code**를 어떻게 조합해야 가장 효율적인지 정리합니다. 마지막에는 Computer Use로 시뮬레이터를 직접 조작해 테스트하는 흐름까지 다룹니다.

## 1. Xcode 26의 AI 기능 한눈에

WWDC 25에서 공개된 Xcode 26은 AI를 "곁다리"가 아니라 **일급 시민**으로 대우합니다.

### 세 가지 진입점

| 위치 | 역할 |
|------|------|
| **인라인 예측 완성** | 타이핑 중 다중 라인 자동 제안. 로컬 모델이 기본 |
| **Coding Tools 패널** | "이 함수 문서화해 줘", "이 버그 고쳐 줘" 같은 타깃 작업 |
| **채팅 창** | 아키텍처 질문, 대규모 리팩토링 같은 대화형 작업 |

### 모델 고르기

`Settings → Intelligence`에서 사용할 모델을 고릅니다.

- **ChatGPT** — 기본. 무료 한도 제공, 유료 ChatGPT 계정 연동 가능
- **Claude** — Anthropic API 키만 넣으면 바로 활성화. Sonnet/Opus 선택 가능
- **로컬 모델** — Apple Silicon 맥에서 돌아가는 온디바이스 모델(예: Foundation Models), 민감 프로젝트에 유용

제3자 프로바이더도 추가할 수 있어, 사내 LLM 엔드포인트를 붙여 쓰는 팀도 늘고 있습니다.

### Xcode 26.3 — 에이전트 승격

2026년 2월에 나온 26.3은 "AI를 어시스턴트에서 에이전트로" 격상시킵니다. 한 줄 한 줄 제안하던 AI가, 이제는 **목표만 던지면 스스로 파일을 만들고 빌드하고 테스트를 돌립니다.**

에이전트가 할 수 있는 일:

- 파일 생성·수정·이동
- 프로젝트 구조 탐색 (Xcode 인덱스 활용)
- 빌드 실행 및 에러 해석
- 테스트 실행
- **Xcode Preview 스크린샷 캡처 후 시각적 검증**
- Apple 공식 문서 의미 검색 (로컬 MLX 모델 기반)

마지막 항목이 특히 강력합니다. SwiftUI API가 바뀌어도 에이전트가 **로컬에서 최신 공식 문서를 검색**해 정확한 시그니처를 찾아냅니다. 환각이 확 줄어드는 지점이죠.

## 2. Claude Code로 iOS 개발하기 — 기본 흐름

Xcode 안의 AI가 많이 강해졌는데, 왜 Claude Code를 따로 쓸까? 세 가지 이유가 있습니다.

1. **멀티 파일 리팩토링** — Xcode 내장 에이전트는 프로젝트 단위 작업에 최적화되어 있지만, 여러 레포·도구를 넘나드는 작업은 터미널 에이전트가 편합니다
2. **스크립트·MCP 확장성** — 커스텀 스크립트, 외부 API, 다른 코드베이스와의 연계
3. **자동화** — CI/헤드리스 모드, 긴 작업을 백그라운드로 돌리기

### 추천 세팅 — XcodeBuildMCP

Claude Code가 iOS 프로젝트를 다루는 가장 깔끔한 방법은 **[XcodeBuildMCP](https://github.com/cameroncooke/XcodeBuildMCP)** MCP 서버를 붙이는 것입니다.

```bash
claude mcp add xcode -- npx -y xcodebuildmcp@latest
```

이 MCP가 노출하는 툴:

- `build` — xcodebuild 래핑. 에러는 구조화된 JSON으로
- `test` — XCTest/Swift Testing 실행 + 결과 파싱
- `simulator_boot` / `simulator_install` / `simulator_launch`
- `ui_tap` / `ui_type_text` / `screenshot` — 시뮬레이터 UI 조작
- `describe_ui` — 현재 화면의 접근성 트리 덤프

픽셀 좌표가 아니라 **접근성 API로 요소를 찾기 때문에** 레이아웃이 바뀌어도 자동화가 깨지지 않습니다.

### CLAUDE.md 템플릿

프로젝트 루트에 아래를 두면 세션마다 같은 규칙이 적용됩니다.

```markdown
# iOS 앱 개발 규약

## 프로젝트 개요

- 타깃: iOS 18+
- 언어: Swift 6 (strict concurrency 활성)
- UI: SwiftUI, UIKit은 필요한 경우에만
- 상태: @Observable / Observation 프레임워크 우선

## 파일 구조

- `Sources/Features/` — 기능 단위 (View + ViewModel + Model)
- `Sources/Shared/` — 공통 유틸·뷰 컴포넌트
- `Tests/` — Swift Testing 기반 유닛 테스트

## 코딩 규칙

- 강제 언래핑 금지. guard let / if let 우선
- Force-unwrap이 불가피하면 주석으로 근거 남김
- UI 문자열은 String Catalog(`Localizable.xcstrings`)로

## 빌드·테스트

- 빌드: `xcode build` MCP 툴 사용
- 테스트: `xcode test --simulator "iPhone 15 Pro"`
- 실기기 빌드는 요청 시에만

## 커밋

- 메시지 한국어
- 이모지 프리픽스 금지
```

### 전형적 대화 예

```text
> 홈 화면에 "오늘의 할 일" 섹션을 추가해 줘.
  Observable 기반 TodoStore를 만들고,
  SwiftUI List로 렌더링. 체크박스 토글 시 애니메이션.
  커밋은 아직 하지 말고.

(Claude가 파일 생성 → build 툴로 검증 → 에러 나면 수정 루프)

> 이 뷰의 스크린샷 보여줘.

(Claude가 시뮬레이터 부팅 → 앱 설치 → 해당 화면으로 네비 → 스크린샷)

> 다크 모드에서 대비가 낮아 보이는데, 확인하고 고쳐 줘.

(Claude가 색상 토큰 조회 → 수정 → 다크 모드 스크린샷으로 재검증)
```

핵심은 **빌드→실행→스크린샷→수정**의 루프를 Claude가 **혼자 닫을 수 있다**는 점입니다. 개발자는 큰 방향만 잡고, 지겨운 반복은 Claude에게 맡깁니다.

## 3. Computer Use로 시뮬레이터 QA 자동화

XcodeBuildMCP가 시뮬레이터 제어의 90%를 커버하지만, **진짜 사람처럼 앱을 써 보는 QA**는 한 층 더 위입니다. Anthropic의 [Computer Use](https://code.claude.com/docs/en/computer-use)가 그 역할을 합니다.

### 뭐가 다른가

| 접근 방식 | 한계 | 강점 |
|-----------|------|------|
| XcodeBuildMCP의 `ui_tap` | 접근성 트리에 있는 요소만 | 정확, 빠름 |
| Computer Use (스크린샷 기반) | 느림, 토큰 소비 큼 | 아무 화면이나, 실제 사용자 눈으로 |

둘은 경쟁이 아니라 **보완**입니다. 개발 루프는 XcodeBuildMCP로, 최종 QA는 Computer Use로.

### Computer Use 활성화

Claude Code 1.2+에서 `--computer-use` 플래그 또는 세션 중 `/enable-computer-use`로 켭니다(버전에 따라 명령명은 다를 수 있으니 `/help`로 확인). macOS에서 실행하는 경우 화면 기록 권한을 요구합니다.

```bash
claude --computer-use
```

### 실전 QA 플로우

```text
> 시뮬레이터에서 우리 앱을 런칭하고,
  "신규 가입 → 온보딩 3단계 → 홈 진입"을 해줘.
  각 단계에서 UI가 이상하거나 멈추는 곳이 있으면
  스크린샷과 함께 리포트해.
```

Claude가 수행하는 일:

1. 시뮬레이터로 포커스 이동
2. 앱 아이콘을 탭 (Computer Use가 화면을 "본다")
3. 가입 화면에서 이메일·비밀번호 입력
4. 온보딩 카드를 오른쪽으로 스와이프
5. 각 단계에서 화면 캡처
6. 레이아웃 깨짐·로딩 지연·이상한 텍스트 발견 시 보고서에 기록

**결과물 예시**

```markdown
## QA 리포트 — 2026-04-18

### ✅ 가입 플로우 정상
- 이메일 검증, 비밀번호 강도 표시 모두 동작

### ⚠️ 온보딩 2단계 문제
- "건너뛰기" 버튼이 다크 모드에서 배경과 대비 1.8:1 (WCAG 미달)
- 스크린샷: screenshots/onboarding-2-dark.png

### ⚠️ 홈 진입 시 로딩
- 스플래시 화면이 3.2초 노출됨 (평균 대비 +1.8초)
- 네트워크 요청 분석 필요
```

이 보고서를 그대로 이슈 트래커로 던지면 됩니다. 아침에 출근해서 보는 QA 리포트가 밤새 자동으로 쌓이는 환경이 됩니다.

### 주의점

- **속도** — Computer Use는 스크린샷 + LLM 추론 기반이라 한 액션당 수 초가 걸립니다. CI에 매번 돌리기엔 느려요. 주요 릴리스 전 스모크 테스트에 적합
- **결정론 부족** — UI 랜덤성(로딩 스피너, 광고)에 취약. 중요한 플로우는 XCUITest로 단단하게, 탐색적 QA만 Computer Use로
- **비용** — 스크린샷 토큰 소비가 큽니다. 세션당 예산을 정해 두세요

## 4. Xcode 내장 AI vs Claude Code — 결정적 차이

| 기준 | Xcode 26/26.3 내장 | Claude Code |
|------|---------------------|-------------|
| **기본 컨텍스트** | Xcode 프로젝트 인덱스 (빠름, 정확) | 파일시스템 + Git (범용) |
| **모델 선택** | ChatGPT·Claude·로컬 | Claude 가족 (Opus/Sonnet/Haiku) |
| **에이전트 자율성** | 26.3부터 본격 지원 | 출시 시점부터 강점 |
| **프로젝트 외 작업** | 제한적 | 자유로움 (다른 레포·시스템) |
| **MCP 확장** | 미지원 (2026-04 기준) | 핵심 기능 |
| **UI 스크린샷 검증** | Xcode Preview 캡처 내장 | XcodeBuildMCP + Computer Use |
| **Apple 공식 문서 검색** | 로컬 MLX 의미 검색 내장 | 웹검색 or NotebookLM |
| **비용 모델** | ChatGPT 무료 한도 + API | API 종량제 or Max 플랜 |
| **오프라인** | 로컬 모델이면 가능 | 불가 (클라우드 API) |
| **사이드바 Preview 즉시 반영** | 예 | 아니오 (시뮬레이터 경유) |
| **CI/헤드리스** | 약함 | 강함 (`claude -p`) |

**요약하면:**

- **Xcode 내장 AI가 이기는 영역** — 일상적 코드 편집, 타입 해결, API 레퍼런스, SwiftUI Preview 연동, 빠른 반복. 특히 26.3의 공식 문서 의미 검색은 환각을 크게 줄여 줍니다.
- **Claude Code가 이기는 영역** — 멀티 레포 작업, 긴 자율 태스크, 복잡한 리팩토링, 터미널 자동화, 시뮬레이터 QA, CI 연동, MCP로 사내 도구 붙이기.

## 5. 언제 뭘 쓸까 — 일 단위 권장 조합

### 매일 쓰는 조합

- **Xcode에서 코드 쓰는 동안**: 내장 AI로 인라인 완성·Coding Tools 빠르게
- **파일 여러 개 건드리는 기능 추가**: Xcode 26.3 에이전트 or Claude Code
- **뷰 하나 디자인 맞추기**: Xcode Preview + 내장 AI
- **신기능 전체 구현 (모델·뷰·테스트 한꺼번에)**: Claude Code + XcodeBuildMCP
- **릴리스 전 QA**: Claude Code + Computer Use로 탐색적 테스트 야간 배치

### 사이드 프로젝트라면

1. 아침 — Xcode 내장 AI로 디자인 디테일 다듬기
2. 낮 — Claude Code로 백엔드 연동·테스트 작성 (긴 태스크)
3. 저녁 — Computer Use로 전체 플로우 훑으며 버그 리포트 받기

내장 AI는 **손이 빠르고**, Claude Code는 **한 번에 많이** 합니다. 두 도구의 성격이 달라서 섞어 써야 최대치가 나옵니다.

### 팀 프로젝트라면

- 개인 개발은 위와 동일
- 팀 공통 CLAUDE.md / AGENTS.md에 프로젝트 규약 박아 두기
- PR 리뷰는 Claude Code 헤드리스 모드(`claude -p`)로 GitHub Actions에 연결
- Xcode 내장 Claude는 API 키를 팀 계정으로 공유 (비용 관리)

## 6. 함정들

### 프로비저닝은 사람이

에이전트가 얼마나 똑똑해도 **개발자 계정·프로비저닝 프로파일·Push 인증서**는 사람이 챙겨야 합니다. Claude에게 실기기 빌드를 시켰다가 잘못된 Team ID로 서명하는 사고가 흔합니다. 실기기 빌드는 수동 트리거로 남겨 두세요.

### SwiftUI ≠ UIKit

에이전트가 종종 둘을 섞어 코드를 뱉습니다. CLAUDE.md에 "SwiftUI 우선, UIKit은 ..." 같은 규칙을 분명히 적어 두는 것이 장기적으로 유효합니다.

### Preview가 느리면 에이전트가 포기

Xcode Preview가 느린 프로젝트(큰 모듈 의존성)는 에이전트의 "스크린샷 검증" 루프가 붕괴합니다. Preview 빌드 타임 최적화가 AI 개발 생산성에 직접 영향을 미칩니다.

### App Store 심사

생성된 코드가 Apple 가이드라인을 어기는 경우가 있습니다(예: 허가 없는 HealthKit 접근, UIWebView 사용). 제출 전 심사 가이드라인을 수동으로 한 번 훑어 주세요.

## 마치며

iOS 개발에서 AI는 2025년 중반까지 "편리한 부가 기능"이었지만, Xcode 26.3과 Claude Code의 결합 이후로는 **개발 파이프라인의 중심축**이 되었습니다. 내장 AI는 손이 빠르고, Claude Code는 책임지는 범위가 넓고, Computer Use는 눈이 되어 줍니다.

세 도구는 대체재가 아니라 **계층**입니다. 가장 빠른 반복은 Xcode 내장으로, 구조적 작업은 Claude Code로, 최종 검증은 Computer Use로. 이 세 층을 한 번 정착시키면, 혼자서 나가는 앱의 퀄리티가 팀 수준에 근접합니다.

```bash
# 오늘 저녁 시작하려면
claude mcp add xcode -- npx -y xcodebuildmcp@latest
echo "CLAUDE.md 템플릿 작성 → 다음 기능부터 Claude Code로"
```

---

*이 글은 Xcode 26.3(2026-02) 공개 정보, [XcodeBuildMCP](https://github.com/cameroncooke/XcodeBuildMCP), [Claude Code Computer Use 문서](https://code.claude.com/docs/en/computer-use)를 참고해 작성되었습니다. 버전에 따라 세부 기능과 UI는 달라질 수 있습니다.*
